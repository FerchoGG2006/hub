import json
import os
import datetime
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form, WebSocket, WebSocketDisconnect, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

import models
from database import get_db, engine
from utils.storage import upload_product_image
from utils.gemini_extractor import extract_menu_from_image
import auth

load_dotenv()
import google.generativeai as genai
if os.getenv("GEMINI_API_KEY"):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Crear tablas si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HUB SaaS API",
    description="Backend Multi-Tenant de la plataforma HUB",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "*"), "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ════════════════ WEBSOCKETS ════════════════
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except RuntimeError:
                pass

manager = ConnectionManager()

@app.websocket("/ws/menu")
async def websocket_menu(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ════════════════ AUTHENTICATION ════════════════
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

@app.post("/api/auth/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"})
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role, "tenant_id": user.tenant_id}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "tenant_slug": user.tenant.slug if user.tenant else None}

# ════════════════ ENDPOINTS MULTI-TENANT ════════════════

@app.get("/api/v1/tenant/{slug}")
def get_tenant_config(slug: str, db: Session = Depends(get_db)):
    from datetime import datetime
    tenant = db.query(models.Tenant).filter_by(slug=slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="HUB no encontrado")
        
    if tenant.valid_until and datetime.utcnow() > tenant.valid_until:
        if tenant.subscription_status == "active":
            tenant.subscription_status = "suspended"
            db.commit()

    return {
        "id": tenant.id,
        "slug": tenant.slug,
        "name": tenant.name,
        "brand_color": tenant.brand_color,
        "logo_url": tenant.logo_url,
        "whatsapp_number": tenant.whatsapp_number,
        "whatsapp_message": tenant.whatsapp_message,
        "subscription_status": tenant.subscription_status,
        "valid_until": tenant.valid_until.isoformat() if tenant.valid_until else None,
        "instagram_url": tenant.instagram_url,
        "tiktok_url": tenant.tiktok_url,
        "branches": [
            {
                "id": b.id,
                "name": b.name,
                "slug": b.slug,
                "whatsapp_number": b.whatsapp_number,
                "address": b.address,
                "ig_username": b.ig_username,
                "ig_profile_picture": b.ig_profile_picture,
                "autopilot_active": b.autopilot_active,
                "tt_username": b.tt_username,
                "tt_profile_picture": b.tt_profile_picture,
                "is_tt_linked": bool(b.tt_token)
            } for b in tenant.branches if b.is_active
        ]
    }

@app.get("/api/v1/tenant/{slug}/menu")
def get_tenant_menu(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter_by(slug=slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
    
    categories = db.query(models.Category).filter_by(tenant_id=tenant.id).all()
    grouped_menu = {}
    
    for cat in categories:
        prods = [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "price": p.price,
                "emoji": p.emoji,
                "image_url": p.image_url,
                "is_available": p.is_available,
                "category_id": p.category_id
            }
            for p in cat.products
        ]
        if prods:
            grouped_menu[cat.name] = prods

    return grouped_menu

@app.get("/api/v1/tenant/{slug}/categories")
def get_tenant_categories(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter_by(slug=slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
    
    cats = db.query(models.Category).filter_by(tenant_id=tenant.id).all()
    return [{"id": c.id, "name": c.name, "icon": c.icon} for c in cats]

# ════════════════ ANALYTICS ════════════════

@app.post("/api/analytics/track")
async def track_analytics(product_id: int, action: str, tenant_slug: str = "la-rivera", db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter_by(slug=tenant_slug).first()
    if not tenant:
        return {"status": "ignored", "detail": "Tenant not found"}
        
    log = models.Analytics(tenant_id=tenant.id, product_id=product_id, action=action)
    db.add(log)
    db.commit()

    if action == "add_to_cart":
        await manager.broadcast({
            "type": "ANALYTICS_UPDATE",
            "action": action,
            "product_id": product_id,
            "tenant_id": tenant.id
        })
    return {"status": "ok"}

@app.get("/api/v1/tenant/{slug}/analytics/top")
def get_tenant_top_analytics(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter_by(slug=slug).first()
    if not tenant:
        return []
        
    top_hits = (
        db.query(models.Analytics.product_id, func.count(models.Analytics.id).label("hits"))
        .filter(models.Analytics.tenant_id == tenant.id)
        .filter(models.Analytics.action == "add_to_cart")
        .group_by(models.Analytics.product_id)
        .order_by(func.count(models.Analytics.id).desc())
        .limit(10)
        .all()
    )

    result = []
    for product_id, hits in top_hits:
        p = db.query(models.Product).filter(models.Product.id == product_id).first()
        if p:
            result.append({"id": p.id, "name": p.name, "hits": hits})
            
    if len(result) == 0:
        # Mock para demostración (Añadir métricas en HUD si el usuario nuevo no tiene ventas)
        prods = db.query(models.Product).filter_by(tenant_id=tenant.id, is_available=True).limit(5).all()
        base_hits = 120
        for p in prods:
            result.append({
                "id": p.id,
                "name": p.name,
                "hits": base_hits
            })
            base_hits -= int(base_hits * 0.3)
            
    return result

# ════════════════ BACKWARD COMPATIBILITY & ADMIN ════════════════
# Hasta que actualicemos AdminDashboard por completo para soportar multi-tenant al inicio de sesión,
# lo ataremos a La Rivera por defecto.

@app.get("/api/menu-dynamic")
def get_legacy_menu(db: Session = Depends(get_db)):
    return get_tenant_menu("la-rivera", db)

@app.get("/api/categories")
def get_legacy_cats(db: Session = Depends(get_db)):
    return get_tenant_categories("la-rivera", db)

@app.get("/api/admin/tenants")
def get_all_tenants(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_superadmin)):
    tenants = db.query(models.Tenant).all()
    result = []
    for t in tenants:
        prods = db.query(models.Product).filter_by(tenant_id=t.id).count()
        result.append({
            "id": t.id,
            "name": t.name,
            "slug": t.slug,
            "brand_color": t.brand_color,
            "total_products": prods
        })
    return result

@app.post("/api/admin/onboard")
def onboard_new_tenant(
    name: str = Form(...),
    slug: str = Form(...),
    brand_color: str = Form("#f59e0b"),
    whatsapp_number: str = Form(""),
    email: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_superadmin)
):
    # 1. Crear el nuevo Tenant en la base de datos
    nuevo_tenant = models.Tenant(
        slug=slug,
        name=name,
        brand_color=brand_color,
        whatsapp_number=whatsapp_number
    )
    db.add(nuevo_tenant)
    db.commit()
    db.refresh(nuevo_tenant)
    
    # 2. Leer la imagen de forma síncrona y darsela a Gemini Flash
    image_bytes = file.file.read()
    menu_data = extract_menu_from_image(image_bytes)
    
    # 3. Iterar por el JSON estructurado de la IA y poblar la Base de Datos
    for category_data in menu_data:
        cat_name = category_data.get("category", "Miscelaneo")
        cat_icon = category_data.get("icon", "🍽️")
        
        nueva_cat = models.Category(
            tenant_id=nuevo_tenant.id,
            name=cat_name,
            icon=cat_icon
        )
        db.add(nueva_cat)
        db.commit()
        db.refresh(nueva_cat)
        
        products = category_data.get("products", [])
        for p in products:
            nuevo_prod = models.Product(
                tenant_id=nuevo_tenant.id,
                category_id=nueva_cat.id,
                name=p.get("name", "Plato Desconocido"),
                description=p.get("description", ""),
                price=str(p.get("price", "$0")),
                emoji=p.get("emoji", "🍽️")
            )
            db.add(nuevo_prod)
        db.commit()

    import secrets
    import string
    passcode = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(8))
    
    import auth
    tenant_admin = models.User(
        username=slug,
        hashed_password=auth.get_password_hash(passcode),
        role="admin",
        tenant_id=nuevo_tenant.id
    )
    db.add(tenant_admin)
    db.commit()

    # == HANDOVER KIT EMAIL ==
    front_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    if email:
        from utils.email_service import send_welcome_kit
        send_welcome_kit(email, name, slug, passcode, front_url)

    return {
        "status": "ok", 
        "message": "Tenant y Menú inyectados vía AI", 
        "tenant_id": nuevo_tenant.id,
        "credentials": {"username": slug, "passcode": passcode}
    }

@app.put("/api/admin/products/{product_id}/toggle")
async def toggle_product(product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    if current_user.role != "superadmin" and current_user.tenant_id != p.tenant_id:
        raise HTTPException(status_code=403, detail="Operación denegada")
        
    p.is_available = not p.is_available
    db.commit()
    
    await manager.broadcast({"type": "MENU_UPDATE", "event": "PRODUCT_TOGGLE", "product_id": product_id, "tenant_id": p.tenant_id})
    return {"status": "ok", "is_available": p.is_available}

class TenantSettingsUpdate(BaseModel):
    brand_color: str
    whatsapp_number: str
    instagram_url: str = None
    tiktok_url: str = None
    maps_url: str = None

@app.put("/api/admin/tenant/settings")
async def update_tenant_settings(
    settings: TenantSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
        
    tenant.brand_color = settings.brand_color
    tenant.whatsapp_number = settings.whatsapp_number
    tenant.instagram_url = settings.instagram_url
    tenant.tiktok_url = settings.tiktok_url
    tenant.maps_url = settings.maps_url
    db.commit()
    
    # Broadcast to trigger theme updates natively across connected clients
    await manager.broadcast({"type": "TENANT_UPDATE", "tenant_id": tenant.id})
    return {"status": "ok"}

@app.get("/api/admin/billing")
def get_billing_status(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == current_user.tenant_id).first()
    return {
        "subscription_status": tenant.subscription_status,
        "valid_until": tenant.valid_until.isoformat() if tenant.valid_until else None
    }

@app.post("/api/admin/billing/subscribe")
def subscribe_tenant(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    from datetime import datetime, timedelta
    tenant = db.query(models.Tenant).filter(models.Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
        
    tenant.subscription_status = "active"
    tenant.valid_until = datetime.utcnow() + timedelta(days=30)
    db.commit()
    
    return {"status": "ok", "message": "Facturación completada", "valid_until": tenant.valid_until.isoformat(), "subscription_status": tenant.subscription_status}

@app.post("/api/admin/products", status_code=201)
async def create_product(
    name: str = Form(...),
    price: str = Form(...),
    desc: str = Form(""),
    emoji: str = Form("🍽️"),
    category_id: int = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if current_user.role != "superadmin" and current_user.tenant_id != cat.tenant_id:
        raise HTTPException(status_code=403, detail="No puedes añadir items a la carta de este HUB.")
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    image_url = None
    if image is not None and image.filename != "":
        # Sube a un espacio en la nube (ej: Cloudinary o ImgBB) configurado en utils.storage
        image_url = await upload_product_image(image)

    new_prod = models.Product(
        tenant_id=cat.tenant_id,
        category_id=cat.id,
        name=name,
        description=desc,
        price=price,
        emoji=emoji,
        image_url=image_url
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)
    
    await manager.broadcast({"type": "MENU_UPDATE", "event": "NEW_PRODUCT", "tenant_id": cat.tenant_id})
    return new_prod

from pydantic import BaseModel

class MagicEditRequest(BaseModel):
    name: str
    price: str
    desc: str

@app.post("/api/admin/magic-edit")
def magic_edit_endpoint(
    req: MagicEditRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    from utils.gemini_extractor import enhance_copywriting
    res = enhance_copywriting(req.name, req.price, req.desc)
    return res

# ════════════════ ONBOARDING AUTÓNOMO (TENANTS) ════════════════

@app.post("/api/admin/ai-ingest")
def ai_ingest_tenant_menu(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Los superadmins deben usar el onboarding global.")

    # 1. Leer imagen
    image_bytes = file.file.read()
    
    # 2. IA procesa
    menu_data = extract_menu_from_image(image_bytes)
    
    # 3. Guardar categorías y productos para ESTE usuario y Tenant
    for category_data in menu_data:
        cat_name = category_data.get("category", "Miscelaneo")
        cat_icon = category_data.get("icon", "🍽️")
        
        # Revisar si ya existe la categoría (para no duplicar si sube el menú en partes)
        cat = db.query(models.Category).filter_by(tenant_id=current_user.tenant_id, name=cat_name).first()
        if not cat:
            cat = models.Category(tenant_id=current_user.tenant_id, name=cat_name, icon=cat_icon)
            db.add(cat)
            db.commit()
            db.refresh(cat)
            
        products = category_data.get("products", [])
        for p in products:
            nuevo_prod = models.Product(
                tenant_id=current_user.tenant_id,
                category_id=cat.id,
                name=p.get("name", "Plato Desconocido"),
                description=p.get("description", ""),
                price=str(p.get("price", "$0")),
                emoji=p.get("emoji", "🍽️")
            )
            db.add(nuevo_prod)
            
        db.commit()
        
    return {"status": "ok", "message": "Carta migrada vía IA exitosamente"}

# ════════════════ KANBAN & MARKETING (NEW FEATURES) ════════════════

class OrderRequest(BaseModel):
    items_json: str
    total_price: int
    customer_name: str
    phone: str
    table_number: str = None
    delivery_method: str = "mesa" # mesa, domicilio, recojo
    payment_method: str = "transferencia"
    branch_id: int = None

@app.post("/api/v1/tenant/{slug}/orders")
async def receive_order(slug: str, req: OrderRequest, db: Session = Depends(get_db)):
    t = db.query(models.Tenant).filter_by(slug=slug).first()
    if not t: raise HTTPException(status_code=404)
    
    nuevo = models.Order(
        tenant_id=t.id,
        delivery_method=req.delivery_method,
        payment_method=req.payment_method,
        total_price=req.total_price,
        items_json=req.items_json,
        status="pending",
        table_number=req.table_number,
        phone=req.phone,
        customer_name=req.customer_name,
        branch_id=req.branch_id
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    
    # Broadcast to admin Kanban!
    await manager.broadcast({
        "type": "NEW_ORDER", 
        "tenant_id": t.id, 
        "order": {
            "id": nuevo.id,
            "customer_name": nuevo.customer_name,
            "total_price": nuevo.total_price,
            "status": nuevo.status
        }
    })
    return {"status": "ok", "order_id": nuevo.id}

@app.get("/api/admin/orders")
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    orders = db.query(models.Order).filter_by(tenant_id=current_user.tenant_id).order_by(models.Order.id.desc()).all()
    result = []
    for o in orders:
        result.append({
            "id": o.id,
            "customer_name": o.customer_name,
            "total_price": o.total_price,
            "status": o.status,
            "table_number": o.table_number,
            "items_json": o.items_json,
            "branch_id": o.branch_id,
            "branch_name": o.branch.name if o.branch else "Central"
        })
    return result

@app.put("/api/admin/orders/{order_id}/status")
async def update_order_status(order_id: int, status: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    o = db.query(models.Order).filter_by(id=order_id, tenant_id=current_user.tenant_id).first()
    if not o: raise HTTPException(status_code=404)
    o.status = status
    db.commit()
    await manager.broadcast({"type": "ORDER_UPDATED", "tenant_id": current_user.tenant_id, "order_id": o.id, "status": status})
    return {"status": "ok"}

class AIMarketingRequest(BaseModel):
    goal: str

@app.post("/api/admin/marketing/ai")
def generate_ai_campaign(req: AIMarketingRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    import google.generativeai as genai
    model = genai.GenerativeModel('gemini-flash-latest')
    prompt = f"Eres un experto en marketing gastronómico. El restaurante quiere: '{req.goal}'. Redacta 1 SMS corto persuasivo, 1 Asunto de Email llamativo, y crea un Código de Cupón de descuento de un solo texto (ej: HAMBUR30) y el Porcentaje sugerido. Responde en JSON estricto con claves: sms_text, email_subject, coupon_code, discount_percent."
    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        
        # Robust JSON extraction
        import re
        json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if json_match:
            text = json_match.group(0)
        else:
            text = raw_text.replace("```json", "").replace("```", "").strip()
            
        data = json.loads(text)
    except Exception as e:
        print(f"AI Marketing failed, using fallback: {str(e)}")
        # Fallback response for marketing campaigns
        # We try to use the goal to make it somewhat relevant
        goal_lower = req.goal.lower()
        discount = 15
        if "venta" in goal_lower or "promo" in goal_lower:
            discount = 20
        
        data = {
            "sms_text": f"¡No te lo pierdas! {req.goal}. Pide ahora y obtén un descuento especial.",
            "email_subject": f"Especial para ti: {req.goal} 🚀",
            "coupon_code": "PROMO" + str(datetime.datetime.now().strftime("%y%m")),
            "discount_percent": discount
        }

    # Guardar cupon en DB
    try:
        tid = current_user.tenant_id
        if not tid:
            t = db.query(models.Tenant).first()
            tid = t.id if t else None

        if tid:
            nuevo_cupon = models.Coupon(
                tenant_id=tid,
                code=data.get('coupon_code', 'DESCUENTO10').upper(),
                discount_percent=int(data.get('discount_percent', 10))
            )
            db.add(nuevo_cupon)
            db.commit()
    except Exception as db_err:
        print(f"Error saving fallback coupon: {db_err}")

    return data


@app.get("/api/v1/tenant/{slug}/coupon/{code}")
def validate_coupon(slug: str, code: str, db: Session = Depends(get_db)):
    t = db.query(models.Tenant).filter_by(slug=slug).first()
    if not t: raise HTTPException(status_code=404)
    cp = db.query(models.Coupon).filter_by(tenant_id=t.id, code=code.upper(), is_active=True).first()
    if not cp: raise HTTPException(status_code=404, detail="Cupón inválido")
    return {"status": "ok", "discount": cp.discount_percent}

# ════════════════ INSTAGRAM AUTOPILOT (MCP) ════════════════

@app.get("/api/admin/instagram/status")
def get_instagram_status(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    branches = db.query(models.Branch).filter(models.Branch.tenant_id == current_user.tenant_id, models.Branch.is_active == True).all()
    
    return {
        "branches": [
            {
                "id": b.id,
                "name": b.name,
                "ig_username": b.ig_username,
                "ig_profile_picture": b.ig_profile_picture,
                "autopilot_active": b.autopilot_active,
                "opening_time": b.opening_time or "11:00",
                "closing_time": b.closing_time or "22:00",
                "is_linked": bool(b.ig_token)
            } for b in branches
        ]
    }

class AutopilotToggleRequest(BaseModel):
    active: bool
    opening_time: str
    closing_time: str
    branch_id: int = 1

@app.post("/api/admin/instagram/toggle")
def toggle_autopilot(req: AutopilotToggleRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    branch = db.query(models.Branch).filter(models.Branch.id == req.branch_id, models.Branch.tenant_id == current_user.tenant_id).first()
    if not branch: raise HTTPException(status_code=404)
    
    branch.autopilot_active = req.active
    branch.opening_time = req.opening_time
    branch.closing_time = req.closing_time
    db.commit()
    return {"status": "ok"}

@app.post("/api/admin/instagram/setup-autopilot")
def setup_instagram_autopilot(req: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    import requests
    import os
    short_token = req.get('shortToken')
    branch_id = req.get('branch_id', 1)

    try:
        # 1. Exchange for Long-Lived Token
        url_token = "https://graph.facebook.com/v19.0/oauth/access_token"
        params_token = {
            'grant_type': 'fb_exchange_token',
            'client_id': os.getenv("FB_CLIENT_ID", "dummy_id"),
            'client_secret': os.getenv("FB_CLIENT_SECRET", "dummy_secret"),
            'fb_exchange_token': short_token
        }
        res_token = requests.get(url_token, params=params_token).json()
        long_token = res_token.get('access_token', short_token)

        # 2. Discover Facebook Pages
        res_pages = requests.get(f"https://graph.facebook.com/v19.0/me/accounts?access_token={long_token}").json()
        pages = res_pages.get('data', [])
        if not pages:
            raise HTTPException(status_code=400, detail="No se encontraron páginas de Facebook vinculadas.")
        
        first_page_id = pages[0]['id']

        # 3. Discover Instagram Business Account linked to the page
        res_ig = requests.get(f"https://graph.facebook.com/v19.0/{first_page_id}?fields=instagram_business_account{{id,username,name,profile_picture_url}}&access_token={long_token}").json()
        ig_business = res_ig.get('instagram_business_account')
        
        if not ig_business:
            raise HTTPException(status_code=400, detail="Esta página de Facebook no tiene una cuenta de Instagram Business vinculada.")

        # 4. Save to DB
        branch = db.query(models.Branch).filter(models.Branch.id == branch_id, models.Branch.tenant_id == current_user.tenant_id).first()
        branch.ig_account_id = ig_business['id']
        branch.ig_token = long_token
        branch.ig_username = ig_business.get('username')
        branch.ig_profile_picture = ig_business.get('profile_picture_url')
        branch.autopilot_active = True
        
        db.commit()
        return {"status": "ok", "ig_username": branch.ig_username}

    except Exception as e:
        print(f"Error setup autopilot: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/tiktok/setup")
def setup_tiktok_integration(req: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Simulated TikTok Auth Discovery Flow
    branch_id = req.get('branch_id', 1)
    branch = db.query(models.Branch).filter(models.Branch.id == branch_id, models.Branch.tenant_id == current_user.tenant_id).first()
    if not branch: raise HTTPException(status_code=404)
    
    branch.tt_token = "tt_premium_token_wow_" + str(branch.id)
    branch.tt_username = branch.tenant.slug + "_official"
    branch.tt_profile_picture = f"https://api.dicebear.com/7.x/avataaars/svg?seed={branch.tt_username}"
    db.commit()
    return {
        "status": "ok", 
        "tt_username": branch.tt_username,
        "tt_profile_picture": branch.tt_profile_picture
    }

# ════════════════ META WEBHOOKS & EXTRAS ════════════════
@app.get("/api/v1/meta/webhook")
def verify_meta_webhook(hub_mode: str = Query(None, alias="hub.mode"), 
                       hub_challenge: str = Query(None, alias="hub.challenge"), 
                       hub_verify_token: str = Query(None, alias="hub.verify_token")):
    """
    Verificación del Webhook requerida por Meta.
    El token de verificación debe coincidir con META_VERIFY_TOKEN en .env.
    """
    if hub_mode == "subscribe" and hub_verify_token == os.getenv("META_VERIFY_TOKEN"):
        print("✅ Meta Webhook verificado correctamente.")
        return int(hub_challenge)
    return "Verification failed"

@app.post("/api/v1/meta/webhook")
async def receive_meta_webhook(request: Request, db: Session = Depends(get_db)):
    """Recibe notificaciones en tiempo real de Instagram/Facebook/WhatsApp."""
    import requests
    data = await request.json()
    print(f"📡 Meta Webhook recibido: {json.dumps(data, indent=2)}")

    # 1. Extraer el mensaje y el remitente (Messenger / Instagram)
    try:
        entries = data.get('entry', [])
        for entry in entries:
            messaging = entry.get('messaging', [])
            for message_event in messaging:
                sender_id = message_event.get('sender', {}).get('id')
                recipient_id = message_event.get('recipient', {}).get('id') # ID de nuestra página
                message = message_event.get('message', {})
                
                if message and 'text' in message:
                    text = message['text']
                    print(f"💬 Mensaje de {sender_id}: {text}")

                    # 2. IA Check: ¿Es intención de pedir?
                    model = genai.GenerativeModel('gemini-flash-latest')
                    prompt = f"El cliente dice: '{text}'. ¿Es un saludo o una intención de ver el menú/pedir comida? Responde solo 'SI' o 'NO'."
                    ai_res = model.generate_content(prompt).text.strip().upper()

                    if "SI" in ai_res:
                        # 3. Buscar el Tenant/Branch vinculado a esta página (recipient_id)
                        # Por ahora usamos el primero o el configurado en .env para el MVP
                        branch = db.query(models.Branch).first() # TODO: Mapear recipient_id a branch real
                        tenant_slug = branch.tenant.slug if branch else "hub"
                        
                        reply_text = f"¡Hola! 🚀 Soy el asistente inteligente de {branch.tenant.name if branch else 'HUB'}. \n\nPuedes ver nuestro menú interactivo y pedir directamente aquí: \n👉 https://hub-frontend-bbaa.onrender.com/{tenant_slug}"
                        
                        # 4. Enviar respuesta vía API de Meta
                        # Detectar si es Instagram o Messenger para usar el token correcto
                        is_instagram = "instagram" in data.get('object', '')
                        access_token = os.getenv("IG_ACCESS_TOKEN") if is_instagram else os.getenv("FB_PAGE_ACCESS_TOKEN")
                        
                        endpoint = f"https://graph.facebook.com/v19.0/me/messages?access_token={access_token}"
                        
                        payload = {
                            "recipient": {"id": sender_id},
                            "message": {"text": reply_text}
                        }
                        
                        res = requests.post(endpoint, json=payload)
                        print(f"✅ Respuesta enviada ({'IG' if is_instagram else 'FB'}): {res.status_code}")

    except Exception as e:
        print(f"❌ Error procesando webhook Messenger/IG: {str(e)}")

    # 5. Lógica para WhatsApp (Estructura diferente)
    try:
        entries = data.get('entry', [])
        for entry in entries:
            changes = entry.get('changes', [])
            for change in changes:
                value = change.get('value', {})
                messages = value.get('messages', [])
                if messages:
                    wa_message = messages[0]
                    sender_wa_id = wa_message.get('from')
                    wa_text = wa_message.get('text', {}).get('body', '')
                    phone_id = value.get('metadata', {}).get('phone_number_id')
                    
                    print(f"📱 WhatsApp de {sender_wa_id}: {wa_text}")

                    # IA Check
                    model = genai.GenerativeModel('gemini-flash-latest')
                    prompt = f"El cliente dice en WhatsApp: '{wa_text}'. ¿Es un saludo o intención de pedir? Responde SI o NO."
                    ai_res = model.generate_content(prompt).text.strip().upper()

                    if "SI" in ai_res:
                        branch = db.query(models.Branch).first()
                        tenant_slug = branch.tenant.slug if branch else "hub"
                        reply_text = f"¡Hola! 🚀 Soy el asistente de {branch.tenant.name if branch else 'HUB'}. \n\nMenú Digital: https://hub-frontend-bbaa.onrender.com/{tenant_slug}"
                        
                        access_token = os.getenv("WA_ACCESS_TOKEN")
                        endpoint = f"https://graph.facebook.com/v19.0/{phone_id}/messages"
                        
                        payload = {
                            "messaging_product": "whatsapp",
                            "to": sender_wa_id,
                            "type": "text",
                            "text": {"body": reply_text}
                        }
                        res = requests.post(endpoint, json=payload, headers={"Authorization": f"Bearer {access_token}"})
                        print(f"✅ WhatsApp enviado: {res.status_code}")

    except Exception as e:
        print(f"❌ Error procesando webhook WhatsApp: {str(e)}")

    return {"status": "received"}

@app.get("/api/v1/admin/meta/test")
def test_meta_config():
    """Prueba rápida para ver si las credenciales de Meta están cargadas."""
    return {
        "fb_token_present": bool(os.getenv("FB_PAGE_ACCESS_TOKEN")),
        "ig_token_present": bool(os.getenv("IG_ACCESS_TOKEN")),
        "wa_token_present": bool(os.getenv("WA_ACCESS_TOKEN") and os.getenv("WA_ACCESS_TOKEN") != "TU_WHATSAPP_TOKEN_AQUI"),
        "callback_url": f"https://hub-api-2lql.onrender.com/api/v1/meta/webhook"
    }

# Background Scheduler
from apscheduler.schedulers.background import BackgroundScheduler
import datetime
import pytz
import subprocess
import sys

def check_instagram_schedules():
    from database import SessionLocal
    db = SessionLocal()
    try:
        now = datetime.datetime.now(pytz.timezone('America/Bogota'))
        current_time = now.strftime("%H:%M")
        
        branches = db.query(models.Branch).filter(models.Branch.autopilot_active == True).all()
        for b in branches:
            # Usar el token específico de la rama si existe, si no el global
            token = b.ig_token or os.getenv("IG_ACCESS_TOKEN")
            if not token: continue

            status = None
            if b.opening_time == current_time:
                status = "OPEN"
            elif b.closing_time == current_time:
                status = "CLOSED"
                
            if status:
                try:
                    import requests
                    store_name = f"{b.tenant.name} {b.name}"
                    slug = b.tenant.slug
                    if status == "OPEN":
                        bio = f"✅ ¡Abiertos en {store_name}! \n🚀 Pide aquí: hub.com/{slug} \n👇"
                    else:
                        bio = f"💤 {store_name} está cerrado por ahora. \n📅 Mira el menú y programa: hub.com/{slug}"

                    url = f"https://graph.facebook.com/v19.0/{b.ig_account_id}"
                    payload = {'biography': bio, 'access_token': token}
                    requests.post(url, data=payload)
                except Exception as e:
                    print(f"Error MCP Autopilot: {e}")
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(check_instagram_schedules, 'interval', minutes=1)
scheduler.start()

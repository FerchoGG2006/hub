import json
import os
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from dotenv import load_dotenv

import models
from database import get_db, engine
from utils.storage import upload_product_image
from utils.gemini_extractor import extract_menu_from_image
import auth

load_dotenv()

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
        "valid_until": tenant.valid_until.isoformat() if tenant.valid_until else None
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

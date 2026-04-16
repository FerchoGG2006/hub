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

# ════════════════ ENDPOINTS MULTI-TENANT ════════════════

@app.get("/api/v1/tenant/{slug}")
def get_tenant_config(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter_by(slug=slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="HUB no encontrado")
    return {
        "id": tenant.id,
        "slug": tenant.slug,
        "name": tenant.name,
        "brand_color": tenant.brand_color,
        "logo_url": tenant.logo_url,
        "whatsapp_number": tenant.whatsapp_number,
        "whatsapp_message": tenant.whatsapp_message
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
def get_all_tenants(db: Session = Depends(get_db)):
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
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
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

    return {"status": "ok", "message": "Tenant y Menú inyectados vía AI", "tenant_id": nuevo_tenant.id}

@app.put("/api/admin/products/{product_id}/toggle")
async def toggle_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    p.is_available = not p.is_available
    db.commit()
    
    await manager.broadcast({"type": "MENU_UPDATE", "event": "PRODUCT_TOGGLE", "product_id": product_id, "tenant_id": p.tenant_id})
    return {"status": "ok", "is_available": p.is_available}

@app.post("/api/admin/products", status_code=201)
async def create_product(
    name: str = Form(...),
    price: str = Form(...),
    desc: str = Form(""),
    emoji: str = Form("🍽️"),
    category_id: int = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
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

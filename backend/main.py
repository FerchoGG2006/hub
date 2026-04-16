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

load_dotenv()

# Crear tablas si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="hub API",
    description="Backend de la plataforma hub — Carta Digital Premium",
    version="1.0.0",
)

# CORS — en producción reemplaza "*" por tu dominio de Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "*"), "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ══════════════════════════════════════════════════════════════
#  WEBSOCKET MANAGER (Para actualizaciones HUD en Tiempo Real)
# ══════════════════════════════════════════════════════════════
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
            # Esperar mensajes para mantener la conexión viva
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
# ══════════════════════════════════════════════════════════════
#  GET /api/menu-dynamic
#  Devuelve el menú agrupado por categorías, listo para el
#  MenuEngine.jsx (cada clave es una "hoja" del libro 3D).
# ══════════════════════════════════════════════════════════════
@app.get("/api/menu-dynamic")
def get_menu(db: Session = Depends(get_db)):
    categories = db.query(models.Category).order_by(models.Category.id).all()

    if not categories:
        raise HTTPException(
            status_code=404,
            detail="No hay categorías. Ejecuta: python backend/seed_db.py",
        )

    menu_structure: dict[str, list] = {}
    for cat in categories:
        menu_structure[cat.name] = [
            {
                "id":          p.id,
                "name":        p.name,
                "price":       p.price,
                # Enviamos AMBOS nombres para que ProductCell.jsx funcione
                # tanto con la API como con el fallback al MenuData.js estático
                "description": p.description or "",   # nombre real en DB y en ProductCell
                "desc":        p.description or "",   # alias por compatibilidad
                "emoji":       p.emoji or "🍽️",
                "image_url":   p.image_url or "",     # nombre real en DB
                "image":       p.image_url or "",     # alias por compatibilidad
            }
            for p in cat.products
            if p.is_available
        ]

    return menu_structure


# ══════════════════════════════════════════════════════════════
#  GET /api/categories   (usado por AdminDashboard)
# ══════════════════════════════════════════════════════════════
@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(models.Category).order_by(models.Category.id).all()
    return [{"id": c.id, "name": c.name, "icon": c.icon} for c in cats]


# ══════════════════════════════════════════════════════════════
#  POST /api/admin/products
#  El AdminDashboard sube la foto + datos del producto.
# ══════════════════════════════════════════════════════════════
@app.post("/api/admin/products", status_code=201)
async def create_product(
    name:        str        = Form(...),
    price:       str        = Form(...),
    desc:        str        = Form(""),
    emoji:       str        = Form("🍽️"),
    category_id: int        = Form(...),
    image:       UploadFile = File(None),
    db: Session = Depends(get_db),
):
    # Verificar que la categoría existe
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail=f"Categoría {category_id} no encontrada")

    # Subir imagen a Cloudinary (opcional)
    image_url = ""
    if image and image.filename:
        image_url = upload_product_image(image.file)

    product = models.Product(
        name=name,
        price=price,
        description=desc,
        emoji=emoji,
        category_id=category_id,
        image_url=image_url,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # Broadcast a todos los comensales
    await manager.broadcast({"type": "MENU_UPDATE", "event": "NEW_PRODUCT"})

    return {
        "status":  "success",
        "id":      product.id,
        "name":    product.name,
        "image":   image_url,
        "message": f"'{name}' añadido a {cat.name}",
    }


# ══════════════════════════════════════════════════════════════
#  PUT /api/admin/products/{id}/toggle
#  Activa / desactiva un producto sin eliminarlo
# ══════════════════════════════════════════════════════════════
@app.put("/api/admin/products/{product_id}/toggle")
async def toggle_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    product.is_available = not product.is_available
    db.commit()

    # Dispara el Kill-Switch a las cartas de los clientes en tiempo real
    action = "ONLINE" if product.is_available else "OFFLINE"
    await manager.broadcast({
        "type": "MENU_UPDATE", 
        "event": "PRODUCT_TOGGLE",
        "product_id": product.id,
        "is_available": product.is_available,
        "action": action
    })

    return {"id": product_id, "is_available": product.is_available}

# ══════════════════════════════════════════════════════════════
#  POST /api/analytics/track
#  Reporte de interacciones para el HUD
# ══════════════════════════════════════════════════════════════
@app.post("/api/analytics/track")
async def track_action(product_id: int, action: str, db: Session = Depends(get_db)):
    new_event = models.Analytics(product_id=product_id, action=action)
    db.add(new_event)
    db.commit()
    
    # Notificar al Terminal Admin HUD
    await manager.broadcast({
        "type": "ANALYTICS_UPDATE",
        "product_id": product_id,
        "action": action
    })
    return {"status": "tracked"}

# ══════════════════════════════════════════════════════════════
#  GET /api/analytics/top
#  Obtiene los stats iniciales para el HUD
# ══════════════════════════════════════════════════════════════
@app.get("/api/analytics/top")
def get_top_analytics(db: Session = Depends(get_db)):
    # Contar clics por producto y obtener el nombre usando SQLAlchemy
    results = db.query(models.Product.id, models.Product.name, func.count(models.Analytics.id).label('hits')) \
        .outerjoin(models.Analytics, models.Product.id == models.Analytics.product_id) \
        .group_by(models.Product.id, models.Product.name) \
        .order_by(func.count(models.Analytics.id).desc()) \
        .limit(10).all()
        
    return [{"id": r.id, "name": r.name, "hits": r.hits} for r in results]


# ══════════════════════════════════════════════════════════════
#  POST /api/orders
#  El CheckoutView registra cada pedido en Neon para analítica
# ══════════════════════════════════════════════════════════════
@app.post("/api/orders", status_code=201)
def create_order(order_data: dict, db: Session = Depends(get_db)):
    order = models.Order(
        delivery_method=order_data.get("delivery", "mesa"),
        payment_method= order_data.get("payment",  "efectivo"),
        total_price=    order_data.get("total",     0),
        items_json=     json.dumps(order_data.get("items", []), ensure_ascii=False),
        table_number=   order_data.get("table",     ""),
        phone=          order_data.get("phone",     ""),
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"status": "success", "order_id": order.id}


# ── Health check ──
@app.get("/health")
def health():
    return {"status": "ok", "service": "hub-api"}

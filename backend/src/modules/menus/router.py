from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import models
import auth
from database import get_db
from src.shared.utils.responses import success_response
from src.shared.errors.app_error import AppError
from src.shared.utils.websocket_manager import manager
from utils.storage import upload_product_image
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["menus"])

@router.get("/v1/tenant/{slug}/menu")
def get_tenant_menu(slug: str, include_unavailable: bool = False, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter_by(slug=slug).first()
    if not tenant:
        raise AppError(message="Tenant no encontrado", status_code=404, code="TENANT_NOT_FOUND")
    
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
                "category_id": p.category_id,
                "type": p.type,
                "variants": [
                    {"id": v.id, "name": v.name, "price": v.price}
                    for v in p.variants
                ]
            }
            for p in cat.products if (p.is_available or include_unavailable)
        ]
        if prods:
            grouped_menu[cat.name] = prods

    return success_response(grouped_menu)

@router.get("/v1/tenant/{slug}/categories")
def get_tenant_categories(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter_by(slug=slug).first()
    if not tenant:
        raise AppError(message="Tenant no encontrado", status_code=404, code="TENANT_NOT_FOUND")
    
    cats = db.query(models.Category).filter_by(tenant_id=tenant.id).all()
    return success_response([{"id": c.id, "name": c.name, "icon": c.icon} for c in cats])

@router.put("/admin/products/{product_id}/toggle")
async def toggle_product(product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not p:
        raise AppError(message="Producto no encontrado", status_code=404)
        
    if current_user.role != "superadmin" and current_user.tenant_id != p.tenant_id:
        raise AppError(message="Operación denegada", status_code=403)
        
    p.is_available = not p.is_available
    db.commit()
    
    await manager.broadcast({"type": "MENU_UPDATE", "event": "PRODUCT_TOGGLE", "product_id": product_id, "tenant_id": p.tenant_id}, tenant_id=p.tenant_id)
    return success_response({"is_available": p.is_available})

@router.post("/admin/products", status_code=201)
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
    if not cat:
        raise AppError(message="Categoría no encontrada", status_code=404)

    if current_user.role != "superadmin" and current_user.tenant_id != cat.tenant_id:
        raise AppError(message="No puedes añadir items a la carta de este HUB.", status_code=403)

    image_url = None
    if image is not None and image.filename != "":
        image_url = upload_product_image(image)

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
    
    await manager.broadcast({"type": "MENU_UPDATE", "event": "NEW_PRODUCT", "tenant_id": cat.tenant_id}, tenant_id=cat.tenant_id)
    return success_response(new_prod)

@router.patch("/admin/products/{product_id}/image", status_code=200)
async def update_product_image(
    product_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    prod = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not prod:
        raise AppError(message="Producto no encontrado", status_code=404)

    if current_user.role != "superadmin" and current_user.tenant_id != prod.tenant_id:
        raise AppError(message="No tienes permiso para modificar este producto", status_code=403)

    if image.filename == "":
        raise AppError(message="Archivo vacío", status_code=400)

    image_url = upload_product_image(image)
    prod.image_url = image_url
    db.commit()
    db.refresh(prod)

    await manager.broadcast({"type": "MENU_UPDATE", "event": "PRODUCT_UPDATED", "tenant_id": prod.tenant_id}, tenant_id=prod.tenant_id)
    return success_response({"image_url": image_url})

class MagicEditRequest(BaseModel):
    name: str
    price: str
    desc: str

@router.post("/admin/magic-edit")
def magic_edit_endpoint(
    req: MagicEditRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    from utils.gemini_extractor import enhance_copywriting
    res = enhance_copywriting(req.name, req.price, req.desc)
    return success_response(res)

@router.post("/admin/ai-ingest")
def ai_ingest_tenant_menu(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    from utils.gemini_extractor import extract_menu_from_image
    from typing import List
    
    if not current_user.tenant_id:
        raise AppError(message="Los superadmins deben usar el onboarding global.", status_code=400)

    for file in files:
        image_bytes = file.file.read()
        menu_data = extract_menu_from_image(image_bytes)
        
        for category_data in menu_data:
            cat_name = category_data.get("category", "Miscelaneo")
            cat_icon = category_data.get("icon", "🍽️")
            
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
            
    return success_response(None, message=f"Carta migrada vía IA exitosamente ({len(files)} imágenes)")

from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import models
import auth
from database import get_db
from src.shared.utils.responses import success_response
from src.shared.errors.app_error import AppError
import logging
import os
from datetime import datetime

router = APIRouter(prefix="/api", tags=["tenants"])
logger = logging.getLogger("platorin")

@router.get("/v1/tenant/{slug}")
def get_tenant_config(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter_by(slug=slug).first()
    if not tenant:
        raise AppError(message="HUB no encontrado", status_code=404, code="TENANT_NOT_FOUND")
        
    if tenant.valid_until and datetime.utcnow() > tenant.valid_until:
        if tenant.subscription_status == "active":
            tenant.subscription_status = "suspended"
            db.commit()

    data = {
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
        "enabled_modules": tenant.enabled_modules or ["orders", "products"],
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
    return success_response(data)

@router.get("/admin/tenants")
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
    return success_response(result)

@router.post("/admin/reset-passcode")
def reset_passcode(
    tenant_slug: str = Form(...),
    new_passcode: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_superadmin)
):
    tenant = db.query(models.Tenant).filter_by(slug=tenant_slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
        
    user = db.query(models.User).filter_by(tenant_id=tenant.id, role="admin").first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario admin no encontrado")
        
    user.hashed_password = auth.get_password_hash(new_passcode)
    db.commit()
    
    return success_response({"message": f"Passcode de {tenant_slug} actualizado con éxito"})

@router.post("/admin/onboard")
def onboard_new_tenant(
    name: str = Form(...),
    slug: str = Form(...),
    brand_color: str = Form("#f59e0b"),
    whatsapp_number: str = Form(""),
    email: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    logger.info(f"Iniciando onboarding para: {name} ({slug})")
    
    # Validar duplicados antes de procesar
    existing_tenant = db.query(models.Tenant).filter_by(slug=slug).first()
    if existing_tenant:
        raise AppError(message=f"El identificador '{slug}' ya está en uso. Prueba con otro nombre.", status_code=400, code="SLUG_TAKEN")
    
    username_to_check = email or f"admin@{slug}.com"
    existing_user = db.query(models.User).filter_by(username=username_to_check).first()
    if existing_user:
        raise AppError(message="Este correo electrónico ya tiene una cuenta activa.", status_code=400, code="USER_EXISTS")

    from utils.gemini_extractor import extract_menu_from_image
    try:
        nuevo_tenant = models.Tenant(
            slug=slug,
            name=name,
            brand_color=brand_color,
            whatsapp_number=whatsapp_number,
            enabled_modules=["orders", "products", "tables", "inventory"]
        )
        db.add(nuevo_tenant)
        db.commit()
        db.refresh(nuevo_tenant)
        
        import secrets
        import string
        generated_pass = ''.join(secrets.choice(string.digits) for i in range(6))
        
        hashed_password = auth.get_password_hash(generated_pass)
        nuevo_usuario = models.User(
            username=email or f"admin@{slug}.com",
            hashed_password=hashed_password,
            role="admin",
            tenant_id=nuevo_tenant.id
        )
        db.add(nuevo_usuario)
        db.commit()

        try:
            image_bytes = file.file.read()
            menu_data = extract_menu_from_image(image_bytes)
            
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
        except Exception as e:
            logger.error(f"Error procesando menú IA: {e}")

        try:
            front_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            if email:
                from utils.email_service import send_welcome_kit
                send_welcome_kit(email, name, slug, generated_pass, front_url)
        except Exception as e:
            logger.error(f"Error enviando kit de bienvenida: {e}")

        data = {
            "status": "success",
            "message": "Negocio activado en tiempo récord",
            "credentials": {
                "user": nuevo_usuario.username,
                "passcode": generated_pass
            },
            "url": f"https://techgastrohub.com/t/{slug}"
        }
        return success_response(data)
    except Exception as e:
        logger.error(f"FATAL ERROR ONBOARDING: {str(e)}")
        raise AppError(message=f"Error interno: {str(e)}", status_code=500)

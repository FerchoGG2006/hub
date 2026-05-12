from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models
import auth
from database import get_db
from src.shared.utils.responses import success_response
from pydantic import BaseModel
import datetime
import json

router = APIRouter(prefix="/api/admin/marketing", tags=["marketing"])

class AIMarketingRequest(BaseModel):
    goal: str

@router.post("/ai")
def generate_ai_campaign(req: AIMarketingRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    import google.generativeai as genai
    model = genai.GenerativeModel('gemini-flash-latest')
    prompt = (
        "Eres un experto en Copywriting Gastronómico de clase mundial. "
        f"El restaurante tiene este objetivo: '{req.goal}'. "
        "Tu tarea es transformar ese objetivo en una campaña persuasiva. "
        "REGLA DE ORO: NO repitas la frase del objetivo literalmente. Úsala solo como contexto. "
        "Genera: "
        "1. Un mensaje de WhatsApp/SMS de máximo 160 caracteres que genere hambre y urgencia. "
        "2. Un asunto de email corto y 'clickbait' elegante. "
        "3. Un código de cupón creativo relacionado (ej: LUNCHTIME25, FOODLOVER). "
        "4. Un porcentaje de descuento (solo el número, ej: 15). "
        "Responde EXCLUSIVAMENTE en JSON estricto con claves: sms_text, email_subject, coupon_code, discount_percent."
    )
    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        
        import re
        json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if json_match:
            text = json_match.group(0)
        else:
            text = raw_text.replace("```json", "").replace("```", "").strip()
            
        data = json.loads(text)
    except Exception as e:
        # Fallback inteligente usando la marca del restaurante
        tenant_prefix = "PROMO"
        try:
            tenant = db.query(models.Tenant).filter_by(id=current_user.tenant_id).first()
            if tenant:
                tenant_prefix = tenant.slug.upper()[:8]
        except:
            pass

        data = {
            "sms_text": "¡Es hora de consentir tu paladar! 🍕 Aprovecha nuestra oferta especial de hoy y pide lo que más te gusta.",
            "email_subject": "Tu mesa (y un regalo) te están esperando... 🎁",
            "coupon_code": f"{tenant_prefix}{datetime.datetime.now().strftime('%d%m')}",
            "discount_percent": 15
        }

    try:
        tid = current_user.tenant_id
        if tid:
            nuevo_cupon = models.Coupon(
                tenant_id=tid,
                code=data.get('coupon_code', 'DESCUENTO10').upper(),
                discount_percent=int(data.get('discount_percent', 10))
            )
            db.add(nuevo_cupon)
            db.commit()
    except Exception:
        pass

    return success_response(data)

@router.post("/send-mass")
def send_mass_campaign(req: AIMarketingRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    tid = current_user.tenant_id
    if not tid: return success_response({"status": "error", "message": "No tenant found"})
    
    # Consultar directamente nuestra nueva base de datos centralizada de clientes
    customers = db.query(models.Customer).filter_by(tenant_id=tid).all()
    all_phones = [c.phone for c in customers if c.phone]
    
    return success_response({
        "status": "success",
        "contacts_count": len(all_phones),
        "message": f"Campaña programada para {len(all_phones)} contactos registrados.",
        "phones": all_phones
    })

@router.get("/coupon/{code}")
def validate_coupon(slug: str, code: str, db: Session = Depends(get_db)):
    t = db.query(models.Tenant).filter_by(slug=slug).first()
    if not t: return success_response({"valid": False}, message="Tenant not found")
    cp = db.query(models.Coupon).filter_by(tenant_id=t.id, code=code.upper(), is_active=True).first()
    if not cp: return success_response({"valid": False}, message="Cupón inválido")
    return success_response({"valid": True, "discount": cp.discount_percent})

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
    prompt = f"Eres un experto en marketing gastronómico. El restaurante quiere: '{req.goal}'. Redacta 1 SMS corto persuasivo, 1 Asunto de Email llamativo, y crea un Código de Cupón de descuento de un solo texto (ej: HAMBUR30) y el Porcentaje sugerido. Responde en JSON estricto con claves: sms_text, email_subject, coupon_code, discount_percent."
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

@router.get("/coupon/{code}")
def validate_coupon(slug: str, code: str, db: Session = Depends(get_db)):
    t = db.query(models.Tenant).filter_by(slug=slug).first()
    if not t: return success_response({"valid": False}, message="Tenant not found")
    cp = db.query(models.Coupon).filter_by(tenant_id=t.id, code=code.upper(), is_active=True).first()
    if not cp: return success_response({"valid": False}, message="Cupón inválido")
    return success_response({"valid": True, "discount": cp.discount_percent})

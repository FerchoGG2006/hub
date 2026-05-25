from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
import models
import auth
from database import get_db
from src.shared.utils.responses import success_response
from pydantic import BaseModel
import datetime
import json
from src.modules.marketing.worker import process_campaign_queue

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
def send_mass_campaign(
    req: AIMarketingRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    tid = current_user.tenant_id
    if not tid: 
        return success_response({"status": "error", "message": "No tenant found"})
    
    # 1. Obtener la audiencia (clientes con número de teléfono registrado)
    customers = db.query(models.Customer).filter_by(tenant_id=tid).all()
    target_customers = [c for c in customers if c.phone]
    
    if not target_customers:
        return success_response({
            "status": "error",
            "message": "No hay clientes con teléfono registrados en el CRM para esta sede."
        })
    
    # 2. Crear la Campaña en la base de datos
    campaign_name = f"Campaña Masiva — {datetime.datetime.now().strftime('%d/%m/%Y %H:%M')}"
    sms_text = req.goal or "¡Aprovecha hoy nuestro descuento exclusivo! Toca el link y pide en Platorin."
    
    new_campaign = models.Campaign(
        tenant_id=tid,
        name=campaign_name,
        campaign_type="whatsapp",
        audience_filter="all",
        message_body=sms_text,
        status="pending"
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)

    # 3. Crear los Jobs individuales en la cola
    for cust in target_customers:
        job = models.CampaignJob(
            campaign_id=new_campaign.id,
            customer_id=cust.id,
            status="pending"
        )
        db.add(job)
    db.commit()

    # 4. Encolar la ejecución asíncrona en BackgroundTasks
    background_tasks.add_task(process_campaign_queue, new_campaign.id)

    return success_response({
        "status": "success",
        "campaign_id": new_campaign.id,
        "contacts_count": len(target_customers),
        "message": f"Campaña encolada exitosamente para {len(target_customers)} clientes."
    })

@router.get("/campaigns")
def list_campaigns(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Lista el historial de campañas creadas."""
    tid = current_user.tenant_id
    if not tid: 
        return success_response([])
    
    camps = db.query(models.Campaign).filter_by(tenant_id=tid).order_by(models.Campaign.created_at.desc()).all()
    return success_response([
        {
            "id": c.id,
            "name": c.name,
            "campaign_type": c.campaign_type,
            "status": c.status,
            "message_body": c.message_body,
            "created_at": c.created_at.isoformat()
        } for c in camps
    ])

@router.get("/campaigns/{campaign_id}/progress")
def get_campaign_progress(campaign_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Retorna las estadísticas reales del progreso de envío de una campaña."""
    campaign = db.query(models.Campaign).filter_by(id=campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")

    if current_user.role != "superadmin" and campaign.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a esta campaña")

    jobs = db.query(models.CampaignJob).filter_by(campaign_id=campaign_id).all()
    
    total = len(jobs)
    pending = sum(1 for j in jobs if j.status in ("pending", "sending"))
    delivered = sum(1 for j in jobs if j.status == "delivered")
    failed = sum(1 for j in jobs if j.status == "failed")

    return success_response({
        "campaign_id": campaign.id,
        "name": campaign.name,
        "status": campaign.status,
        "stats": {
            "total": total,
            "pending": pending,
            "delivered": delivered,
            "failed": failed,
            "progress_percent": round((delivered + failed) / total * 100, 1) if total > 0 else 100
        },
        "jobs": [
            {
                "id": j.id,
                "customer_name": j.customer.name or "Sin nombre",
                "phone": j.customer.phone,
                "status": j.status,
                "failed_reason": j.failed_reason
            } for j in jobs
        ]
    })


@router.get("/coupon/{code}")
def validate_coupon(slug: str, code: str, db: Session = Depends(get_db)):
    t = db.query(models.Tenant).filter_by(slug=slug).first()
    if not t: return success_response({"valid": False}, message="Tenant not found")
    cp = db.query(models.Coupon).filter_by(tenant_id=t.id, code=code.upper(), is_active=True).first()
    if not cp: return success_response({"valid": False}, message="Cupón inválido")
    return success_response({"valid": True, "discount": cp.discount_percent})

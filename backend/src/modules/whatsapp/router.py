from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks
from sqlalchemy.orm import Session
import models
import auth
import os
import json
import datetime
import logging
from database import get_db, SessionLocal
from src.shared.utils.responses import success_response
from src.shared.errors.app_error import AppError
from src.shared.utils.websocket_manager import manager
from events import send_whatsapp_message
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger("platorin.whatsapp")

router = APIRouter(prefix="/api", tags=["whatsapp"])

# ════════════════ SCHEMAS ════════════════
class SendManualMessageRequest(BaseModel):
    phone: str
    body: str

class BotSettingsUpdateRequest(BaseModel):
    chatbot_enabled: bool
    chatbot_personality: str

# ════════════════ PUBLIC WEBHOOK ENDPOINTS ════════════════

@router.get("/webhooks/whatsapp")
def verify_whatsapp_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    """
    Endpoint requerido por Meta para verificar y validar el Webhook.
    """
    verify_token = os.getenv("META_VERIFY_TOKEN", "hub_secret_token_2026")
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        logger.info("✅ Webhook de WhatsApp verificado exitosamente.")
        return int(hub_challenge)
    logger.warning("❌ Fallo en la verificación del webhook de WhatsApp.")
    return "Verification failed"

@router.post("/webhooks/whatsapp")
async def receive_whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Endpoint que recibe los eventos de mensajes entrantes desde Meta.
    Procesa de manera asíncrona para retornar HTTP 200 de inmediato.
    """
    try:
        payload = await request.json()
        logger.info(f"📡 Webhook recibido: {json.dumps(payload)}")
        
        # Encolar procesamiento para evitar timeouts
        background_tasks.add_task(process_incoming_webhook, payload)
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"💥 Error al procesar Webhook: {e}")
        return {"status": "error", "detail": str(e)}

# ════════════════ CORE WEBHOOK PROCESSING (BACKGROUND) ════════════════

async def process_incoming_webhook(payload: dict):
    """
    Analiza el payload del webhook de Meta, guarda el mensaje y activa la IA si aplica.
    """
    db: Session = SessionLocal()
    try:
        # Validar si es una notificación de mensaje de WhatsApp
        entry = payload.get("entry", [])
        if not entry:
            return
            
        changes = entry[0].get("changes", [])
        if not changes:
            return
            
        value = changes[0].get("value", {})
        messages = value.get("messages", [])
        if not messages:
            return # Puede ser una confirmación de entrega (statuses)

        message_data = messages[0]
        customer_phone = message_data.get("from")
        text_body = message_data.get("text", {}).get("body", "")
        timestamp = message_data.get("timestamp", str(int(datetime.datetime.utcnow().timestamp())))
        
        # Obtener datos del perfil del contacto
        contacts = value.get("contacts", [])
        customer_name = contacts[0].get("profile", {}).get("name", "Cliente") if contacts else "Cliente"

        if not customer_phone or not text_body:
            return

        logger.info(f"💬 Mensaje de WhatsApp recibido de {customer_phone} ({customer_name}): {text_body}")

        # 1. Determinar el Tenant correspondiente
        # Buscamos el Tenant o Branch por el número de WhatsApp de destino (metadata)
        display_phone = value.get("metadata", {}).get("display_phone_number")
        
        tenant = None
        if display_phone:
            tenant = db.query(models.Tenant).filter_by(whatsapp_number=display_phone).first()
            if not tenant:
                # Buscar en sedes (branches)
                branch = db.query(models.Branch).filter_by(whatsapp_number=display_phone).first()
                if branch:
                    tenant = branch.tenant

        if not tenant:
            # Fallback seguro: Asignar al primer tenant
            tenant = db.query(models.Tenant).order_by(models.Tenant.id.asc()).first()
            
        if not tenant:
            logger.error("❌ No se encontró ningún Tenant en la base de datos.")
            return

        # 2. Sincronizar CRM
        from core.crm import crm_service
        customer = crm_service.upsert_customer(
            db,
            tenant_id=tenant.id,
            phone=customer_phone,
            name=customer_name
        )

        # 3. Guardar el mensaje entrante en la BD
        incoming_msg = models.WhatsAppMessage(
            tenant_id=tenant.id,
            customer_id=customer.id if customer else None,
            phone=customer_phone,
            sender="customer",
            body=text_body,
            created_at=datetime.datetime.fromtimestamp(int(timestamp))
        )
        db.add(incoming_msg)
        db.commit()
        db.refresh(incoming_msg)

        # 4. Broadcast vía WebSocket al Command Center (Admin Dashboard)
        ws_payload = {
            "type": "NEW_WHATSAPP_MESSAGE",
            "message": {
                "id": incoming_msg.id,
                "phone": incoming_msg.phone,
                "customer_name": customer.name if customer else "Cliente de WhatsApp",
                "sender": "customer",
                "body": incoming_msg.body,
                "created_at": incoming_msg.created_at.isoformat()
            }
        }
        await manager.broadcast(ws_payload, tenant_id=tenant.id)

        # 5. Lógica del Chatbot Inteligente (Gemini Flash)
        if tenant.chatbot_enabled:
            await run_ai_chatbot(db, tenant, customer, incoming_msg)

    except Exception as e:
        logger.error(f"💥 Error crítico en process_incoming_webhook: {e}", exc_info=True)
    finally:
        db.close()

async def run_ai_chatbot(db: Session, tenant: models.Tenant, customer: models.Customer, last_msg: models.WhatsAppMessage):
    """
    Invoca a Gemini Flash con el menú completo y el contexto de la conversación para responder al cliente.
    """
    import google.generativeai as genai
    logger.info(f"🤖 Ejecutando Chatbot Inteligente para {customer.phone}")
    
    # 1. Obtener la carta digital (categorías y productos)
    products = db.query(models.Product).filter_by(tenant_id=tenant.id, is_available=True).all()
    menu_data = []
    for p in products:
        menu_data.append({
            "nombre": p.name,
            "descripcion": p.description or "Sin descripción",
            "precio": p.price,
            "categoria": p.category.name if p.category else "Otros"
        })
    
    # 2. Cargar historial reciente de conversación (últimos 5 mensajes)
    history = db.query(models.WhatsAppMessage).filter_by(
        tenant_id=tenant.id,
        phone=customer.phone
    ).order_by(models.WhatsAppMessage.created_at.desc()).limit(6).all()
    
    history.reverse() # Ordenar cronológicamente
    
    history_text = ""
    for m in history:
        sender_label = "Cliente" if m.sender == "customer" else "Asistente (Tú)"
        history_text += f"{sender_label}: {m.body}\n"

    # 3. Formular prompt
    prompt = (
        f"Eres el asistente inteligente de servicio '{tenant.name}'.\n"
        f"Personalidad y reglas: {tenant.chatbot_personality or 'Responde de forma concisa y amable.'}\n\n"
        f"Aquí tienes nuestra carta digital activa en formato JSON:\n"
        f"{json.dumps(menu_data, ensure_ascii=False, indent=2)}\n\n"
        f"Instrucciones clave:\n"
        f"1. Si el cliente quiere ordenar o comprar, guíalo amablemente para que lo haga a través del menú interactivo en: https://platorin.com/{tenant.slug}\n"
        f"2. Sé muy conciso. Los mensajes de WhatsApp deben ser fáciles de leer.\n"
        f"3. Responde únicamente a la última duda del cliente usando el historial como contexto.\n\n"
        f"Historial de conversación:\n{history_text}"
        f"Asistente (Tú):"
    )

    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        bot_reply = response.text.strip()
        
        # Eliminar posibles etiquetas molestas que añada la IA
        bot_reply = bot_reply.replace("Asistente (Tú):", "").strip()

        logger.info(f"🤖 Bot responde: '{bot_reply}'")

        # 4. Enviar el mensaje por WhatsApp Cloud API
        success = send_whatsapp_message(customer.phone, bot_reply)
        
        # 5. Guardar la respuesta en la base de datos
        bot_msg = models.WhatsAppMessage(
            tenant_id=tenant.id,
            customer_id=customer.id,
            phone=customer.phone,
            sender="bot",
            body=bot_reply,
            created_at=datetime.datetime.utcnow()
        )
        db.add(bot_msg)
        db.commit()
        db.refresh(bot_msg)

        # 6. Broadcast vía WebSocket de la respuesta
        ws_payload = {
            "type": "NEW_WHATSAPP_MESSAGE",
            "message": {
                "id": bot_msg.id,
                "phone": bot_msg.phone,
                "customer_name": customer.name,
                "sender": "bot",
                "body": bot_msg.body,
                "created_at": bot_msg.created_at.isoformat()
            }
        }
        await manager.broadcast(ws_payload, tenant_id=tenant.id)

    except Exception as e:
        logger.error(f"❌ Error en run_ai_chatbot: {e}", exc_info=True)

# ════════════════ ADMIN ENDPOINTS (COMMAND CENTER) ════════════════

@router.get("/admin/whatsapp/chats")
def get_whatsapp_chats(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Obtiene todos los chats de WhatsApp agrupados por cliente con su último mensaje.
    """
    tid = current_user.tenant_id
    if not tid:
        return success_response([])

    # Subquery para encontrar el ID del último mensaje por teléfono
    from sqlalchemy import func
    subq = db.query(
        models.WhatsAppMessage.phone,
        func.max(models.WhatsAppMessage.id).label("max_id")
    ).filter_by(tenant_id=tid).group_by(models.WhatsAppMessage.phone).subquery()

    latest_messages = db.query(models.WhatsAppMessage).join(
        subq, models.WhatsAppMessage.id == subq.c.max_id
    ).order_by(models.WhatsAppMessage.created_at.desc()).all()

    chats = []
    for m in latest_messages:
        cust = db.query(models.Customer).filter_by(tenant_id=tid, phone=m.phone).first()
        chats.append({
            "phone": m.phone,
            "customer_name": cust.name if cust else "Cliente de WhatsApp",
            "last_message": m.body,
            "last_message_sender": m.sender,
            "created_at": m.created_at.isoformat()
        })
    return success_response(chats)

@router.get("/admin/whatsapp/chats/{phone}/messages")
def get_chat_messages(phone: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Obtiene el historial de mensajes de un chat específico.
    """
    tid = current_user.tenant_id
    if not tid:
        raise HTTPException(status_code=403, detail="No autorizado")

    msgs = db.query(models.WhatsAppMessage).filter_by(
        tenant_id=tid,
        phone=phone
    ).order_by(models.WhatsAppMessage.created_at.asc()).all()

    return success_response([
        {
            "id": m.id,
            "sender": m.sender,
            "body": m.body,
            "created_at": m.created_at.isoformat()
        } for m in msgs
    ])

@router.post("/admin/whatsapp/send")
async def send_manual_whatsapp(req: SendManualMessageRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Envía un mensaje manual de WhatsApp al cliente y desactiva temporalmente el bot para evitar colisiones.
    """
    tid = current_user.tenant_id
    if not tid:
        raise HTTPException(status_code=403, detail="No autorizado")

    logger.info(f"📤 Envío manual de WhatsApp a {req.phone}: {req.body}")
    
    # Intentar envío real
    success = send_whatsapp_message(req.phone, req.body)
    
    # Registrar mensaje en la base de datos
    cust = db.query(models.Customer).filter_by(tenant_id=tid, phone=req.phone).first()
    
    new_msg = models.WhatsAppMessage(
        tenant_id=tid,
        customer_id=cust.id if cust else None,
        phone=req.phone,
        sender="agent",
        body=req.body,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    # Broadcast inmediato
    ws_payload = {
        "type": "NEW_WHATSAPP_MESSAGE",
        "message": {
            "id": new_msg.id,
            "phone": new_msg.phone,
            "customer_name": cust.name if cust else "Cliente de WhatsApp",
            "sender": "agent",
            "body": new_msg.body,
            "created_at": new_msg.created_at.isoformat()
        }
    }
    await manager.broadcast(ws_payload, tenant_id=tid)

    return success_response({"success": success})

@router.get("/admin/whatsapp/bot-settings")
def get_bot_settings(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Obtiene la configuración actual del bot.
    """
    tid = current_user.tenant_id
    if not tid:
         raise HTTPException(status_code=403, detail="No autorizado")
    tenant = db.query(models.Tenant).filter_by(id=tid).first()
    return success_response({
        "chatbot_enabled": tenant.chatbot_enabled,
        "chatbot_personality": tenant.chatbot_personality
    })

@router.patch("/admin/whatsapp/bot-settings")
def update_bot_settings(req: BotSettingsUpdateRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Actualiza la configuración del bot.
    """
    tid = current_user.tenant_id
    if not tid:
         raise HTTPException(status_code=403, detail="No autorizado")
    tenant = db.query(models.Tenant).filter_by(id=tid).first()
    tenant.chatbot_enabled = req.chatbot_enabled
    tenant.chatbot_personality = req.chatbot_personality
    db.commit()
    return success_response({"status": "ok"})

import asyncio
import logging
import os
from datetime import datetime
from sqlalchemy.orm import Session
import models
from database import SessionLocal
from events import send_whatsapp_message

# Configuración de Observabilidad específica para Marketing
log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
os.makedirs(log_dir, exist_ok=True)
marketing_log_file = os.path.join(log_dir, "marketing.log")

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler = logging.FileHandler(marketing_log_file, encoding='utf-8')
file_handler.setFormatter(formatter)

logger = logging.getLogger("platorin.marketing.worker")
logger.setLevel(logging.INFO)
if not logger.handlers:
    logger.addHandler(file_handler)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

async def process_campaign_queue(campaign_id: int):
    """
    Worker asíncrono que procesa secuencialmente los jobs de una campaña
    aplicando Throttling seguro para evitar límites de API y SPAM blocks.
    """
    logger.info(f"🚀 Iniciando procesamiento de campaña ID: {campaign_id}")
    
    # Creamos una sesión de base de datos dedicada para el hilo de fondo
    db: Session = SessionLocal()
    try:
        campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
        if not campaign:
            logger.error(f"❌ Campaña {campaign_id} no encontrada en el worker.")
            return

        campaign.status = "sending"
        db.commit()

        # Obtener todos los trabajos pendientes de la campaña
        jobs = db.query(models.CampaignJob).filter(
            models.CampaignJob.campaign_id == campaign_id,
            models.CampaignJob.status == "pending"
        ).all()

        total_jobs = len(jobs)
        logger.info(f"📊 Procesando {total_jobs} envíos para la campaña '{campaign.name}'")

        for idx, job in enumerate(jobs):
            # Recargar el job dentro de la sesión por si hubo cambios concurrentes
            customer = db.query(models.Customer).filter(models.Customer.id == job.customer_id).first()
            if not customer:
                job.status = "failed"
                job.failed_reason = "Cliente no encontrado en CRM"
                db.commit()
                continue

            # 1. Validación de Opt-In
            if not customer.whatsapp_opt_in:
                job.status = "failed"
                job.failed_reason = "Cliente ha desactivado recibir mensajes (Opt-Out)"
                db.commit()
                continue

            # 2. Validación de Teléfono
            if not customer.phone:
                job.status = "failed"
                job.failed_reason = "Cliente no tiene teléfono registrado"
                db.commit()
                continue

            # 3. Envío real a través del canal elegido (ej. WhatsApp)
            job.status = "sending"
            db.commit()

            success = False
            error_reason = None
            max_retries = 3
            base_delay = 2.0  # Segundos

            for attempt in range(1, max_retries + 1):
                try:
                    # send_whatsapp_message retorna True si se envía físicamente, o False si no está configurado
                    success = send_whatsapp_message(customer.phone, campaign.message_body)
                    if not success:
                        error_reason = "Meta API error o token no configurado (Advertencia segura en logs)"
                        break  # Si falla por configuración, no reintentamos
                    else:
                        break  # Envío exitoso, salir del retry loop
                except Exception as e:
                    error_reason = str(e)
                    logger.warning(f"⚠️ Error enviando WhatsApp al job {job.id} (Intento {attempt}/{max_retries}): {e}")
                    
                    if attempt < max_retries:
                        # Exponential backoff: 2s, 4s...
                        sleep_time = base_delay ** attempt
                        logger.info(f"⏳ Reintentando job {job.id} en {sleep_time} segundos...")
                        await asyncio.sleep(sleep_time)
                        job.retry_count = attempt
                        db.commit()
                    else:
                        logger.error(f"💥 Fallo definitivo enviando WhatsApp al job {job.id} tras {max_retries} intentos.")

            # 4. Actualizar estado del job individualmente
            if success:
                job.status = "delivered"
                job.delivered_at = datetime.utcnow()
                job.failed_reason = None
            else:
                job.status = "failed"
                job.failed_reason = error_reason

            db.commit()
            logger.info(f"✅ Job {job.id} finalizado ({idx + 1}/{total_jobs}): {job.status}")

            # 5. Throttling Seguro (500ms entre envíos para cumplir políticas de Meta)
            await asyncio.sleep(0.5)

        # Campaña finalizada
        campaign.status = "completed"
        db.commit()
        logger.info(f"🎉 Campaña {campaign_id} procesada por completo.")

    except Exception as e:
        logger.error(f"❌ Error crítico procesando la campaña {campaign_id} en el worker: {e}")
        try:
            campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
            if campaign:
                campaign.status = "failed"
                db.commit()
        except:
            pass
    finally:
        db.close()

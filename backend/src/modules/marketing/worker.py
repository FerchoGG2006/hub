import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session
import models
from database import SessionLocal
from events import send_whatsapp_message

logger = logging.getLogger("platorin.marketing.worker")

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
            try:
                # send_whatsapp_message retorna True si se envía físicamente, o False si no está configurado
                success = send_whatsapp_message(customer.phone, campaign.message_body)
                if not success:
                    error_reason = "Meta API error o token no configurado (Advertencia segura en logs)"
            except Exception as e:
                error_reason = str(e)
                logger.error(f"💥 Error crítico enviando WhatsApp al job {job.id}: {e}")

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

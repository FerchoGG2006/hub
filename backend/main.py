import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import models
from database import engine, SessionLocal, get_db
import auth
from src.shared.config.env import settings
from src.shared.middleware.exception_handler import global_exception_handler
from src.shared.errors.app_error import AppError
from src.shared.utils.websocket_manager import manager
from src.shared.infra.redis_manager import redis_client
from sqlalchemy import text

# Import Routers
from src.modules.auth.router import router as auth_router
from src.modules.tenants.router import router as tenants_router
from src.modules.menus.router import router as menus_router
from src.modules.orders.router import router as orders_router
from src.modules.analytics.router import router as analytics_router
from src.modules.payments.router import router as payments_router
from src.modules.marketing.router import router as marketing_router
from src.modules.social.router import router as social_router
from src.modules.whatsapp.router import router as whatsapp_router
from src.modules.menus.cart_router import router as cart_router

# Activar Listeners de Dominio (Modular Monolith)
import src.modules.crm.service # Activa el registro automático de clientes
import src.modules.realtime.service # Activa las notificaciones en vivo
import src.modules.marketing.service # Activa campañas automáticas
import src.modules.whatsapp.service # Activa las alertas transaccionales de WhatsApp



# External Routers (Legacy/Core)
from events import router as events_router
from core.payments.webhook_handler import router as payments_webhook_router

load_dotenv()

# Background Tasks
from core.payments.payment_service import handle_payment_expiration
from src.modules.whatsapp.recovery_service import recover_abandoned_carts

def run_job_with_db(job_func):
    db = SessionLocal()
    try:
        job_func(db)
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(lambda: run_job_with_db(handle_payment_expiration), 'interval', minutes=1)
if os.getenv('ENABLE_WHATSAPP_RECOVERY', 'false').lower() == 'true':
    scheduler.add_job(lambda: run_job_with_db(recover_abandoned_carts), 'interval', minutes=1)

@asynccontextmanager
async def lifespan(app):
    if os.getenv('AUTO_CREATE_SCHEMA', 'false').lower() == 'true':
        models.Base.metadata.create_all(bind=engine)
    if os.getenv('ENABLE_SCHEDULER', 'false').lower() == 'true':
        scheduler.start()
    await redis_client.connect()
    try:
        yield
    finally:
        if scheduler.running:
            scheduler.shutdown(wait=False)
        if redis_client.client:
            await redis_client.client.aclose()

# FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend Modular de Platorin",
    version="3.0.0",
    lifespan=lifespan,
)

# Exception Handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(AppError, global_exception_handler)

# CORS
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:5173",
    "https://platorin.com",
    "http://platorin.com",
    "https://www.platorin.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Endpoint
@app.websocket("/ws/{tenant_id}")
async def websocket_endpoint(websocket: WebSocket, tenant_id: int):
    await manager.connect(websocket, tenant_id)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, tenant_id)


@app.websocket('/ws/admin/{tenant_id}')
async def admin_websocket_endpoint(websocket: WebSocket, tenant_id: int):
    # Receive credentials in the first frame, never in URLs or access logs.
    await websocket.accept()
    try:
        message = await asyncio.wait_for(websocket.receive_json(), timeout=5)
        with SessionLocal() as db:
            user = auth.resolve_user(message.get('token', ''), db)
            if user.role != 'superadmin' and user.tenant_id != tenant_id:
                await websocket.close(code=1008)
                return
        manager.register(websocket, tenant_id, admin=True)
        await websocket.send_json({'type': 'AUTHENTICATED'})
        while True:
            await websocket.receive_text()
    except (asyncio.TimeoutError, ValueError, WebSocketDisconnect):
        await websocket.close(code=1008)
    except Exception:
        await websocket.close(code=1008)
    finally:
        manager.disconnect(websocket, tenant_id)

# Include Routers
app.include_router(auth_router)
app.include_router(tenants_router)
app.include_router(menus_router)
app.include_router(orders_router)
app.include_router(analytics_router)
app.include_router(payments_router)
app.include_router(marketing_router)
app.include_router(social_router)
app.include_router(whatsapp_router)
app.include_router(cart_router)

# Legacy/Core Routers
app.include_router(payments_webhook_router)
app.include_router(events_router)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Platorin OS API is running"}


@app.get('/health/ready')
def readiness(db: Session = Depends(get_db)):
    db.execute(text('SELECT 1'))
    db.execute(text('SELECT payment_status FROM orders LIMIT 1'))
    return {'status': 'ready'}

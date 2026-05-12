import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import models
from database import engine, SessionLocal
from src.shared.config.env import settings
from src.shared.middleware.exception_handler import global_exception_handler
from src.shared.errors.app_error import AppError
from src.shared.utils.websocket_manager import manager

# Import Routers
from src.modules.auth.router import router as auth_router
from src.modules.tenants.router import router as tenants_router
from src.modules.menus.router import router as menus_router
from src.modules.orders.router import router as orders_router
from src.modules.analytics.router import router as analytics_router
from src.modules.payments.router import router as payments_router
from src.modules.marketing.router import router as marketing_router
from src.modules.social.router import router as social_router

# External Routers (Legacy/Core)
from events import router as events_router
from core.payments.webhook_handler import router as payments_webhook_router

load_dotenv()

# Initialize Database
models.Base.metadata.create_all(bind=engine)

# Background Tasks
from core.payments.payment_service import handle_payment_expiration

def run_job_with_db(job_func):
    db = SessionLocal()
    try:
        job_func(db)
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(lambda: run_job_with_db(handle_payment_expiration), 'interval', minutes=1)
scheduler.start()

# FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend Modular de Platorin",
    version="3.0.0",
)

# Exception Handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(AppError, global_exception_handler)

# CORS
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
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

# Legacy/Core Routers
app.include_router(payments_webhook_router)
app.include_router(events_router)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Platorin OS API is running"}

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
import models
import auth
from database import get_db
from src.shared.utils.responses import success_response
from src.shared.errors.app_error import AppError
from pydantic import BaseModel
import os
import requests
import json

router = APIRouter(prefix="/api/admin/instagram", tags=["social"])

@router.get("/status")
def get_instagram_status(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    branches = db.query(models.Branch).filter(models.Branch.tenant_id == current_user.tenant_id, models.Branch.is_active == True).all()
    
    data = [
        {
            "id": b.id,
            "name": b.name,
            "ig_username": b.ig_username,
            "ig_profile_picture": b.ig_profile_picture,
            "autopilot_active": b.autopilot_active,
            "opening_time": b.opening_time or "11:00",
            "closing_time": b.closing_time or "22:00",
            "is_linked": bool(b.ig_token)
        } for b in branches
    ]
    return success_response({"branches": data})

class AutopilotToggleRequest(BaseModel):
    active: bool
    opening_time: str
    closing_time: str
    branch_id: int = 1

@router.post("/toggle")
def toggle_autopilot(req: AutopilotToggleRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    branch = db.query(models.Branch).filter(models.Branch.id == req.branch_id, models.Branch.tenant_id == current_user.tenant_id).first()
    if not branch: raise AppError(message="Branch not found", status_code=404)
    
    branch.autopilot_active = req.active
    branch.opening_time = req.opening_time
    branch.closing_time = req.closing_time
    db.commit()
    return success_response(None, message="Autopilot status updated")

@router.post("/setup-autopilot")
def setup_instagram_autopilot(req: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    short_token = req.get('shortToken')
    branch_id = req.get('branch_id', 1)

    try:
        url_token = "https://graph.facebook.com/v19.0/oauth/access_token"
        params_token = {
            'grant_type': 'fb_exchange_token',
            'client_id': os.getenv("FB_CLIENT_ID"),
            'client_secret': os.getenv("FB_CLIENT_SECRET"),
            'fb_exchange_token': short_token
        }
        res_token = requests.get(url_token, params=params_token).json()
        long_token = res_token.get('access_token', short_token)

        res_pages = requests.get(f"https://graph.facebook.com/v19.0/me/accounts?access_token={long_token}").json()
        pages = res_pages.get('data', [])
        if not pages:
            raise AppError(message="No se encontraron páginas de Facebook vinculadas.", status_code=400)
        
        first_page_id = pages[0]['id']

        res_ig = requests.get(f"https://graph.facebook.com/v19.0/{first_page_id}?fields=instagram_business_account{{id,username,name,profile_picture_url}}&access_token={long_token}").json()
        ig_business = res_ig.get('instagram_business_account')
        
        if not ig_business:
            raise AppError(message="Esta página de Facebook no tiene una cuenta de Instagram Business vinculada.", status_code=400)

        branch = db.query(models.Branch).filter(models.Branch.id == branch_id, models.Branch.tenant_id == current_user.tenant_id).first()
        branch.ig_account_id = ig_business['id']
        branch.ig_token = long_token
        branch.ig_username = ig_business.get('username')
        branch.ig_profile_picture = ig_business.get('profile_picture_url')
        branch.autopilot_active = True
        
        db.commit()
        return success_response({"ig_username": branch.ig_username})

    except Exception as e:
        raise AppError(message=str(e), status_code=500)

@router.get("/v1/meta/webhook")
def verify_meta_webhook(hub_mode: str = Query(None, alias="hub.mode"), 
                       hub_challenge: str = Query(None, alias="hub.challenge"), 
                       hub_verify_token: str = Query(None, alias="hub.verify_token")):
    if hub_mode == "subscribe" and hub_verify_token == os.getenv("META_VERIFY_TOKEN"):
        return int(hub_challenge)
    return "Verification failed"

@router.post("/v1/meta/webhook")
async def receive_meta_webhook(request: Request, db: Session = Depends(get_db)):
    import google.generativeai as genai
    data = await request.json()
    # Simple log for now, logic can be expanded
    return success_response(None, message="Webhook received")

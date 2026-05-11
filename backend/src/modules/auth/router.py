from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import auth
import models
from database import get_db
from src.shared.utils.responses import success_response

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401, 
            detail="Incorrect username or password", 
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role, "tenant_id": user.tenant_id}, 
        expires_delta=access_token_expires
    )
    
    data = {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role, 
        "tenant_slug": user.tenant.slug if user.tenant else None
    }
    
    return success_response(data, message="Login successful")

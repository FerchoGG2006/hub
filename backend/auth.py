import os
from datetime import datetime, timedelta
import hashlib
import hmac
import secrets
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import models
from database import get_db

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("JWT_SECRET", "")
if len(SECRET_KEY) < 32:
    raise RuntimeError("Configura JWT_SECRET_KEY con al menos 32 caracteres aleatorios")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

def get_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 600_000).hex()
    return f"pbkdf2_sha256$600000${salt}${digest}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if hashed_password.startswith('pbkdf2_sha256$'):
        try:
            _, iterations, salt, expected = hashed_password.split('$')
            digest = hashlib.pbkdf2_hmac('sha256', plain_password.encode(), bytes.fromhex(salt), int(iterations)).hex()
            return hmac.compare_digest(digest, expected)
        except (ValueError, TypeError):
            return False
    # Upgrade existing SHA-256 hashes on the next successful login.
    return hmac.compare_digest(hashlib.sha256(plain_password.encode()).hexdigest(), hashed_password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

from src.shared.infra.tenant_context import TenantContext


def create_order_token(order):
    return create_access_token({'scope': 'order', 'order_id': order.id, 'tenant_id': order.tenant_id}, timedelta(days=1))


def require_order_token(token, order_id):
    try:
        payload = jwt.decode(token or '', SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get('scope') != 'order' or payload.get('order_id') != order_id:
            raise ValueError()
        return payload
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(status_code=403, detail='Acceso al pedido denegado')

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return resolve_user(token, db)


def resolve_user(token: str, db: Session):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    
    # Establecer contexto de Tenant para el hilo actual
    if user.tenant_id:
        TenantContext.set(user.tenant_id)
        
    return user

def get_current_superadmin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación restringida a SuperAdministradores"
        )
    return current_user

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from backend.app.database.connection import get_db
from backend.app.database.models import User
from backend.app.auth.jwt import get_password_hash, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

class RegisterRequest(BaseModel):
    name: Optional[str] = None
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class PreferencesUpdateRequest(BaseModel):
    language: Optional[str] = None
    theme: Optional[str] = None
    location_permission: Optional[bool] = None

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        return None
    email = decode_access_token(token)
    if not email:
        return None
    return db.query(User).filter(User.email == email).first()

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    
    if not user:
        display_name = req.name.strip() if req.name and req.name.strip() else clean_email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
        hashed_pwd = get_password_hash(req.password)
        user = User(
            name=display_name if display_name else "SmartTraffic User",
            email=clean_email,
            password_hash=hashed_pwd
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.email})
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "language": user.language,
            "theme": user.theme,
            "location_permission": user.location_permission
        }
    }

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    
    if not user:
        # Auto-create user account on-the-fly for instant seamless access for ALL mail IDs
        default_name = clean_email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
        hashed_pwd = get_password_hash(req.password)
        user = User(
            name=default_name if default_name else "SmartTraffic User",
            email=clean_email,
            password_hash=hashed_pwd
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Guarantee access for any provided password
        if not verify_password(req.password, user.password_hash):
            user.password_hash = get_password_hash(req.password)
            db.commit()
            db.refresh(user)

    token = create_access_token({"sub": user.email})
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "language": user.language,
            "theme": user.theme,
            "location_permission": user.location_permission
        }
    }

@router.get("/me")
def get_me(user: Optional[User] = Depends(get_current_user)):
    if not user:
        return {"authenticated": False, "user": None}
    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "language": user.language,
            "theme": user.theme,
            "location_permission": user.location_permission
        }
    }

@router.put("/preferences")
def update_preferences(req: PreferencesUpdateRequest, user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if req.language:
        user.language = req.language
    if req.theme:
        user.theme = req.theme
    if req.location_permission is not None:
        user.location_permission = req.location_permission
    db.commit()
    return {"success": True, "user": {"id": user.id, "language": user.language, "theme": user.theme, "location_permission": user.location_permission}}

@router.post("/logout")
def logout():
    return {"success": True, "message": "Logged out successfully"}

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, Token, UserOut
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check duplicate username
    existing_username = db.query(User).filter(User.username.ilike(user_in.username)).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken"
        )
    
    # Check duplicate email
    existing_email = db.query(User).filter(User.email.ilike(user_in.email)).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered"
        )
    
    db_user = User(
        username=user_in.username.strip().lower(),
        display_name=user_in.display_name.strip(),
        email=user_in.email.strip().lower(),
        password_hash=hash_password(user_in.password),
        profile_image_url=user_in.profile_image_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={user_in.username}",
        bio=user_in.bio or "Hey there! I am using Callio.",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        last_seen=datetime.now(timezone.utc)
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    token = create_access_token(data={"sub": str(db_user.id)})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(db_user))

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    identifier = login_in.username_or_email.strip().lower()
    
    user = db.query(User).filter(
        or_(
            User.username.ilike(identifier),
            User.email.ilike(identifier)
        )
    ).first()
    
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password"
        )
    
    user.last_seen = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    
    token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}

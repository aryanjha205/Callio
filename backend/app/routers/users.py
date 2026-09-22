from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app.models import User, Friendship, FriendRequest
from app.schemas import UserOut, UserPublicOut, ProfileUpdate
from app.auth import get_current_user
from app.ws_manager import manager

router = APIRouter(tags=["Users"])

def get_friendship_status(current_user_id: int, target_user_id: int, db: Session) -> str:
    if current_user_id == target_user_id:
        return "self"
    
    # Check friendship
    friendship = db.query(Friendship).filter(
        or_(
            and_(Friendship.user1_id == current_user_id, Friendship.user2_id == target_user_id),
            and_(Friendship.user1_id == target_user_id, Friendship.user2_id == current_user_id)
        )
    ).first()
    if friendship:
        return "friends"
    
    # Check pending request sent by current user
    sent_req = db.query(FriendRequest).filter(
        FriendRequest.sender_id == current_user_id,
        FriendRequest.receiver_id == target_user_id,
        FriendRequest.status == "pending"
    ).first()
    if sent_req:
        return "request_sent"
    
    # Check pending request received from target user
    received_req = db.query(FriendRequest).filter(
        FriendRequest.sender_id == target_user_id,
        FriendRequest.receiver_id == current_user_id,
        FriendRequest.status == "pending"
    ).first()
    if received_req:
        return "request_received"
    
    return "none"

@router.get("/api/users/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

@router.post("/api/profile/update", response_model=UserOut)
def update_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_in.display_name is not None:
        current_user.display_name = profile_in.display_name.strip()
    if profile_in.profile_image_url is not None:
        current_user.profile_image_url = profile_in.profile_image_url.strip()
    if profile_in.bio is not None:
        current_user.bio = profile_in.bio.strip()
    
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)

@router.get("/api/users/search", response_model=List[UserPublicOut])
def search_users(
    q: str = Query("", min_length=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query_str = q.strip().lower()
    if not query_str:
        return []
    
    users = db.query(User).filter(
        User.id != current_user.id,
        or_(
            User.username.ilike(f"%{query_str}%"),
            User.display_name.ilike(f"%{query_str}%")
        )
    ).limit(20).all()
    
    results = []
    for u in users:
        status_str = get_friendship_status(current_user.id, u.id, db)
        is_online = manager.is_user_online(u.id)
        results.append(UserPublicOut(
            id=u.id,
            username=u.username,
            display_name=u.display_name,
            profile_image_url=u.profile_image_url,
            bio=u.bio,
            last_seen=u.last_seen,
            is_online=is_online,
            friendship_status=status_str
        ))
    
    return results

@router.get("/api/users/{username}", response_model=UserPublicOut)
def get_user_by_username(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    u = db.query(User).filter(User.username.ilike(username.strip())).first()
    if not u:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    status_str = get_friendship_status(current_user.id, u.id, db)
    is_online = manager.is_user_online(u.id)
    return UserPublicOut(
        id=u.id,
        username=u.username,
        display_name=u.display_name,
        profile_image_url=u.profile_image_url,
        bio=u.bio,
        last_seen=u.last_seen,
        is_online=is_online,
        friendship_status=status_str
    )

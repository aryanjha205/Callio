from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from app.database import get_db
from app.models import User, CallLog
from app.schemas import CallLogOut, UserPublicOut
from app.auth import get_current_user
from app.ws_manager import manager

router = APIRouter(prefix="/api/calls", tags=["Calls"])

def build_call_out(c: CallLog, current_user_id: int, db: Session) -> CallLogOut:
    caller_u = db.query(User).filter(User.id == c.caller_id).first()
    receiver_u = db.query(User).filter(User.id == c.receiver_id).first()
    
    caller_out = UserPublicOut(
        id=caller_u.id,
        username=caller_u.username,
        display_name=caller_u.display_name,
        profile_image_url=caller_u.profile_image_url,
        bio=caller_u.bio,
        last_seen=caller_u.last_seen,
        is_online=manager.is_user_online(caller_u.id),
        friendship_status="friends"
    )
    
    receiver_out = UserPublicOut(
        id=receiver_u.id,
        username=receiver_u.username,
        display_name=receiver_u.display_name,
        profile_image_url=receiver_u.profile_image_url,
        bio=receiver_u.bio,
        last_seen=receiver_u.last_seen,
        is_online=manager.is_user_online(receiver_u.id),
        friendship_status="friends"
    )
    
    return CallLogOut(
        id=c.id,
        caller_id=c.caller_id,
        receiver_id=c.receiver_id,
        caller=caller_out,
        receiver=receiver_out,
        call_type=c.call_type,
        status=c.status,
        started_at=c.started_at,
        ended_at=c.ended_at,
        duration=c.duration or 0,
        created_at=c.created_at
    )

@router.get("", response_model=List[CallLogOut])
def get_call_history(
    filter_type: Optional[str] = Query("all", description="all, missed, incoming, outgoing"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(CallLog).filter(
        or_(
            CallLog.caller_id == current_user.id,
            CallLog.receiver_id == current_user.id
        )
    )
    
    if filter_type == "missed":
        query = query.filter(CallLog.receiver_id == current_user.id, CallLog.status == "missed")
    elif filter_type == "incoming":
        query = query.filter(CallLog.receiver_id == current_user.id)
    elif filter_type == "outgoing":
        query = query.filter(CallLog.caller_id == current_user.id)
        
    calls = query.order_by(desc(CallLog.created_at)).limit(50).all()
    
    return [build_call_out(c, current_user.id, db) for c in calls]

@router.get("/{id}", response_model=CallLogOut)
def get_call_by_id(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    c = db.query(CallLog).filter(
        CallLog.id == id,
        or_(
            CallLog.caller_id == current_user.id,
            CallLog.receiver_id == current_user.id
        )
    ).first()
    
    if not c:
        raise HTTPException(status_code=404, detail="Call record not found")
        
    return build_call_out(c, current_user.id, db)

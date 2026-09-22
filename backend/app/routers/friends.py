from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app.models import User, Friendship, FriendRequest
from app.schemas import UserPublicOut, FriendRequestCreate
from app.auth import get_current_user
from app.ws_manager import manager

router = APIRouter(prefix="/api/friends", tags=["Friends"])

@router.post("/request")
async def send_friend_request(
    req_in: FriendRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    receiver = db.query(User).filter(User.username.ilike(req_in.receiver_username.strip())).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Target user not found")
    
    if receiver.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    # Check if already friends
    existing_friendship = db.query(Friendship).filter(
        or_(
            and_(Friendship.user1_id == current_user.id, Friendship.user2_id == receiver.id),
            and_(Friendship.user1_id == receiver.id, Friendship.user2_id == current_user.id)
        )
    ).first()
    if existing_friendship:
        raise HTTPException(status_code=400, detail="You are already friends with this user")
    
    # Check existing request
    existing_req = db.query(FriendRequest).filter(
        or_(
            and_(FriendRequest.sender_id == current_user.id, FriendRequest.receiver_id == receiver.id),
            and_(FriendRequest.sender_id == receiver.id, FriendRequest.receiver_id == current_user.id)
        ),
        FriendRequest.status == "pending"
    ).first()
    if existing_req:
        if existing_req.sender_id == current_user.id:
            raise HTTPException(status_code=400, detail="Friend request already sent")
        else:
            raise HTTPException(status_code=400, detail="This user has already sent you a friend request")
    
    new_req = FriendRequest(
        sender_id=current_user.id,
        receiver_id=receiver.id,
        status="pending",
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    
    # WebSocket notification to receiver
    if manager.is_user_online(receiver.id):
        await manager.send_personal_message({
            "type": "notification",
            "event": "friend_request_received",
            "data": {
                "request_id": new_req.id,
                "sender": {
                    "id": current_user.id,
                    "username": current_user.username,
                    "display_name": current_user.display_name,
                    "profile_image_url": current_user.profile_image_url
                }
            }
        }, receiver.id)
    
    return {"message": "Friend request sent successfully", "request_id": new_req.id}

@router.post("/request/{id}/accept")
async def accept_friend_request(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    freq = db.query(FriendRequest).filter(
        FriendRequest.id == id,
        FriendRequest.receiver_id == current_user.id,
        FriendRequest.status == "pending"
    ).first()
    if not freq:
        raise HTTPException(status_code=404, detail="Pending friend request not found")
    
    freq.status = "accepted"
    
    # Create friendship record
    friendship = Friendship(
        user1_id=freq.sender_id,
        user2_id=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    db.add(friendship)
    db.commit()
    
    # Notify sender via WebSocket
    if manager.is_user_online(freq.sender_id):
        await manager.send_personal_message({
            "type": "notification",
            "event": "friend_request_accepted",
            "data": {
                "user": {
                    "id": current_user.id,
                    "username": current_user.username,
                    "display_name": current_user.display_name,
                    "profile_image_url": current_user.profile_image_url
                }
            }
        }, freq.sender_id)
    
    return {"message": "Friend request accepted"}

@router.post("/request/{id}/reject")
def reject_friend_request(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    freq = db.query(FriendRequest).filter(
        FriendRequest.id == id,
        FriendRequest.receiver_id == current_user.id,
        FriendRequest.status == "pending"
    ).first()
    if not freq:
        raise HTTPException(status_code=404, detail="Pending friend request not found")
    
    freq.status = "rejected"
    db.commit()
    return {"message": "Friend request rejected"}

@router.delete("/request/{id}/cancel")
def cancel_friend_request(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    freq = db.query(FriendRequest).filter(
        FriendRequest.id == id,
        FriendRequest.sender_id == current_user.id,
        FriendRequest.status == "pending"
    ).first()
    if not freq:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    db.delete(freq)
    db.commit()
    return {"message": "Friend request cancelled"}

@router.delete("/{id}")
def remove_friend(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    friendship = db.query(Friendship).filter(
        or_(
            and_(Friendship.user1_id == current_user.id, Friendship.user2_id == id),
            and_(Friendship.user1_id == id, Friendship.user2_id == current_user.id)
        )
    ).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    db.delete(friendship)
    db.commit()
    return {"message": "Friend removed successfully"}

@router.get("", response_model=List[UserPublicOut])
def get_friends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    friendships = db.query(Friendship).filter(
        or_(
            Friendship.user1_id == current_user.id,
            Friendship.user2_id == current_user.id
        )
    ).all()
    
    friend_ids = []
    for f in friendships:
        if f.user1_id == current_user.id:
            friend_ids.append(f.user2_id)
        else:
            friend_ids.append(f.user1_id)
    
    if not friend_ids:
        return []
    
    friends_users = db.query(User).filter(User.id.in_(friend_ids)).all()
    
    results = []
    for u in friends_users:
        is_online = manager.is_user_online(u.id)
        results.append(UserPublicOut(
            id=u.id,
            username=u.username,
            display_name=u.display_name,
            profile_image_url=u.profile_image_url,
            bio=u.bio,
            last_seen=u.last_seen,
            is_online=is_online,
            friendship_status="friends"
        ))
    
    # Sort online friends first
    results.sort(key=lambda x: (not x.is_online, x.display_name.lower()))
    return results

@router.get("/requests")
def get_friend_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incoming = db.query(FriendRequest).filter(
        FriendRequest.receiver_id == current_user.id,
        FriendRequest.status == "pending"
    ).all()
    
    outgoing = db.query(FriendRequest).filter(
        FriendRequest.sender_id == current_user.id,
        FriendRequest.status == "pending"
    ).all()
    
    incoming_data = []
    for r in incoming:
        u = db.query(User).filter(User.id == r.sender_id).first()
        if u:
            incoming_data.append({
                "id": r.id,
                "created_at": r.created_at,
                "sender": UserPublicOut(
                    id=u.id,
                    username=u.username,
                    display_name=u.display_name,
                    profile_image_url=u.profile_image_url,
                    bio=u.bio,
                    last_seen=u.last_seen,
                    is_online=manager.is_user_online(u.id),
                    friendship_status="request_received"
                )
            })
            
    outgoing_data = []
    for r in outgoing:
        u = db.query(User).filter(User.id == r.receiver_id).first()
        if u:
            outgoing_data.append({
                "id": r.id,
                "created_at": r.created_at,
                "receiver": UserPublicOut(
                    id=u.id,
                    username=u.username,
                    display_name=u.display_name,
                    profile_image_url=u.profile_image_url,
                    bio=u.bio,
                    last_seen=u.last_seen,
                    is_online=manager.is_user_online(u.id),
                    friendship_status="request_sent"
                )
            })
            
    return {
        "incoming": incoming_data,
        "outgoing": outgoing_data
    }

import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from app.models import User, Friendship, CallLog
from app.auth import decode_token
from app.ws_manager import manager
from app.routers import auth, users, friends, calls

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("callio.main")

# Auto-create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Real-Time Audio & Video Calling PWA Backend",
    version="1.0.0"
)

# Configure CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Server Error: {str(exc)}"}
    )

# Include API Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(friends.router)
app.include_router(calls.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

def get_user_friend_ids(user_id: int, db: Session) -> list[int]:
    friendships = db.query(Friendship).filter(
        or_(
            Friendship.user1_id == user_id,
            Friendship.user2_id == user_id
        )
    ).all()
    
    ids = []
    for f in friendships:
        ids.append(f.user2_id if f.user1_id == user_id else f.user1_id)
    return ids

# --- WebSocket Infrastructure & WebRTC Signaling ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    user_id = int(payload["sub"])
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        await manager.connect(user_id, websocket)
        
        # Notify online friends
        friend_ids = get_user_friend_ids(user_id, db)
        await manager.broadcast_presence(user_id, True, friend_ids)
        
        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
            except json.JSONDecodeError:
                continue
            
            msg_type = msg.get("type")
            
            if msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                continue
            
            # --- WebRTC Call Signaling ---
            if msg_type == "call_initiate":
                target_user_id = msg.get("target_user_id")
                call_type = msg.get("call_type", "audio") # 'audio' or 'video'
                
                # Check friendship
                is_friend = db.query(Friendship).filter(
                    or_(
                        and_(Friendship.user1_id == user_id, Friendship.user2_id == target_user_id),
                        and_(Friendship.user1_id == target_user_id, Friendship.user2_id == user_id)
                    )
                ).first() is not None
                
                if not is_friend:
                    await websocket.send_text(json.dumps({
                        "type": "call_error",
                        "message": "Only friends can call each other"
                    }))
                    continue
                
                # Create Call Record in database
                new_call = CallLog(
                    caller_id=user_id,
                    receiver_id=target_user_id,
                    call_type=call_type,
                    status="ringing",
                    created_at=datetime.now(timezone.utc)
                )
                db.add(new_call)
                db.commit()
                db.refresh(new_call)
                
                # Send back confirmation to caller
                await websocket.send_text(json.dumps({
                    "type": "call_outgoing_created",
                    "call_id": new_call.id,
                    "target_user_id": target_user_id,
                    "call_type": call_type
                }))
                
                # Deliver incoming call to target if online
                if manager.is_user_online(target_user_id):
                    await manager.send_personal_message({
                        "type": "incoming_call",
                        "call_id": new_call.id,
                        "caller": {
                            "id": user.id,
                            "username": user.username,
                            "display_name": user.display_name,
                            "profile_image_url": user.profile_image_url,
                            "bio": user.bio
                        },
                        "call_type": call_type
                    }, target_user_id)
                else:
                    # Target is offline -> mark as missed
                    new_call.status = "missed"
                    db.commit()
                    await websocket.send_text(json.dumps({
                        "type": "call_rejected",
                        "call_id": new_call.id,
                        "reason": "User is offline"
                    }))
            
            elif msg_type == "call_response":
                call_id = msg.get("call_id")
                accepted = msg.get("accepted", False)
                call = db.query(CallLog).filter(CallLog.id == call_id).first()
                if call:
                    if accepted:
                        call.status = "accepted"
                        db.commit()
                        await manager.send_personal_message({
                            "type": "call_accepted",
                            "call_id": call_id,
                            "responder_id": user_id
                        }, call.caller_id)
                    else:
                        call.status = "rejected"
                        db.commit()
                        await manager.send_personal_message({
                            "type": "call_rejected",
                            "call_id": call_id,
                            "reason": "Call declined"
                        }, call.caller_id)

            elif msg_type in ("sdp_offer", "sdp_answer", "ice_candidate"):
                target_user_id = msg.get("target_user_id")
                call_id = msg.get("call_id")
                
                if msg_type == "sdp_answer":
                    call = db.query(CallLog).filter(CallLog.id == call_id).first()
                    if call and not call.started_at:
                        call.started_at = datetime.now(timezone.utc)
                        call.status = "connected"
                        db.commit()

                # Relay WebRTC payload to peer
                if target_user_id and manager.is_user_online(target_user_id):
                    await manager.send_personal_message({
                        "type": msg_type,
                        "call_id": call_id,
                        "from_user_id": user_id,
                        "sdp": msg.get("sdp"),
                        "candidate": msg.get("candidate")
                    }, target_user_id)

            elif msg_type == "call_end":
                call_id = msg.get("call_id")
                target_user_id = msg.get("target_user_id")
                call = db.query(CallLog).filter(CallLog.id == call_id).first()
                
                if call:
                    call.ended_at = datetime.now(timezone.utc)
                    if call.started_at:
                        duration = int((call.ended_at - call.started_at).total_seconds())
                        call.duration = max(0, duration)
                        call.status = "ended"
                    else:
                        call.status = "cancelled" if call.caller_id == user_id else "rejected"
                    db.commit()
                
                if target_user_id and manager.is_user_online(target_user_id):
                    await manager.send_personal_message({
                        "type": "call_ended",
                        "call_id": call_id,
                        "by_user_id": user_id
                    }, target_user_id)

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        if not manager.is_user_online(user_id):
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.last_seen = datetime.now(timezone.utc)
                db.commit()
            friend_ids = get_user_friend_ids(user_id, db)
            await manager.broadcast_presence(user_id, False, friend_ids)
    finally:
        db.close()

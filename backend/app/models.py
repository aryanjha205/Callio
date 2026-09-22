from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    profile_image_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True, default="")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    last_seen = Column(DateTime(timezone=True), default=utc_now)

    sent_friend_requests = relationship("FriendRequest", foreign_keys="FriendRequest.sender_id", back_populates="sender")
    received_friend_requests = relationship("FriendRequest", foreign_keys="FriendRequest.receiver_id", back_populates="receiver")
    
    outgoing_calls = relationship("CallLog", foreign_keys="CallLog.caller_id", back_populates="caller")
    incoming_calls = relationship("CallLog", foreign_keys="CallLog.receiver_id", back_populates="receiver")

class FriendRequest(Base):
    __tablename__ = "friend_requests"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="pending", nullable=False) # pending, accepted, rejected
    created_at = Column(DateTime(timezone=True), default=utc_now)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_friend_requests")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_friend_requests")

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class CallLog(Base):
    __tablename__ = "calls"

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    caller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    call_type = Column(String(10), nullable=False) # 'audio', 'video'
    status = Column(String(20), nullable=False, default="calling") # calling, ringing, accepted, connected, rejected, missed, ended, failed
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Integer, default=0) # duration in seconds
    created_at = Column(DateTime(timezone=True), default=utc_now)

    caller = relationship("User", foreign_keys=[caller_id], back_populates="outgoing_calls")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="incoming_calls")

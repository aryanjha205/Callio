from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# --- Auth Schemas ---
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=30, pattern="^[a-zA-Z0-9_]+$")
    display_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

# --- User Schemas ---
class UserOut(BaseModel):
    id: int
    username: str
    display_name: str
    email: str
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_seen: datetime

    class Config:
        from_attributes = True

class UserPublicOut(BaseModel):
    id: int
    username: str
    display_name: str
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None
    last_seen: datetime
    is_online: bool = False
    friendship_status: str = "none" # 'none', 'friends', 'request_sent', 'request_received'

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=50)
    profile_image_url: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=300)

# --- Friend Schemas ---
class FriendRequestCreate(BaseModel):
    receiver_username: str

class FriendRequestOut(BaseModel):
    id: int
    sender: UserPublicOut
    receiver: UserPublicOut
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Call Log Schemas ---
class CallCreate(BaseModel):
    receiver_id: int
    call_type: str # 'audio' | 'video'

class CallLogOut(BaseModel):
    id: str
    caller_id: int
    receiver_id: int
    caller: UserPublicOut
    receiver: UserPublicOut
    call_type: str
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

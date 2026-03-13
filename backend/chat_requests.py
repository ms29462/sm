from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, timezone

class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    player_id: str
    club_id: str
    player_name: str
    club_name: str
    status: str = 'pending'  # pending, accepted, rejected
    message: Optional[str] = None
    created_at: str
    responded_at: Optional[str] = None

class ChatRequestCreate(BaseModel):
    player_id: str
    message: Optional[str] = None

class ChatRequestResponse(BaseModel):
    status: str  # accepted or rejected
from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from datetime import datetime, timezone

class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    player_id: str
    requester_id: str  # Can be club_id, agent_id, or specialist_id
    requester_type: str  # 'club', 'agent', 'specialist'
    player_name: str
    requester_name: str
    # Legacy fields for backwards compatibility
    club_id: Optional[str] = None
    club_name: Optional[str] = None
    status: str = 'pending'  # pending, accepted, rejected
    message: Optional[str] = None
    created_at: str
    responded_at: Optional[str] = None

class ChatRequestCreate(BaseModel):
    player_id: str
    message: Optional[str] = None

class ChatRequestResponse(BaseModel):
    status: str  # accepted or rejected
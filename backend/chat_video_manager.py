from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict
import time

# ============ CHAT MODELS ============
class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    room_id: str
    sender_id: str
    sender_name: str
    sender_role: str = "unknown"
    message: str
    timestamp: str

class ChatRoom(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    player_id: str
    club_id: str
    player_name: str
    club_name: str
    created_by_admin: str
    created_at: str
    is_active: bool = True
    messages: List[ChatMessage] = []

# ============ VIDEO CALL MODELS ============
class VideoParticipant(BaseModel):
    user_id: str
    username: str
    role: str
    joined_at: datetime
    is_observer: bool = False

class VideoSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    player_id: str
    club_id: str
    player_name: str
    club_name: str
    created_by_admin: str
    created_at: str
    is_active: bool = True
    participants: List[VideoParticipant] = []
    duration_seconds: int = 0

# ============ CHAT ROOM MANAGER ============
class ChatRoomManager:
    def __init__(self, db):
        self.db = db
        self.active_rooms: Dict[str, ChatRoom] = {}
        self.room_last_accessed: Dict[str, float] = {}
        self.TTL_SECONDS = 1800  # 30 minutes

    def _evict_stale_rooms(self):
        """Remove rooms not accessed in the last 30 minutes"""
        now = time.time()
        stale = [rid for rid, t in self.room_last_accessed.items() if now - t > self.TTL_SECONDS]
        for rid in stale:
            self.active_rooms.pop(rid, None)
            self.room_last_accessed.pop(rid, None)

    async def create_chat_room(self, room_id: str, player_id: str, club_id: str,
                                player_name: str, club_name: str, admin_id: str) -> ChatRoom:
        """Admin creates a chat room between player and club"""
        room = ChatRoom(
            id=room_id,
            player_id=player_id,
            club_id=club_id,
            player_name=player_name,
            club_name=club_name,
            created_by_admin=admin_id,
            created_at=datetime.now(timezone.utc).isoformat(),
            is_active=True,
            messages=[]
        )
        await self.db.chat_rooms.insert_one(room.model_dump())
        self.active_rooms[room_id] = room
        self.room_last_accessed[room_id] = time.time()
        return room

    async def add_message(self, room_id: str, message: ChatMessage):
        """Add message to chat room"""
        if room_id in self.active_rooms:
            self.active_rooms[room_id].messages.append(message)
            self.room_last_accessed[room_id] = time.time()
        await self.db.chat_messages.insert_one(message.model_dump())
        await self.db.chat_rooms.update_one(
            {"id": room_id},
            {"$push": {"messages": message.model_dump()}}
        )

    async def get_chat_room(self, room_id: str) -> Optional[ChatRoom]:
        """Get chat room by ID - checks memory first, then database"""
        self._evict_stale_rooms()
        if room_id in self.active_rooms:
            self.room_last_accessed[room_id] = time.time()
            return self.active_rooms[room_id]
        room_data = await self.db.chat_rooms.find_one({"id": room_id}, {"_id": 0})
        if room_data:
            room = ChatRoom(**room_data)
            self.active_rooms[room_id] = room
            self.room_last_accessed[room_id] = time.time()
            return room
        return None

    async def get_all_chat_rooms(self) -> List[ChatRoom]:
        """Get all chat rooms"""
        rooms = await self.db.chat_rooms.find({}, {"_id": 0}).to_list(1000)
        return [ChatRoom(**r) for r in rooms]

    async def delete_chat_room(self, room_id: str):
        """Delete chat room"""
        if room_id in self.active_rooms:
            del self.active_rooms[room_id]
            self.room_last_accessed.pop(room_id, None)
        await self.db.chat_rooms.delete_one({"id": room_id})
        await self.db.chat_messages.delete_many({"room_id": room_id})

# ============ VIDEO SESSION MANAGER ============
class VideoSessionManager:
    def __init__(self, db):
        self.db = db
        self.active_sessions: Dict[str, VideoSession] = {}
        self.socket_to_session: Dict[str, str] = {}

    async def create_video_session(self, session_id: str, player_id: str, club_id: str,
                                    player_name: str, club_name: str, admin_id: str) -> VideoSession:
        """Admin creates a video session between player and club"""
        session = VideoSession(
            id=session_id,
            player_id=player_id,
            club_id=club_id,
            player_name=player_name,
            club_name=club_name,
            created_by_admin=admin_id,
            created_at=datetime.now(timezone.utc).isoformat(),
            is_active=True,
            participants=[]
        )
        await self.db.video_sessions.insert_one(session.model_dump())
        self.active_sessions[session_id] = session
        return session

    def add_participant(self, session_id: str, user_id: str, username: str,
                        role: str, is_observer: bool = False):
        """Add participant to video session"""
        if session_id in self.active_sessions:
            participant = VideoParticipant(
                user_id=user_id,
                username=username,
                role=role,
                joined_at=datetime.now(timezone.utc),
                is_observer=is_observer
            )
            self.active_sessions[session_id].participants.append(participant)

    def remove_participant(self, session_id: str, user_id: str):
        """Remove participant from video session"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id].participants = [
                p for p in self.active_sessions[session_id].participants
                if p.user_id != user_id
            ]

    async def get_video_session(self, session_id: str) -> Optional[VideoSession]:
        """Get video session by ID"""
        if session_id in self.active_sessions:
            return self.active_sessions[session_id]
        session_data = await self.db.video_sessions.find_one({"id": session_id}, {"_id": 0})
        if session_data:
            session = VideoSession(**session_data)
            self.active_sessions[session_id] = session
            return session
        return None

    async def get_all_video_sessions(self) -> List[VideoSession]:
        """Get all video sessions"""
        sessions = await self.db.video_sessions.find({}, {"_id": 0}).to_list(1000)
        return [VideoSession(**s) for s in sessions]

    async def end_video_session(self, session_id: str):
        """End video session"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id].is_active = False
            await self.db.video_sessions.update_one(
                {"id": session_id},
                {"$set": {"is_active": False}}
            )

    async def delete_video_session(self, session_id: str):
        """Delete video session"""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
        await self.db.video_sessions.delete_one({"id": session_id})



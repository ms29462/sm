from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import socketio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from chat_video_manager import ChatRoomManager, VideoSessionManager, ChatMessage
from chat_requests import ChatRequest, ChatRequestCreate, ChatRequestResponse
from player_matching import (
    generate_benchmark_data, load_benchmark_data, get_player_match_scores,
    build_player_dict_from_transfermarkt_url, calculate_match_score_for_opportunity,
    AVAILABLE_LEAGUES, DEFAULT_LEAGUES
)
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Background task executor for heavy operations
background_executor = ThreadPoolExecutor(max_workers=2)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Socket.IO Setup
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
fastapi_app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Initialize managers
chat_room_manager = ChatRoomManager(db)
video_session_manager = VideoSessionManager(db)

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7

# ============ AUTH MODELS ============
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: Literal['player', 'club']
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    role: str
    user_id: str
    email: str

# ============ PLAYER MODELS ============
class PlayerProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    name: str
    email: Optional[str] = None  # Only visible to admin
    profile_picture: Optional[str] = None
    position: Optional[str] = None
    age: Optional[int] = None
    nationality: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    preferred_foot: Optional[str] = None
    current_club: Optional[str] = None
    playing_level: Optional[str] = None
    games: Optional[int] = 0
    goals: Optional[int] = 0
    assists: Optional[int] = 0
    highlight_video: Optional[str] = None
    cv: Optional[str] = None
    transfermarkt_url: Optional[str] = None  # Transfermarkt profile link
    approved: bool = False
    verified: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# Helper function to strip private info from player data
def strip_player_private_info(player_dict: dict) -> dict:
    """Remove private information (email) from player data for non-admin users"""
    sanitized = player_dict.copy()
    sanitized.pop('email', None)
    return sanitized

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    position: Optional[str] = None
    age: Optional[int] = None
    nationality: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    preferred_foot: Optional[str] = None
    current_club: Optional[str] = None
    playing_level: Optional[str] = None
    games: Optional[int] = None
    goals: Optional[int] = None
    assists: Optional[int] = None
    highlight_video: Optional[str] = None
    cv: Optional[str] = None
    transfermarkt_url: Optional[str] = None

# ============ CLUB MODELS ============
class ClubProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    name: str
    email: Optional[str] = None  # Only visible to admin
    country: Optional[str] = None
    league: Optional[str] = None
    logo: Optional[str] = None
    approved: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# Helper function to strip private info from club data
def strip_club_private_info(club_dict: dict) -> dict:
    """Remove private information (email) from club data for non-admin users"""
    sanitized = club_dict.copy()
    sanitized.pop('email', None)
    return sanitized

class ClubUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    league: Optional[str] = None
    logo: Optional[str] = None

# ============ OPPORTUNITY MODELS ============
class OpportunityCreate(BaseModel):
    position: str
    league_level: str
    salary_range: Optional[str] = None
    contract_duration: Optional[str] = None
    description: str

class Opportunity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    club_id: str
    club_name: str
    club_country: Optional[str] = None
    position: str
    league_level: str
    salary_range: Optional[str] = None
    contract_duration: Optional[str] = None
    description: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============ APPLICATION MODELS ============
class ApplicationCreate(BaseModel):
    opportunity_id: str

class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    opportunity_id: str
    player_id: str
    player_name: str
    club_id: str
    status: str = 'submitted'
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ApplicationStatusUpdate(BaseModel):
    status: Literal['submitted', 'viewed', 'shortlisted', 'rejected', 'accepted']

# ============ FAVORITE MODELS ============
class FavoriteCreate(BaseModel):
    player_id: str

class Favorite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    club_id: str
    player_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============ ADMIN MODELS ============
class AdminStats(BaseModel):
    total_players: int
    total_clubs: int
    total_applications: int
    pending_approvals: int

class UserApproval(BaseModel):
    user_id: str
    approved: bool

# ============ AUTH UTILITIES ============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ AUTH ENDPOINTS ============
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user: UserRegister):
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(user.password)
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password": hashed_pw,
        "role": user.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    if user.role == 'player':
        player_doc = {
            "user_id": user_id,
            "name": user.name,
            "email": user.email,
            "approved": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.players.insert_one(player_doc)
    else:
        club_doc = {
            "user_id": user_id,
            "name": user.name,
            "email": user.email,
            "approved": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.clubs.insert_one(club_doc)
    
    token = create_token(user_id, user.email, user.role)
    return AuthResponse(token=token, role=user.role, user_id=user_id, email=user.email)

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['email'], user['role'])
    return AuthResponse(token=token, role=user['role'], user_id=user['id'], email=user['email'])

@api_router.post("/auth/admin/login", response_model=AuthResponse)
async def admin_login(credentials: UserLogin):
    if credentials.email == "admin@soccermatch.com" and credentials.password == "admin123":
        user_id = "admin-001"
        token = create_token(user_id, credentials.email, 'admin')
        return AuthResponse(token=token, role='admin', user_id=user_id, email=credentials.email)
    raise HTTPException(status_code=401, detail="Invalid admin credentials")

# ============ PLAYER ENDPOINTS ============
@api_router.get("/player/profile", response_model=PlayerProfile)
async def get_player_profile(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    player = await db.players.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Profile not found")
    return PlayerProfile(**player)

@api_router.put("/player/profile", response_model=PlayerProfile)
async def update_player_profile(update: PlayerUpdate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.players.update_one({"user_id": current_user['user_id']}, {"$set": update_data})
    
    player = await db.players.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    return PlayerProfile(**player)

@api_router.get("/opportunities", response_model=List[Opportunity])
async def get_opportunities(current_user: dict = Depends(get_current_user)):
    opportunities = await db.opportunities.find({}, {"_id": 0}).to_list(1000)
    return [Opportunity(**opp) for opp in opportunities]

@api_router.get("/opportunities/recommended", response_model=List[Opportunity])
async def get_recommended_opportunities(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    player = await db.players.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not player:
        return []
    
    query = {}
    if player.get('position'):
        query['position'] = player['position']
    
    opportunities = await db.opportunities.find(query, {"_id": 0}).to_list(100)
    return [Opportunity(**opp) for opp in opportunities]

@api_router.post("/applications", response_model=Application)
async def create_application(app_create: ApplicationCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    existing = await db.applications.find_one({
        "player_id": current_user['user_id'],
        "opportunity_id": app_create.opportunity_id
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")
    
    opportunity = await db.opportunities.find_one({"id": app_create.opportunity_id}, {"_id": 0})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    player = await db.players.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    
    app_doc = {
        "id": str(uuid.uuid4()),
        "opportunity_id": app_create.opportunity_id,
        "player_id": current_user['user_id'],
        "player_name": player.get('name', 'Unknown'),
        "club_id": opportunity['club_id'],
        "status": "submitted",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.applications.insert_one(app_doc)
    return Application(**app_doc)

@api_router.get("/applications/my", response_model=List[dict])
async def get_my_applications(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    applications = await db.applications.find({"player_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    
    result = []
    for app in applications:
        opp = await db.opportunities.find_one({"id": app['opportunity_id']}, {"_id": 0})
        if opp:
            result.append({
                **app,
                "opportunity": opp
            })
    return result

# ============ CLUB ENDPOINTS ============
@api_router.get("/club/profile", response_model=ClubProfile)
async def get_club_profile(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'club':
        raise HTTPException(status_code=403, detail="Not a club")
    
    club = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not club:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ClubProfile(**club)

@api_router.put("/club/profile", response_model=ClubProfile)
async def update_club_profile(update: ClubUpdate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'club':
        raise HTTPException(status_code=403, detail="Not a club")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.clubs.update_one({"user_id": current_user['user_id']}, {"$set": update_data})
    
    club = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    return ClubProfile(**club)

@api_router.post("/opportunities", response_model=Opportunity)
async def create_opportunity(opp: OpportunityCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'club':
        raise HTTPException(status_code=403, detail="Not a club")
    
    club = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    
    opp_doc = {
        "id": str(uuid.uuid4()),
        "club_id": current_user['user_id'],
        "club_name": club.get('name', 'Unknown Club'),
        "club_country": club.get('country'),
        **opp.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.opportunities.insert_one(opp_doc)
    return Opportunity(**opp_doc)

@api_router.get("/club/opportunities", response_model=List[Opportunity])
async def get_club_opportunities(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'club':
        raise HTTPException(status_code=403, detail="Not a club")
    
    opportunities = await db.opportunities.find({"club_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    return [Opportunity(**opp) for opp in opportunities]

@api_router.delete("/opportunities/{opportunity_id}")
async def delete_opportunity(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'club':
        raise HTTPException(status_code=403, detail="Not a club")
    
    result = await db.opportunities.delete_one({"id": opportunity_id, "club_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return {"message": "Deleted"}

@api_router.get("/club/applications", response_model=List[dict])
async def get_club_applications(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'club':
        raise HTTPException(status_code=403, detail="Not a club")
    
    applications = await db.applications.find({"club_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    
    result = []
    for app in applications:
        player = await db.players.find_one({"user_id": app['player_id']}, {"_id": 0})
        opp = await db.opportunities.find_one({"id": app['opportunity_id']}, {"_id": 0})
        if player and opp:
            # Strip private info from player data
            player = strip_player_private_info(player)
            result.append({
                **app,
                "player": player,
                "opportunity": opp
            })
    return result

@api_router.put("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    status_update: ApplicationStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != 'club':
        raise HTTPException(status_code=403, detail="Not a club")
    
    result = await db.applications.update_one(
        {"id": application_id, "club_id": current_user['user_id']},
        {"$set": {"status": status_update.status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Status updated"}

@api_router.get("/players/{player_id}", response_model=PlayerProfile)
async def get_player_detail(player_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed player profile by user_id"""
    if current_user['role'] not in ['club', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    player = await db.players.find_one({"user_id": player_id, "approved": True}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Strip private info for non-admin users
    if current_user['role'] != 'admin':
        player = strip_player_private_info(player)
    
    return PlayerProfile(**player)

@api_router.get("/players", response_model=List[PlayerProfile])
async def get_players(
    position: Optional[str] = None,
    nationality: Optional[str] = None,
    level: Optional[str] = None,
    name: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != 'club':
        raise HTTPException(status_code=403, detail="Not a club")
    
    query = {"approved": True}
    if position:
        query['position'] = position
    if nationality:
        query['nationality'] = nationality
    if level:
        query['playing_level'] = level
    if name:
        query['name'] = {"$regex": name, "$options": "i"}  # Case-insensitive search
    
    players = await db.players.find(query, {"_id": 0}).to_list(1000)
    # Strip private info for club users
    players = [strip_player_private_info(p) for p in players]
    return [PlayerProfile(**p) for p in players]

@api_router.get("/players/recommended", response_model=List[PlayerProfile])
async def get_recommended_players(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'club':
        raise HTTPException(status_code=403, detail="Not a club")
    
    club = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    
    opportunities = await db.opportunities.find({"club_id": current_user['user_id']}, {"_id": 0}).to_list(100)
    
    if not opportunities:
        players = await db.players.find({"approved": True}, {"_id": 0}).to_list(20)
        # Strip private info
        players = [strip_player_private_info(p) for p in players]
        return [PlayerProfile(**p) for p in players]
    
    positions = list(set([opp['position'] for opp in opportunities]))
    query = {"approved": True, "position": {"$in": positions}}
    
    if club.get('country'):
        query['nationality'] = club['country']
    
    players = await db.players.find(query, {"_id": 0}).to_list(100)
    # Strip private info
    players = [strip_player_private_info(p) for p in players]
    return [PlayerProfile(**p) for p in players]

@api_router.post("/favorites", response_model=Favorite)
async def add_favorite(fav: FavoriteCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'club':
        raise HTTPException(status_code=403, detail="Not a club")
    
    existing = await db.favorites.find_one({
        "club_id": current_user['user_id'],
        "player_id": fav.player_id
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already favorited")
    
    fav_doc = {
        "id": str(uuid.uuid4()),
        "club_id": current_user['user_id'],
        "player_id": fav.player_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.favorites.insert_one(fav_doc)
    return Favorite(**fav_doc)

@api_router.get("/favorites", response_model=List[PlayerProfile])
async def get_favorites(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'club':
        raise HTTPException(status_code=403, detail="Not a club")
    
    favorites = await db.favorites.find({"club_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    player_ids = [fav['player_id'] for fav in favorites]
    
    players = await db.players.find({"user_id": {"$in": player_ids}}, {"_id": 0}).to_list(1000)
    # Strip private info
    players = [strip_player_private_info(p) for p in players]
    return [PlayerProfile(**p) for p in players]

@api_router.delete("/favorites/{player_id}")
async def remove_favorite(player_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'club':
        raise HTTPException(status_code=403, detail="Not a club")
    
    result = await db.favorites.delete_one({"club_id": current_user['user_id'], "player_id": player_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Removed"}

# ============ ADMIN ENDPOINTS ============
@api_router.get("/admin/stats", response_model=AdminStats)
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    total_players = await db.players.count_documents({})
    total_clubs = await db.clubs.count_documents({})
    total_applications = await db.applications.count_documents({})
    pending_players = await db.players.count_documents({"approved": False})
    pending_clubs = await db.clubs.count_documents({"approved": False})
    
    return AdminStats(
        total_players=total_players,
        total_clubs=total_clubs,
        total_applications=total_applications,
        pending_approvals=pending_players + pending_clubs
    )

@api_router.get("/admin/players", response_model=List[PlayerProfile])
async def get_all_players(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    players = await db.players.find({}, {"_id": 0}).to_list(1000)
    return [PlayerProfile(**p) for p in players]

@api_router.get("/admin/clubs", response_model=List[ClubProfile])
async def get_all_clubs(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    clubs = await db.clubs.find({}, {"_id": 0}).to_list(1000)
    return [ClubProfile(**c) for c in clubs]

@api_router.put("/admin/players/{user_id}/approve")
async def approve_player(user_id: str, approval: UserApproval, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    result = await db.players.update_one({"user_id": user_id}, {"$set": {"approved": approval.approved}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"message": "Updated"}

@api_router.put("/admin/players/{user_id}/verify")
async def verify_player(user_id: str, verified: bool, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    result = await db.players.update_one({"user_id": user_id}, {"$set": {"verified": verified}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"message": "Updated"}

@api_router.put("/admin/clubs/{user_id}/approve")
async def approve_club(user_id: str, approval: UserApproval, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    result = await db.clubs.update_one({"user_id": user_id}, {"$set": {"approved": approval.approved}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Club not found")
    return {"message": "Updated"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    await db.users.delete_one({"id": user_id})
    await db.players.delete_one({"user_id": user_id})
    await db.clubs.delete_one({"user_id": user_id})
    return {"message": "User deleted"}

@api_router.get("/admin/opportunities", response_model=List[Opportunity])
async def get_all_opportunities_admin(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    opportunities = await db.opportunities.find({}, {"_id": 0}).to_list(1000)
    return [Opportunity(**opp) for opp in opportunities]

@api_router.delete("/admin/opportunities/{opportunity_id}")
async def delete_opportunity_admin(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    result = await db.opportunities.delete_one({"id": opportunity_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return {"message": "Deleted"}

# ============ CHAT & VIDEO ADMIN ENDPOINTS ============
@api_router.post("/admin/chat/create")
async def create_chat_room_admin(
    player_id: str,
    club_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Admin creates a chat room between player and club"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    # Get player and club info
    player = await db.players.find_one({"user_id": player_id}, {"_id": 0})
    club = await db.clubs.find_one({"user_id": club_id}, {"_id": 0})
    
    if not player or not club:
        raise HTTPException(status_code=404, detail="Player or club not found")
    
    room_id = f"chat_{player_id}_{club_id}_{uuid.uuid4().hex[:8]}"
    room = await chat_room_manager.create_chat_room(
        room_id,
        player_id,
        club_id,
        player.get('name', 'Unknown Player'),
        club.get('name', 'Unknown Club'),
        current_user['user_id']
    )
    
    return {
        "room_id": room.id,
        "player_name": room.player_name,
        "club_name": room.club_name,
        "created_at": room.created_at
    }

@api_router.get("/admin/chat/rooms")
async def get_all_chat_rooms(current_user: dict = Depends(get_current_user)):
    """Admin gets all chat rooms"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    rooms = await chat_room_manager.get_all_chat_rooms()
    return [
        {
            "id": r.id,
            "player_name": r.player_name,
            "club_name": r.club_name,
            "created_at": r.created_at,
            "message_count": len(r.messages),
            "is_active": r.is_active
        }
        for r in rooms
    ]

@api_router.get("/admin/chat/rooms/{room_id}/messages")
async def get_chat_room_messages(room_id: str, current_user: dict = Depends(get_current_user)):
    """Admin views chat room messages"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    room = await chat_room_manager.get_chat_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    return {
        "room_id": room.id,
        "player_name": room.player_name,
        "club_name": room.club_name,
        "messages": [m.model_dump() for m in room.messages]
    }

@api_router.delete("/admin/chat/rooms/{room_id}")
async def delete_chat_room(room_id: str, current_user: dict = Depends(get_current_user)):
    """Admin deletes chat room"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    await chat_room_manager.delete_chat_room(room_id)
    return {"message": "Chat room deleted"}

@api_router.post("/admin/video/create")
async def create_video_session_admin(
    player_id: str,
    club_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Admin creates a video session between player and club"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    # Get player and club info
    player = await db.players.find_one({"user_id": player_id}, {"_id": 0})
    club = await db.clubs.find_one({"user_id": club_id}, {"_id": 0})
    
    if not player or not club:
        raise HTTPException(status_code=404, detail="Player or club not found")
    
    session_id = f"video_{player_id}_{club_id}_{uuid.uuid4().hex[:8]}"
    session = await video_session_manager.create_video_session(
        session_id,
        player_id,
        club_id,
        player.get('name', 'Unknown Player'),
        club.get('name', 'Unknown Club'),
        current_user['user_id']
    )
    
    return {
        "session_id": session.id,
        "player_name": session.player_name,
        "club_name": session.club_name,
        "created_at": session.created_at
    }

@api_router.get("/admin/video/sessions")
async def get_all_video_sessions(current_user: dict = Depends(get_current_user)):
    """Admin gets all video sessions"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    sessions = await video_session_manager.get_all_video_sessions()
    return [
        {
            "id": s.id,
            "player_name": s.player_name,
            "club_name": s.club_name,
            "created_at": s.created_at,
            "is_active": s.is_active,
            "participant_count": len(s.participants)
        }
        for s in sessions
    ]

@api_router.get("/admin/video/sessions/{session_id}")
async def get_video_session_details(session_id: str, current_user: dict = Depends(get_current_user)):
    """Admin views video session details"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    session = await video_session_manager.get_video_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Video session not found")
    
    return {
        "id": session.id,
        "player_name": session.player_name,
        "club_name": session.club_name,
        "created_at": session.created_at,
        "is_active": session.is_active,
        "participants": [
            {
                "user_id": p.user_id,
                "username": p.username,
                "role": p.role,
                "joined_at": p.joined_at.isoformat(),
                "is_observer": p.is_observer
            }
            for p in session.participants
        ]
    }

@api_router.delete("/admin/video/sessions/{session_id}")
async def delete_video_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Admin deletes video session"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    await video_session_manager.delete_video_session(session_id)
    return {"message": "Video session deleted"}

# ============ PLAYER/CLUB CHAT & VIDEO ENDPOINTS ============
@api_router.get("/my-chats")
async def get_my_chats(current_user: dict = Depends(get_current_user)):
    """Get chats for current user (player or club)"""
    user_id = current_user['user_id']
    role = current_user['role']
    
    rooms = await chat_room_manager.get_all_chat_rooms()
    
    if role == 'player':
        my_rooms = [r for r in rooms if r.player_id == user_id]
    elif role == 'club':
        my_rooms = [r for r in rooms if r.club_id == user_id]
    else:
        my_rooms = []
    
    return [
        {
            "id": r.id,
            "other_party": r.club_name if role == 'player' else r.player_name,
            "last_message": r.messages[-1].model_dump() if r.messages else None,
            "unread_count": 0
        }
        for r in my_rooms
    ]

@api_router.get("/my-videos")
async def get_my_videos(current_user: dict = Depends(get_current_user)):
    """Get video sessions for current user (player or club)"""
    user_id = current_user['user_id']
    role = current_user['role']
    
    sessions = await video_session_manager.get_all_video_sessions()
    
    if role == 'player':
        my_sessions = [s for s in sessions if s.player_id == user_id]
    elif role == 'club':
        my_sessions = [s for s in sessions if s.club_id == user_id]
    else:
        my_sessions = []
    
    return [
        {
            "id": s.id,
            "other_party": s.club_name if role == 'player' else s.player_name,
            "created_at": s.created_at,
            "is_active": s.is_active
        }
        for s in my_sessions
    ]


# ============ CHAT REQUEST ENDPOINTS ============
@api_router.post("/chat-requests", response_model=dict)
async def create_chat_request(
    request_data: ChatRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Club creates a chat request to connect with a player"""
    if current_user['role'] != 'club':
        raise HTTPException(status_code=403, detail="Only clubs can request chats")
    
    # Check if there's already a pending request
    existing = await db.chat_requests.find_one({
        "club_id": current_user['user_id'],
        "player_id": request_data.player_id,
        "status": "pending"
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="A pending request already exists for this player")
    
    # Get player and club info
    player = await db.players.find_one({"user_id": request_data.player_id}, {"_id": 0})
    club = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    chat_request = {
        "id": str(uuid.uuid4()),
        "player_id": request_data.player_id,
        "club_id": current_user['user_id'],
        "player_name": player.get('name', 'Unknown Player'),
        "club_name": club.get('name', 'Unknown Club'),
        "status": "pending",
        "message": request_data.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "responded_at": None
    }
    
    await db.chat_requests.insert_one(chat_request)
    
    # Create notifications for player and admin
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": request_data.player_id,
        "type": "chat_request",
        "title": "New Chat Request",
        "message": f"{club.get('name', 'A club')} wants to chat with you",
        "reference_id": chat_request["id"],
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Admin notification
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": "admin-001",
        "type": "chat_request",
        "title": "New Chat Request",
        "message": f"{club.get('name', 'Unknown Club')} requests to chat with {player.get('name', 'Unknown Player')}",
        "reference_id": chat_request["id"],
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Chat request sent successfully", "request_id": chat_request["id"]}


@api_router.get("/chat-requests/my", response_model=List[dict])
async def get_my_chat_requests(current_user: dict = Depends(get_current_user)):
    """Get chat requests for the current user (player sees incoming, club sees outgoing)"""
    user_id = current_user['user_id']
    role = current_user['role']
    
    if role == 'player':
        requests = await db.chat_requests.find({"player_id": user_id}, {"_id": 0}).to_list(100)
    elif role == 'club':
        requests = await db.chat_requests.find({"club_id": user_id}, {"_id": 0}).to_list(100)
    else:
        return []
    
    return requests


@api_router.put("/chat-requests/{request_id}/respond")
async def respond_to_chat_request(
    request_id: str,
    response: ChatRequestResponse,
    current_user: dict = Depends(get_current_user)
):
    """Player responds to a chat request (accept or reject)"""
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Only players can respond to chat requests")
    
    chat_request = await db.chat_requests.find_one({
        "id": request_id,
        "player_id": current_user['user_id'],
        "status": "pending"
    }, {"_id": 0})
    
    if not chat_request:
        raise HTTPException(status_code=404, detail="Chat request not found or already responded")
    
    if response.status not in ['accepted', 'rejected']:
        raise HTTPException(status_code=400, detail="Invalid response status")
    
    await db.chat_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": response.status,
            "responded_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    player = await db.players.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    player_name = player.get('name', 'Unknown Player') if player else 'Unknown Player'
    
    if response.status == 'accepted':
        # Notify admin to create the chat room
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": "admin-001",
            "type": "chat_request_accepted",
            "title": "Chat Request Accepted",
            "message": f"{player_name} accepted chat request from {chat_request['club_name']}. Please create the chat room.",
            "reference_id": request_id,
            "player_id": chat_request['player_id'],
            "club_id": chat_request['club_id'],
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return {"message": "Chat request accepted. Admin will create the chat room."}
    else:
        # Notify admin and club about rejection
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": "admin-001",
            "type": "chat_request_rejected",
            "title": "Chat Request Rejected",
            "message": f"{player_name} rejected chat request from {chat_request['club_name']}",
            "reference_id": request_id,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": chat_request['club_id'],
            "type": "chat_request_rejected",
            "title": "Chat Request Rejected",
            "message": f"{player_name} has declined your chat request",
            "reference_id": request_id,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return {"message": "Chat request rejected"}


@api_router.get("/admin/chat-requests", response_model=List[dict])
async def get_all_chat_requests(current_user: dict = Depends(get_current_user)):
    """Admin gets all chat requests"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    requests = await db.chat_requests.find({}, {"_id": 0}).to_list(1000)
    return requests


@api_router.get("/notifications", response_model=List[dict])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Get notifications for the current user"""
    notifications = await db.notifications.find(
        {"user_id": current_user['user_id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifications


@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a notification as read"""
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user['user_id']},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}


@api_router.get("/notifications/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get count of unread notifications"""
    count = await db.notifications.count_documents({
        "user_id": current_user['user_id'],
        "read": False
    })
    return {"count": count}


# ============ PLAYER MATCHING ENDPOINTS ============
# Track benchmark generation status
benchmark_generation_status = {"running": False, "started_at": None, "error": None}

@api_router.get("/available-leagues")
async def get_available_leagues():
    """Get list of available leagues for opportunity selection"""
    return {"leagues": AVAILABLE_LEAGUES}


async def run_benchmark_generation_background():
    """Background task to generate benchmark data"""
    global benchmark_generation_status
    try:
        benchmark_generation_status["running"] = True
        benchmark_generation_status["started_at"] = datetime.now(timezone.utc).isoformat()
        benchmark_generation_status["error"] = None
        
        # Run the heavy scraping operation
        result = await generate_benchmark_data(db, DEFAULT_LEAGUES)
        
        benchmark_generation_status["running"] = False
        benchmark_generation_status["last_result"] = result
        return result
    except Exception as e:
        benchmark_generation_status["running"] = False
        benchmark_generation_status["error"] = str(e)
        raise


@api_router.post("/admin/generate-benchmark")
async def admin_generate_benchmark(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Admin generates/updates benchmark data from Transfermarkt (runs in background)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    if benchmark_generation_status["running"]:
        return {
            "message": "Benchmark generation is already in progress",
            "started_at": benchmark_generation_status["started_at"],
            "status": "running"
        }
    
    # Start background task
    background_tasks.add_task(run_benchmark_generation_background)
    
    return {
        "message": "Benchmark generation started in background. This will take 5-10 minutes.",
        "status": "started",
        "check_status_at": "/api/admin/benchmark-generation-status"
    }


@api_router.get("/admin/benchmark-generation-status")
async def get_benchmark_generation_status(current_user: dict = Depends(get_current_user)):
    """Check the status of ongoing benchmark generation"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    return {
        "running": benchmark_generation_status["running"],
        "started_at": benchmark_generation_status.get("started_at"),
        "error": benchmark_generation_status.get("error"),
        "last_result": benchmark_generation_status.get("last_result")
    }


@api_router.get("/admin/benchmark-status")
async def get_benchmark_status(current_user: dict = Depends(get_current_user)):
    """Check if benchmark data exists and when it was generated"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    benchmark_doc = await db.benchmark_data.find_one({"id": "current_benchmark"}, {"_id": 0, "df_model": 0, "benchmark_role": 0, "benchmark_group": 0, "prod_minmax": 0})
    if not benchmark_doc:
        return {"exists": False, "message": "No benchmark data. Please generate it."}
    
    return {
        "exists": True,
        "generated_at": benchmark_doc.get("generated_at"),
        "leagues": benchmark_doc.get("leagues", []),
        "player_count": benchmark_doc.get("player_count", 0)
    }


@api_router.get("/player/match-scores")
async def get_player_match_scores_endpoint(current_user: dict = Depends(get_current_user)):
    """Get match scores for the current player against all opportunities"""
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    # Get player profile
    player = await db.players.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player profile not found")
    
    transfermarkt_url = player.get("transfermarkt_url")
    if not transfermarkt_url:
        return {"error": "Please add your Transfermarkt profile URL to get match scores", "scores": []}
    
    # Check if benchmark data exists
    benchmark_exists = await db.benchmark_data.find_one({"id": "current_benchmark"})
    if not benchmark_exists:
        return {"error": "Benchmark data not available. Please ask admin to generate it.", "scores": []}
    
    # Get all opportunities
    opportunities = await db.opportunities.find({}, {"_id": 0}).to_list(1000)
    if not opportunities:
        return {"scores": [], "message": "No opportunities available"}
    
    # Get match scores
    try:
        scores = await get_player_match_scores(db, transfermarkt_url, opportunities)
        return {"scores": scores}
    except Exception as e:
        logger.error(f"Failed to calculate match scores: {str(e)}")
        return {"error": f"Failed to fetch player data from Transfermarkt. Please verify your profile URL is correct.", "scores": []}


@api_router.get("/player/match-score/{opportunity_id}")
async def get_single_match_score(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    """Get match score for a specific opportunity"""
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    # Get player profile
    player = await db.players.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player profile not found")
    
    transfermarkt_url = player.get("transfermarkt_url")
    if not transfermarkt_url:
        return {"error": "Please add your Transfermarkt profile URL to get match scores"}
    
    # Get opportunity
    opportunity = await db.opportunities.find_one({"id": opportunity_id}, {"_id": 0})
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Load benchmark data
    benchmark_data = await load_benchmark_data(db)
    if not benchmark_data:
        return {"error": "Benchmark data not available. Please ask admin to generate it."}
    
    try:
        player_dict = build_player_dict_from_transfermarkt_url(transfermarkt_url)
        match_score = calculate_match_score_for_opportunity(
            player_dict=player_dict,
            opportunity_league=opportunity.get("league_level", "USL Championship"),
            opportunity_position=opportunity.get("position", ""),
            benchmark_data=benchmark_data
        )
        return {
            "opportunity_id": opportunity_id,
            **match_score
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate match score: {str(e)}")


fastapi_app.include_router(api_router)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO Event Handlers
@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")
    # Clean up video session if user was in one
    for session_id, session in video_session_manager.active_sessions.items():
        for participant in session.participants:
            if video_session_manager.socket_to_session.get(sid) == session_id:
                video_session_manager.remove_participant(session_id, participant.user_id)
                await sio.emit('participant_left', {
                    'session_id': session_id,
                    'user_id': participant.user_id
                }, room=session_id, skip_sid=sid)
                break

@sio.event
async def join_chat_room(sid, data):
    """Join a chat room"""
    room_id = data.get('room_id')
    user_id = data.get('user_id')
    if room_id:
        await sio.enter_room(sid, room_id)
        logger.info(f"User {user_id} joined chat room {room_id}")
        
        # Load previous messages
        room = await chat_room_manager.get_chat_room(room_id)
        if room:
            await sio.emit('previous_messages', {
                'messages': [m.model_dump() for m in room.messages[-50:]]  # Last 50 messages
            }, room=sid)

@sio.event
async def send_chat_message(sid, data):
    """Send chat message"""
    room_id = data.get('room_id')
    sender_id = data.get('sender_id')
    sender_name = data.get('sender_name')
    message_text = data.get('message')
    
    if room_id and sender_id and message_text:
        message = ChatMessage(
            id=str(uuid.uuid4()),
            room_id=room_id,
            sender_id=sender_id,
            sender_name=sender_name,
            message=message_text,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        await chat_room_manager.add_message(room_id, message)
        
        # Broadcast to all in room
        await sio.emit('new_chat_message', message.model_dump(), room=room_id)

@sio.event
async def join_video_session(sid, data):
    """Join video session"""
    session_id = data.get('session_id')
    user_id = data.get('user_id')
    username = data.get('username')
    role = data.get('role')
    is_observer = data.get('is_observer', False)
    
    if session_id:
        await sio.enter_room(sid, session_id)
        video_session_manager.socket_to_session[sid] = session_id
        video_session_manager.add_participant(session_id, user_id, username, role, is_observer)
        
        # Notify others
        session = await video_session_manager.get_video_session(session_id)
        if session:
            await sio.emit('participant_joined', {
                'session_id': session_id,
                'user_id': user_id,
                'username': username,
                'role': role,
                'is_observer': is_observer,
                'participants': [
                    {
                        'user_id': p.user_id,
                        'username': p.username,
                        'role': p.role,
                        'is_observer': p.is_observer
                    }
                    for p in session.participants
                ]
            }, room=session_id)

@sio.event
async def webrtc_offer(sid, data):
    """Forward WebRTC offer"""
    session_id = data.get('session_id')
    offer = data.get('offer')
    from_user = data.get('from_user')
    
    await sio.emit('webrtc_offer', {
        'from_user': from_user,
        'offer': offer
    }, room=session_id, skip_sid=sid)

@sio.event
async def webrtc_answer(sid, data):
    """Forward WebRTC answer"""
    session_id = data.get('session_id')
    answer = data.get('answer')
    from_user = data.get('from_user')
    
    await sio.emit('webrtc_answer', {
        'from_user': from_user,
        'answer': answer
    }, room=session_id, skip_sid=sid)

@sio.event
async def webrtc_ice_candidate(sid, data):
    """Forward ICE candidate"""
    session_id = data.get('session_id')
    candidate = data.get('candidate')
    from_user = data.get('from_user')
    
    await sio.emit('webrtc_ice_candidate', {
        'from_user': from_user,
        'candidate': candidate
    }, room=session_id, skip_sid=sid)

fastapi_app.include_router(api_router)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@fastapi_app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Wrap FastAPI with Socket.IO
socket_app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app, socketio_path='/api/socket.io')
app = socket_app
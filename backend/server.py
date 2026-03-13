from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

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
    email: str
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
    approved: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

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

# ============ CLUB MODELS ============
class ClubProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    name: str
    email: str
    country: Optional[str] = None
    league: Optional[str] = None
    logo: Optional[str] = None
    approved: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

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

@api_router.get("/players", response_model=List[PlayerProfile])
async def get_players(
    position: Optional[str] = None,
    nationality: Optional[str] = None,
    level: Optional[str] = None,
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
    
    players = await db.players.find(query, {"_id": 0}).to_list(1000)
    return [PlayerProfile(**p) for p in players]

@api_router.get("/players/recommended", response_model=List[PlayerProfile])
async def get_recommended_players(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'club':
        raise HTTPException(status_code=403, detail="Not a club")
    
    club = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    
    opportunities = await db.opportunities.find({"club_id": current_user['user_id']}, {"_id": 0}).to_list(100)
    
    if not opportunities:
        players = await db.players.find({"approved": True}, {"_id": 0}).to_list(20)
        return [PlayerProfile(**p) for p in players]
    
    positions = list(set([opp['position'] for opp in opportunities]))
    query = {"approved": True, "position": {"$in": positions}}
    
    if club.get('country'):
        query['nationality'] = club['country']
    
    players = await db.players.find(query, {"_id": 0}).to_list(100)
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

app.include_router(api_router)

app.add_middleware(
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
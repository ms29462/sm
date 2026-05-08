from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables FIRST before any other imports that might need them
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks, UploadFile, File, Form, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import logging
import socketio
import shutil
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
from video_analysis import analyze_highlight_video, calculate_overall_score, analyze_video_with_gemini
from chatbot_service import SoccerMatchChatbot, search_players_from_criteria, search_opportunities_from_criteria, format_player_results, format_opportunity_results
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Background task executor for heavy operations
background_executor = ThreadPoolExecutor(max_workers=2)

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / "uploads" / "videos"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Socket.IO Setup
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
fastapi_app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Mount static files for uploaded videos
fastapi_app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR.parent)), name="uploads")

# Initialize managers
chat_room_manager = ChatRoomManager(db)
video_session_manager = VideoSessionManager(db)

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7

# ============ AUTH MODELS ============
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: Literal['player', 'club', 'federation', 'agent', 'specialist', 'college']
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
    nationality: Optional[str] = None  # Primary nationality (kept for backwards compatibility)
    nationality_1: Optional[str] = None  # First nationality
    nationality_2: Optional[str] = None  # Second nationality
    nationality_3: Optional[str] = None  # Third nationality
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
    video_analysis_score: Optional[int] = None  # AI video analysis score
    approved: bool = False
    verified: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# Helper function to strip private info from player data
def strip_player_private_info(player_dict: dict) -> dict:
    """Remove private information (email) from player data for non-admin users"""
    sanitized = player_dict.copy()
    sanitized.pop('email', None)
    return sanitized


# Helper to get all nationalities from a player
def get_player_nationalities(player: dict) -> List[str]:
    """Get all nationalities from a player document"""
    nationalities = []
    for key in ['nationality', 'nationality_1', 'nationality_2', 'nationality_3']:
        val = player.get(key)
        if val and val not in nationalities:
            nationalities.append(val)
    return nationalities


class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    position: Optional[str] = None
    age: Optional[int] = None
    nationality: Optional[str] = None
    nationality_1: Optional[str] = None
    nationality_2: Optional[str] = None
    nationality_3: Optional[str] = None
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


# ============ MATCH ARCHIVE MODELS ============
class MatchArchiveEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    video_link: str
    match_date: str
    opponent: str
    competition_level: str
    description: Optional[str] = None
    position_played: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class MatchArchiveCreate(BaseModel):
    video_link: str
    match_date: str
    opponent: str
    competition_level: str
    description: Optional[str] = None
    position_played: Optional[str] = None


# ============ MATCH CALENDAR MODELS ============
class MatchCalendarEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    match_date: str
    match_time: Optional[str] = None
    location: Optional[str] = None
    stadium: Optional[str] = None
    opponent: str
    competition: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class MatchCalendarCreate(BaseModel):
    match_date: str
    match_time: Optional[str] = None
    location: Optional[str] = None
    stadium: Optional[str] = None
    opponent: str
    competition: Optional[str] = None

# ============ CLUB MODELS ============
class ClubProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    name: str
    email: Optional[str] = None
    country: Optional[str] = None
    league: Optional[str] = None
    league_level: Optional[str] = None
    playing_level: Optional[Literal['Amateur', 'Semi-Professional', 'Professional']] = None
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
    league_level: Optional[str] = None
    playing_level: Optional[Literal['Amateur', 'Semi-Professional', 'Professional']] = None
    logo: Optional[str] = None


# ============ COLLEGE MODELS ============
class CollegeProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    name: str
    email: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    conference: Optional[str] = None
    division: Optional[Literal["NCAA Division I", "NCAA Division II", "NAIA", "NJCAA"]] = None
    logo: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    approved: bool = False
    verified: bool = False
    schema_version: Optional[int] = 1
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None

def strip_college_private_info(college_dict: dict) -> dict:
    sanitized = college_dict.copy()
    sanitized.pop("email", None)
    return sanitized

class CollegeUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    conference: Optional[str] = None
    division: Optional[Literal["NCAA Division I", "NCAA Division II", "NAIA", "NJCAA"]] = None
    logo: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None

# ============ FEDERATION MODELS ============
class FederationProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    name: str  # e.g., "Cameroon Football Federation"
    email: Optional[str] = None  # Only visible to admin
    country: str  # The country this federation represents
    logo: Optional[str] = None
    description: Optional[str] = None
    approved: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def strip_federation_private_info(federation_dict: dict) -> dict:
    """Remove private information from federation data for non-admin users"""
    sanitized = federation_dict.copy()
    sanitized.pop('email', None)
    return sanitized


class FederationUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    logo: Optional[str] = None
    description: Optional[str] = None


# Federation Team Groups (Senior, U23, U20, U17, U15)
class FederationTeam(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    federation_id: str
    name: str  # e.g., "Senior Team", "U23", "U20", "U17", "U15"
    description: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class FederationTeamCreate(BaseModel):
    name: str
    description: Optional[str] = None


# Player assignment to federation teams
class FederationTeamPlayer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    team_id: str
    federation_id: str
    player_id: str
    player_name: str
    added_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    notes: Optional[str] = None


class FederationTeamPlayerAdd(BaseModel):
    player_id: str
    notes: Optional[str] = None


# ============ AGENT MODELS ============
AGENT_SPECIALIZATIONS = [
    'Youth Players',
    'Professional Players',
    'International Transfers',
    'Contract Negotiations',
    'Endorsement Deals',
    'Career Management'
]

class AgentProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    name: str
    email: Optional[str] = None  # Only visible to admin
    agency_name: Optional[str] = None
    license_number: Optional[str] = None
    fifa_registered: bool = False
    country: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    specializations: List[str] = []  # From AGENT_SPECIALIZATIONS
    years_experience: Optional[int] = None
    players_represented: Optional[int] = 0
    successful_transfers: Optional[int] = 0
    website: Optional[str] = None
    linkedin: Optional[str] = None
    approved: bool = False
    verified: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def strip_agent_private_info(agent_dict: dict) -> dict:
    """Remove private information from agent data for non-admin users"""
    sanitized = agent_dict.copy()
    sanitized.pop('email', None)
    sanitized.pop('phone', None)
    return sanitized


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    agency_name: Optional[str] = None
    license_number: Optional[str] = None
    fifa_registered: Optional[bool] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    specializations: Optional[List[str]] = None
    years_experience: Optional[int] = None
    players_represented: Optional[int] = None
    successful_transfers: Optional[int] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None


# ============ SPECIALIST MODELS ============
SPECIALIST_TYPES = [
    'Physical Trainer',
    'Physiotherapist',
    'Nutritionist',
    'Sports Psychologist',
    'Strength & Conditioning Coach',
    'Recovery Specialist',
    'Performance Analyst',
    'Rehabilitation Specialist'
]

SPECIALIST_CERTIFICATIONS = [
    'FIFA Diploma',
    'UEFA Pro License',
    'NSCA-CSCS',
    'NASM-CPT',
    'Licensed Physiotherapist',
    'Registered Dietitian',
    'Sports Psychology Certification',
    'First Aid/CPR',
    'Other'
]

class SpecialistProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    name: str
    email: Optional[str] = None  # Only visible to admin
    specialist_type: Optional[str] = None  # From SPECIALIST_TYPES
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    certifications: List[str] = []  # From SPECIALIST_CERTIFICATIONS
    years_experience: Optional[int] = None
    current_club: Optional[str] = None  # If working with a club
    hourly_rate: Optional[str] = None
    availability: Optional[str] = None  # e.g., "Full-time", "Part-time", "Freelance"
    services_offered: List[str] = []  # e.g., ["ACL Rehab", "Speed Training", "Nutrition Plans"]
    languages: List[str] = []
    website: Optional[str] = None
    linkedin: Optional[str] = None
    approved: bool = False
    verified: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def strip_specialist_private_info(specialist_dict: dict) -> dict:
    """Remove private information from specialist data for non-admin users"""
    sanitized = specialist_dict.copy()
    sanitized.pop('email', None)
    sanitized.pop('phone', None)
    return sanitized


class SpecialistUpdate(BaseModel):
    name: Optional[str] = None
    specialist_type: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    certifications: Optional[List[str]] = None
    years_experience: Optional[int] = None
    current_club: Optional[str] = None
    hourly_rate: Optional[str] = None
    availability: Optional[str] = None
    services_offered: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None


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
    total_federations: int = 0
    total_agents: int = 0
    total_specialists: int = 0
    total_applications: int
    pending_approvals: int

class UserApproval(BaseModel):
    user_id: str
    approved: bool


# ============ MASTERCLASS MODELS ============
MASTERCLASS_CATEGORIES = [
    'medical_recovery',
    'pro_masterclass',
    'college_tips',
    'fitness_conditioning',
    'mental_performance'
]

MASTERCLASS_DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

MASTERCLASS_SUBCATEGORIES = {
    'medical_recovery': ['ACL Recovery', 'Ankle Sprain', 'Hamstring Injury', 'Knee Injury', 'Muscle Recovery', 'General Rehabilitation'],
    'pro_masterclass': ['Goalkeeper', 'Defender', 'Midfielder', 'Striker', 'Winger', 'General Skills'],
    'college_tips': ['Recruitment Process', 'Academic Balance', 'Showcase Events', 'Communication with Coaches', 'Scholarship Tips'],
    'fitness_conditioning': ['Speed Training', 'Strength Training', 'Endurance', 'Flexibility', 'Nutrition'],
    'mental_performance': ['Pre-Match Preparation', 'Dealing with Pressure', 'Confidence Building', 'Recovery Mindset', 'Goal Setting']
}

class MasterclassCreate(BaseModel):
    title: str
    description: str
    category: str  # One of MASTERCLASS_CATEGORIES
    subcategory: Optional[str] = None
    difficulty: str = 'beginner'  # beginner, intermediate, advanced
    duration_minutes: int = 10
    thumbnail: Optional[str] = None
    video_url: Optional[str] = None  # YouTube/Vimeo URL
    content: Optional[str] = None  # Rich text/markdown content
    author_name: str  # e.g., "Cristiano Ronaldo" or "Coach John Smith"
    author_credentials: Optional[str] = None  # e.g., "Former Real Madrid Player"
    author_image: Optional[str] = None
    tags: List[str] = []
    featured: bool = False

class MasterclassUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    difficulty: Optional[str] = None
    duration_minutes: Optional[int] = None
    thumbnail: Optional[str] = None
    video_url: Optional[str] = None
    content: Optional[str] = None
    author_name: Optional[str] = None
    author_credentials: Optional[str] = None
    author_image: Optional[str] = None
    tags: Optional[List[str]] = None
    featured: Optional[bool] = None
    published: Optional[bool] = None

class MasterclassComment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    masterclass_id: str
    user_id: str
    user_name: str
    user_role: str
    content: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


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
    elif user.role == 'federation':
        federation_doc = {
            "user_id": user_id,
            "name": user.name,
            "email": user.email,
            "country": "",  # To be filled in profile
            "approved": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.federations.insert_one(federation_doc)
    elif user.role == 'agent':
        agent_doc = {
            "user_id": user_id,
            "name": user.name,
            "email": user.email,
            "approved": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.agents.insert_one(agent_doc)
    elif user.role == 'specialist':
        specialist_doc = {
            "user_id": user_id,
            "name": user.name,
            "email": user.email,
            "approved": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.specialists.insert_one(specialist_doc)
    else:  # club
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
    if not user or not verify_password(credentials.password, user.get('password_hash', user.get('password', ''))):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = user.get('user_id', user.get('id'))
    token = create_token(user_id, user['email'], user['role'])
    return AuthResponse(token=token, role=user['role'], user_id=user_id, email=user['email'])

@api_router.post("/auth/refresh")
async def refresh_token(request: Request):
    """Get a new access token using a refresh token"""
    body = await request.json()
    refresh_token = body.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token required")
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload["user_id"]
        email = payload["email"]
        role = payload["role"]
        new_access_token = create_token(user_id, email, role)
        new_refresh_token = create_refresh_token(user_id, email, role)
        return {
            "token": new_access_token,
            "refresh_token": new_refresh_token,
            "role": role,
            "user_id": user_id,
            "email": email
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired - please login again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.post("/auth/admin/login", response_model=AuthResponse)
async def admin_login(credentials: UserLogin):
    admin_email = os.environ.get('ADMIN_EMAIL')
    admin_password = os.environ.get('ADMIN_PASSWORD')
    if credentials.email == admin_email and credentials.password == admin_password:
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
async def update_player_profile(update: PlayerUpdate, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    # Check if highlight_video is being updated - trigger auto analysis
    trigger_analysis = False
    if 'highlight_video' in update_data and update_data['highlight_video']:
        # Check if it's a new or changed video URL
        player = await db.players.find_one({"user_id": current_user['user_id']}, {"_id": 0})
        if player and player.get('highlight_video') != update_data['highlight_video']:
            trigger_analysis = True
    
    if update_data:
        await db.players.update_one({"user_id": current_user['user_id']}, {"$set": update_data})
    
    # Trigger background video analysis if video URL changed
    if trigger_analysis:
        background_tasks.add_task(
            run_video_analysis_background,
            current_user['user_id'],
            update_data['highlight_video']
        )
    
    player = await db.players.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    return PlayerProfile(**player)


# ============ VIDEO ANALYSIS ENDPOINTS ============

async def run_video_analysis_background(player_id: str, video_url: str):
    """Background task to run video analysis"""
    try:
        # Mark analysis as in progress
        await db.video_analyses.update_one(
            {"player_id": player_id},
            {"$set": {
                "status": "analyzing",
                "video_url": video_url,
                "started_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        
        # Run the analysis
        result = await analyze_highlight_video(video_url, player_id)
        
        if result["success"]:
            # Calculate overall score
            overall_score = calculate_overall_score(result["analysis"])
            
            # Store results
            await db.video_analyses.update_one(
                {"player_id": player_id},
                {"$set": {
                    "status": "completed",
                    "analysis_id": result["analysis_id"],
                    "video_url": video_url,
                    "analysis": result["analysis"],
                    "overall_score": overall_score,
                    "analyzed_at": result["analyzed_at"],
                    "error": None
                }}
            )
            
            # Update player profile with overall score
            await db.players.update_one(
                {"user_id": player_id},
                {"$set": {"video_analysis_score": overall_score}}
            )
        else:
            await db.video_analyses.update_one(
                {"player_id": player_id},
                {"$set": {
                    "status": "failed",
                    "error": result.get("error", "Analysis failed"),
                    "analyzed_at": datetime.now(timezone.utc).isoformat()
                }}
            )
    except Exception as e:
        await db.video_analyses.update_one(
            {"player_id": player_id},
            {"$set": {
                "status": "failed",
                "error": str(e),
                "analyzed_at": datetime.now(timezone.utc).isoformat()
            }}
        )


@api_router.post("/player/video-analysis/trigger")
async def trigger_video_analysis(background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    """Manually trigger video analysis for the current player"""
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    player = await db.players.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    video_url = player.get('highlight_video')
    if not video_url:
        raise HTTPException(status_code=400, detail="No highlight video URL set in profile")
    
    # Check if analysis is already in progress
    existing = await db.video_analyses.find_one({"player_id": current_user['user_id']})
    if existing and existing.get('status') == 'analyzing':
        return {"message": "Analysis already in progress", "status": "analyzing"}
    
    # Start background analysis
    background_tasks.add_task(
        run_video_analysis_background,
        current_user['user_id'],
        video_url
    )
    
    return {"message": "Video analysis started", "status": "analyzing"}


@api_router.get("/player/video-analysis")
async def get_video_analysis(current_user: dict = Depends(get_current_user)):
    """Get video analysis results for the current player"""
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    analysis = await db.video_analyses.find_one(
        {"player_id": current_user['user_id']},
        {"_id": 0}
    )
    
    if not analysis:
        return {"status": "not_analyzed", "message": "No video analysis available"}
    
    return analysis


@api_router.get("/player/video-analysis/status")
async def get_video_analysis_status(current_user: dict = Depends(get_current_user)):
    """Get video analysis status for the current player"""
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    analysis = await db.video_analyses.find_one(
        {"player_id": current_user['user_id']},
        {"_id": 0, "status": 1, "error": 1, "analyzed_at": 1}
    )
    
    if not analysis:
        return {"status": "not_analyzed"}
    
    return {
        "status": analysis.get("status", "unknown"),
        "error": analysis.get("error"),
        "analyzed_at": analysis.get("analyzed_at")
    }


@api_router.get("/players/{player_id}/video-analysis")
async def get_player_video_analysis_public(player_id: str, current_user: dict = Depends(get_current_user)):
    """Get video analysis for any player (clubs/federations/admins can view)"""
    if current_user['role'] not in ['club', 'federation', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    analysis = await db.video_analyses.find_one(
        {"player_id": player_id, "status": "completed"},
        {"_id": 0}
    )
    
    if not analysis:
        return {"status": "not_analyzed", "message": "No video analysis available for this player"}
    
    return analysis


# ============ VIDEO UPLOAD ENDPOINTS ============

MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB limit

async def run_uploaded_video_analysis(analysis_id: str, video_path: str, uploader_id: str, uploader_role: str, player_id: str = None):
    """Background task to analyze an uploaded video"""
    try:
        # Update status to analyzing
        await db.uploaded_video_analyses.update_one(
            {"analysis_id": analysis_id},
            {"$set": {"status": "analyzing", "started_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Check file exists
        if not os.path.exists(video_path):
            raise Exception("Video file not found")
        
        # Analyze with Gemini
        result = await analyze_video_with_gemini(video_path)
        
        if result["success"]:
            overall_score = calculate_overall_score(result["analysis"])
            
            await db.uploaded_video_analyses.update_one(
                {"analysis_id": analysis_id},
                {"$set": {
                    "status": "completed",
                    "analysis": result["analysis"],
                    "overall_score": overall_score,
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                    "error": None
                }}
            )
            
            # If this is a player analyzing their own video, update their profile score
            if uploader_role == 'player' and not player_id:
                await db.players.update_one(
                    {"user_id": uploader_id},
                    {"$set": {"video_analysis_score": overall_score}}
                )
        else:
            await db.uploaded_video_analyses.update_one(
                {"analysis_id": analysis_id},
                {"$set": {
                    "status": "failed",
                    "error": result.get("error", "Analysis failed"),
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }}
            )
    except Exception as e:
        await db.uploaded_video_analyses.update_one(
            {"analysis_id": analysis_id},
            {"$set": {
                "status": "failed",
                "error": str(e),
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )


@api_router.post("/video-upload/analyze")
async def upload_and_analyze_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    player_id: Optional[str] = Form(None),
    video_title: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a video for AI analysis.
    - Players can upload their own highlight videos
    - Clubs/Federations can upload videos for any player they're scouting
    """
    # Validate file type
    content_type = video.content_type or ''
    
    if not any(t in content_type for t in ['video/', 'application/octet-stream']):
        raise HTTPException(status_code=400, detail="File must be a video (MP4, WebM, MOV, AVI)")
    
    # Check file size by reading chunks
    file_size = 0
    chunks = []
    while True:
        chunk = await video.read(1024 * 1024)  # Read 1MB at a time
        if not chunk:
            break
        chunks.append(chunk)
        file_size += len(chunk)
        if file_size > MAX_VIDEO_SIZE:
            raise HTTPException(status_code=400, detail=f"Video must be under {MAX_VIDEO_SIZE // (1024*1024)}MB")
    
    # Generate unique filename
    analysis_id = str(uuid.uuid4())
    file_ext = video.filename.split('.')[-1] if '.' in video.filename else 'mp4'
    filename = f"{analysis_id}.{file_ext}"
    file_path = str(UPLOADS_DIR / filename)
    
    # Save file
    with open(file_path, 'wb') as f:
        for chunk in chunks:
            f.write(chunk)
    
    # Determine target player
    target_player_id = player_id if current_user['role'] in ['club', 'federation', 'admin'] and player_id else None
    if current_user['role'] == 'player':
        target_player_id = None  # Player is analyzing their own video
    
    # Create analysis record
    analysis_record = {
        "analysis_id": analysis_id,
        "uploader_id": current_user['user_id'],
        "uploader_role": current_user['role'],
        "player_id": target_player_id,
        "video_title": video_title or video.filename,
        "video_path": file_path,
        "video_filename": filename,
        "file_size": file_size,
        "status": "uploaded",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.uploaded_video_analyses.insert_one(analysis_record)
    analysis_record.pop('_id', None)
    
    # Start background analysis
    background_tasks.add_task(
        run_uploaded_video_analysis,
        analysis_id,
        file_path,
        current_user['user_id'],
        current_user['role'],
        target_player_id
    )
    
    return {
        "message": "Video uploaded successfully. Analysis started.",
        "analysis_id": analysis_id,
        "status": "analyzing"
    }


@api_router.get("/video-upload/analyses")
async def get_uploaded_analyses(current_user: dict = Depends(get_current_user)):
    """Get all video analyses uploaded by the current user"""
    query = {"uploader_id": current_user['user_id']}
    analyses = await db.uploaded_video_analyses.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return analyses


@api_router.get("/video-upload/analysis/{analysis_id}")
async def get_uploaded_analysis(analysis_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific uploaded video analysis"""
    analysis = await db.uploaded_video_analyses.find_one(
        {"analysis_id": analysis_id},
        {"_id": 0}
    )
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Check access - owner or admin
    if analysis['uploader_id'] != current_user['user_id'] and current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized to view this analysis")
    
    return analysis


@api_router.delete("/video-upload/analysis/{analysis_id}")
async def delete_uploaded_analysis(analysis_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an uploaded video analysis"""
    analysis = await db.uploaded_video_analyses.find_one({"analysis_id": analysis_id})
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Check access - owner or admin
    if analysis['uploader_id'] != current_user['user_id'] and current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized to delete this analysis")
    
    # Delete video file
    try:
        if analysis.get('video_path') and os.path.exists(analysis['video_path']):
            os.remove(analysis['video_path'])
    except Exception:
        pass
    
    # Delete record
    await db.uploaded_video_analyses.delete_one({"analysis_id": analysis_id})
    
    return {"message": "Analysis deleted successfully"}


# ============ MASTERCLASS ENDPOINTS ============

@api_router.get("/masterclass/categories")
async def get_masterclass_categories():
    """Get all masterclass categories and subcategories"""
    return {
        "categories": MASTERCLASS_CATEGORIES,
        "subcategories": MASTERCLASS_SUBCATEGORIES,
        "difficulties": MASTERCLASS_DIFFICULTIES
    }


@api_router.get("/masterclass")
async def get_masterclasses(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    limit: int = 50
):
    """Get all published masterclasses with optional filters"""
    query = {"published": True}
    
    if category:
        query["category"] = category
    if subcategory:
        query["subcategory"] = subcategory
    if difficulty:
        query["difficulty"] = difficulty
    if featured is not None:
        query["featured"] = featured
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search.lower()]}},
            {"author_name": {"$regex": search, "$options": "i"}}
        ]
    
    masterclasses = await db.masterclasses.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return masterclasses


@api_router.get("/masterclass/{masterclass_id}")
async def get_masterclass(masterclass_id: str):
    """Get a single masterclass by ID"""
    masterclass = await db.masterclasses.find_one(
        {"id": masterclass_id, "published": True},
        {"_id": 0}
    )
    if not masterclass:
        raise HTTPException(status_code=404, detail="Masterclass not found")
    
    # Increment view count
    await db.masterclasses.update_one(
        {"id": masterclass_id},
        {"$inc": {"views": 1}}
    )
    
    return masterclass


@api_router.post("/admin/masterclass")
async def create_masterclass(masterclass: MasterclassCreate, current_user: dict = Depends(get_current_user)):
    """Create a new masterclass (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if masterclass.category not in MASTERCLASS_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {MASTERCLASS_CATEGORIES}")
    
    masterclass_doc = {
        "id": str(uuid.uuid4()),
        **masterclass.model_dump(),
        "published": True,
        "views": 0,
        "bookmarks_count": 0,
        "comments_count": 0,
        "created_by": current_user['user_id'],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.masterclasses.insert_one(masterclass_doc)
    masterclass_doc.pop('_id', None)
    return masterclass_doc


@api_router.put("/admin/masterclass/{masterclass_id}")
async def update_masterclass(masterclass_id: str, update: MasterclassUpdate, current_user: dict = Depends(get_current_user)):
    """Update a masterclass (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = await db.masterclasses.find_one({"id": masterclass_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Masterclass not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.masterclasses.update_one({"id": masterclass_id}, {"$set": update_data})
    
    updated = await db.masterclasses.find_one({"id": masterclass_id}, {"_id": 0})
    return updated


@api_router.delete("/admin/masterclass/{masterclass_id}")
async def delete_masterclass(masterclass_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a masterclass (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.masterclasses.delete_one({"id": masterclass_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Masterclass not found")
    
    # Also delete related bookmarks and comments
    await db.masterclass_bookmarks.delete_many({"masterclass_id": masterclass_id})
    await db.masterclass_comments.delete_many({"masterclass_id": masterclass_id})
    
    return {"message": "Masterclass deleted"}


@api_router.get("/admin/masterclass")
async def get_all_masterclasses_admin(current_user: dict = Depends(get_current_user)):
    """Get all masterclasses including unpublished (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    masterclasses = await db.masterclasses.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return masterclasses


# Bookmarks
@api_router.post("/masterclass/{masterclass_id}/bookmark")
async def bookmark_masterclass(masterclass_id: str, current_user: dict = Depends(get_current_user)):
    """Bookmark a masterclass"""
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Only players can bookmark masterclasses")
    
    masterclass = await db.masterclasses.find_one({"id": masterclass_id, "published": True})
    if not masterclass:
        raise HTTPException(status_code=404, detail="Masterclass not found")
    
    existing = await db.masterclass_bookmarks.find_one({
        "masterclass_id": masterclass_id,
        "user_id": current_user['user_id']
    })
    
    if existing:
        return {"message": "Already bookmarked"}
    
    await db.masterclass_bookmarks.insert_one({
        "id": str(uuid.uuid4()),
        "masterclass_id": masterclass_id,
        "user_id": current_user['user_id'],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.masterclasses.update_one({"id": masterclass_id}, {"$inc": {"bookmarks_count": 1}})
    
    return {"message": "Bookmarked successfully"}


@api_router.delete("/masterclass/{masterclass_id}/bookmark")
async def remove_bookmark(masterclass_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a bookmark"""
    result = await db.masterclass_bookmarks.delete_one({
        "masterclass_id": masterclass_id,
        "user_id": current_user['user_id']
    })
    
    if result.deleted_count > 0:
        await db.masterclasses.update_one({"id": masterclass_id}, {"$inc": {"bookmarks_count": -1}})
    
    return {"message": "Bookmark removed"}


@api_router.get("/masterclass/user/bookmarks")
async def get_user_bookmarks(current_user: dict = Depends(get_current_user)):
    """Get user's bookmarked masterclasses"""
    bookmarks = await db.masterclass_bookmarks.find(
        {"user_id": current_user['user_id']},
        {"_id": 0}
    ).to_list(100)
    
    masterclass_ids = [b['masterclass_id'] for b in bookmarks]
    
    masterclasses = await db.masterclasses.find(
        {"id": {"$in": masterclass_ids}, "published": True},
        {"_id": 0}
    ).to_list(100)
    
    return masterclasses


# Comments
@api_router.post("/masterclass/{masterclass_id}/comments")
async def add_comment(masterclass_id: str, content: dict, current_user: dict = Depends(get_current_user)):
    """Add a comment to a masterclass"""
    masterclass = await db.masterclasses.find_one({"id": masterclass_id, "published": True})
    if not masterclass:
        raise HTTPException(status_code=404, detail="Masterclass not found")
    
    comment_text = content.get('content', '').strip()
    if not comment_text:
        raise HTTPException(status_code=400, detail="Comment content is required")
    
    # Get user name
    user_name = "Anonymous"
    if current_user['role'] == 'player':
        player = await db.players.find_one({"user_id": current_user['user_id']})
        if player:
            user_name = player.get('name', 'Anonymous')
    elif current_user['role'] == 'admin':
        user_name = "Admin"
    
    comment_doc = {
        "id": str(uuid.uuid4()),
        "masterclass_id": masterclass_id,
        "user_id": current_user['user_id'],
        "user_name": user_name,
        "user_role": current_user['role'],
        "content": comment_text,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.masterclass_comments.insert_one(comment_doc)
    comment_doc.pop('_id', None)
    
    await db.masterclasses.update_one({"id": masterclass_id}, {"$inc": {"comments_count": 1}})
    
    return comment_doc


@api_router.get("/masterclass/{masterclass_id}/comments")
async def get_comments(masterclass_id: str, limit: int = 50):
    """Get comments for a masterclass"""
    comments = await db.masterclass_comments.find(
        {"masterclass_id": masterclass_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    return comments


@api_router.delete("/masterclass/{masterclass_id}/comments/{comment_id}")
async def delete_comment(masterclass_id: str, comment_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a comment (owner or admin)"""
    comment = await db.masterclass_comments.find_one({"id": comment_id, "masterclass_id": masterclass_id})
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment['user_id'] != current_user['user_id'] and current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    await db.masterclass_comments.delete_one({"id": comment_id})
    await db.masterclasses.update_one({"id": masterclass_id}, {"$inc": {"comments_count": -1}})
    
    return {"message": "Comment deleted"}


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
    if current_user['role'] not in ['club', 'college']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    club = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not club:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ClubProfile(**club)

@api_router.put("/club/profile", response_model=ClubProfile)
async def update_club_profile(update: ClubUpdate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'college']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.clubs.update_one({"user_id": current_user['user_id']}, {"$set": update_data})
    
    club = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    return ClubProfile(**club)

@api_router.post("/opportunities", response_model=Opportunity)
async def create_opportunity(opp: OpportunityCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'college']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
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
    if current_user['role'] not in ['club', 'college']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    opportunities = await db.opportunities.find({"club_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    return [Opportunity(**opp) for opp in opportunities]

@api_router.delete("/opportunities/{opportunity_id}")
async def delete_opportunity(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'college']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.opportunities.delete_one({"id": opportunity_id, "club_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return {"message": "Deleted"}

@api_router.get("/club/applications", response_model=List[dict])
async def get_club_applications(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'college']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
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
    if current_user['role'] not in ['club', 'college']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
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
    if current_user['role'] not in ['club', 'admin', 'federation']:
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
    if current_user['role'] not in ['club', 'college']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
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

@api_router.get("/players/recommended-list", response_model=List[PlayerProfile])
async def get_recommended_players(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'college']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
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
    if current_user['role'] not in ['club', 'college']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
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
    if current_user['role'] not in ['club', 'college']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    favorites = await db.favorites.find({"club_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    player_ids = [fav['player_id'] for fav in favorites]
    
    players = await db.players.find({"user_id": {"$in": player_ids}}, {"_id": 0}).to_list(1000)
    # Strip private info
    players = [strip_player_private_info(p) for p in players]
    return [PlayerProfile(**p) for p in players]

@api_router.delete("/favorites/{player_id}")
async def remove_favorite(player_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'college']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
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
    total_federations = await db.federations.count_documents({})
    total_agents = await db.agents.count_documents({})
    total_specialists = await db.specialists.count_documents({})
    total_applications = await db.applications.count_documents({})
    pending_players = await db.players.count_documents({"approved": False})
    pending_clubs = await db.clubs.count_documents({"approved": False})
    pending_federations = await db.federations.count_documents({"approved": False})
    pending_agents = await db.agents.count_documents({"approved": False})
    pending_specialists = await db.specialists.count_documents({"approved": False})
    
    return AdminStats(
        total_players=total_players,
        total_clubs=total_clubs,
        total_federations=total_federations,
        total_agents=total_agents,
        total_specialists=total_specialists,
        total_applications=total_applications,
        pending_approvals=pending_players + pending_clubs + pending_federations + pending_agents + pending_specialists
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


@api_router.get("/admin/federations", response_model=List[FederationProfile])
async def get_all_federations(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    federations = await db.federations.find({}, {"_id": 0}).to_list(1000)
    return [FederationProfile(**f) for f in federations]


@api_router.put("/admin/federations/{user_id}/approve")
async def approve_federation(user_id: str, approval: UserApproval, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    result = await db.federations.update_one({"user_id": user_id}, {"$set": {"approved": approval.approved}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Federation not found")
    return {"message": "Updated"}


@api_router.put("/admin/federations/{user_id}/verify")
async def verify_federation(user_id: str, current_user: dict = Depends(get_current_user)):
    """Admin verifies a federation - gives them a verified badge"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    result = await db.federations.update_one(
        {"user_id": user_id},
        {"$set": {"verified": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Federation not found")
    
    # Notify federation
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "verification",
        "title": "Federation Verified!",
        "message": "Your federation has been verified. A verified badge will now appear on your profile.",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    await sio.emit("account_approved", {
        "approved": True,
        "message": notification["message"]
    }, room=f"user_{user_id}")
    
    return {"message": "Federation verified successfully"}

@api_router.put("/admin/federations/{user_id}/unverify")
async def unverify_federation(user_id: str, current_user: dict = Depends(get_current_user)):
    """Admin removes verification from a federation"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    result = await db.federations.update_one(
        {"user_id": user_id},
        {"$set": {"verified": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Federation not found")
    return {"message": "Federation verification removed"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    await db.users.delete_one({"id": user_id})
    await db.players.delete_one({"user_id": user_id})
    await db.clubs.delete_one({"user_id": user_id})
    await db.federations.delete_one({"user_id": user_id})
    await db.agents.delete_one({"user_id": user_id})
    await db.specialists.delete_one({"user_id": user_id})
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


# ============ COLLEGE ENDPOINTS ============
@api_router.get("/college/profile", response_model=CollegeProfile)
async def get_college_profile(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'college':
        raise HTTPException(status_code=403, detail="Not a college")
    college = await db.colleges.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not college:
        raise HTTPException(status_code=404, detail="Profile not found")
    return CollegeProfile(**college)

@api_router.put("/college/profile", response_model=CollegeProfile)
async def update_college_profile(update: CollegeUpdate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'college':
        raise HTTPException(status_code=403, detail="Not a college")
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.colleges.update_one(
            {"user_id": current_user['user_id']},
            {"$set": update_data},
            upsert=True
        )
    college = await db.colleges.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not college:
        raise HTTPException(status_code=404, detail="Profile not found")
    return CollegeProfile(**college)

@api_router.get("/college/players", response_model=List[PlayerProfile])
async def get_college_players(
    position: Optional[str] = None,
    nationality: Optional[str] = None,
    level: Optional[str] = None,
    name: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != 'college':
        raise HTTPException(status_code=403, detail="Not a college")
    query = {"approved": True, "visibility": {"$in": ["public", "clubs_only", None]}}
    if position:
        query["position"] = position
    if nationality:
        query["nationality"] = nationality
    if level:
        query["playing_level"] = level
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    players = await db.players.find(query, {"_id": 0}).to_list(1000)
    players = [strip_player_private_info(p) for p in players]
    return [PlayerProfile(**p) for p in players]

# ============ FEDERATION ENDPOINTS ============
@api_router.get("/federation/profile", response_model=FederationProfile)
async def get_federation_profile(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'federation':
        raise HTTPException(status_code=403, detail="Not a federation")
    
    federation = await db.federations.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not federation:
        raise HTTPException(status_code=404, detail="Profile not found")
    return FederationProfile(**federation)


@api_router.put("/federation/profile", response_model=FederationProfile)
async def update_federation_profile(update: FederationUpdate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'federation':
        raise HTTPException(status_code=403, detail="Not a federation")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.federations.update_one(
            {"user_id": current_user['user_id']},
            {"$set": update_data}
        )
    
    federation = await db.federations.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    return FederationProfile(**federation)


@api_router.get("/federation/players", response_model=List[PlayerProfile])
async def get_federation_players(
    position: Optional[str] = None,
    nationality: Optional[str] = None,
    level: Optional[str] = None,
    name: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Federation searches for players with filters"""
    if current_user['role'] != 'federation':
        raise HTTPException(status_code=403, detail="Not a federation")
    
    query = {"approved": True}
    if position:
        query['position'] = position
    if nationality:
        # Search across all nationality fields
        query['$or'] = [
            {'nationality': nationality},
            {'nationality_1': nationality},
            {'nationality_2': nationality},
            {'nationality_3': nationality}
        ]
    if level:
        query['playing_level'] = level
    if name:
        query['name'] = {"$regex": name, "$options": "i"}
    if min_age:
        query['age'] = {"$gte": min_age}
    if max_age:
        if 'age' in query:
            query['age']['$lte'] = max_age
        else:
            query['age'] = {"$lte": max_age}
    
    players = await db.players.find(query, {"_id": 0}).to_list(1000)
    players = [strip_player_private_info(p) for p in players]
    return [PlayerProfile(**p) for p in players]


@api_router.get("/federation/recommended-players", response_model=List[PlayerProfile])
async def get_recommended_players_for_federation(current_user: dict = Depends(get_current_user)):
    """Get players recommended for this federation based on nationality match"""
    if current_user['role'] != 'federation':
        raise HTTPException(status_code=403, detail="Not a federation")
    
    federation = await db.federations.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not federation or not federation.get('country'):
        return []
    
    country = federation['country']
    
    # Find players with matching nationality
    query = {
        "approved": True,
        "$or": [
            {'nationality': country},
            {'nationality_1': country},
            {'nationality_2': country},
            {'nationality_3': country}
        ]
    }
    
    players = await db.players.find(query, {"_id": 0}).to_list(1000)
    players = [strip_player_private_info(p) for p in players]
    return [PlayerProfile(**p) for p in players]


# Federation favorites (scouting list)
@api_router.post("/federation/favorites")
async def add_federation_favorite(fav: FavoriteCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'federation':
        raise HTTPException(status_code=403, detail="Not a federation")
    
    existing = await db.federation_favorites.find_one({
        "federation_id": current_user['user_id'],
        "player_id": fav.player_id
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already in scouting list")
    
    fav_doc = {
        "id": str(uuid.uuid4()),
        "federation_id": current_user['user_id'],
        "player_id": fav.player_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.federation_favorites.insert_one(fav_doc)
    return {"message": "Added to scouting list"}


@api_router.get("/federation/favorites", response_model=List[PlayerProfile])
async def get_federation_favorites(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'federation':
        raise HTTPException(status_code=403, detail="Not a federation")
    
    favorites = await db.federation_favorites.find({"federation_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    player_ids = [fav['player_id'] for fav in favorites]
    
    players = await db.players.find({"user_id": {"$in": player_ids}}, {"_id": 0}).to_list(1000)
    players = [strip_player_private_info(p) for p in players]
    return [PlayerProfile(**p) for p in players]


@api_router.delete("/federation/favorites/{player_id}")
async def remove_federation_favorite(player_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'federation':
        raise HTTPException(status_code=403, detail="Not a federation")
    
    result = await db.federation_favorites.delete_one({"federation_id": current_user['user_id'], "player_id": player_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not in scouting list")
    return {"message": "Removed from scouting list"}


# Federation Teams (U15, U17, U20, U23, Senior)
@api_router.get("/federation/teams")
async def get_federation_teams(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'federation':
        raise HTTPException(status_code=403, detail="Not a federation")
    
    teams = await db.federation_teams.find({"federation_id": current_user['user_id']}, {"_id": 0}).to_list(100)
    return teams


@api_router.post("/federation/teams")
async def create_federation_team(team: FederationTeamCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'federation':
        raise HTTPException(status_code=403, detail="Not a federation")
    
    team_doc = {
        "id": str(uuid.uuid4()),
        "federation_id": current_user['user_id'],
        "name": team.name,
        "description": team.description,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.federation_teams.insert_one(team_doc)
    # Remove MongoDB _id before returning
    team_doc.pop('_id', None)
    return team_doc


@api_router.delete("/federation/teams/{team_id}")
async def delete_federation_team(team_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'federation':
        raise HTTPException(status_code=403, detail="Not a federation")
    
    result = await db.federation_teams.delete_one({"id": team_id, "federation_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Also remove all players from this team
    await db.federation_team_players.delete_many({"team_id": team_id})
    return {"message": "Team deleted"}


@api_router.get("/federation/teams/{team_id}/players")
async def get_federation_team_players(team_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'federation':
        raise HTTPException(status_code=403, detail="Not a federation")
    
    team = await db.federation_teams.find_one({"id": team_id, "federation_id": current_user['user_id']}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team_players = await db.federation_team_players.find({"team_id": team_id}, {"_id": 0}).to_list(1000)
    player_ids = [tp['player_id'] for tp in team_players]
    
    players = await db.players.find({"user_id": {"$in": player_ids}}, {"_id": 0}).to_list(1000)
    players = [strip_player_private_info(p) for p in players]
    
    # Add team-specific data
    result = []
    for p in players:
        team_player = next((tp for tp in team_players if tp['player_id'] == p['user_id']), None)
        result.append({
            **p,
            "added_at": team_player.get('added_at') if team_player else None,
            "notes": team_player.get('notes') if team_player else None
        })
    
    return result


@api_router.post("/federation/teams/{team_id}/players")
async def add_player_to_federation_team(
    team_id: str,
    player_data: FederationTeamPlayerAdd,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != 'federation':
        raise HTTPException(status_code=403, detail="Not a federation")
    
    team = await db.federation_teams.find_one({"id": team_id, "federation_id": current_user['user_id']}, {"_id": 0})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    player = await db.players.find_one({"user_id": player_data.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check if already in team
    existing = await db.federation_team_players.find_one({
        "team_id": team_id,
        "player_id": player_data.player_id
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Player already in this team")
    
    team_player_doc = {
        "id": str(uuid.uuid4()),
        "team_id": team_id,
        "federation_id": current_user['user_id'],
        "player_id": player_data.player_id,
        "player_name": player.get('name', 'Unknown'),
        "added_at": datetime.now(timezone.utc).isoformat(),
        "notes": player_data.notes
    }
    await db.federation_team_players.insert_one(team_player_doc)
    return {"message": "Player added to team"}


@api_router.delete("/federation/teams/{team_id}/players/{player_id}")
async def remove_player_from_federation_team(
    team_id: str,
    player_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != 'federation':
        raise HTTPException(status_code=403, detail="Not a federation")
    
    result = await db.federation_team_players.delete_one({
        "team_id": team_id,
        "federation_id": current_user['user_id'],
        "player_id": player_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Player not in team")
    return {"message": "Player removed from team"}


# ============ AGENT ENDPOINTS ============
@api_router.get("/agent/profile", response_model=AgentProfile)
async def get_agent_profile(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'agent':
        raise HTTPException(status_code=403, detail="Not an agent")
    
    agent = await db.agents.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Profile not found")
    return AgentProfile(**agent)


@api_router.put("/agent/profile", response_model=AgentProfile)
async def update_agent_profile(update: AgentUpdate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'agent':
        raise HTTPException(status_code=403, detail="Not an agent")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.agents.update_one(
            {"user_id": current_user['user_id']},
            {"$set": update_data}
        )
    
    agent = await db.agents.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    return AgentProfile(**agent)


@api_router.get("/agent/players", response_model=List[PlayerProfile])
async def get_agent_players(
    position: Optional[str] = None,
    nationality: Optional[str] = None,
    level: Optional[str] = None,
    name: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Agent searches for players with filters"""
    if current_user['role'] != 'agent':
        raise HTTPException(status_code=403, detail="Not an agent")
    
    query = {"approved": True}
    if position:
        query['position'] = position
    if nationality:
        query['$or'] = [
            {'nationality': nationality},
            {'nationality_1': nationality},
            {'nationality_2': nationality},
            {'nationality_3': nationality}
        ]
    if level:
        query['playing_level'] = level
    if name:
        query['name'] = {"$regex": name, "$options": "i"}
    if min_age:
        query['age'] = {"$gte": min_age}
    if max_age:
        if 'age' in query:
            query['age']['$lte'] = max_age
        else:
            query['age'] = {"$lte": max_age}
    
    players = await db.players.find(query, {"_id": 0}).to_list(1000)
    players = [strip_player_private_info(p) for p in players]
    return [PlayerProfile(**p) for p in players]


@api_router.get("/agent/player/{player_id}", response_model=PlayerProfile)
async def get_agent_player_detail(player_id: str, current_user: dict = Depends(get_current_user)):
    """Agent views a specific player's profile"""
    if current_user['role'] != 'agent':
        raise HTTPException(status_code=403, detail="Not an agent")
    
    player = await db.players.find_one({"user_id": player_id, "approved": True}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    player = strip_player_private_info(player)
    return PlayerProfile(**player)


# Agent favorites (watchlist)
@api_router.post("/agent/favorites")
async def add_agent_favorite(fav: FavoriteCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'agent':
        raise HTTPException(status_code=403, detail="Not an agent")
    
    existing = await db.agent_favorites.find_one({
        "agent_id": current_user['user_id'],
        "player_id": fav.player_id
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already in watchlist")
    
    fav_doc = {
        "id": str(uuid.uuid4()),
        "agent_id": current_user['user_id'],
        "player_id": fav.player_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.agent_favorites.insert_one(fav_doc)
    return {"message": "Added to watchlist"}


@api_router.get("/agent/favorites", response_model=List[PlayerProfile])
async def get_agent_favorites(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'agent':
        raise HTTPException(status_code=403, detail="Not an agent")
    
    favorites = await db.agent_favorites.find({"agent_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    player_ids = [fav['player_id'] for fav in favorites]
    
    players = await db.players.find({"user_id": {"$in": player_ids}}, {"_id": 0}).to_list(1000)
    players = [strip_player_private_info(p) for p in players]
    return [PlayerProfile(**p) for p in players]


@api_router.delete("/agent/favorites/{player_id}")
async def remove_agent_favorite(player_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'agent':
        raise HTTPException(status_code=403, detail="Not an agent")
    
    result = await db.agent_favorites.delete_one({
        "agent_id": current_user['user_id'],
        "player_id": player_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Removed from watchlist"}


@api_router.get("/agent/opportunities", response_model=List[Opportunity])
async def get_agent_opportunities(current_user: dict = Depends(get_current_user)):
    """Agent views all opportunities to match with players"""
    if current_user['role'] != 'agent':
        raise HTTPException(status_code=403, detail="Not an agent")
    
    opportunities = await db.opportunities.find({}, {"_id": 0}).to_list(1000)
    return [Opportunity(**opp) for opp in opportunities]


# Admin Agent endpoints
@api_router.get("/admin/agents", response_model=List[AgentProfile])
async def get_all_agents(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    agents = await db.agents.find({}, {"_id": 0}).to_list(1000)
    return [AgentProfile(**a) for a in agents]


@api_router.put("/admin/agents/{user_id}/approve")
async def approve_agent(user_id: str, approval: UserApproval, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    # First check if agent exists
    agent = await db.agents.find_one({"user_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    await db.agents.update_one({"user_id": user_id}, {"$set": {"approved": approval.approved}})
    return {"message": "Updated"}


@api_router.put("/admin/agents/{user_id}/verify")
async def verify_agent(user_id: str, verified: bool, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    result = await db.agents.update_one({"user_id": user_id}, {"$set": {"verified": verified}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Updated"}


# ============ SPECIALIST ENDPOINTS ============
@api_router.get("/specialist/profile", response_model=SpecialistProfile)
async def get_specialist_profile(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'specialist':
        raise HTTPException(status_code=403, detail="Not a specialist")
    
    specialist = await db.specialists.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not specialist:
        raise HTTPException(status_code=404, detail="Profile not found")
    return SpecialistProfile(**specialist)


@api_router.put("/specialist/profile", response_model=SpecialistProfile)
async def update_specialist_profile(update: SpecialistUpdate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'specialist':
        raise HTTPException(status_code=403, detail="Not a specialist")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.specialists.update_one(
            {"user_id": current_user['user_id']},
            {"$set": update_data}
        )
    
    specialist = await db.specialists.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    return SpecialistProfile(**specialist)


@api_router.get("/specialist/players", response_model=List[PlayerProfile])
async def get_specialist_players(
    position: Optional[str] = None,
    nationality: Optional[str] = None,
    level: Optional[str] = None,
    name: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Specialist searches for players to offer services"""
    if current_user['role'] != 'specialist':
        raise HTTPException(status_code=403, detail="Not a specialist")
    
    query = {"approved": True}
    if position:
        query['position'] = position
    if nationality:
        query['$or'] = [
            {'nationality': nationality},
            {'nationality_1': nationality},
            {'nationality_2': nationality},
            {'nationality_3': nationality}
        ]
    if level:
        query['playing_level'] = level
    if name:
        query['name'] = {"$regex": name, "$options": "i"}
    
    players = await db.players.find(query, {"_id": 0}).to_list(1000)
    players = [strip_player_private_info(p) for p in players]
    return [PlayerProfile(**p) for p in players]


@api_router.get("/specialist/player/{player_id}", response_model=PlayerProfile)
async def get_specialist_player_detail(player_id: str, current_user: dict = Depends(get_current_user)):
    """Specialist views a specific player's profile"""
    if current_user['role'] != 'specialist':
        raise HTTPException(status_code=403, detail="Not a specialist")
    
    player = await db.players.find_one({"user_id": player_id, "approved": True}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    player = strip_player_private_info(player)
    return PlayerProfile(**player)


# Specialist favorites (client list)
@api_router.post("/specialist/favorites")
async def add_specialist_favorite(fav: FavoriteCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'specialist':
        raise HTTPException(status_code=403, detail="Not a specialist")
    
    existing = await db.specialist_favorites.find_one({
        "specialist_id": current_user['user_id'],
        "player_id": fav.player_id
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already in client list")
    
    fav_doc = {
        "id": str(uuid.uuid4()),
        "specialist_id": current_user['user_id'],
        "player_id": fav.player_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.specialist_favorites.insert_one(fav_doc)
    return {"message": "Added to client list"}


@api_router.get("/specialist/favorites", response_model=List[PlayerProfile])
async def get_specialist_favorites(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'specialist':
        raise HTTPException(status_code=403, detail="Not a specialist")
    
    favorites = await db.specialist_favorites.find({"specialist_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    player_ids = [fav['player_id'] for fav in favorites]
    
    players = await db.players.find({"user_id": {"$in": player_ids}}, {"_id": 0}).to_list(1000)
    players = [strip_player_private_info(p) for p in players]
    return [PlayerProfile(**p) for p in players]


@api_router.delete("/specialist/favorites/{player_id}")
async def remove_specialist_favorite(player_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'specialist':
        raise HTTPException(status_code=403, detail="Not a specialist")
    
    result = await db.specialist_favorites.delete_one({
        "specialist_id": current_user['user_id'],
        "player_id": player_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Removed from client list"}


# Get specialist types and certifications
@api_router.get("/specialist/types")
async def get_specialist_types():
    """Get available specialist types and certifications"""
    return {
        "types": SPECIALIST_TYPES,
        "certifications": SPECIALIST_CERTIFICATIONS
    }


# Admin Specialist endpoints
@api_router.get("/admin/specialists", response_model=List[SpecialistProfile])
async def get_all_specialists(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    specialists = await db.specialists.find({}, {"_id": 0}).to_list(1000)
    return [SpecialistProfile(**s) for s in specialists]


@api_router.put("/admin/specialists/{user_id}/approve")
async def approve_specialist(user_id: str, approval: UserApproval, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    # First check if specialist exists
    specialist = await db.specialists.find_one({"user_id": user_id}, {"_id": 0})
    if not specialist:
        raise HTTPException(status_code=404, detail="Specialist not found")
    
    await db.specialists.update_one({"user_id": user_id}, {"$set": {"approved": approval.approved}})
    return {"message": "Updated"}


@api_router.put("/admin/specialists/{user_id}/verify")
async def verify_specialist(user_id: str, verified: bool, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    
    result = await db.specialists.update_one({"user_id": user_id}, {"$set": {"verified": verified}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Specialist not found")
    return {"message": "Updated"}


# ============ MATCH ARCHIVE ENDPOINTS ============
@api_router.get("/player/match-archive")
async def get_player_match_archive(current_user: dict = Depends(get_current_user)):
    """Player gets their match archive"""
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    matches = await db.match_archive.find({"player_id": current_user['user_id']}, {"_id": 0}).sort("match_date", -1).to_list(100)
    return matches


@api_router.post("/player/match-archive")
async def add_match_to_archive(match: MatchArchiveCreate, current_user: dict = Depends(get_current_user)):
    """Player adds a match to their archive"""
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    match_doc = {
        "id": str(uuid.uuid4()),
        "player_id": current_user['user_id'],
        "video_link": match.video_link,
        "match_date": match.match_date,
        "opponent": match.opponent,
        "competition_level": match.competition_level,
        "description": match.description,
        "position_played": match.position_played,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.match_archive.insert_one(match_doc)
    match_doc.pop('_id', None)
    return match_doc


@api_router.delete("/player/match-archive/{match_id}")
async def delete_match_from_archive(match_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    result = await db.match_archive.delete_one({"id": match_id, "player_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Match not found")
    return {"message": "Match deleted"}


@api_router.get("/players/{player_id}/match-archive")
async def get_player_match_archive_public(player_id: str, current_user: dict = Depends(get_current_user)):
    """Clubs and federations can view player match archive"""
    if current_user['role'] not in ['club', 'federation', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    matches = await db.match_archive.find({"player_id": player_id}, {"_id": 0}).sort("match_date", -1).to_list(100)
    return matches


# ============ MATCH CALENDAR ENDPOINTS ============
@api_router.get("/player/match-calendar")
async def get_player_match_calendar(current_user: dict = Depends(get_current_user)):
    """Player gets their upcoming match calendar"""
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    matches = await db.match_calendar.find({"player_id": current_user['user_id']}, {"_id": 0}).sort("match_date", 1).to_list(100)
    return matches


@api_router.post("/player/match-calendar")
async def add_match_to_calendar(match: MatchCalendarCreate, current_user: dict = Depends(get_current_user)):
    """Player adds an upcoming match to their calendar"""
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    match_doc = {
        "id": str(uuid.uuid4()),
        "player_id": current_user['user_id'],
        "match_date": match.match_date,
        "match_time": match.match_time,
        "location": match.location,
        "stadium": match.stadium,
        "opponent": match.opponent,
        "competition": match.competition,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.match_calendar.insert_one(match_doc)
    match_doc.pop('_id', None)
    return match_doc


@api_router.delete("/player/match-calendar/{match_id}")
async def delete_match_from_calendar(match_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'player':
        raise HTTPException(status_code=403, detail="Not a player")
    
    result = await db.match_calendar.delete_one({"id": match_id, "player_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Match not found")
    return {"message": "Match deleted"}


@api_router.get("/players/{player_id}/match-calendar")
async def get_player_match_calendar_public(player_id: str, current_user: dict = Depends(get_current_user)):
    """Clubs and federations can view player upcoming matches"""
    if current_user['role'] not in ['club', 'federation', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    matches = await db.match_calendar.find({"player_id": player_id}, {"_id": 0}).sort("match_date", 1).to_list(100)
    return matches


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

@api_router.get("/chat/{room_id}/messages")
async def get_chat_messages(room_id: str, before: str = None, limit: int = 50, current_user: dict = Depends(get_current_user)):
    """Get paginated messages for a chat room"""
    user_id = current_user["user_id"]
    
    # Verify user belongs to this room
    room = await db.chat_rooms.find_one({"id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    if user_id not in [room.get("player_id"), room.get("club_id")] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Build query - load messages before a given timestamp for pagination
    query = {"room_id": room_id}
    if before:
        query["timestamp"] = {"$lt": before}
    
    messages = await db.chat_messages.find(
        query, {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Reverse to get chronological order
    messages.reverse()
    
    return {
        "messages": messages,
        "has_more": len(messages) == limit
    }

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
    """Club, Agent, or Specialist creates a chat request to connect with a player"""
    role = current_user['role']
    if role not in ['club', 'agent', 'specialist']:
        raise HTTPException(status_code=403, detail="Only clubs, agents, and specialists can request chats")
    
    # Check if there's already a pending request from this requester
    existing = await db.chat_requests.find_one({
        "requester_id": current_user['user_id'],
        "player_id": request_data.player_id,
        "status": "pending"
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="A pending request already exists for this player")
    
    # Get player info
    player = await db.players.find_one({"user_id": request_data.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Get requester info based on role
    requester_name = "Unknown"
    if role == 'club':
        requester = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0})
        requester_name = requester.get('name', 'Unknown Club') if requester else 'Unknown Club'
    elif role == 'agent':
        requester = await db.agents.find_one({"user_id": current_user['user_id']}, {"_id": 0})
        requester_name = requester.get('name', 'Unknown Agent') if requester else 'Unknown Agent'
    elif role == 'specialist':
        requester = await db.specialists.find_one({"user_id": current_user['user_id']}, {"_id": 0})
        requester_name = requester.get('name', 'Unknown Specialist') if requester else 'Unknown Specialist'
    
    chat_request = {
        "id": str(uuid.uuid4()),
        "player_id": request_data.player_id,
        "requester_id": current_user['user_id'],
        "requester_type": role,
        "player_name": player.get('name', 'Unknown Player'),
        "requester_name": requester_name,
        # Legacy fields for backwards compatibility
        "club_id": current_user['user_id'] if role == 'club' else None,
        "club_name": requester_name if role == 'club' else None,
        "status": "pending",
        "message": request_data.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "responded_at": None
    }
    
    await db.chat_requests.insert_one(chat_request)
    
    # Create notification for player
    role_label = role.capitalize()
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": request_data.player_id,
        "type": "chat_request",
        "title": f"New Chat Request from {role_label}",
        "message": f"{requester_name} ({role_label}) wants to chat with you",
        "reference_id": chat_request["id"],
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Admin notification
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": "admin-001",
        "type": "chat_request",
        "title": f"New Chat Request ({role_label})",
        "message": f"{requester_name} ({role_label}) requests to chat with {player.get('name', 'Unknown Player')}",
        "reference_id": chat_request["id"],
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Chat request sent successfully", "request_id": chat_request["id"]}


@api_router.get("/chat-requests/my", response_model=List[dict])
async def get_my_chat_requests(current_user: dict = Depends(get_current_user)):
    """Get chat requests for the current user (player sees incoming, others see outgoing)"""
    user_id = current_user['user_id']
    role = current_user['role']
    
    if role == 'player':
        requests = await db.chat_requests.find({"player_id": user_id}, {"_id": 0}).to_list(100)
    elif role in ['club', 'agent', 'specialist']:
        requests = await db.chat_requests.find({"requester_id": user_id}, {"_id": 0}).to_list(100)
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
    
    # Get requester info - support both new and legacy format
    requester_name = chat_request.get('requester_name') or chat_request.get('club_name', 'Unknown')
    requester_type = chat_request.get('requester_type', 'club')
    requester_id = chat_request.get('requester_id') or chat_request.get('club_id')
    
    if response.status == 'accepted':
        # Notify admin to create the chat room
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": "admin-001",
            "type": "chat_request_accepted",
            "title": "Chat Request Accepted",
            "message": f"{player_name} accepted chat request from {requester_name} ({requester_type}). Please create the chat room.",
            "reference_id": request_id,
            "player_id": chat_request['player_id'],
            "requester_id": requester_id,
            "requester_type": requester_type,
            # Legacy fields
            "club_id": chat_request.get('club_id'),
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return {"message": "Chat request accepted. Admin will create the chat room."}
    else:
        # Notify admin about rejection
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": "admin-001",
            "type": "chat_request_rejected",
            "title": "Chat Request Rejected",
            "message": f"{player_name} rejected chat request from {requester_name} ({requester_type})",
            "reference_id": request_id,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Notify requester about rejection
        if requester_id:
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": requester_id,
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
    
    # Get all opportunities
    opportunities = await db.opportunities.find({}, {"_id": 0}).to_list(1000)
    if not opportunities:
        return {"scores": [], "message": "No opportunities available"}
    
    # Get match scores - uses manual benchmarks, Transfermarkt optional
    try:
        scores = await get_player_match_scores(db, transfermarkt_url, opportunities, player_profile=player)
        return {"scores": scores}
    except Exception as e:
        logger.error(f"Failed to calculate match scores: {str(e)}")
        return {"error": str(e), "scores": []}


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


# ============ CHATBOT ENDPOINTS ============

class ChatbotQuery(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatbotResponse(BaseModel):
    action: str
    response: Optional[str] = None
    results: Optional[List[dict]] = None
    criteria: Optional[dict] = None

# Store chatbot sessions per user
chatbot_sessions: Dict[str, SoccerMatchChatbot] = {}

@api_router.post("/chatbot/query", response_model=ChatbotResponse)
async def chatbot_query(
    query: ChatbotQuery,
    current_user: dict = Depends(get_current_user)
):
    """Process a natural language query through the AI chatbot"""
    user_id = current_user["user_id"]
    user_role = current_user["role"]
    
    # Get or create chatbot session for this user
    session_key = query.session_id or user_id
    if session_key not in chatbot_sessions:
        chatbot_sessions[session_key] = SoccerMatchChatbot(session_id=session_key)
    
    chatbot = chatbot_sessions[session_key]
    
    try:
        # Process the query through the LLM
        result = await chatbot.process_query(query.message, user_role)
        
        action = result.get("action", "conversation")
        
        if action == "search_players":
            # Execute player search
            criteria = result.get("criteria", {})
            players = await search_players_from_criteria(db, criteria)
            formatted = format_player_results(players)
            return ChatbotResponse(
                action="search_players",
                response=formatted,
                results=players[:10],
                criteria=criteria
            )
        
        elif action == "search_opportunities":
            # Execute opportunity search
            criteria = result.get("criteria", {})
            opportunities = await search_opportunities_from_criteria(db, criteria)
            formatted = format_opportunity_results(opportunities)
            return ChatbotResponse(
                action="search_opportunities",
                response=formatted,
                results=opportunities[:10],
                criteria=criteria
            )
        
        elif action == "error":
            return ChatbotResponse(
                action="error",
                response=result.get("response", "Une erreur s'est produite")
            )
        
        else:
            # Regular conversation response
            return ChatbotResponse(
                action="conversation",
                response=result.get("response", "")
            )
    
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        return ChatbotResponse(
            action="error",
            response=f"DÃ©solÃ©, une erreur s'est produite: {str(e)}"
        )


@api_router.delete("/chatbot/session")
async def clear_chatbot_session(
    current_user: dict = Depends(get_current_user)
):
    """Clear the chatbot session for the current user"""
    user_id = current_user["user_id"]
    if user_id in chatbot_sessions:
        del chatbot_sessions[user_id]
    return {"success": True, "message": "Session cleared"}


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
        
        room = await chat_room_manager.get_chat_room(room_id)
        
        if room:
            
            await sio.emit('previous_messages', {
                'messages': [m.model_dump() for m in room.messages[-50:]]
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

































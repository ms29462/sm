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
from player_evaluation import (
    PLAYER_ARCHETYPES, TECHNICAL_METRICS, TACTICAL_METRICS, PHYSICAL_METRICS, MENTAL_METRICS,
    RECOMMENDATION_LEVELS, PlayerEvaluationCreate, PlayerEvaluation, AnalystProfile, AnalystUpdate,
    MetricScore, TechnicalEvaluation, TacticalEvaluation, PhysicalEvaluation, MentalEvaluation,
    VideoReference, process_evaluation_data, get_player_evolution, generate_evaluation_pdf
)
from chat_video_manager import ChatRoomManager, VideoSessionManager, ChatMessage
from chat_requests import ChatRequest, ChatRequestCreate, ChatRequestResponse
from player_matching import (
    generate_benchmark_data, load_benchmark_data, get_player_match_scores,
    build_player_dict_from_transfermarkt_url, calculate_match_score_for_opportunity,
    AVAILABLE_LEAGUES, DEFAULT_LEAGUES
)
from subscription_plans import SUBSCRIPTION_PLANS, get_plan, get_plans_for_role, create_subscription, is_subscription_active, get_default_plan
from email_service import send_player_welcome, send_org_application_received, send_org_approved, send_analyst_invitation, send_application_status_update
from permissions import get_user_status, get_permissions, has_permission
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
# Mount static files for news images
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
    role: Literal['player', 'club', 'federation', 'agent', 'specialist', 'college', 'analyst']
    name: str
    # Player registration fields
    date_of_birth: Optional[str] = None
    residence_country: Optional[str] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    nationality_2: Optional[str] = None
    position: Optional[str] = None
    secondary_position: Optional[str] = None
    looking_for: Optional[list] = None
    playing_level: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    preferred_foot: Optional[str] = None
    highlight_video: Optional[str] = None
    full_game_videos: Optional[list] = None
    phone: Optional[str] = None
    # Club registration fields
    club_name: Optional[str] = None
    division: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    website: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    linkedin: Optional[str] = None
    rep_first_name: Optional[str] = None
    rep_last_name: Optional[str] = None
    rep_role: Optional[str] = None
    rep_email: Optional[str] = None
    rep_phone: Optional[str] = None
    country: Optional[str] = None
    league: Optional[str] = None

    # Specialist fields
    specialist_type: Optional[str] = None
    current_organization: Optional[str] = None
    org_type: Optional[str] = None
    certifications: Optional[str] = None

    # Federation fields
    federation_type: Optional[str] = None
    primary_objective: Optional[str] = None
    age_categories: Optional[list] = None
    eligible_nationalities: Optional[list] = None

    # Agent fields
    license_type: Optional[str] = None
    bio: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    licensing_authority: Optional[str] = None
    license_number: Optional[str] = None
    license_document: Optional[str] = None
    agency_name: Optional[str] = None
    agency_logo: Optional[str] = None
    experience: Optional[str] = None
    primary_market: Optional[str] = None
    regions: Optional[list] = None
    twitter: Optional[str] = None
    recruitment_priorities: Optional[list] = None
    institution_type: Optional[str] = None
    competition_level: Optional[str] = None
    athletic_program: Optional[str] = None
    team_gender: Optional[str] = None
    scholarship: Optional[str] = None

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
    # Extended fields
    residence_country: Optional[str] = None
    current_country: Optional[str] = None
    market_value: Optional[str] = None
    bio: Optional[str] = None
    date_of_birth: Optional[str] = None
    contract_status: Optional[str] = None
    looking_for: Optional[list] = None
    open_to: Optional[list] = None
    representation_status: Optional[str] = None
    agent_name: Optional[str] = None
    agency_name: Optional[str] = None
    jersey_number: Optional[str] = None
    secondary_positions: Optional[list] = None
    national_team: Optional[str] = None
    full_game_videos: Optional[list] = None
    contract_end_date: Optional[str] = None
    languages: Optional[list] = None
    profile_status: Optional[str] = None
    completion_score: Optional[int] = None


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
    model_config = ConfigDict(extra="ignore")
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
    has_baccalaureate: Optional[bool] = None
    bac_year: Optional[int] = None
    bac_grade: Optional[str] = None
    english_level: Optional[int] = None
    has_postsecondary: Optional[bool] = None
    postsecondary_start_date: Optional[str] = None
    annual_budget: Optional[str] = None
    # Missing fields
    residence_country: Optional[str] = None
    current_country: Optional[str] = None
    market_value: Optional[str] = None
    bio: Optional[str] = None
    date_of_birth: Optional[str] = None
    contract_status: Optional[str] = None
    looking_for: Optional[list] = None
    open_to: Optional[list] = None
    representation_status: Optional[str] = None
    agent_name: Optional[str] = None
    agency_name: Optional[str] = None
    jersey_number: Optional[str] = None
    secondary_positions: Optional[list] = None
    national_team: Optional[str] = None
    date_of_birth: Optional[str] = None
    full_game_videos: Optional[list] = None
    contract_end_date: Optional[str] = None
    languages: Optional[list] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    linkedin: Optional[str] = None


# ============ MATCHING PLAYER NOTIFICATIONS ============
async def notify_orgs_of_new_player(player: dict):
    """Notify organizations when a new player matches their posted opportunities"""
    try:
        position = player.get("position", "")
        playing_level = player.get("playing_level", "")
        nationality = player.get("nationality", "")

        # Find opportunities that match this player
        opportunities = await db.opportunities.find({"status": "published"}, {"_id": 0}).to_list(1000)

        notified_orgs = set()
        for opp in opportunities:
            opp_position = opp.get("position", "")
            opp_level = opp.get("league_level", "")
            club_id = opp.get("club_id", "")

            if club_id in notified_orgs:
                continue

            # Check position match
            position_match = any(
                pos.strip().lower() in opp_position.lower()
                for pos in position.split(",")
            ) if position and opp_position else False

            if position_match:
                await create_notification(
                    club_id,
                    "new_matching_player",
                    f"New player matching your opportunity: {player.get('name', 'A player')} ({position}) just joined!",
                    {
                        "player_id": player.get("user_id"),
                        "player_name": player.get("name"),
                        "position": position,
                        "playing_level": playing_level,
                        "opportunity_id": opp.get("id")
                    }
                )
                notified_orgs.add(club_id)
    except Exception as e:
        print(f"Error notifying orgs: {e}")


async def notify_federations_of_player(player: dict):
    """Notify federations about dual-national or diaspora players"""
    try:
        nationality_1 = player.get("nationality_1") or player.get("nationality", "")
        nationality_2 = player.get("nationality_2", "")
        nationality_3 = player.get("nationality_3", "")
        player_name = player.get("name", "A player")
        player_id = player.get("user_id", "")
        position = player.get("position", "")

        nationalities = [n for n in [nationality_1, nationality_2, nationality_3] if n]
        
        if len(nationalities) < 2:
            return  # Not a dual-national player

        # Find all federations
        federations = await db.federations.find({}, {"_id": 0}).to_list(1000)
        
        for fed in federations:
            fed_country = fed.get("country", "")
            fed_user_id = fed.get("user_id", "")
            if not fed_country or not fed_user_id:
                continue
            
            # Check if any nationality matches federation country
            matching_nats = [n for n in nationalities if fed_country.lower() in n.lower() or n.lower() in fed_country.lower()]
            
            if matching_nats:
                other_nats = [n for n in nationalities if n not in matching_nats]
                other_nats_str = ", ".join(other_nats)
                
                # Is diaspora (primary nationality different from federation country)
                is_diaspora = nationality_1 and fed_country.lower() not in nationality_1.lower()
                
                if is_diaspora:
                    message = f"🌍 Diaspora alert: {player_name} ({position}) holds {fed_country} nationality and plays at {player.get('playing_level', 'unknown level')}"
                else:
                    message = f"⚡ Dual-national detected: {player_name} ({position}) holds {', '.join(nationalities)} nationalities"
                
                await create_notification(
                    fed_user_id,
                    "dual_national_detected" if not is_diaspora else "diaspora_detected",
                    message,
                    {
                        "player_id": player_id,
                        "player_name": "Anonymous",  # Anonymized
                        "nationalities": nationalities,
                        "position": position,
                        "is_diaspora": is_diaspora
                    }
                )
    except Exception as e:
        print(f"Error notifying federations: {e}")

# ============ NOTIFICATION HELPER ============
async def create_notification(user_id: str, type: str, message: str, data: dict = {}):
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": type,
        "message": message,
        "data": data,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })



# ============ NEWS FEED MODELS ============
class NewsPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    author: str = "Soccer Match"
    target_roles: List[str] = ["player", "club", "federation", "college", "agent", "specialist"]
    pinned: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class NewsPostCreate(BaseModel):
    title: str
    content: str
    target_roles: List[str] = ["player", "club", "federation", "college", "agent", "specialist"]
    pinned: bool = False
    media_url: Optional[str] = None
    media_type: Optional[str] = None  # "image" or "youtube"

class NewsPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    target_roles: Optional[List[str]] = None
    pinned: Optional[bool] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None

# ============ BADGE & VERIFICATION MODELS ============
AVAILABLE_BADGES = [
    "verified_profile",
    "match_ready",
    "scout_approved",
    "professional_experience",
    "international_player",
    "university_eligible",
    "top_prospect",
    "diaspora_eligible",
    "video_verified"
]

BADGE_LABELS = {
    "verified_profile": "Verified Profile",
    "match_ready": "Match Ready",
    "scout_approved": "Scout Approved",
    "professional_experience": "Professional Experience",
    "international_player": "International Player",
    "university_eligible": "University Eligible",
    "top_prospect": "Top Prospect",
    "diaspora_eligible": "Diaspora Eligible",
    "video_verified": "Video Verified"
}

QUALITY_LEVELS = ["Bronze", "Silver", "Gold", "Elite"]

class PlayerVerification(BaseModel):
    user_id: str
    verified: bool = False
    badges: List[str] = []
    quality_level: Optional[str] = None
    quality_score: Optional[int] = None
    admin_notes: List[dict] = []
    activity_log: List[dict] = []
    updated_at: Optional[str] = None

class BadgeUpdate(BaseModel):
    badge: str
    action: Literal["add", "remove"]

class QualityUpdate(BaseModel):
    quality_level: Optional[str] = None
    quality_score: Optional[int] = None

class AdminNote(BaseModel):
    content: str

def calculate_quality_score(player: dict) -> int:
    score = 0
    if player.get("profile_picture"): score += 15
    if player.get("highlight_video"): score += 15
    if player.get("position"): score += 5
    if player.get("nationality"): score += 5
    if player.get("age"): score += 5
    if player.get("current_club"): score += 5
    if player.get("playing_level"): score += 5
    if player.get("bio"): score += 5
    if player.get("transfermarkt_url"): score += 5
    if player.get("goals") is not None: score += 5
    if player.get("assists") is not None: score += 5
    if player.get("verified"): score += 10
    if player.get("nationality_2"): score += 5
    # Full game footage
    score = min(score, 100)
    return score

# ============ RECRUITMENT PIPELINE MODELS ============
class PipelinePlayer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    org_id: str
    player_id: str
    stage: str = "New Application"
    priority: Literal["low", "medium", "high", "urgent"] = "medium"
    scout_assigned: Optional[str] = None
    internal_rating: Optional[int] = None
    notes: List[dict] = []
    tags: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PipelinePlayerAdd(BaseModel):
    player_id: str
    stage: str = "New Application"
    priority: Literal["low", "medium", "high", "urgent"] = "medium"
    opportunity_id: Optional[str] = None

class PipelinePlayerUpdate(BaseModel):
    stage: Optional[str] = None
    priority: Optional[Literal["low", "medium", "high", "urgent"]] = None
    scout_assigned: Optional[str] = None
    internal_rating: Optional[int] = None
    tags: Optional[List[str]] = None

class PipelineNote(BaseModel):
    content: str
    type: Literal["note", "scouting", "evaluation"] = "note"

# ============ SCOUTING MODELS ============
class ScoutingNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    author_id: str
    author_name: str
    content: str
    visibility: Literal["private", "group", "org"] = "private"
    shared_with: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ScoutingNoteCreate(BaseModel):
    player_id: str
    content: str
    visibility: Literal["private", "group", "org"] = "private"
    shared_with: List[str] = []

class ScoutingNoteUpdate(BaseModel):
    content: Optional[str] = None
    visibility: Optional[Literal["private", "group", "org"]] = None
    shared_with: Optional[List[str]] = None

class PostMortem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    author_id: str
    author_name: str
    match_date: str
    opponent: str
    position_played: Optional[str] = None
    overall_rating: int
    physical: int
    technical: int
    tactical: int
    mental: int
    strengths: str
    weaknesses: str
    recommendation: Literal["sign", "monitor", "reject"]
    visibility: Literal["private", "group", "org"] = "private"
    shared_with: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PostMortemCreate(BaseModel):
    player_id: str
    match_date: str
    opponent: str
    position_played: Optional[str] = None
    overall_rating: int
    physical: int
    technical: int
    tactical: int
    mental: int
    strengths: str
    weaknesses: str
    recommendation: Literal["sign", "monitor", "reject"]
    visibility: Literal["private", "group", "org"] = "private"
    shared_with: List[str] = []

class ScoutingGroup(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    org_id: str
    org_name: str
    admin_id: str
    name: str
    description: Optional[str] = None
    members: List[str] = []
    invite_token: str = Field(default_factory=lambda: str(uuid.uuid4()))
    visibility: Literal["private", "org_wide"] = "private"
    players_tracked: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ScoutingGroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    visibility: Literal["private", "org_wide"] = "private"

class GroupMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str
    author_id: str
    author_name: str
    content: str
    player_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GroupMessageCreate(BaseModel):
    content: str
    player_id: Optional[str] = None

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
    # Club registration fields
    club_name: Optional[str] = None
    division: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    website: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    linkedin: Optional[str] = None
    rep_first_name: Optional[str] = None
    rep_last_name: Optional[str] = None
    rep_role: Optional[str] = None
    rep_email: Optional[str] = None
    rep_phone: Optional[str] = None
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
    # Club registration fields
    club_name: Optional[str] = None
    division: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    website: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    linkedin: Optional[str] = None
    rep_first_name: Optional[str] = None
    rep_last_name: Optional[str] = None
    rep_role: Optional[str] = None
    rep_email: Optional[str] = None
    rep_phone: Optional[str] = None
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
    # Club registration fields
    club_name: Optional[str] = None
    division: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    website: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    linkedin: Optional[str] = None
    rep_first_name: Optional[str] = None
    rep_last_name: Optional[str] = None
    rep_role: Optional[str] = None
    rep_email: Optional[str] = None
    rep_phone: Optional[str] = None
    certifications: Optional[str] = None
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
    # Club registration fields
    club_name: Optional[str] = None
    division: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    website: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    linkedin: Optional[str] = None
    rep_first_name: Optional[str] = None
    rep_last_name: Optional[str] = None
    rep_role: Optional[str] = None
    rep_email: Optional[str] = None
    rep_phone: Optional[str] = None
    certifications: Optional[str] = None
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
    position: Optional[str] = None
    positions: Optional[List[str]] = None
    country: Optional[str] = None
    league_level: str
    custom_league: Optional[str] = None
    salary_range: Optional[str] = None
    contract_duration: Optional[str] = None
    description: str
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    deadline: Optional[str] = None
    max_applicants: Optional[int] = None
    requirements: Optional[list] = None

class Opportunity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    club_id: str
    club_name: str
    club_country: Optional[str] = None
    position: Optional[str] = None
    positions: Optional[List[str]] = None
    country: Optional[str] = None
    league_level: str
    salary_range: Optional[str] = None
    contract_duration: Optional[str] = None
    description: str
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    deadline: Optional[str] = None
    max_applicants: Optional[int] = None
    requirements: Optional[list] = None
    visibility: str = 'anonymous'
    status: Optional[str] = None
    admin_status: Optional[str] = None
    credit_cost: Optional[int] = None
    admin_notes: Optional[str] = None
    public_feedback: Optional[str] = None
    approved_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None

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
    fit_score: Optional[int] = None
    fit_reasons: Optional[List[str]] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ApplicationStatusUpdate(BaseModel):
    status: Literal['submitted', 'viewed', 'shortlisted', 'rejected', 'accepted', 'under_review', 'interested', 'interview_requested', 'offer_received']

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
            "created_at": datetime.now(timezone.utc).isoformat(),
            "date_of_birth": user.date_of_birth,
            "residence_country": user.residence_country,
            "gender": user.gender,
            "nationality": user.nationality,
            "nationality_2": user.nationality_2,
            "position": user.position,
            "secondary_position": user.secondary_position,
            "playing_level": user.playing_level,
            "height": user.height,
            "weight": user.weight,
            "preferred_foot": user.preferred_foot,
            "highlight_video": user.highlight_video,
            "full_game_videos": user.full_game_videos or [],
            "phone": user.phone,
            "profile_status": "incomplete",
        }
        await db.players.insert_one(player_doc)
        try:
            await send_player_welcome(user.email, user.name)
        except Exception as e:
            print(f"Welcome email error: {e}")
    elif user.role == 'federation':
        federation_doc = {
            "user_id": user_id,
            "name": user.name,
            "email": user.email,
            "approved": False,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "country": user.country,
            "federation_type": user.federation_type,
            "primary_objective": user.primary_objective,
            "age_categories": user.age_categories or [],
            "eligible_nationalities": user.eligible_nationalities or [],
            "logo": user.logo,
            "description": user.description,
            "website": user.website,
            "instagram": user.instagram,
            "facebook": user.facebook,
            "linkedin": user.linkedin,
            "rep_first_name": user.rep_first_name,
            "rep_last_name": user.rep_last_name,
            "rep_role": user.rep_role,
            "rep_email": user.rep_email,
            "rep_phone": user.rep_phone,
            "discovery_call_status": "Not Contacted",
        }
        await db.federations.insert_one(federation_doc)
    elif user.role == 'agent':
        agent_doc = {
            "user_id": user_id,
            "name": user.name,
            "email": user.email,
            "approved": False,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "country": user.country,
            "license_type": user.license_type,
            "licensing_authority": user.licensing_authority,
            "license_number": user.license_number,
            "license_document": user.license_document,
            "agency_name": user.agency_name,
            "agency_logo": user.agency_logo,
            "website": user.website,
            "instagram": user.instagram,
            "linkedin": user.linkedin,
            "bio": user.bio,
            "experience": user.experience,
            "primary_market": user.primary_market,
            "regions": user.regions or [],
            "phone": user.phone,
            "discovery_call_status": "Not Contacted",
        }
        await db.agents.insert_one(agent_doc)
    elif user.role == 'analyst':
        analyst_doc = {
            "user_id": user_id,
            "name": user.name,
            "email": user.email,
            "approved": False,
            "certified_analyst": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "country": user.country,
            "analyst_type": user.analyst_type,
            "experience": user.experience,
            "bio": user.bio,
            "certifications": user.certifications,
            "current_organization": user.current_organization,
            "website": user.website,
            "linkedin": user.linkedin,
            "badges": [],
        }
        await db.analysts.insert_one(analyst_doc)
    elif user.role == 'specialist':
        specialist_doc = {
            "user_id": user_id,
            "name": user.name,
            "email": user.email,
            "approved": False,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "country": user.country,
            "specialist_type": user.specialist_type,
            "experience": user.experience,
            "bio": user.bio,
            "current_organization": user.current_organization,
            "org_type": user.org_type,
            "certifications": user.certifications,
            "website": user.website,
            "instagram": user.instagram,
            "linkedin": user.linkedin,
            "facebook": user.facebook,
            "phone": user.phone,
            "discovery_call_status": "Not Contacted",
        }
        await db.specialists.insert_one(specialist_doc)
    else:  # club
        club_doc = {
            "user_id": user_id,
            "name": user.club_name or user.name,
            "email": user.email,
            "approved": False,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "country": user.country,
            "league": user.league,
            "division": user.division,
            "playing_level": user.playing_level,
            "description": user.description,
            "logo": user.logo,
            "website": user.website,
            "instagram": user.instagram,
            "facebook": user.facebook,
            "linkedin": user.linkedin,
            "rep_first_name": user.rep_first_name,
            "rep_last_name": user.rep_last_name,
            "rep_role": user.rep_role,
            "rep_email": user.rep_email,
            "rep_phone": user.rep_phone,
            "discovery_call_status": "Not Contacted",
            "recommended_tier": user.playing_level,
        }
        await db.clubs.insert_one(club_doc)
        try:
            await send_org_application_received(user.rep_email or user.email, user.club_name or user.name, "club")
        except Exception as e:
            print(f"Email error: {e}")
    
    token = create_token(user_id, user.email, user.role)
    return AuthResponse(token=token, role=user.role, user_id=user_id, email=user.email)

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get('password_hash', user.get('password', ''))):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = user.get('user_id', user.get('id'))
    
    # Check if club or college is pending review
    if user['role'] in ['club', 'college', 'agent', 'federation', 'specialist']:
        club = await db.clubs.find_one({"user_id": user_id}, {"_id": 0})
        college = await db.colleges.find_one({"user_id": user_id}, {"_id": 0}) if not club else None
        agent = await db.agents.find_one({"user_id": user_id}, {"_id": 0}) if not club and not college else None
        federation = await db.federations.find_one({"user_id": user_id}, {"_id": 0}) if not club and not college and not agent else None
        specialist = await db.specialists.find_one({"user_id": user_id}, {"_id": 0}) if not club and not college and not agent and not federation else None
        org = club or college or agent or federation or specialist
        if org and org.get('status') == 'pending' and not org.get('approved', False):
            raise HTTPException(status_code=403, detail="PENDING_REVIEW")
    
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
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None or isinstance(v, bool)}
    
    # Check if highlight_video is being updated - trigger auto analysis
    trigger_analysis = False
    if 'highlight_video' in update_data and update_data['highlight_video']:
        # Check if it's a new or changed video URL
        player = await db.players.find_one({"user_id": current_user['user_id']}, {"_id": 0})
        if player and player.get('highlight_video') != update_data['highlight_video']:
            trigger_analysis = True
    
    if update_data:
        await db.players.update_one({"user_id": current_user["user_id"]}, {"$set": update_data})
    
    # Recalculate profile completion after update
    try:
        updated_player = await db.players.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
        if updated_player:
            completion = calculate_profile_completion(updated_player)
            await db.players.update_one(
                {"user_id": current_user["user_id"]},
                {"$set": {
                    "profile_status": completion["status"],
                    "completion_score": completion["completion_score"]
                }}
            )
    except Exception as e:
        print(f"Completion calc error: {e}")
    
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
    query = {"status": "published"}
    
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
        {"id": masterclass_id, "status": "published"},
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
    
    masterclass = await db.masterclasses.find_one({"id": masterclass_id, "status": "published"})
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
        {"id": {"$in": masterclass_ids}, "status": "published"},
        {"_id": 0}
    ).to_list(100)
    
    return masterclasses


# Comments
@api_router.post("/masterclass/{masterclass_id}/comments")
async def add_comment(masterclass_id: str, content: dict, current_user: dict = Depends(get_current_user)):
    """Add a comment to a masterclass"""
    masterclass = await db.masterclasses.find_one({"id": masterclass_id, "status": "published"})
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


async def auto_close_expired_opportunities(db):
    now = datetime.now(timezone.utc).isoformat()[:10]  # YYYY-MM-DD
    await db.opportunities.update_many(
        {"deadline": {"$lt": now, "$ne": None}, "status": "open"},
        {"$set": {"status": "closed"}}
    )

@api_router.get("/opportunities", response_model=List[Opportunity])
async def get_opportunities(current_user: dict = Depends(get_current_user)):
    await auto_close_expired_opportunities(db)
    opportunities = await db.opportunities.find({"status": "published"}, {"_id": 0}).to_list(1000)
    
    # Anonymize opportunities for players
    if current_user["role"] == "player":
        opportunities = await anonymize_opportunities(opportunities, db)
    
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
    opportunities = await anonymize_opportunities(opportunities, db)
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
    
    # Check mandatory requirements
    requirements = opportunity.get("requirements", [])
    if requirements:
        player = await db.players.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
        missing_req = []
        if "highlight_video" in requirements and not player.get("highlight_video"):
            missing_req.append("Highlight Video")
        if "full_match" in requirements:
            match_archive = await db.match_archive.find_one({"player_id": current_user["user_id"]})
            if not player.get("full_game_videos") and not match_archive:
                missing_req.append("Full Match Video")
        if "profile_picture" in requirements and not player.get("profile_picture"):
            missing_req.append("Profile Photo")
        if "cv" in requirements and not player.get("cv"):
            missing_req.append("CV / Resume")
        if missing_req:
            raise HTTPException(status_code=400, detail=f"Missing required info: {', '.join(missing_req)}")
    
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
                "opportunity": opp,
                "fit_score": app.get("fit_score", None)
            })
    return result

# ============ CLUB ENDPOINTS ============
@api_router.get("/club/profile", response_model=ClubProfile)
async def get_club_profile(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'college', 'analyst', 'federation', 'agent', 'specialist']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    club = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not club:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ClubProfile(**club)

@api_router.put("/club/profile", response_model=ClubProfile)
async def update_club_profile(update: ClubUpdate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'college', 'analyst', 'federation', 'agent', 'specialist']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.clubs.update_one({"user_id": current_user['user_id']}, {"$set": update_data})
    
    club = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    return ClubProfile(**club)

@api_router.post("/opportunities", response_model=Opportunity)
async def create_opportunity(opp: OpportunityCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'college', 'analyst', 'federation', 'agent', 'specialist']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    club = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    
    opp_doc = {
        "id": str(uuid.uuid4()),
        "club_id": current_user['user_id'],
        "club_name": club.get('name', 'Unknown Club'),
        "club_country": club.get('country'),
        **opp.model_dump(),
        "status": "pending_review",
        "admin_status": "pending_review",
        "credit_cost": None,
        "admin_notes": "",
        "public_feedback": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.opportunities.insert_one(opp_doc)
    return Opportunity(**opp_doc)

@api_router.get("/club/opportunities", response_model=List[Opportunity])
async def get_club_opportunities(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'college', 'analyst', 'federation', 'agent', 'specialist']:
        raise HTTPException(status_code=403, detail="Not authorized")
    await auto_close_expired_opportunities(db)
    opportunities = await db.opportunities.find({"club_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    return [Opportunity(**opp) for opp in opportunities]

@api_router.put("/opportunities/{opportunity_id}/status")
async def update_opportunity_status(opportunity_id: str, status_update: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["club", "federation", "college"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    status = status_update.get("status")
    if status not in ["open", "closed", "filled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    await db.opportunities.update_one(
        {"id": opportunity_id, "club_id": current_user["user_id"]},
        {"$set": {"status": status}}
    )


@api_router.put("/opportunities/{opportunity_id}")
async def update_opportunity(opportunity_id: str, update: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["club", "federation", "college"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    opp = await db.opportunities.find_one({"id": opportunity_id, "club_id": current_user["user_id"]})
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    update.pop("id", None)
    update.pop("club_id", None)
    update.pop("created_at", None)
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    update["updated_by"] = current_user["user_id"]
    await db.opportunities.update_one({"id": opportunity_id}, {"$set": update})
    # Log change for admin monitoring
    await db.opportunity_changes.insert_one({
        "id": str(__import__("uuid").uuid4()),
        "opportunity_id": opportunity_id,
        "club_id": current_user["user_id"],
        "changes": update,
        "changed_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Opportunity updated"}

@api_router.get("/admin/opportunity-changes")
async def get_opportunity_changes(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    changes = await db.opportunity_changes.find({}, {"_id": 0}).sort("changed_at", -1).to_list(200)
    return changes

@api_router.delete("/opportunities/{opportunity_id}")
async def delete_opportunity(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'college', 'analyst', 'federation', 'agent', 'specialist']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.opportunities.delete_one({"id": opportunity_id, "club_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return {"message": "Deleted"}

@api_router.get("/club/applications", response_model=List[dict])
async def get_club_applications(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'college', 'analyst', 'federation', 'agent', 'specialist']:
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
    if current_user['role'] not in ['club', 'college', 'analyst', 'federation', 'agent', 'specialist']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    player_label = APPLICATION_STATUS_LABELS.get(status_update.status, status_update.status)
    result = await db.applications.update_one(
        {"id": application_id, "club_id": current_user["user_id"]},
        {"$set": {
            "status": status_update.status,
            "player_status_label": player_label,
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        "$push": {
            "status_history": {
                "status": status_update.status,
                "label": player_label,
                "changed_at": datetime.now(timezone.utc).isoformat()
            }
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Notify player of status change
    try:
        application = await db.applications.find_one({"id": application_id}, {"_id": 0})
        if application:
            status_messages = {
                "viewed": "Your application has been viewed",
                "shortlisted": "You have been shortlisted",
                "interview_requested": "An interview has been requested",
                "accepted": "Congratulations! Your application has been accepted",
                "rejected": "Your application status has been updated"
            }
            msg = status_messages.get(status_update.status, f"Your application status changed to {status_update.status}")
            await create_notification(
                application.get("player_id"),
                "application_update",
                f"📋 {msg}",
                {"application_id": application_id, "status": status_update.status}
            )
    except Exception as e:
        print(f"Notification error: {e}")
    

        if app:
            new_stage = STATUS_TO_PIPELINE_STAGE.get(status_update.status)
            AUTO_PIPELINE_STATUSES = ["interested"]
            
            if new_stage and status_update.status in AUTO_PIPELINE_STATUSES:
                existing = await db.pipeline.find_one({
                    "player_id": app["player_id"],
                    "org_id": current_user["user_id"]
                })
                
                if existing:
                    await db.pipeline.update_one(
                        {"id": existing["id"]},
                        {"$set": {"stage": new_stage, "opportunity_id": app.get("opportunity_id"), "updated_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    print("DEBUG: Updated existing pipeline entry")
                else:
                    import uuid as uuid_mod
                    pp = {
                        "id": str(uuid_mod.uuid4()),
                        "org_id": current_user["user_id"],
                        "player_id": app["player_id"],
                        "opportunity_id": app.get("opportunity_id"),
                        "stage": new_stage,
                        "priority": "medium",
                        "scout_assigned": None,
                        "internal_rating": None,
                        "notes": [],
                        "tags": [],
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.pipeline.insert_one(pp)
                    print("DEBUG: Created new pipeline entry!")
                    
                    await create_notification(
                        app["player_id"],
                        "pipeline_update",
                        "🎯 You have been added to a recruitment pipeline",
                        {"org_id": current_user["user_id"]}
                    )
    except Exception as e:
        import traceback
        print(f"Pipeline sync error: {e}")
        traceback.print_exc()
    
    # Send email notification to player
    try:
        app = await db.applications.find_one({"id": application_id}, {"_id": 0})
        if app:
            player = await db.players.find_one({"user_id": app["player_id"]}, {"_id": 0})
            if player and player.get("email"):
                await send_application_status_update(player["email"], player.get("name", "Player"), status_update.status)
    except Exception as e:
        print(f"Email error: {e}")
    return {"message": "Status updated"}

@api_router.get("/players/{player_id}/verification")
async def get_player_verification_public(player_id: str, current_user: dict = Depends(get_current_user)):
    verification = await db.verifications.find_one({"user_id": player_id}, {"_id": 0, "admin_notes": 0})
    if not verification:
        player = await db.players.find_one({"user_id": player_id}, {"_id": 0}) or {}
        return {"user_id": player_id, "verified": player.get("verified", False), "badges": [], "quality_level": None, "quality_score": calculate_quality_score(player)}
    verification.pop("admin_notes", None)
    return verification

@api_router.get("/players/{player_id}", response_model=PlayerProfile)
async def get_player_detail(player_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed player profile by user_id"""
    if current_user['role'] not in ['club', 'admin', 'federation', 'college', 'agent', 'specialist', 'analyst']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Send profile viewed notification
    if current_user["role"] in ["club", "federation", "college", "agent"] and current_user["user_id"] != player_id:
        try:
            org = await db.clubs.find_one({"user_id": current_user["user_id"]}, {"_id": 0}) or                   await db.federations.find_one({"user_id": current_user["user_id"]}, {"_id": 0}) or                   await db.colleges.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
            org_name = org.get("name", "An organization") if org else "An organization"
            await create_notification(
                player_id, "profile_viewed",
                "A " + (current_user["role"].capitalize() if current_user["role"] != "college" else "College") + " viewed your profile",
                {"viewer_id": current_user["user_id"], "viewer_role": current_user["role"]}
            )
        except Exception:
            pass

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
    has_highlights: Optional[bool] = None,
    has_full_game: Optional[bool] = None,
    badge: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    quality_level: Optional[str] = None,
    representation_status: Optional[str] = None,
    mandate_status: Optional[str] = None,
    min_quality_score: Optional[int] = None,
    national_team: Optional[str] = None,
    residence_country: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] not in ['club', 'college', 'analyst', 'federation', 'agent', 'specialist']:
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
    if has_highlights:
        query['highlight_video'] = {"$exists": True, "$not": {"$in": [None, "", "null", "undefined"]}}
    if has_full_game:
        archive_entries = await db.match_archive.distinct("player_id")
        query['user_id'] = {"$in": archive_entries}
    
    # Representation status filters
    if representation_status:
        query["representation_status"] = representation_status
    if mandate_status:
        query["mandate_status"] = mandate_status

    # Visibility filter - only show active/verified players
    query["$or"] = [
        {"profile_status": {"$in": ["active", "verified"]}},
        {"profile_status": {"$exists": False}},  # Legacy players without status
        {"highlight_video": {"$exists": True, "$ne": ""}},  # Legacy check
    ]

    # National team filter
    if national_team:
        query["national_team"] = national_team
    if residence_country:
        query["residence_country"] = residence_country

    # Min quality score filter
    if min_quality_score:
        verif_query_score = {"quality_score": {"$gte": min_quality_score}}
        score_user_ids = await db.verifications.distinct("user_id", verif_query_score)
        if "user_id" in query and "$in" in query.get("user_id", {}):
            query["user_id"]["$in"] = list(set(query["user_id"]["$in"]) & set(score_user_ids))
        else:
            existing_ids = query.get("user_id", {}).get("$in", None)
            if existing_ids:
                query["user_id"] = {"$in": list(set(existing_ids) & set(score_user_ids))}
            else:
                query["user_id"] = {"$in": score_user_ids}

    # Badge and quality level filters - lookup from verifications collection
    if badge or quality_level:
        verif_query = {}
        if badge:
            verif_query["badges"] = badge
        if quality_level:
            verif_query["quality_level"] = quality_level
        verif_user_ids = await db.verifications.distinct("user_id", verif_query)
        if "user_id" in query and "$in" in query["user_id"]:
            query["user_id"]["$in"] = list(set(query["user_id"]["$in"]) & set(verif_user_ids))
        else:
            query["user_id"] = {"$in": verif_user_ids}

    skip = (page - 1) * limit
    players = await db.players.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    # Strip private info for club users
    players = [strip_player_private_info(p) for p in players]
    return [PlayerProfile(**p) for p in players]

@api_router.get("/players/recommended-list", response_model=List[PlayerProfile])
async def get_recommended_players(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'college', 'analyst', 'federation', 'agent', 'specialist']:
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
    if current_user['role'] not in ['club', 'college', 'analyst', 'federation', 'agent', 'specialist']:
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
    if current_user['role'] not in ['club', 'college', 'analyst', 'federation', 'agent', 'specialist']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    favorites = await db.favorites.find({"club_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    player_ids = [fav['player_id'] for fav in favorites]
    
    players = await db.players.find({"user_id": {"$in": player_ids}}, {"_id": 0}).to_list(1000)
    # Strip private info
    players = [strip_player_private_info(p) for p in players]
    return [PlayerProfile(**p) for p in players]

@api_router.delete("/favorites/{player_id}")
async def remove_favorite(player_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'college', 'analyst', 'federation', 'agent', 'specialist']:
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
    # Notify matching organizations and federations when player is approved
    if approval.approved:
        player = await db.players.find_one({"user_id": user_id}, {"_id": 0})
        if player:
            await notify_orgs_of_new_player(player)
            await notify_federations_of_player(player)
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

@api_router.get("/admin/opportunities")
async def get_all_opportunities_admin(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403)
    opportunities = await db.opportunities.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Anonymize opportunities for players
    if current_user["role"] == "player":
        result = []
        for opp in opportunities:
            if opp.get("visibility", "anonymous") != "public":
                # Build anonymous label using club's playing level
                org_id = opp.get("club_id")
                club_profile = await db.clubs.find_one({"user_id": org_id}, {"_id": 0}) if org_id else None
                college_profile = await db.colleges.find_one({"user_id": org_id}, {"_id": 0}) if (org_id and not club_profile) else None
                country = opp.get("club_country", "")
                if college_profile:
                    anon_label = f"College{(' (' + country + ')') if country else ''}"
                elif club_profile:
                    level = club_profile.get("playing_level", "") or club_profile.get("league_level", "")
                    level_map = {
                        "Professional": "Professional",
                        "Semi-Professional": "Semi-Professional",
                        "Amateur": "Amateur",
                        "University/College": "College",
                    }
                    clean_level = level_map.get(level, level)
                    level_label = f"{clean_level} Club" if clean_level else "Club"
                    anon_label = f"{level_label}{(' (' + country + ')') if country else ''}"
                else:
                    anon_label = f"Club{(' (' + country + ')') if country else ''}"
                opp["club_name"] = anon_label
                opp["club_id"] = "anonymous"
                opp.pop("club_logo", None)
                opp.pop("club_website", None)
                opp.pop("club_email", None)
                opp.pop("club_phone", None)
                opp.pop("club_city", None)
            result.append(opp)
        return [Opportunity(**opp) for opp in result]
    
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
    skip = (page - 1) * limit
    players = await db.players.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
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
    
    skip = (page - 1) * limit
    players = await db.players.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
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
    
    skip = (page - 1) * limit
    players = await db.players.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
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
    
    skip = (page - 1) * limit
    players = await db.players.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
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
    
    opportunities = await db.opportunities.find({"status": "published"}, {"_id": 0}).to_list(1000)
    
    # Anonymize opportunities for players
    if current_user["role"] == "player":
        result = []
        for opp in opportunities:
            if opp.get("visibility", "anonymous") != "public":
                # Build anonymous label using club's playing level
                org_id = opp.get("club_id")
                club_profile = await db.clubs.find_one({"user_id": org_id}, {"_id": 0}) if org_id else None
                college_profile = await db.colleges.find_one({"user_id": org_id}, {"_id": 0}) if (org_id and not club_profile) else None
                country = opp.get("club_country", "")
                if college_profile:
                    anon_label = f"College{(' (' + country + ')') if country else ''}"
                elif club_profile:
                    level = club_profile.get("playing_level", "") or club_profile.get("league_level", "")
                    level_map = {
                        "Professional": "Professional",
                        "Semi-Professional": "Semi-Professional",
                        "Amateur": "Amateur",
                        "University/College": "College",
                    }
                    clean_level = level_map.get(level, level)
                    level_label = f"{clean_level} Club" if clean_level else "Club"
                    anon_label = f"{level_label}{(' (' + country + ')') if country else ''}"
                else:
                    anon_label = f"Club{(' (' + country + ')') if country else ''}"
                opp["club_name"] = anon_label
                opp["club_id"] = "anonymous"
                opp.pop("club_logo", None)
                opp.pop("club_website", None)
                opp.pop("club_email", None)
                opp.pop("club_phone", None)
                opp.pop("club_city", None)
            result.append(opp)
        return [Opportunity(**opp) for opp in result]
    
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
    
    skip = (page - 1) * limit
    players = await db.players.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
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
    result = []
    for s in specialists:
        if isinstance(s.get("certifications"), list):
            s["certifications"] = ", ".join(s["certifications"]) if s["certifications"] else None
        result.append(SpecialistProfile(**s))
    return result


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
    if current_user['role'] not in ['club', 'federation', 'admin', 'college', 'agent', 'specialist', 'analyst']:
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
    
    # Get player and org info (club, specialist, agent, federation, college, analyst)
    player = await db.players.find_one({"user_id": player_id}, {"_id": 0})
    club = (
        await db.clubs.find_one({"user_id": club_id}, {"_id": 0}) or
        await db.specialists.find_one({"user_id": club_id}, {"_id": 0}) or
        await db.agents.find_one({"user_id": club_id}, {"_id": 0}) or
        await db.federations.find_one({"user_id": club_id}, {"_id": 0}) or
        await db.colleges.find_one({"user_id": club_id}, {"_id": 0}) or
        await db.analysts.find_one({"user_id": club_id}, {"_id": 0}) or
        await db.users.find_one({"user_id": club_id}, {"_id": 0})
    )
    
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
    
    # Get player and org info (club, specialist, agent, federation, college, analyst)
    player = await db.players.find_one({"user_id": player_id}, {"_id": 0})
    club = (
        await db.clubs.find_one({"user_id": club_id}, {"_id": 0}) or
        await db.specialists.find_one({"user_id": club_id}, {"_id": 0}) or
        await db.agents.find_one({"user_id": club_id}, {"_id": 0}) or
        await db.federations.find_one({"user_id": club_id}, {"_id": 0}) or
        await db.colleges.find_one({"user_id": club_id}, {"_id": 0}) or
        await db.analysts.find_one({"user_id": club_id}, {"_id": 0}) or
        await db.users.find_one({"user_id": club_id}, {"_id": 0})
    )
    
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
    else:
        # club, specialist, agent, federation, college, analyst all use club_id
        my_rooms = [r for r in rooms if r.club_id == user_id]
    
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
    opportunities = await db.opportunities.find({"status": "published"}, {"_id": 0}).to_list(1000)
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


# ============ SCOUTING ENDPOINTS ============

# --- Scouting Notes ---
@api_router.post("/scouting/notes", response_model=ScoutingNote)
async def create_scouting_note(note: ScoutingNoteCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'federation', 'college', 'agent']:
        raise HTTPException(status_code=403, detail="Not authorized")
    org = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0}) or           await db.federations.find_one({"user_id": current_user['user_id']}, {"_id": 0}) or           await db.colleges.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    author_name = org.get("name", current_user.get("email", "Unknown")) if org else current_user.get("email", "Unknown")
    note_doc = {
        "id": str(uuid.uuid4()),
        "player_id": note.player_id,
        "author_id": current_user['user_id'],
        "author_name": author_name,
        "content": note.content,
        "visibility": note.visibility,
        "shared_with": note.shared_with,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.scouting_notes.insert_one(note_doc)
    return ScoutingNote(**note_doc)

@api_router.get("/scouting/notes/{player_id}")
async def get_scouting_notes(player_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'federation', 'college', 'agent']:
        raise HTTPException(status_code=403, detail="Not authorized")
    notes = await db.scouting_notes.find({
        "player_id": player_id,
        "$or": [
            {"author_id": current_user['user_id']},
            {"visibility": "org"},
            {"shared_with": current_user['user_id']}
        ]
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notes

@api_router.put("/scouting/notes/{note_id}")
async def update_scouting_note(note_id: str, update: ScoutingNoteUpdate, current_user: dict = Depends(get_current_user)):
    note = await db.scouting_notes.find_one({"id": note_id, "author_id": current_user['user_id']})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.scouting_notes.update_one({"id": note_id}, {"$set": update_data})
    return {"message": "Updated"}

@api_router.delete("/scouting/notes/{note_id}")
async def delete_scouting_note(note_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.scouting_notes.delete_one({"id": note_id, "author_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Deleted"}

# --- Post Mortems ---
@api_router.post("/scouting/post-mortems", response_model=PostMortem)
async def create_post_mortem(pm: PostMortemCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'federation', 'college', 'agent']:
        raise HTTPException(status_code=403, detail="Not authorized")
    org = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0}) or           await db.federations.find_one({"user_id": current_user['user_id']}, {"_id": 0}) or           await db.colleges.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    author_name = org.get("name", current_user.get("email", "Unknown")) if org else current_user.get("email", "Unknown")
    pm_doc = {
        "id": str(uuid.uuid4()),
        "author_id": current_user['user_id'],
        "author_name": author_name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        **pm.model_dump()
    }
    await db.post_mortems.insert_one(pm_doc)
    return PostMortem(**pm_doc)

@api_router.get("/scouting/post-mortems/{player_id}")
async def get_post_mortems(player_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'federation', 'college', 'agent']:
        raise HTTPException(status_code=403, detail="Not authorized")
    pms = await db.post_mortems.find({
        "player_id": player_id,
        "$or": [
            {"author_id": current_user['user_id']},
            {"visibility": "org"},
            {"shared_with": current_user['user_id']}
        ]
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    return pms

@api_router.put("/scouting/post-mortems/{pm_id}")
async def update_post_mortem(pm_id: str, update: dict, current_user: dict = Depends(get_current_user)):
    pm = await db.post_mortems.find_one({"id": pm_id, "author_id": current_user['user_id']})
    if not pm:
        raise HTTPException(status_code=404, detail="Report not found")
    update.pop("id", None)
    update.pop("author_id", None)
    update.pop("created_at", None)
    await db.post_mortems.update_one({"id": pm_id}, {"$set": update})
    return {"message": "Updated"}

@api_router.delete("/scouting/post-mortems/{pm_id}")
async def delete_post_mortem(pm_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.post_mortems.delete_one({"id": pm_id, "author_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post-mortem not found")
    return {"message": "Deleted"}

# --- Player Tracking ---
@api_router.post("/scouting/track/{player_id}")
async def track_player(player_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'federation', 'college', 'agent']:
        raise HTTPException(status_code=403, detail="Not authorized")
    existing = await db.tracked_players.find_one({"tracker_id": current_user['user_id'], "player_id": player_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already tracking this player")
    await db.tracked_players.insert_one({
        "id": str(uuid.uuid4()),
        "tracker_id": current_user['user_id'],
        "player_id": player_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Player tracked"}

@api_router.delete("/scouting/track/{player_id}")
async def untrack_player(player_id: str, current_user: dict = Depends(get_current_user)):
    await db.tracked_players.delete_one({"tracker_id": current_user['user_id'], "player_id": player_id})
    return {"message": "Player untracked"}

@api_router.get("/scouting/tracked")
async def get_tracked_players(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'federation', 'college', 'agent']:
        raise HTTPException(status_code=403, detail="Not authorized")
    tracked = await db.tracked_players.find({"tracker_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    player_ids = [t["player_id"] for t in tracked]
    players = await db.players.find({"user_id": {"$in": player_ids}, "approved": True}, {"_id": 0}).to_list(1000)
    players = [strip_player_private_info(p) for p in players]
    return players

# --- Scouting Groups ---
@api_router.post("/scouting/groups")
async def create_scouting_group(group: ScoutingGroupCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'federation', 'college']:
        raise HTTPException(status_code=403, detail="Not authorized")
    org = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0}) or           await db.federations.find_one({"user_id": current_user['user_id']}, {"_id": 0}) or           await db.colleges.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    org_name = org.get("name", "Unknown") if org else "Unknown"
    group_doc = {
        "id": str(uuid.uuid4()),
        "org_id": current_user['user_id'],
        "org_name": org_name,
        "admin_id": current_user['user_id'],
        "name": group.name,
        "description": group.description,
        "members": [current_user['user_id']],
        "invite_token": str(uuid.uuid4()),
        "visibility": group.visibility,
        "players_tracked": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.scouting_groups.insert_one(group_doc)
    return group_doc

@api_router.get("/scouting/groups")
async def get_scouting_groups(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['club', 'federation', 'college']:
        raise HTTPException(status_code=403, detail="Not authorized")
    groups = await db.scouting_groups.find({
        "$or": [
            {"org_id": current_user['user_id']},
            {"members": current_user['user_id']}
        ]
    }, {"_id": 0}).to_list(100)
    return groups

@api_router.get("/scouting/groups/join/{invite_token}")
async def join_scouting_group(invite_token: str, current_user: dict = Depends(get_current_user)):
    group = await db.scouting_groups.find_one({"invite_token": invite_token}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite link")
    if current_user['user_id'] not in group['members']:
        await db.scouting_groups.update_one(
            {"invite_token": invite_token},
            {"$push": {"members": current_user['user_id']}}
        )
    return {"message": "Joined group", "group_id": group['id']}

@api_router.delete("/scouting/groups/{group_id}")
async def delete_scouting_group(group_id: str, current_user: dict = Depends(get_current_user)):
    group = await db.scouting_groups.find_one({"id": group_id, "admin_id": current_user['user_id']})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found or not authorized")
    await db.scouting_groups.delete_one({"id": group_id})
    await db.group_messages.delete_many({"group_id": group_id})
    return {"message": "Group deleted"}

@api_router.post("/scouting/groups/{group_id}/track/{player_id}")
async def group_track_player(group_id: str, player_id: str, current_user: dict = Depends(get_current_user)):
    group = await db.scouting_groups.find_one({"id": group_id, "members": current_user['user_id']})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    await db.scouting_groups.update_one({"id": group_id}, {"$addToSet": {"players_tracked": player_id}})
    return {"message": "Player added to group watchlist"}

# --- Group Messages ---
@api_router.post("/scouting/groups/{group_id}/messages")
async def send_group_message(group_id: str, msg: GroupMessageCreate, current_user: dict = Depends(get_current_user)):
    group = await db.scouting_groups.find_one({"id": group_id, "members": current_user['user_id']})
    if not group:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    org = await db.clubs.find_one({"user_id": current_user['user_id']}, {"_id": 0}) or           await db.federations.find_one({"user_id": current_user['user_id']}, {"_id": 0}) or           await db.colleges.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    author_name = org.get("name", current_user.get("email", "Unknown")) if org else current_user.get("email", "Unknown")
    msg_doc = {
        "id": str(uuid.uuid4()),
        "group_id": group_id,
        "author_id": current_user['user_id'],
        "author_name": author_name,
        "content": msg.content,
        "player_id": msg.player_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.group_messages.insert_one(msg_doc)
    return msg_doc

@api_router.get("/scouting/groups/{group_id}/messages")
async def get_group_messages(group_id: str, current_user: dict = Depends(get_current_user)):
    group = await db.scouting_groups.find_one({"id": group_id, "members": current_user['user_id']})
    if not group:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    messages = await db.group_messages.find({"group_id": group_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return messages



# ============ RECRUITMENT PIPELINE ENDPOINTS ============

PIPELINE_STAGES = [
    "New Application", "Under Review", "Video Reviewed", "Live Scouting",
    "Shortlisted", "Contacted", "Trial Planned", "Negotiation", "Signed", "Rejected"
]

@api_router.get("/pipeline")
async def get_pipeline(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["club", "federation", "college"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    pipeline_players = await db.pipeline.find({"org_id": current_user["user_id"]}, {"_id": 0}).to_list(1000)
    # Enrich with player data
    result = []
    for pp in pipeline_players:
        player = await db.players.find_one({"user_id": pp["player_id"]}, {"_id": 0})
        if player:
            pp["player"] = strip_player_private_info(player)
        # Auto-link to opportunity if not set
        if not pp.get("opportunity_id"):
            app = await db.applications.find_one({
                "player_id": pp["player_id"],
                "$or": [{"club_id": current_user["user_id"]}, {"org_id": current_user["user_id"]}]
            }, {"_id": 0})
            if app and app.get("opportunity_id"):
                pp["opportunity_id"] = app["opportunity_id"]
                await db.pipeline.update_one(
                    {"id": pp["id"]},
                    {"$set": {"opportunity_id": app["opportunity_id"]}}
                )
        result.append(pp)
    return result

@api_router.post("/pipeline")
async def add_to_pipeline(data: PipelinePlayerAdd, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["club", "federation", "college"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    existing = await db.pipeline.find_one({"org_id": current_user["user_id"], "player_id": data.player_id})
    if existing:
        raise HTTPException(status_code=400, detail="Player already in pipeline")
    pp = {
        "id": str(uuid.uuid4()),
        "org_id": current_user["user_id"],
        "player_id": data.player_id,
        "stage": data.stage,
        "priority": data.priority,
        "opportunity_id": data.opportunity_id,
        "scout_assigned": None,
        "internal_rating": None,
        "notes": [],
        "tags": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.pipeline.insert_one(pp)
    
    # Notify player they were added to pipeline
    try:
        await create_notification(
            data.player_id,
            "pipeline",
            "🎯 You have been added to a recruitment pipeline",
            {"org_id": current_user["user_id"]}
        )
    except Exception as e:
        print(f"Notification error: {e}")
    
    return pp

@api_router.put("/pipeline/{pipeline_id}")
async def update_pipeline_player(pipeline_id: str, update: PipelinePlayerUpdate, current_user: dict = Depends(get_current_user)):
    pp = await db.pipeline.find_one({"id": pipeline_id, "org_id": current_user["user_id"]})
    if not pp:
        raise HTTPException(status_code=404, detail="Not found")
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.pipeline.update_one({"id": pipeline_id}, {"$set": update_data})
    # Notify player of stage change
    if update.stage and update.stage != pp.get("stage"):
        org = await db.clubs.find_one({"user_id": current_user["user_id"]}, {"_id": 0}) or               await db.federations.find_one({"user_id": current_user["user_id"]}, {"_id": 0}) or               await db.colleges.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
        org_name = org.get("name", "An organization") if org else "An organization"
        stage_messages = {
            "Shortlisted": f"{org_name} has shortlisted you!",
            "Contacted": f"{org_name} wants to contact you",
            "Trial Planned": f"{org_name} is planning a trial for you!",
            "Negotiation": f"{org_name} has moved you to negotiation stage!",
            "Signed": f"Congratulations! {org_name} has signed you!",
            "Rejected": f"{org_name} has updated your application status"
        }
        if update.stage in stage_messages:
            await create_notification(
                pp["player_id"],
                "pipeline_update",
                stage_messages[update.stage],
                {"stage": update.stage, "org_id": current_user["user_id"]}
            )
        
        # Sync application status with pipeline stage
        stage_key = update.stage.lower().replace(" ", "_")
        new_status = PIPELINE_STAGE_TO_STATUS.get(stage_key)
        player_label = PIPELINE_STAGE_PLAYER_LABELS.get(stage_key)
        
        if new_status:
            # Find and update the application
            await db.applications.update_many(
                {"player_id": pp["player_id"], "club_id": current_user["user_id"]},
                {"$set": {
                    "status": new_status,
                    "player_status_label": player_label,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                },
                "$push": {
                    "status_history": {
                        "status": new_status,
                        "label": player_label,
                        "pipeline_stage": update.stage,
                        "changed_at": datetime.now(timezone.utc).isoformat()
                    }
                }}
            )
            
            # Notify player of application status change
            if player_label:
                await create_notification(
                    pp["player_id"],
                    "application_update",
                    f"📋 {player_label}",
                    {"status": new_status, "label": player_label}
                )
    
    return {"message": "Updated"}

@api_router.delete("/pipeline/{pipeline_id}")
async def remove_from_pipeline(pipeline_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.pipeline.delete_one({"id": pipeline_id, "org_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Removed"}

@api_router.post("/pipeline/{pipeline_id}/notes")
async def add_pipeline_note(pipeline_id: str, note: PipelineNote, current_user: dict = Depends(get_current_user)):
    pp = await db.pipeline.find_one({"id": pipeline_id, "org_id": current_user["user_id"]})
    if not pp:
        raise HTTPException(status_code=404, detail="Not found")
    note_doc = {
        "id": str(uuid.uuid4()),
        "content": note.content,
        "type": note.type,
        "author_id": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.pipeline.update_one(
        {"id": pipeline_id},
        {"$push": {"notes": note_doc}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return note_doc

@api_router.get("/pipeline/stages")
async def get_pipeline_stages():
    return PIPELINE_STAGES


# ============ TRIAL INVITATION ============
class TrialInvitation(BaseModel):
    player_id: str
    trial_date: str
    location: str
    message: Optional[str] = None

@api_router.post("/trial-invitation")
async def send_trial_invitation(invite: TrialInvitation, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["club", "federation", "college"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    org = await db.clubs.find_one({"user_id": current_user["user_id"]}, {"_id": 0}) or           await db.federations.find_one({"user_id": current_user["user_id"]}, {"_id": 0}) or           await db.colleges.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    org_name = org.get("name", "An organization") if org else "An organization"
    
    invitation = {
        "id": str(uuid.uuid4()),
        "org_id": current_user["user_id"],
        "org_name": org_name,
        "player_id": invite.player_id,
        "trial_date": invite.trial_date,
        "location": invite.location,
        "message": invite.message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.trial_invitations.insert_one(invitation)
    
    # Notify player
    await create_notification(
        invite.player_id,
        "trial_invitation",
        f"🏆 You have received a trial invitation for {invite.trial_date} at {invite.location}!",
        {"invitation_id": invitation["id"], "org_name": org_name, "trial_date": invite.trial_date, "location": invite.location}
    )
    return {"message": "Trial invitation sent!", "id": invitation["id"]}

@api_router.get("/trial-invitations/my")
async def get_my_trial_invitations(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "player":
        invites = await db.trial_invitations.find({"player_id": current_user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    else:
        invites = await db.trial_invitations.find({"org_id": current_user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return invites

@api_router.put("/trial-invitations/{invite_id}/respond")
async def respond_to_trial(invite_id: str, response: dict, current_user: dict = Depends(get_current_user)):
    invite = await db.trial_invitations.find_one({"id": invite_id, "player_id": current_user["user_id"]})
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")
    status = response.get("status")
    await db.trial_invitations.update_one({"id": invite_id}, {"$set": {"status": status}})
    # Notify org
    player = await db.players.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    player_name = player.get("name", "A player") if player else "A player"
    await create_notification(
        invite["org_id"],
        "trial_response",
        f"A player {'accepted' if status == 'accepted' else 'declined'} your trial invitation",
        {"invite_id": invite_id, "player_id": current_user["user_id"], "status": status}
    )
    return {"message": "Response sent"}


@api_router.get("/admin/colleges")
async def get_all_colleges(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    # Colleges are stored in clubs collection with role=college in users
    college_users = await db.users.find({"role": "college"}, {"_id": 0}).to_list(1000)
    college_ids = [u["user_id"] for u in college_users]
    colleges = await db.clubs.find({"user_id": {"$in": college_ids}}, {"_id": 0}).to_list(1000)
    # Add email from users
    for college in colleges:
        user = next((u for u in college_users if u["user_id"] == college["user_id"]), None)
        if user:
            college["email"] = user.get("email", "")
    return colleges

@api_router.put("/admin/colleges/{user_id}/approve")
async def approve_college(user_id: str, approval: UserApproval, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    result = await db.clubs.update_one({"user_id": user_id}, {"$set": {"approved": approval.approved}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="College not found")
    # Notify college account
    await create_notification(
        user_id,
        "account_approved",
        "Your college account has been approved! You can now access all features." if approval.approved else "Your college account has been reviewed.",
        {"approved": approval.approved}
    )
    return {"message": "Updated"}


# ============ BADGE & VERIFICATION ENDPOINTS ============

@api_router.get("/admin/players/{user_id}/verification")
async def get_player_verification(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    player = await db.players.find_one({"user_id": user_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    verification = await db.verifications.find_one({"user_id": user_id}, {"_id": 0})
    if not verification:
        verification = {"user_id": user_id, "verified": player.get("verified", False), "badges": [], "quality_level": None, "quality_score": calculate_quality_score(player), "admin_notes": [], "activity_log": []}
    else:
        if not verification.get("quality_score"):
            verification["quality_score"] = calculate_quality_score(player)
    return {**player, **verification}

@api_router.put("/admin/players/{user_id}/verify")
async def toggle_verification(user_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    verified = data.get("verified", False)
    await db.players.update_one({"user_id": user_id}, {"$set": {"verified": verified}})
    log_entry = {"action": "verification_granted" if verified else "verification_revoked", "admin": current_user["user_id"], "timestamp": datetime.now(timezone.utc).isoformat()}
    await db.verifications.update_one({"user_id": user_id}, {"$set": {"verified": verified, "updated_at": datetime.now(timezone.utc).isoformat()}, "$push": {"activity_log": log_entry}}, upsert=True)
    await create_notification(user_id, "verification_update", "Your profile has been verified by Soccer Match!" if verified else "Your verification status has been updated.", {"verified": verified})
    return {"message": "Updated"}

@api_router.put("/admin/players/{user_id}/badges")
async def update_badge(user_id: str, data: BadgeUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    if data.badge not in AVAILABLE_BADGES:
        raise HTTPException(status_code=400, detail="Invalid badge")
    if data.action == "add":
        op = {"$addToSet": {"badges": data.badge}}
        action_label = f"badge_added:{data.badge}"
    else:
        op = {"$pull": {"badges": data.badge}}
        action_label = f"badge_removed:{data.badge}"
    log_entry = {"action": action_label, "admin": current_user["user_id"], "timestamp": datetime.now(timezone.utc).isoformat()}
    op["$set"] = {"updated_at": datetime.now(timezone.utc).isoformat()}
    op["$push"] = {"activity_log": log_entry}
    await db.verifications.update_one({"user_id": user_id}, op, upsert=True)
    return {"message": "Badge updated"}

@api_router.put("/admin/players/{user_id}/quality")
async def update_quality(user_id: str, data: QualityUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.quality_level is not None:
        if data.quality_level not in QUALITY_LEVELS and data.quality_level != "":
            raise HTTPException(status_code=400, detail="Invalid quality level")
        update["quality_level"] = data.quality_level
    if data.quality_score is not None:
        update["quality_score"] = max(0, min(100, data.quality_score))
    log_entry = {"action": f"quality_updated:{data.quality_level or ''}:{data.quality_score or ''}", "admin": current_user["user_id"], "timestamp": datetime.now(timezone.utc).isoformat()}
    await db.verifications.update_one({"user_id": user_id}, {"$set": update, "$push": {"activity_log": log_entry}}, upsert=True)
    return {"message": "Quality updated"}

@api_router.post("/admin/players/{user_id}/notes")
async def add_admin_note(user_id: str, note: AdminNote, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    note_doc = {"id": str(uuid.uuid4()), "content": note.content, "admin": current_user["user_id"], "created_at": datetime.now(timezone.utc).isoformat()}
    await db.verifications.update_one({"user_id": user_id}, {"$push": {"admin_notes": note_doc}}, upsert=True)
    return note_doc

@api_router.get("/player/verification")
async def get_my_verification(current_user: dict = Depends(get_current_user)):
    verification = await db.verifications.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not verification:
        player = await db.players.find_one({"user_id": current_user["user_id"]}, {"_id": 0}) or {}
        return {"user_id": current_user["user_id"], "verified": player.get("verified", False), "badges": [], "quality_level": None, "quality_score": calculate_quality_score(player)}
    return verification




# ============ NEWS FEED ENDPOINTS ============

@api_router.post("/admin/news")
async def create_news_post(post: NewsPostCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    news_doc = {
        "id": str(uuid.uuid4()),
        "title": post.title,
        "content": post.content,
        "author": "Soccer Match",
        "target_roles": post.target_roles,
        "pinned": post.pinned,
        "media_url": post.media_url,
        "media_type": post.media_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.news.insert_one(news_doc)
    # Notify users in background (don't await to avoid timeout)
    try:
        users = await db.users.find({"role": {"$in": post.target_roles}}, {"_id": 0}).to_list(1000)
        for user in users[:100]:  # Limit to 100 notifications at a time
            await create_notification(
                user["user_id"],
                "news",
                f"📰 {post.title}",
                {"news_id": news_doc["id"]}
            )
    except Exception as e:
        print(f"Notification error: {e}")
    return news_doc

@api_router.get("/admin/news")
async def get_all_news(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    posts = await db.news.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return posts


@api_router.post("/admin/news/upload-image")
async def upload_news_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    import base64, uuid as uuid_module
    contents = await file.read()
    # Limit to 2MB
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 2MB")
    b64 = base64.b64encode(contents).decode("utf-8")
    media_type = file.content_type
    data_url = f"data:{media_type};base64,{b64}"
    # Store in db
    img_doc = {"id": str(uuid_module.uuid4()), "data_url": data_url, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.news_images.insert_one(img_doc)
    return {"url": data_url}

@api_router.put("/admin/news/{news_id}")
async def update_news_post(news_id: str, update: NewsPostUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    await db.news.update_one({"id": news_id}, {"$set": update_data})
    return {"message": "Updated"}

@api_router.delete("/admin/news/{news_id}")
async def delete_news_post(news_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.news.delete_one({"id": news_id})
    return {"message": "Deleted"}

@api_router.put("/admin/news/{news_id}/pin")
async def toggle_pin_news(news_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    post = await db.news.find_one({"id": news_id})
    if not post:
        raise HTTPException(status_code=404, detail="Not found")
    await db.news.update_one({"id": news_id}, {"$set": {"pinned": not post.get("pinned", False)}})
    return {"message": "Updated"}

@api_router.get("/news")
async def get_news_feed(current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    posts = await db.news.find(
        {"target_roles": role},
        {"_id": 0}
    ).sort([("pinned", -1), ("created_at", -1)]).to_list(50)
    return posts


# ============ ANALYST ENDPOINTS ============
@api_router.get("/analyst/profile")
async def get_analyst_profile(current_user: dict = Depends(get_current_user)):
    """Get current analyst's profile"""
    if current_user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    analyst = await db.analysts.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not analyst:
        raise HTTPException(status_code=404, detail="Analyst profile not found")
    return analyst


@api_router.put("/analyst/profile")
async def update_analyst_profile(
    update: AnalystUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update analyst profile"""
    if current_user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.analysts.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": update_data}
        )
    
    analyst = await db.analysts.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    return analyst


@api_router.get("/analyst/stats")
async def get_analyst_stats(current_user: dict = Depends(get_current_user)):
    """Get analyst's evaluation statistics"""
    if current_user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    evaluations = await db.player_evaluations.find(
        {"analyst_id": current_user["user_id"]}
    ).to_list(1000)
    
    total_evaluations = len(evaluations)
    players_evaluated = len(set(e.get("player_id") for e in evaluations))
    
    # Recommendations breakdown
    recommendations = {}
    for e in evaluations:
        rec = e.get("recommendation", "unknown")
        recommendations[rec] = recommendations.get(rec, 0) + 1
    
    return {
        "total_evaluations": total_evaluations,
        "players_evaluated": players_evaluated,
        "recommendations_breakdown": recommendations
    }


# --- Player Evaluation Endpoints ---

@api_router.get("/evaluation/archetypes")
async def get_archetypes():
    """Get all available player archetypes"""
    return PLAYER_ARCHETYPES


@api_router.get("/evaluation/metrics")
async def get_metrics():
    """Get all evaluation metrics"""
    return {
        "technical": TECHNICAL_METRICS,
        "tactical": TACTICAL_METRICS,
        "physical": PHYSICAL_METRICS,
        "mental": MENTAL_METRICS,
        "recommendation_levels": RECOMMENDATION_LEVELS
    }


@api_router.get("/evaluation/players")
async def get_players_for_evaluation(
    current_user: dict = Depends(get_current_user)
):
    """Get list of players available for evaluation"""
    players = await db.players.find(
        {},
        {"_id": 0, "user_id": 1, "first_name": 1, "last_name": 1, "name": 1, 
         "position": 1, "nationality": 1, "nationality_2": 1, "date_of_birth": 1,
         "current_club": 1, "profile_picture": 1}
    ).to_list(500)
    
    # Enrich with evaluation count
    for player in players:
        eval_count = await db.player_evaluations.count_documents({"player_id": player.get("user_id")})
        player["evaluations_count"] = eval_count
    
    return players


@api_router.post("/evaluation/create")
async def create_evaluation(
    evaluation_data: PlayerEvaluationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new player evaluation"""
    if current_user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Only analysts can create evaluations")
    
    # Get analyst name
    analyst = await db.analysts.find_one({"user_id": current_user["user_id"]})
    if not analyst:
        raise HTTPException(status_code=404, detail="Analyst profile not found")
    
    if not analyst.get("approved", False):
        raise HTTPException(status_code=403, detail="Analyst account not yet approved")
    
    # Check if player exists
    player = await db.players.find_one({"user_id": evaluation_data.player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Process evaluation data
    evaluation = process_evaluation_data(
        evaluation_data, 
        current_user["user_id"], 
        analyst.get("name", "Unknown Analyst")
    )
    
    # Store in database
    eval_doc = evaluation.model_dump()
    await db.player_evaluations.insert_one(eval_doc)
    
    # Update analyst evaluation count
    await db.analysts.update_one(
        {"user_id": current_user["user_id"]},
        {"$inc": {"evaluations_count": 1}}
    )
    
    # Remove MongoDB _id
    eval_doc.pop("_id", None)
    return eval_doc


@api_router.get("/evaluation/{evaluation_id}")
async def get_evaluation(
    evaluation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific evaluation by ID"""
    evaluation = await db.player_evaluations.find_one({"id": evaluation_id}, {"_id": 0})
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return evaluation


@api_router.put("/evaluation/{evaluation_id}")
async def update_evaluation(
    evaluation_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing evaluation (only by the creator)"""
    evaluation = await db.player_evaluations.find_one({"id": evaluation_id})
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    if evaluation.get("analyst_id") != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only the creator can modify this evaluation")
    
    # Update fields
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.player_evaluations.update_one(
        {"id": evaluation_id},
        {"$set": update_data}
    )
    
    updated = await db.player_evaluations.find_one({"id": evaluation_id}, {"_id": 0})
    return updated


@api_router.delete("/evaluation/{evaluation_id}")
async def delete_evaluation(
    evaluation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an evaluation"""
    evaluation = await db.player_evaluations.find_one({"id": evaluation_id})
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    if evaluation.get("analyst_id") != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this evaluation")
    
    await db.player_evaluations.delete_one({"id": evaluation_id})
    
    # Decrement analyst count
    await db.analysts.update_one(
        {"user_id": evaluation.get("analyst_id")},
        {"$inc": {"evaluations_count": -1}}
    )
    
    return {"success": True, "message": "Evaluation deleted"}


@api_router.get("/evaluation/{evaluation_id}/export-pdf")
async def export_evaluation_pdf(
    evaluation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Export evaluation as PDF"""
    from fastapi.responses import Response
    
    evaluation = await db.player_evaluations.find_one({"id": evaluation_id})
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    # Get player info
    player = await db.players.find_one({"user_id": evaluation.get("player_id")})
    if not player:
        player = {"name": "Unknown Player"}
    
    try:
        pdf_bytes = generate_evaluation_pdf(evaluation, player)
        
        player_name = f"{player.get('first_name', '')}_{player.get('last_name', '')}".strip() or player.get('name', 'player')
        player_name = player_name.replace(' ', '_')
        filename = f"evaluation_{player_name}_{evaluation.get('match_date', 'report')}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


# --- Player Evaluations Access (for other roles) ---

@api_router.get("/player/{player_id}/evaluations")
async def get_player_evaluations(
    player_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all evaluations for a specific player"""
    evaluations = await db.player_evaluations.find(
        {"player_id": player_id},
        {"_id": 0}
    ).sort("match_date", -1).to_list(100)
    
    return evaluations


@api_router.get("/player/{player_id}/evolution")
async def get_player_evolution_data(
    player_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get player's evolution/progression over time"""
    evaluations = await db.player_evaluations.find(
        {"player_id": player_id},
        {"_id": 0}
    ).to_list(100)
    
    evolution = get_player_evolution(evaluations)
    return evolution


@api_router.get("/player/{player_id}/dashboard")
async def get_player_dashboard(
    player_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get complete player dashboard data"""
    # Get player info
    player = await db.players.find_one({"user_id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Get all evaluations
    evaluations = await db.player_evaluations.find(
        {"player_id": player_id},
        {"_id": 0}
    ).sort("match_date", -1).to_list(100)
    
    # Get most recent evaluation
    latest_evaluation = evaluations[0] if evaluations else None
    
    # Get evolution data
    evolution = get_player_evolution(evaluations)
    
    # Calculate aggregate scores if multiple evaluations
    if len(evaluations) > 1:
        avg_scores = {
            "technical": round(sum(e.get("technical_score", 0) for e in evaluations) / len(evaluations), 1),
            "tactical": round(sum(e.get("tactical_score", 0) for e in evaluations) / len(evaluations), 1),
            "physical": round(sum(e.get("physical_score", 0) for e in evaluations) / len(evaluations), 1),
            "mental": round(sum(e.get("mental_score", 0) for e in evaluations) / len(evaluations), 1),
            "attacking": round(sum(e.get("attacking_score", 0) for e in evaluations) / len(evaluations), 1),
            "defending": round(sum(e.get("defending_score", 0) for e in evaluations) / len(evaluations), 1),
        }
    elif latest_evaluation:
        avg_scores = {
            "technical": latest_evaluation.get("technical_score", 0),
            "tactical": latest_evaluation.get("tactical_score", 0),
            "physical": latest_evaluation.get("physical_score", 0),
            "mental": latest_evaluation.get("mental_score", 0),
            "attacking": latest_evaluation.get("attacking_score", 0),
            "defending": latest_evaluation.get("defending_score", 0),
        }
    else:
        avg_scores = None
    
    # Aggregate archetypes
    all_archetypes = []
    for e in evaluations:
        all_archetypes.extend(e.get("archetypes", []))
    unique_archetypes = list(set(all_archetypes))
    
    # Aggregate strengths/weaknesses
    all_strengths = []
    all_weaknesses = []
    for e in evaluations:
        all_strengths.extend(e.get("top_strengths", []))
        all_weaknesses.extend(e.get("development_areas", []))
    
    # Count frequencies
    from collections import Counter
    top_strengths = [s for s, _ in Counter(all_strengths).most_common(5)]
    top_weaknesses = [w for w, _ in Counter(all_weaknesses).most_common(3)]
    
    return {
        "player": player,
        "evaluations_count": len(evaluations),
        "latest_evaluation": latest_evaluation,
        "average_scores": avg_scores,
        "archetypes": unique_archetypes,
        "top_strengths": top_strengths,
        "development_areas": top_weaknesses,
        "evolution": evolution,
        "all_evaluations": evaluations
    }


# --- Analyst's Evaluations ---

@api_router.get("/analyst/evaluations")
async def get_analyst_evaluations(
    current_user: dict = Depends(get_current_user)
):
    """Get all evaluations created by the current analyst"""
    if current_user["role"] != "analyst":
        raise HTTPException(status_code=403, detail="Analyst access required")
    
    evaluations = await db.player_evaluations.find(
        {"analyst_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrich with player names
    for eval in evaluations:
        player = await db.players.find_one({"user_id": eval.get("player_id")}, {"_id": 0, "first_name": 1, "last_name": 1, "name": 1})
        if player:
            eval["player_name"] = f"{player.get('first_name', '')} {player.get('last_name', '')}".strip() or player.get('name', 'Unknown')
        else:
            eval["player_name"] = "Unknown Player"
    
    return evaluations


# --- Admin Analyst Management ---

@api_router.get("/admin/analysts")
async def get_all_analysts(current_user: dict = Depends(get_current_user)):
    """Get all analysts (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    analysts = await db.analysts.find({}, {"_id": 0}).to_list(1000)
    return analysts


@api_router.put("/admin/analysts/{user_id}/approve")
async def approve_analyst(
    user_id: str,
    approved: bool,
    current_user: dict = Depends(get_current_user)
):
    """Approve or reject an analyst"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.analysts.update_one(
        {"user_id": user_id},
        {"$set": {"approved": approved}}
    )
    return {"success": True, "approved": approved}


@api_router.delete("/admin/analysts/{user_id}")
async def delete_analyst(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    await db.analysts.delete_one({"user_id": user_id})
    await db.users.delete_one({"user_id": user_id})
    return {"success": True}

@api_router.put("/admin/analysts/{user_id}/verify")
async def verify_analyst(
    user_id: str,
    verified: bool,
    current_user: dict = Depends(get_current_user)
):
    """Verify an analyst's credentials"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.analysts.update_one(
        {"user_id": user_id},
        {"$set": {"verified": verified}}
    )
    return {"success": True, "verified": verified}


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




@api_router.get("/admin/fix-analyst-profiles")
async def fix_analyst_profiles():
    analysts = await db.users.find({"role": "analyst"}).to_list(100)
    fixed = 0
    for user in analysts:
        uid = str(user.get("user_id") or user.get("_id", ""))
        existing = await db.analysts.find_one({"user_id": uid})
        if not existing:
            await db.analysts.insert_one({
                "user_id": uid,
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "approved": True,
                "verified": False,
                "evaluations_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            fixed += 1
        else:
            await db.analysts.update_one({"user_id": uid}, {"$set": {"approved": True}})
    return {"fixed": fixed, "total": len(analysts)}


@api_router.get("/admin/fix-analyst/{user_id}")
async def fix_single_analyst(user_id: str):
    existing = await db.analysts.find_one({"user_id": user_id})
    if existing:
        await db.analysts.update_one({"user_id": user_id}, {"$set": {"approved": True}})
        return {"status": "updated", "user_id": user_id}
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        # Try with string _id
        user = {"user_id": user_id, "name": "Analyst", "email": "analyst@analyst.com"}
    await db.analysts.insert_one({
        "user_id": user_id,
        "name": user.get("name", "Analyst"),
        "email": user.get("email", ""),
        "approved": True,
        "verified": False,
        "evaluations_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"status": "created", "user_id": user_id}


# ============ DUPLICATE DETECTION ENDPOINTS ============

def calculate_similarity(p1: dict, p2: dict) -> dict:
    score = 0
    reasons = []
    risk_factors = []
    
    # High risk checks
    if p1.get("phone") and p1.get("phone") == p2.get("phone"):
        score += 40; reasons.append("Same phone number"); risk_factors.append("high")
    if p1.get("email") and p1.get("email") == p2.get("email"):
        score += 40; reasons.append("Same email address"); risk_factors.append("high")
    if p1.get("date_of_birth") and p1.get("date_of_birth") == p2.get("date_of_birth"):
        score += 20; reasons.append("Same date of birth"); risk_factors.append("high")
    
    # Medium risk checks
    if p1.get("profile_picture") and p1.get("profile_picture") == p2.get("profile_picture"):
        score += 25; reasons.append("Same profile photo"); risk_factors.append("medium")
    if p1.get("nationality") and p1.get("nationality") == p2.get("nationality") and p1.get("position") == p2.get("position"):
        score += 10; reasons.append("Same nationality and position"); risk_factors.append("medium")
    if p1.get("height") and p1.get("height") == p2.get("height") and p1.get("weight") == p2.get("weight"):
        score += 10; reasons.append("Same height and weight"); risk_factors.append("medium")
    
    # Name similarity
    name1 = (p1.get("name") or "").lower().strip()
    name2 = (p2.get("name") or "").lower().strip()
    if name1 and name2:
        if name1 == name2:
            score += 30; reasons.append("Identical name"); risk_factors.append("high")
        else:
            # Check partial name match
            parts1 = set(name1.split())
            parts2 = set(name2.split())
            common = parts1 & parts2
            if len(common) >= 2:
                score += 15; reasons.append("Similar name"); risk_factors.append("medium")
            elif len(common) == 1 and len(parts1) > 1:
                score += 5; reasons.append("Partial name match"); risk_factors.append("low")
    
    # Birth year match
    dob1 = p1.get("date_of_birth", "")
    dob2 = p2.get("date_of_birth", "")
    if dob1 and dob2 and dob1 != dob2 and dob1[:4] == dob2[:4]:
        score += 8; reasons.append("Same birth year"); risk_factors.append("medium")
    
    # Determine risk level
    if "high" in risk_factors:
        risk = "high"
    elif "medium" in risk_factors:
        risk = "medium"
    else:
        risk = "low"
    
    return {
        "score": min(score, 100),
        "reasons": reasons,
        "risk": risk
    }

@api_router.get("/admin/duplicates")
async def get_duplicate_profiles(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    players = await db.players.find({}, {"_id": 0}).to_list(1000)
    duplicates = []
    
    for i in range(len(players)):
        for j in range(i + 1, len(players)):
            sim = calculate_similarity(players[i], players[j])
            if sim["score"] >= 20:
                duplicates.append({
                    "id": f"{players[i]['user_id']}_{players[j]['user_id']}",
                    "player1": {
                        "user_id": players[i].get("user_id"),
                        "name": players[i].get("name"),
                        "nationality": players[i].get("nationality"),
                        "position": players[i].get("position"),
                        "date_of_birth": players[i].get("date_of_birth"),
                        "profile_picture": players[i].get("profile_picture"),
                        "created_at": players[i].get("created_at"),
                        "verified": players[i].get("verified", False),
                        "email": players[i].get("email"),
                        "phone": players[i].get("phone"),
                        "height": players[i].get("height"),
                        "weight": players[i].get("weight"),
                        "current_club": players[i].get("current_club"),
                        "playing_level": players[i].get("playing_level"),
                    },
                    "player2": {
                        "user_id": players[j].get("user_id"),
                        "name": players[j].get("name"),
                        "nationality": players[j].get("nationality"),
                        "position": players[j].get("position"),
                        "date_of_birth": players[j].get("date_of_birth"),
                        "profile_picture": players[j].get("profile_picture"),
                        "created_at": players[j].get("created_at"),
                        "verified": players[j].get("verified", False),
                        "email": players[j].get("email"),
                        "phone": players[j].get("phone"),
                        "height": players[j].get("height"),
                        "weight": players[j].get("weight"),
                        "current_club": players[j].get("current_club"),
                        "playing_level": players[j].get("playing_level"),
                    },
                    "similarity_score": sim["score"],
                    "risk": sim["risk"],
                    "reasons": sim["reasons"],
                })
    
    # Sort by score descending
    duplicates.sort(key=lambda x: x["similarity_score"], reverse=True)
    return duplicates[:100]  # Return top 100

@api_router.post("/admin/duplicates/{duplicate_id}/action")
async def handle_duplicate_action(
    duplicate_id: str,
    action: dict,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    action_type = action.get("action")  # dismiss, mark_duplicate, mark_legitimate, add_note
    note = action.get("note", "")
    
    await db.duplicate_actions.update_one(
        {"duplicate_id": duplicate_id},
        {"$set": {
            "duplicate_id": duplicate_id,
            "action": action_type,
            "note": note,
            "admin_id": current_user["user_id"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"success": True}

@api_router.get("/admin/duplicates/{duplicate_id}/action")
async def get_duplicate_action(duplicate_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    action = await db.duplicate_actions.find_one({"duplicate_id": duplicate_id}, {"_id": 0})
    return action or {}



fastapi_app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "https://www.soccer-match.org",
        "https://soccer-match.org",
        "http://localhost:3000",
        "*"
    ],
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
    sender_role = data.get('sender_role', 'unknown')
    message_text = data.get('message')
    
    if room_id and sender_id and message_text:
        message = ChatMessage(
            id=str(uuid.uuid4()),
            room_id=room_id,
            sender_id=sender_id,
            sender_name=sender_name,
            sender_role=sender_role,
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



# Pipeline stage to application status mapping
STATUS_TO_PIPELINE_STAGE = {
    "submitted": "scouting",
    "under_review": "scouting",
    "interested": "scouting",
    "rejected": "rejected",
}

APPLICATION_STATUS_LABELS = {
    "submitted": "Application Submitted",
    "under_review": "Under Review",
    "interested": "Selected for Evaluation",
    "rejected": "Not Selected",
}

PIPELINE_STAGE_TO_STATUS = {
    "scouting": "under_review",
    "video_analysis": "under_review",
    "interview": "under_review",
    "trial_scheduled": "under_review",
    "contract_discussion": "under_review",
    "offer_sent": "interested",
    "signed": "interested",
    "rejected": "rejected",
}

PIPELINE_STAGE_PLAYER_LABELS = {
    "scouting": "Under Evaluation",
    "video_analysis": "Video Analysis",
    "interview": "Interview Scheduled",
    "trial_scheduled": "Trial Scheduled",
    "contract_discussion": "Contract Discussion",
    "offer_sent": "Offer Received",
    "signed": "Signed",
    "rejected": "Not Selected",
}

PIPELINE_STAGE_TO_PLAYER_STATUS_OLD = {
    "new": "Application Received",
    "under_review": "Profile Under Review",
    "interview": "Trial or Interview Scheduled",
    "trial": "Trial or Interview Scheduled",
    "shortlisted": "Shortlisted",
    "offer_sent": "Offer Received",
    "rejected": "Application Unsuccessful",
    "signed": "Successfully Signed",
}


def calculate_profile_completion(player: dict) -> dict:
    """Calculate profile completion score and status"""
    fields = {
        # Identity (20%)
        "date_of_birth": 5,
        "nationality": 5,
        "profile_picture": 10,
        # Football info (20%)
        "position": 10,
        "preferred_foot": 5,
        "playing_level": 5,
        # Physical (10%)
        "height": 5,
        "weight": 5,
        # Current situation (15%)
        "current_club": 5,
        "current_country": 5,
        "residence_country": 5,
        # Media (20%)
        "highlight_video": 20,
        # Availability (15%)
        "contract_status": 5,
        "looking_for": 5,
        "bio": 5,
    }
    
    score = 0
    completed = []
    missing = []
    
    for field, weight in fields.items():
        val = player.get(field)
        if val and str(val).strip():
            score += weight
            completed.append(field)
        else:
            missing.append(field)
    
    score = min(score, 100)
    
    # Determine status
    required_for_visibility = ["profile_picture", "nationality", "position", "playing_level", "highlight_video"]
    is_visible = all(player.get(f) for f in required_for_visibility)
    
    if score == 0:
        status = "draft"
    elif not is_visible:
        status = "incomplete"
    else:
        status = "active"
    
    # Quality level
    if score >= 95:
        quality = "Elite"
    elif score >= 90:
        quality = "Gold"
    elif score >= 75:
        quality = "Silver"
    elif score >= 50:
        quality = "Bronze"
    else:
        quality = None
    
    return {
        "completion_score": score,
        "status": status,
        "quality_level": quality,
        "is_visible": is_visible,
        "missing_fields": missing,
        "completed_fields": completed
    }



LEAGUE_CATEGORY_MAP = {
    # Professional leagues
    "Premier League": "Professional",
    "La Liga": "Professional",
    "Bundesliga": "Professional",
    "Serie A": "Professional",
    "Ligue 1": "Professional",
    "Eredivisie": "Professional",
    "Primeira Liga": "Professional",
    "Pro League": "Professional",
    "Saudi Pro League": "Professional",
    "J1 League": "Professional",
    "MLS": "Professional",
    "Brasileirao": "Professional",
    "Primera Division": "Professional",
    "Colombian Primera": "Professional",
    "Egyptian Premier": "Professional",
    "South African PSL": "Professional",
    "CPL": "Professional",
    "Liga MX": "Professional",
    # Semi-Professional
    "Championship": "Semi-Professional",
    "League One": "Semi-Professional",
    "League Two": "Semi-Professional",
    "USL Championship": "Semi-Professional",
    "USL League One": "Semi-Professional",
    "National League": "Semi-Professional",
    "Challenger Pro League": "Semi-Professional",
    "Botola Pro": "Semi-Professional",
    "National": "Semi-Professional",
    "National 2": "Semi-Professional",
    "Ligue 2": "Semi-Professional",
    "Ligue 1 Quebec": "Semi-Professional",
    "Ligue 1 Québec": "Semi-Professional",
    "PLSQ": "Semi-Professional",
    "LSEQ": "Semi-Professional",
    "RSEQ": "Semi-Professional",
    # College/University
    "NCAA Division I": "College",
    "NCAA Division II": "College",
    "NCAA Division III": "College",
    "NAIA": "College",
    "NJCAA": "College",
    "U SPORTS": "College",
    "CCAA": "College",
    # Amateur
    "Semi-Professional": "Semi-Professional",
    "Amateur": "Amateur",
    "National League": "Amateur",
}

def get_org_category(playing_level: str, league_level: str = "") -> str:
    # Check league level first
    if league_level and league_level in LEAGUE_CATEGORY_MAP:
        return LEAGUE_CATEGORY_MAP[league_level]
    # Fall back to playing level
    level_map = {
        "Professional": "Professional",
        "Semi-Professional": "Semi-Professional", 
        "Amateur": "Amateur",
        "University/College": "College",
    }
    return level_map.get(playing_level, playing_level or "Club")

async def anonymize_opportunities(opportunities: list, db) -> list:
    result = []
    for opp in opportunities:
        if opp.get("visibility", "anonymous") != "public":
            org_id = opp.get("club_id")
            club_profile = await db.clubs.find_one({"user_id": org_id}, {"_id": 0}) if org_id else None
            college_profile = await db.colleges.find_one({"user_id": org_id}, {"_id": 0}) if (org_id and not club_profile) else None
            country = opp.get("club_country", "")
            if college_profile:
                anon_label = f"College{(' (' + country + ')') if country else ''}"
            elif club_profile:
                level = club_profile.get("playing_level", "") or club_profile.get("league_level", "")
                league_level = opp.get("league_level", "")
                # Use opportunity league level to determine category
                category = LEAGUE_CATEGORY_MAP.get(league_level, "")
                if not category and club_profile:
                    category = get_org_category(club_profile.get("playing_level", ""), league_level)
                if category == "College":
                    level_label = "College"
                elif category:
                    level_label = f"{category} Club"
                else:
                    level_label = "Club"
                anon_label = f"{level_label}{(' (' + country + ')') if country else ''}"
            else:
                anon_label = f"Club{(' (' + country + ')') if country else ''}"
            opp["club_name"] = anon_label
            opp["club_id"] = "anonymous"
        result.append(opp)
    return result

# ============ AGENT REPRESENTATION ENDPOINTS ============

@api_router.get("/player/agent-representation")
async def get_agent_representation(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "player":
        raise HTTPException(status_code=403, detail="Player only")
    data = await db.agent_representation.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    return data or {"user_id": current_user["user_id"], "representation_status": None}

@api_router.put("/player/agent-representation")
async def update_agent_representation(data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "player":
        raise HTTPException(status_code=403, detail="Player only")
    data["user_id"] = current_user["user_id"]
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.agent_representation.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": data},
        upsert=True
    )
    # Also update player profile with representation_status
    await db.players.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"representation_status": data.get("representation_status"), "mandate_status": data.get("mandate_status")}}
    )
    return {"success": True}

@api_router.get("/players/{player_id}/agent-representation")
async def get_player_agent_representation(player_id: str, current_user: dict = Depends(get_current_user)):
    data = await db.agent_representation.find_one({"user_id": player_id}, {"_id": 0})
    if not data:
        return {"user_id": player_id, "representation_status": None}
    # Privacy: hide agent contact details unless admin or player allows
    if current_user["role"] != "admin" and current_user["user_id"] != player_id:
        if not data.get("allow_contact_sharing", False):
            data.pop("agent_email", None)
            data.pop("agent_phone", None)
            data.pop("agent_name", None)
            data.pop("agency_name", None)
    return data

@api_router.put("/admin/players/{user_id}/agent-representation")
async def admin_update_agent_representation(user_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    data["user_id"] = user_id
    data["admin_updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.agent_representation.update_one(
        {"user_id": user_id},
        {"$set": data},
        upsert=True
    )
    if "representation_status" in data:
        await db.players.update_one(
            {"user_id": user_id},
            {"$set": {"representation_status": data.get("representation_status"), "mandate_status": data.get("mandate_status")}}
        )
    return {"success": True}


@api_router.post("/chat-requests/{request_id}/deletion-request")
async def request_chat_deletion(request_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "player":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Store deletion request
    deletion_doc = {
        "id": str(uuid.uuid4()),
        "request_id": request_id,
        "requester_id": current_user["user_id"],
        "requester_role": current_user["role"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_deletion_requests.insert_one(deletion_doc)
    
    # Notify admin
    await create_notification(
        "admin-001",
        "deletion_request",
        f"Organization requests deletion of chat request {request_id}",
        {"request_id": request_id, "requester_id": current_user["user_id"]}
    )
    
    return {"success": True, "message": "Deletion request sent to admin"}

@api_router.get("/admin/fix-pipeline-stages")
async def fix_pipeline_stages(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    result = await db.pipeline.update_many(
        {"stage": {"$in": ["scouting", "submitted", "viewed", "shortlisted", "interview_requested", "accepted", "rejected_old"]}},
        {"$set": {"stage": "New Application"}}
    )
    return {"fixed": result.modified_count}


@api_router.get("/player/completion")
async def get_profile_completion(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "player":
        raise HTTPException(status_code=403, detail="Player only")
    player = await db.players.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not player:
        return {"completion_score": 0, "status": "draft", "missing_fields": [], "is_visible": False}
    completion = calculate_profile_completion(player)
    # Update player status in DB
    await db.players.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {
            "profile_status": completion["status"],
            "completion_score": completion["completion_score"]
        }}
    )
    return completion


@api_router.delete("/admin/clubs/{club_id}")
async def delete_club(club_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    await db.clubs.delete_one({"user_id": club_id})
    await db.users.delete_one({"id": club_id})
    return {"message": "Club deleted"}

@api_router.get("/admin/club-applications")
async def get_club_applications(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    clubs = await db.clubs.find({"status": "pending"}, {"_id": 0}).to_list(1000)
    # Also include all clubs for admin review
    all_clubs = await db.clubs.find({}, {"_id": 0}).to_list(1000)
    return all_clubs

@api_router.put("/admin/club-applications/{club_id}")
async def update_club_application(club_id: str, update: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    update.pop("_id", None)
    await db.clubs.update_one({"user_id": club_id}, {"$set": update})
    # Send approval email if approved
    if update.get("approved") and update.get("status") == "approved":
        try:
            club = await db.clubs.find_one({"user_id": club_id}, {"_id": 0})
            if club:
                email = club.get("rep_email") or club.get("email")
                name = club.get("name", "")
                await send_org_approved(email, name, "club")
        except Exception as e:
            print(f"Email error: {e}")
    return {"message": "Updated"}


@api_router.post("/admin/invite-analyst")
async def invite_analyst(data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    email = data.get("email")
    name = data.get("name")
    if not email or not name:
        raise HTTPException(status_code=400, detail="Name and email required")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    import secrets
    activation_token = secrets.token_urlsafe(32)
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": "",
        "role": "analyst",
        "status": "invited",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    analyst_doc = {
        "user_id": user_id,
        "name": name,
        "email": email,
        "approved": False,
        "certified_analyst": False,
        "status": "invited",
        "activation_token": activation_token,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "country": data.get("country", ""),
        "analyst_type": data.get("analyst_type", ""),
        "experience": data.get("experience", ""),
        "bio": data.get("bio", ""),
        "certifications": data.get("certifications", ""),
        "current_organization": data.get("current_organization", ""),
        "website": data.get("website", ""),
        "linkedin": data.get("linkedin", ""),
        "badges": [],
    }
    await db.analysts.insert_one(analyst_doc)
    activation_link = f"http://localhost:3000/analyst/activate/{activation_token}"
    # Send invitation email
    try:
        await send_analyst_invitation(email, name, activation_link)
    except Exception as e:
        print(f"Email error: {e}")
    return {"message": "Analyst invited", "activation_link": activation_link, "token": activation_token}

@api_router.post("/analyst/activate/{token}")
async def activate_analyst(token: str, data: dict):
    password = data.get("password")
    if not password or len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    analyst = await db.analysts.find_one({"activation_token": token}, {"_id": 0})
    if not analyst:
        raise HTTPException(status_code=404, detail="Invalid or expired activation link")
    if analyst.get("status") == "active":
        raise HTTPException(status_code=400, detail="Account already activated")
    hashed = hash_password(password)
    await db.users.update_one({"id": analyst["user_id"]}, {"$set": {"password_hash": hashed, "status": "active"}})
    await db.analysts.update_one(
        {"activation_token": token},
        {"$set": {
            "status": "active",
            "approved": True,
            "certified_analyst": True,
            "activated_at": datetime.now(timezone.utc).isoformat(),
            "badges": ["soccer_match_certified_analyst"],
            "activation_token": None
        }}
    )
    login_token = create_token(analyst["user_id"], analyst["email"], "analyst")
    return AuthResponse(token=login_token, role="analyst", user_id=analyst["user_id"], email=analyst["email"])


@api_router.get("/my-permissions")
async def get_my_permissions(current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    user_id = current_user["user_id"]
    
    # Get user data based on role
    user_data = {}
    if role == "player":
        player = await db.players.find_one({"user_id": user_id}, {"_id": 0})
        user_data = player or {}
    elif role in ["club"]:
        club = await db.clubs.find_one({"user_id": user_id}, {"_id": 0})
        user_data = club or {}
    elif role == "college":
        college = await db.colleges.find_one({"user_id": user_id}, {"_id": 0})
        if not college:
            college = await db.clubs.find_one({"user_id": user_id}, {"_id": 0})
        user_data = college or {}
    elif role == "federation":
        fed = await db.federations.find_one({"user_id": user_id}, {"_id": 0})
        user_data = fed or {}
    elif role == "agent":
        agent = await db.agents.find_one({"user_id": user_id}, {"_id": 0})
        user_data = agent or {}
    elif role == "specialist":
        spec = await db.specialists.find_one({"user_id": user_id}, {"_id": 0})
        user_data = spec or {}
    elif role == "analyst":
        analyst = await db.analysts.find_one({"user_id": user_id}, {"_id": 0})
        user_data = analyst or {}
    
    # Get subscription
    subscription = await db.subscriptions.find_one({"user_id": user_id}, {"_id": 0})
    
    # Check if subscription is active
    from subscription_plans import is_subscription_active, get_plan
    sub_active = subscription and is_subscription_active(subscription)
    
    status = get_user_status(role, user_data)
    
    # Override status if premium subscription active
    if sub_active:
        plan_id = subscription.get("plan_id", "")
        if plan_id == "player_premium":
            status = "premium"
    
    permissions = get_permissions(role, status)
    
    return {
        "role": role,
        "status": status,
        "permissions": permissions,
        "is_premium": user_data.get("is_premium", False),
    }


# ============ SUBSCRIPTION ENDPOINTS ============

@api_router.get("/subscription/plans")
async def get_subscription_plans(current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    plans = get_plans_for_role(role)
    return {"plans": plans, "role": role}

@api_router.get("/subscription/my")
async def get_my_subscription(current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    user_id = current_user["user_id"]
    sub = await db.subscriptions.find_one({"user_id": user_id}, {"_id": 0})
    if not sub:
        default = get_default_plan(role)
        return {
            "plan_id": default,
            "plan": get_plan(default) if default else None,
            "status": "none",
            "is_active": False,
        }
    plan = get_plan(sub.get("plan_id", ""))
    return {
        **sub,
        "plan": plan,
        "is_active": is_subscription_active(sub),
    }

@api_router.post("/subscription/assign")
async def assign_subscription(data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    target_user_id = data.get("user_id")
    plan_id = data.get("plan_id")
    billing = data.get("billing", "yearly")
    
    if not target_user_id or not plan_id:
        raise HTTPException(status_code=400, detail="user_id and plan_id required")
    
    plan = get_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    sub = create_subscription(plan_id, billing)
    sub["user_id"] = target_user_id
    sub["assigned_by"] = current_user["user_id"]
    sub["assigned_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.subscriptions.update_one(
        {"user_id": target_user_id},
        {"$set": sub},
        upsert=True
    )
    
    # Update player premium status
    if plan.get("role") == "player" and plan_id == "player_premium":
        await db.players.update_one(
            {"user_id": target_user_id},
            {"$set": {"is_premium": True}}
        )
    
    return {"message": "Subscription assigned", "subscription": sub}

@api_router.post("/subscription/cancel")
async def cancel_subscription(data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    target_user_id = data.get("user_id")
    await db.subscriptions.update_one(
        {"user_id": target_user_id},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Subscription cancelled"}

@api_router.get("/admin/subscriptions")
async def get_all_subscriptions(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    subs = await db.subscriptions.find({}, {"_id": 0}).to_list(1000)
    return subs


@api_router.get("/admin/opportunities")
async def admin_get_opportunities(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    opps = await db.opportunities.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return opps

@api_router.put("/admin/opportunities/{opp_id}")
async def admin_update_opportunity(opp_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    data.pop("_id", None)
    await db.opportunities.update_one({"id": opp_id}, {"$set": data})
    return {"message": "Updated"}

@api_router.post("/admin/opportunities/{opp_id}/approve")
async def admin_approve_opportunity(opp_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    credit_cost = data.get("credit_cost", 1)
    await db.opportunities.update_one(
        {"id": opp_id},
        {"$set": {
            "status": "published",
            "admin_status": "approved",
            "credit_cost": credit_cost,
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": current_user["user_id"],
        }}
    )
    return {"message": "Opportunity approved and published"}

@api_router.post("/admin/opportunities/{opp_id}/reject")
async def admin_reject_opportunity(opp_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    await db.opportunities.update_one(
        {"id": opp_id},
        {"$set": {
            "status": "rejected",
            "admin_status": "rejected",
            "public_feedback": data.get("feedback", ""),
            "admin_notes": data.get("notes", ""),
        }}
    )
    return {"message": "Opportunity rejected"}

@api_router.post("/admin/opportunities/{opp_id}/request-changes")
async def admin_request_changes(opp_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    await db.opportunities.update_one(
        {"id": opp_id},
        {"$set": {
            "status": "changes_requested",
            "admin_status": "changes_requested",
            "public_feedback": data.get("feedback", ""),
            "admin_notes": data.get("notes", ""),
        }}
    )
    return {"message": "Changes requested"}


@api_router.post("/admin/migrate-opportunities")
async def migrate_opportunities(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403)
    result = await db.opportunities.update_many(
        {},  # Match ALL opportunities
        {"$set": {"status": "pending_review", "admin_status": "pending_review", "credit_cost": None}}
    )
    return {"migrated": result.modified_count}

fastapi_app.include_router(api_router)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "https://www.soccer-match.org",
        "https://soccer-match.org",
        "http://localhost:3000",
        "*"
    ],
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
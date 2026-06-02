"""
Professional Player Evaluation System
Football scouting and analysis models
"""
import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict
from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# ============ PLAYER ARCHETYPES ============
PLAYER_ARCHETYPES = {
    "goalkeeper": [
        "Sweeper Keeper",
        "Traditional Goalkeeper",
        "Shot Stopper",
        "Distributor"
    ],
    "defender": [
        "Ball Playing Defender",
        "Defensive Defender",
        "Stopper",
        "Cover Defender",
        "Wide Center Back"
    ],
    "fullback": [
        "Attacking Fullback",
        "Inverted Fullback",
        "Defensive Fullback",
        "Wing Back"
    ],
    "midfielder": [
        "Deep Lying Playmaker",
        "Box-to-Box Midfielder",
        "Ball Winning Midfielder",
        "Advanced Playmaker",
        "Regista",
        "Mezzala",
        "Carrilero"
    ],
    "attacker": [
        "Target Forward",
        "Poacher",
        "Pressing Forward",
        "False 9",
        "Complete Forward",
        "Advanced Forward"
    ],
    "winger": [
        "Traditional Winger",
        "Inverted Winger",
        "Inside Forward",
        "Wide Playmaker",
        "Raumdeuter"
    ]
}

# ============ EVALUATION METRICS ============
TECHNICAL_METRICS = [
    "passing", "first_touch", "ball_control", "dribbling",
    "finishing", "crossing", "tackling", "heading"
]

TACTICAL_METRICS = [
    "positioning", "decision_making", "game_intelligence",
    "defensive_awareness", "movement_off_ball", "transition_play"
]

PHYSICAL_METRICS = [
    "speed", "acceleration", "agility", "strength", "endurance"
]

MENTAL_METRICS = [
    "leadership", "communication", "confidence",
    "discipline", "work_rate", "competitive_mentality"
]

ALL_METRICS = TECHNICAL_METRICS + TACTICAL_METRICS + PHYSICAL_METRICS + MENTAL_METRICS

RECOMMENDATION_LEVELS = [
    "strongly_recommend",
    "recommend", 
    "monitor",
    "further_evaluation",
    "not_recommended"
]


# ============ PYDANTIC MODELS ============

class MetricScore(BaseModel):
    """Individual metric with score and comment"""
    score: float = Field(ge=1, le=10)
    comment: Optional[str] = None


class TechnicalEvaluation(BaseModel):
    passing: MetricScore
    first_touch: MetricScore
    ball_control: MetricScore
    dribbling: MetricScore
    finishing: MetricScore
    crossing: MetricScore
    tackling: MetricScore
    heading: MetricScore


class TacticalEvaluation(BaseModel):
    positioning: MetricScore
    decision_making: MetricScore
    game_intelligence: MetricScore
    defensive_awareness: MetricScore
    movement_off_ball: MetricScore
    transition_play: MetricScore


class PhysicalEvaluation(BaseModel):
    speed: MetricScore
    acceleration: MetricScore
    agility: MetricScore
    strength: MetricScore
    endurance: MetricScore


class MentalEvaluation(BaseModel):
    leadership: MetricScore
    communication: MetricScore
    confidence: MetricScore
    discipline: MetricScore
    work_rate: MetricScore
    competitive_mentality: MetricScore


class VideoReference(BaseModel):
    """Video reference with timestamps"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    video_type: str  # "full_match", "highlights", "external"
    url: str
    title: Optional[str] = None
    timestamps: List[Dict[str, str]] = []  # [{"time": "12:43", "action": "Excellent pass"}]


class PlayerEvaluationCreate(BaseModel):
    """Input model for creating an evaluation"""
    player_id: str
    match_date: str
    match_description: str  # e.g., "PSG vs Real Madrid - Champions League"
    position_played: str
    minutes_played: int
    
    # Evaluations
    technical: TechnicalEvaluation
    tactical: TacticalEvaluation
    physical: PhysicalEvaluation
    mental: MentalEvaluation
    
    # Archetypes
    archetypes: List[str] = []
    
    # Recommendation
    recommendation: str  # From RECOMMENDATION_LEVELS
    
    # Video references
    video_references: List[VideoReference] = []
    
    # Manual notes
    executive_summary: Optional[str] = None
    strengths_notes: Optional[str] = None
    weaknesses_notes: Optional[str] = None
    development_potential: Optional[str] = None
    
    # Generate AI report
    generate_ai_report: bool = True


class PlayerEvaluation(BaseModel):
    """Full evaluation model with computed scores"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    analyst_id: str
    analyst_name: str
    
    # Match info
    match_date: str
    match_description: str
    position_played: str
    minutes_played: int
    
    # Evaluations
    technical: TechnicalEvaluation
    tactical: TacticalEvaluation
    physical: PhysicalEvaluation
    mental: MentalEvaluation
    
    # Computed category scores (averages)
    technical_score: float = 0
    tactical_score: float = 0
    physical_score: float = 0
    mental_score: float = 0
    
    # Attacking/Defending scores (computed)
    attacking_score: float = 0
    defending_score: float = 0
    
    # Top strengths and weaknesses
    top_strengths: List[str] = []
    development_areas: List[str] = []
    
    # Archetypes
    archetypes: List[str] = []
    
    # Recommendation
    recommendation: str
    
    # Video references
    video_references: List[VideoReference] = []
    
    # Report content
    executive_summary: Optional[str] = None
    strengths_notes: Optional[str] = None
    weaknesses_notes: Optional[str] = None
    tactical_analysis: Optional[str] = None
    physical_analysis: Optional[str] = None
    mental_analysis: Optional[str] = None
    development_potential: Optional[str] = None
    key_match_actions: Optional[str] = None
    recruitment_recommendation: Optional[str] = None
    
    # AI generated flag
    ai_report_generated: bool = False
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: Optional[str] = None


class AnalystProfile(BaseModel):
    """Analyst profile model"""
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    name: str
    email: Optional[str] = None
    organization: Optional[str] = None  # Club, federation, agency name
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    country: Optional[str] = None
    specialization: Optional[str] = None  # e.g., "Youth Development", "First Team Scouting"
    certifications: List[str] = []
    years_experience: Optional[int] = None
    evaluations_count: int = 0
    approved: bool = False
    verified: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AnalystUpdate(BaseModel):
    name: Optional[str] = None
    organization: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    country: Optional[str] = None
    specialization: Optional[str] = None
    certifications: Optional[List[str]] = None
    years_experience: Optional[int] = None


# ============ UTILITY FUNCTIONS ============

def calculate_category_score(evaluation: dict) -> float:
    """Calculate average score for a category"""
    scores = [v.get('score', 0) if isinstance(v, dict) else v.score for v in evaluation.values()]
    return round(sum(scores) / len(scores), 1) if scores else 0


def calculate_attacking_score(tech: dict, tact: dict, ment: dict) -> float:
    """Calculate attacking score from relevant metrics"""
    attacking_metrics = [
        tech.get('finishing', {}).get('score', 5),
        tech.get('dribbling', {}).get('score', 5),
        tech.get('crossing', {}).get('score', 5),
        tact.get('movement_off_ball', {}).get('score', 5),
        tact.get('transition_play', {}).get('score', 5),
        ment.get('confidence', {}).get('score', 5),
    ]
    return round(sum(attacking_metrics) / len(attacking_metrics), 1)


def calculate_defending_score(tech: dict, tact: dict, ment: dict, phys: dict) -> float:
    """Calculate defending score from relevant metrics"""
    defending_metrics = [
        tech.get('tackling', {}).get('score', 5),
        tech.get('heading', {}).get('score', 5),
        tact.get('positioning', {}).get('score', 5),
        tact.get('defensive_awareness', {}).get('score', 5),
        phys.get('strength', {}).get('score', 5),
        ment.get('discipline', {}).get('score', 5),
    ]
    return round(sum(defending_metrics) / len(defending_metrics), 1)


def extract_strengths_weaknesses(evaluation_data: dict) -> tuple:
    """Extract top strengths and development areas from all metrics"""
    all_scores = []
    
    # Collect all metric scores
    for category in ['technical', 'tactical', 'physical', 'mental']:
        cat_data = evaluation_data.get(category, {})
        if isinstance(cat_data, dict):
            for metric, data in cat_data.items():
                if isinstance(data, dict):
                    score = data.get('score', 5)
                else:
                    score = data.score if hasattr(data, 'score') else 5
                all_scores.append((metric.replace('_', ' ').title(), score))
    
    # Sort by score
    sorted_scores = sorted(all_scores, key=lambda x: x[1], reverse=True)
    
    # Top 5 strengths (score >= 7)
    strengths = [name for name, score in sorted_scores[:5] if score >= 7]
    
    # Development areas (lowest scores)
    weaknesses = [name for name, score in sorted_scores[-3:] if score < 7]
    
    return strengths, weaknesses


def process_evaluation_data(create_data: PlayerEvaluationCreate, analyst_id: str, analyst_name: str) -> PlayerEvaluation:
    """Process raw evaluation data and compute all scores"""
    
    # Convert to dict for processing
    tech_dict = create_data.technical.model_dump()
    tact_dict = create_data.tactical.model_dump()
    phys_dict = create_data.physical.model_dump()
    ment_dict = create_data.mental.model_dump()
    
    # Calculate category scores
    technical_score = calculate_category_score(tech_dict)
    tactical_score = calculate_category_score(tact_dict)
    physical_score = calculate_category_score(phys_dict)
    mental_score = calculate_category_score(ment_dict)
    
    # Calculate attacking/defending
    attacking_score = calculate_attacking_score(tech_dict, tact_dict, ment_dict)
    defending_score = calculate_defending_score(tech_dict, tact_dict, ment_dict, phys_dict)
    
    # Extract strengths and weaknesses
    eval_data = {
        'technical': tech_dict,
        'tactical': tact_dict,
        'physical': phys_dict,
        'mental': ment_dict
    }
    strengths, weaknesses = extract_strengths_weaknesses(eval_data)
    
    return PlayerEvaluation(
        player_id=create_data.player_id,
        analyst_id=analyst_id,
        analyst_name=analyst_name,
        match_date=create_data.match_date,
        match_description=create_data.match_description,
        position_played=create_data.position_played,
        minutes_played=create_data.minutes_played,
        technical=create_data.technical,
        tactical=create_data.tactical,
        physical=create_data.physical,
        mental=create_data.mental,
        technical_score=technical_score,
        tactical_score=tactical_score,
        physical_score=physical_score,
        mental_score=mental_score,
        attacking_score=attacking_score,
        defending_score=defending_score,
        top_strengths=strengths,
        development_areas=weaknesses,
        archetypes=create_data.archetypes,
        recommendation=create_data.recommendation,
        video_references=[v.model_dump() for v in create_data.video_references],
        executive_summary=create_data.executive_summary,
        strengths_notes=create_data.strengths_notes,
        weaknesses_notes=create_data.weaknesses_notes,
        development_potential=create_data.development_potential
    )


# ============ AI REPORT GENERATION ============

REPORT_GENERATION_PROMPT = """Tu es un analyste de football professionnel travaillant pour un club de haut niveau.

Génère un rapport de scouting professionnel basé sur cette évaluation de joueur.

DONNÉES DU JOUEUR:
Nom: {player_name}
Position: {position}
Match: {match_description}
Date: {match_date}
Minutes jouées: {minutes}

SCORES PAR CATÉGORIE:
- Technique: {technical_score}/10
- Tactique: {tactical_score}/10
- Physique: {physical_score}/10
- Mental: {mental_score}/10
- Attaque: {attacking_score}/10
- Défense: {defending_score}/10

ARCHÉTYPES: {archetypes}

FORCES PRINCIPALES: {strengths}
AXES D'AMÉLIORATION: {weaknesses}

DÉTAILS DES MÉTRIQUES:
{metrics_detail}

RECOMMANDATION DE L'ANALYSTE: {recommendation}

NOTES DE L'ANALYSTE:
{analyst_notes}

---

Génère un rapport professionnel en JSON avec cette structure exacte:
{{
  "executive_summary": "Résumé exécutif de 2-3 phrases sur le joueur",
  "strengths_analysis": "Analyse détaillée des forces du joueur (2-3 paragraphes)",
  "weaknesses_analysis": "Analyse des axes d'amélioration (1-2 paragraphes)",
  "tactical_analysis": "Analyse tactique approfondie (2 paragraphes)",
  "physical_analysis": "Analyse des attributs physiques (1 paragraphe)",
  "mental_analysis": "Analyse du profil mental (1-2 paragraphes)",
  "development_potential": "Potentiel de développement et projection (1-2 paragraphes)",
  "key_match_actions": "Actions clés observées pendant le match (liste à puces)",
  "recruitment_recommendation": "Recommandation finale détaillée pour le recrutement (1 paragraphe)"
}}

Écris en français professionnel, comme un vrai rapport de scouting utilisé par les clubs.
"""


async def generate_ai_report(evaluation: PlayerEvaluation, player_name: str) -> dict:
    """Generate AI-powered professional scouting report"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"report-{evaluation.id}",
            system_message="Tu es un analyste de football professionnel. Réponds uniquement en JSON valide."
        ).with_model("gemini", "gemini-2.5-flash")
        
        # Build metrics detail
        metrics_detail = []
        for category, cat_name in [
            (evaluation.technical.model_dump(), "Technique"),
            (evaluation.tactical.model_dump(), "Tactique"),
            (evaluation.physical.model_dump(), "Physique"),
            (evaluation.mental.model_dump(), "Mental")
        ]:
            for metric, data in category.items():
                score = data.get('score', 5)
                comment = data.get('comment', '')
                metric_name = metric.replace('_', ' ').title()
                line = f"- {metric_name}: {score}/10"
                if comment:
                    line += f" ({comment})"
                metrics_detail.append(line)
        
        # Build analyst notes
        analyst_notes = []
        if evaluation.executive_summary:
            analyst_notes.append(f"Résumé: {evaluation.executive_summary}")
        if evaluation.strengths_notes:
            analyst_notes.append(f"Forces: {evaluation.strengths_notes}")
        if evaluation.weaknesses_notes:
            analyst_notes.append(f"Faiblesses: {evaluation.weaknesses_notes}")
        if evaluation.development_potential:
            analyst_notes.append(f"Potentiel: {evaluation.development_potential}")
        
        recommendation_labels = {
            "strongly_recommend": "Fortement recommandé",
            "recommend": "Recommandé",
            "monitor": "À surveiller",
            "further_evaluation": "Évaluation supplémentaire nécessaire",
            "not_recommended": "Non recommandé"
        }
        
        prompt = REPORT_GENERATION_PROMPT.format(
            player_name=player_name,
            position=evaluation.position_played,
            match_description=evaluation.match_description,
            match_date=evaluation.match_date,
            minutes=evaluation.minutes_played,
            technical_score=evaluation.technical_score,
            tactical_score=evaluation.tactical_score,
            physical_score=evaluation.physical_score,
            mental_score=evaluation.mental_score,
            attacking_score=evaluation.attacking_score,
            defending_score=evaluation.defending_score,
            archetypes=", ".join(evaluation.archetypes) or "Non spécifié",
            strengths=", ".join(evaluation.top_strengths) or "À déterminer",
            weaknesses=", ".join(evaluation.development_areas) or "À déterminer",
            metrics_detail="\n".join(metrics_detail),
            recommendation=recommendation_labels.get(evaluation.recommendation, evaluation.recommendation),
            analyst_notes="\n".join(analyst_notes) if analyst_notes else "Aucune note supplémentaire"
        )
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        # Parse JSON response
        response_text = response.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        
        report_data = json.loads(response_text.strip())
        return {"success": True, "report": report_data}
        
    except Exception as e:
        print(f"AI Report generation error: {e}")
        return {"success": False, "error": str(e)}


def get_player_evolution(evaluations: List[dict]) -> dict:
    """Calculate player evolution over time"""
    if len(evaluations) < 2:
        return {"has_evolution": False}
    
    # Sort by date
    sorted_evals = sorted(evaluations, key=lambda x: x.get('match_date', ''))
    
    first = sorted_evals[0]
    last = sorted_evals[-1]
    
    evolution = {
        "has_evolution": True,
        "evaluations_count": len(evaluations),
        "first_date": first.get('match_date'),
        "last_date": last.get('match_date'),
        "categories": {
            "technical": {
                "first": first.get('technical_score', 0),
                "last": last.get('technical_score', 0),
                "change": round(last.get('technical_score', 0) - first.get('technical_score', 0), 1)
            },
            "tactical": {
                "first": first.get('tactical_score', 0),
                "last": last.get('tactical_score', 0),
                "change": round(last.get('tactical_score', 0) - first.get('tactical_score', 0), 1)
            },
            "physical": {
                "first": first.get('physical_score', 0),
                "last": last.get('physical_score', 0),
                "change": round(last.get('physical_score', 0) - first.get('physical_score', 0), 1)
            },
            "mental": {
                "first": first.get('mental_score', 0),
                "last": last.get('mental_score', 0),
                "change": round(last.get('mental_score', 0) - first.get('mental_score', 0), 1)
            }
        },
        "history": [
            {
                "date": e.get('match_date'),
                "match": e.get('match_description'),
                "technical": e.get('technical_score'),
                "tactical": e.get('tactical_score'),
                "physical": e.get('physical_score'),
                "mental": e.get('mental_score')
            }
            for e in sorted_evals
        ]
    }
    
    return evolution

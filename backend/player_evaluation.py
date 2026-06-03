"""
Professional Player Evaluation System
Football scouting and analysis models - No AI dependencies
"""
import os
import io
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.graphics.shapes import Drawing, Circle, Polygon, String, Line
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics import renderPDF
import math

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

RECOMMENDATION_LABELS = {
    "strongly_recommend": "Strongly Recommend",
    "recommend": "Recommend",
    "monitor": "Monitor",
    "further_evaluation": "Further Evaluation Needed",
    "not_recommended": "Not Recommended"
}


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
    
    # Report content (manual)
    executive_summary: Optional[str] = None
    strengths_notes: Optional[str] = None
    weaknesses_notes: Optional[str] = None
    tactical_analysis: Optional[str] = None
    physical_analysis: Optional[str] = None
    mental_analysis: Optional[str] = None
    development_potential: Optional[str] = None
    key_match_actions: Optional[str] = None
    recruitment_recommendation: Optional[str] = None
    
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
    
    # Metric name mapping for display
    metric_names = {
        'passing': 'Passing', 'first_touch': 'First Touch', 'ball_control': 'Ball Control',
        'dribbling': 'Dribbling', 'finishing': 'Finishing', 'crossing': 'Crossing',
        'tackling': 'Tackling', 'heading': 'Heading', 'positioning': 'Positioning',
        'decision_making': 'Decision Making', 'game_intelligence': 'Game Intelligence',
        'defensive_awareness': 'Defensive Awareness', 'movement_off_ball': 'Movement Off Ball',
        'transition_play': 'Transition Play', 'speed': 'Speed', 'acceleration': 'Acceleration',
        'agility': 'Agility', 'strength': 'Strength', 'endurance': 'Endurance',
        'leadership': 'Leadership', 'communication': 'Communication', 'confidence': 'Confidence',
        'discipline': 'Discipline', 'work_rate': 'Work Rate', 'competitive_mentality': 'Competitive Mentality'
    }
    
    # Collect all metric scores
    for category in ['technical', 'tactical', 'physical', 'mental']:
        cat_data = evaluation_data.get(category, {})
        if isinstance(cat_data, dict):
            for metric, data in cat_data.items():
                if isinstance(data, dict):
                    score = data.get('score', 5)
                else:
                    score = data.score if hasattr(data, 'score') else 5
                name = metric_names.get(metric, metric.replace('_', ' ').title())
                all_scores.append((name, score))
    
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


# ============ PDF REPORT GENERATION ============

def draw_radar_chart(drawing: Drawing, scores: dict, cx: float, cy: float, radius: float):
    """Draw a hexagonal radar chart"""
    labels = ['Technical', 'Tactical', 'Physical', 'Mental', 'Attacking', 'Defending']
    values = [
        scores.get('technical', 5),
        scores.get('tactical', 5),
        scores.get('physical', 5),
        scores.get('mental', 5),
        scores.get('attacking', 5),
        scores.get('defending', 5)
    ]
    
    n = len(labels)
    angle_step = 2 * math.pi / n
    
    # Draw grid circles
    for r in [0.2, 0.4, 0.6, 0.8, 1.0]:
        points = []
        for i in range(n):
            angle = -math.pi/2 + i * angle_step
            x = cx + radius * r * math.cos(angle)
            y = cy + radius * r * math.sin(angle)
            points.append((x, y))
        
        for i in range(n):
            x1, y1 = points[i]
            x2, y2 = points[(i + 1) % n]
            drawing.add(Line(x1, y1, x2, y2, strokeColor=colors.lightgrey, strokeWidth=0.5))
    
    # Draw axes
    for i in range(n):
        angle = -math.pi/2 + i * angle_step
        x = cx + radius * math.cos(angle)
        y = cy + radius * math.sin(angle)
        drawing.add(Line(cx, cy, x, y, strokeColor=colors.lightgrey, strokeWidth=0.5))
        
        # Add labels
        label_x = cx + (radius + 15) * math.cos(angle)
        label_y = cy + (radius + 15) * math.sin(angle)
        drawing.add(String(label_x, label_y, labels[i], fontSize=8, textAnchor='middle'))
    
    # Draw data polygon
    data_points = []
    for i in range(n):
        angle = -math.pi/2 + i * angle_step
        r = (values[i] / 10) * radius
        x = cx + r * math.cos(angle)
        y = cy + r * math.sin(angle)
        data_points.extend([x, y])
    
    polygon = Polygon(data_points, fillColor=colors.Color(0.06, 0.73, 0.51, 0.3), 
                      strokeColor=colors.Color(0.06, 0.73, 0.51), strokeWidth=2)
    drawing.add(polygon)
    
    # Draw data points
    for i in range(n):
        angle = -math.pi/2 + i * angle_step
        r = (values[i] / 10) * radius
        x = cx + r * math.cos(angle)
        y = cy + r * math.sin(angle)
        drawing.add(Circle(x, y, 3, fillColor=colors.Color(0.06, 0.73, 0.51), strokeColor=colors.white, strokeWidth=1))


def generate_evaluation_pdf(evaluation: dict, player: dict) -> bytes:
    """Generate a professional PDF report for a player evaluation"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*cm, bottomMargin=1*cm, 
                            leftMargin=1.5*cm, rightMargin=1.5*cm)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, 
                                  spaceAfter=20, textColor=colors.Color(0.06, 0.73, 0.51))
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=14, 
                                    spaceBefore=15, spaceAfter=10, textColor=colors.Color(0.2, 0.2, 0.2))
    subheading_style = ParagraphStyle('Subheading', parent=styles['Heading3'], fontSize=11, 
                                       spaceBefore=10, spaceAfter=5)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, spaceAfter=8)
    
    elements = []
    
    # Header
    player_name = f"{player.get('first_name', '')} {player.get('last_name', '')}".strip() or player.get('name', 'Unknown Player')
    elements.append(Paragraph("SOCCERMATCH", title_style))
    elements.append(Paragraph("Professional Player Evaluation Report", styles['Heading2']))
    elements.append(Spacer(1, 20))
    
    # Player Info
    elements.append(Paragraph(f"<b>Player:</b> {player_name}", body_style))
    elements.append(Paragraph(f"<b>Position:</b> {evaluation.get('position_played', 'N/A')}", body_style))
    elements.append(Paragraph(f"<b>Match:</b> {evaluation.get('match_description', 'N/A')}", body_style))
    elements.append(Paragraph(f"<b>Date:</b> {evaluation.get('match_date', 'N/A')}", body_style))
    elements.append(Paragraph(f"<b>Minutes Played:</b> {evaluation.get('minutes_played', 'N/A')}", body_style))
    elements.append(Paragraph(f"<b>Analyst:</b> {evaluation.get('analyst_name', 'N/A')}", body_style))
    elements.append(Spacer(1, 15))
    
    # Recommendation
    rec_label = RECOMMENDATION_LABELS.get(evaluation.get('recommendation', ''), evaluation.get('recommendation', 'N/A'))
    elements.append(Paragraph(f"<b>Recommendation:</b> {rec_label}", heading_style))
    elements.append(Spacer(1, 10))
    
    # Category Scores Table
    elements.append(Paragraph("Category Scores", heading_style))
    scores_data = [
        ['Category', 'Score'],
        ['Technical', f"{evaluation.get('technical_score', 0)}/10"],
        ['Tactical', f"{evaluation.get('tactical_score', 0)}/10"],
        ['Physical', f"{evaluation.get('physical_score', 0)}/10"],
        ['Mental', f"{evaluation.get('mental_score', 0)}/10"],
        ['Attacking', f"{evaluation.get('attacking_score', 0)}/10"],
        ['Defending', f"{evaluation.get('defending_score', 0)}/10"],
    ]
    scores_table = Table(scores_data, colWidths=[3*inch, 1.5*inch])
    scores_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.06, 0.73, 0.51)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.Color(0.95, 0.95, 0.95)),
        ('GRID', (0, 0), (-1, -1), 1, colors.white),
    ]))
    elements.append(scores_table)
    elements.append(Spacer(1, 15))
    
    # Archetypes
    if evaluation.get('archetypes'):
        elements.append(Paragraph("Player Archetypes", heading_style))
        archetypes_text = ", ".join(evaluation.get('archetypes', []))
        elements.append(Paragraph(archetypes_text, body_style))
        elements.append(Spacer(1, 10))
    
    # Strengths & Weaknesses
    elements.append(Paragraph("Top Strengths", heading_style))
    strengths = evaluation.get('top_strengths', [])
    if strengths:
        for i, s in enumerate(strengths, 1):
            elements.append(Paragraph(f"{i}. {s}", body_style))
    else:
        elements.append(Paragraph("No significant strengths identified", body_style))
    
    elements.append(Paragraph("Development Areas", heading_style))
    weaknesses = evaluation.get('development_areas', [])
    if weaknesses:
        for i, w in enumerate(weaknesses, 1):
            elements.append(Paragraph(f"{i}. {w}", body_style))
    else:
        elements.append(Paragraph("No significant areas for improvement identified", body_style))
    
    # Notes sections
    if evaluation.get('executive_summary'):
        elements.append(Paragraph("Executive Summary", heading_style))
        elements.append(Paragraph(evaluation['executive_summary'], body_style))
    
    if evaluation.get('strengths_notes'):
        elements.append(Paragraph("Strengths Analysis", heading_style))
        elements.append(Paragraph(evaluation['strengths_notes'], body_style))
    
    if evaluation.get('weaknesses_notes'):
        elements.append(Paragraph("Weaknesses Analysis", heading_style))
        elements.append(Paragraph(evaluation['weaknesses_notes'], body_style))
    
    if evaluation.get('tactical_analysis'):
        elements.append(Paragraph("Tactical Analysis", heading_style))
        elements.append(Paragraph(evaluation['tactical_analysis'], body_style))
    
    if evaluation.get('physical_analysis'):
        elements.append(Paragraph("Physical Analysis", heading_style))
        elements.append(Paragraph(evaluation['physical_analysis'], body_style))
    
    if evaluation.get('mental_analysis'):
        elements.append(Paragraph("Mental Analysis", heading_style))
        elements.append(Paragraph(evaluation['mental_analysis'], body_style))
    
    if evaluation.get('development_potential'):
        elements.append(Paragraph("Development Potential", heading_style))
        elements.append(Paragraph(evaluation['development_potential'], body_style))
    
    if evaluation.get('recruitment_recommendation'):
        elements.append(Paragraph("Recruitment Recommendation", heading_style))
        elements.append(Paragraph(evaluation['recruitment_recommendation'], body_style))
    
    # Footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(f"Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}", 
                              ParagraphStyle('Footer', fontSize=8, textColor=colors.grey)))
    elements.append(Paragraph("© SoccerMatch - Professional Football Scouting Platform", 
                              ParagraphStyle('Footer', fontSize=8, textColor=colors.grey)))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

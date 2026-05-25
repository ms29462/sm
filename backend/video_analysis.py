"""
Video Analysis Service using Google Gemini
Analyzes highlight videos for quality and performance metrics
"""

import os
import re
import json
import uuid
import asyncio
import tempfile
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import httpx
import google.generativeai as genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

ANALYSIS_PROMPT = """You are an expert football (soccer) scout and video analyst. Analyze this highlight video and provide a comprehensive assessment.

Return your analysis as a valid JSON object with the following structure:

{
  "video_quality": {
    "overall_score": <1-100>,
    "resolution_quality": "<poor/fair/good/excellent>",
    "lighting": "<poor/fair/good/excellent>",
    "stability": "<poor/fair/good/excellent>",
    "clarity": "<poor/fair/good/excellent>",
    "audio_quality": "<poor/fair/good/excellent/no_audio>",
    "notes": "<brief notes about video quality>"
  },
  "player_assessment": {
    "overall_rating": <1-100>,
    "detected_position": "<GK/CB/LB/RB/DM/CM/AM/Winger/Striker/Unknown>",
    "confidence_level": "<low/medium/high>",
    "playing_style": "<brief description of playing style>"
  },
  "technical_skills": {
    "ball_control": <1-100>,
    "passing": <1-100>,
    "shooting": <1-100>,
    "dribbling": <1-100>,
    "heading": <1-100>,
    "first_touch": <1-100>,
    "weak_foot": "<poor/fair/good/excellent/not_shown>",
    "notes": "<brief notes on technical abilities>"
  },
  "physical_attributes": {
    "pace": "<slow/average/fast/explosive/not_assessable>",
    "strength": "<weak/average/strong/dominant/not_assessable>",
    "stamina": "<low/average/high/excellent/not_assessable>",
    "agility": "<low/average/high/excellent/not_assessable>",
    "notes": "<brief notes on physical attributes>"
  },
  "tactical_awareness": {
    "positioning": <1-100>,
    "decision_making": <1-100>,
    "work_rate": "<low/average/high/excellent>",
    "defensive_contribution": "<poor/fair/good/excellent/not_applicable>",
    "notes": "<brief notes on tactical intelligence>"
  },
  "key_moments": [
    {
      "timestamp": "<approximate timestamp or description>",
      "type": "<goal/assist/tackle/save/dribble/pass/skill/other>",
      "description": "<brief description of the moment>",
      "quality_rating": <1-10>
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areas_for_improvement": ["<area 1>", "<area 2>"],
  "scout_summary": "<2-3 sentence summary a scout would write>",
  "recommended_level": "<amateur/semi-pro/professional/elite>",
  "similar_player_style": "<name of a professional player with similar style, if applicable>"
}

Be thorough but realistic. If you cannot assess something from the video, indicate that clearly. Focus on what is actually visible in the footage."""


async def download_video_from_url(url: str, output_path: str) -> bool:
    """Download video from URL (supports YouTube, Vimeo, direct links)"""
    try:
        if any(ext in url.lower() for ext in [".mp4", ".webm", ".mov", ".avi"]):
            async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    with open(output_path, "wb") as f:
                        f.write(response.content)
                    return True
            return False

        youtube_patterns = [r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]+)"]
        vimeo_pattern = r"vimeo\.com/(\d+)"

        is_youtube = any(re.search(p, url) for p in youtube_patterns)
        is_vimeo = re.search(vimeo_pattern, url)

        if is_youtube or is_vimeo:
            cmd = ["yt-dlp", "-f", "best", "-o", output_path, "--no-playlist", "--socket-timeout", "60", "--max-filesize", "50m", "--no-check-certificates", url]
            process = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=180)
            if process.returncode == 0 and os.path.exists(output_path):
                return True
            print(f"yt-dlp failed: {stderr.decode()}")
            return False

        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            response = await client.get(url)
            if response.status_code == 200:
                content_type = response.headers.get("content-type", "")
                if "video" in content_type or len(response.content) > 100000:
                    with open(output_path, "wb") as f:
                        f.write(response.content)
                    return True

        return False

    except Exception as e:
        print(f"Error downloading video: {e}")
        return False


async def analyze_video_with_gemini(video_path: str) -> Dict[str, Any]:
    """Analyze video using Google Gemini Files API"""
    try:
        genai.configure(api_key=GEMINI_API_KEY)

        print("Uploading video to Gemini Files API...")
        video_file = genai.upload_file(path=video_path, mime_type="video/mp4")

        max_wait = 120
        waited = 0
        while video_file.state.name == "PROCESSING" and waited < max_wait:
            time.sleep(3)
            waited += 3
            video_file = genai.get_file(video_file.name)

        if video_file.state.name == "FAILED":
            return {"success": False, "error": "Video processing failed in Gemini Files API"}

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction="You are an expert football scout and video analyst. Always respond with valid JSON only, no additional text."
        )

        response = model.generate_content([video_file, ANALYSIS_PROMPT])

        try:
            genai.delete_file(video_file.name)
        except Exception:
            pass

        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        analysis = json.loads(response_text.strip())
        return {"success": True, "analysis": analysis}

    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        return {"success": False, "error": "Failed to parse AI response"}
    except Exception as e:
        print(f"Gemini analysis error: {e}")
        return {"success": False, "error": str(e)}


async def analyze_highlight_video(video_url: str, player_id: str) -> Dict[str, Any]:
    """Main function to analyze a highlight video"""
    analysis_id = str(uuid.uuid4())
    temp_dir = tempfile.mkdtemp()
    video_path = os.path.join(temp_dir, f"video_{analysis_id}.mp4")

    try:
        print(f"Downloading video from {video_url}...")
        download_success = await download_video_from_url(video_url, video_path)

        if not download_success or not os.path.exists(video_path):
            return {"success": False, "error": "Failed to download video. Please ensure the URL is valid and accessible.", "analysis_id": analysis_id}

        file_size = os.path.getsize(video_path)
        if file_size > 50 * 1024 * 1024:
            return {"success": False, "error": "Video file is too large (>50MB). Please use a shorter highlight clip.", "analysis_id": analysis_id}

        print(f"Video downloaded: {file_size / 1024 / 1024:.2f}MB")
        print("Analyzing video with AI...")
        result = await analyze_video_with_gemini(video_path)

        if result["success"]:
            return {
                "success": True,
                "analysis_id": analysis_id,
                "player_id": player_id,
                "video_url": video_url,
                "analysis": result["analysis"],
                "analyzed_at": datetime.now(timezone.utc).isoformat()
            }
        else:
            return {"success": False, "error": result.get("error", "Analysis failed"), "analysis_id": analysis_id}

    except Exception as e:
        print(f"Video analysis error: {e}")
        return {"success": False, "error": str(e), "analysis_id": analysis_id}
    finally:
        try:
            if os.path.exists(video_path):
                os.remove(video_path)
            os.rmdir(temp_dir)
        except Exception:
            pass


def calculate_overall_score(analysis: Dict[str, Any]) -> int:
    """Calculate overall player score from analysis"""
    try:
        scores = []

        if "video_quality" in analysis:
            scores.append(analysis["video_quality"].get("overall_score", 50) * 0.1)

        if "player_assessment" in analysis:
            scores.append(analysis["player_assessment"].get("overall_rating", 50) * 0.2)

        if "technical_skills" in analysis:
            tech = analysis["technical_skills"]
            tech_scores = [tech.get("ball_control", 50), tech.get("passing", 50), tech.get("shooting", 50), tech.get("dribbling", 50), tech.get("first_touch", 50)]
            scores.append(sum(tech_scores) / len(tech_scores) * 0.35)

        if "tactical_awareness" in analysis:
            tact = analysis["tactical_awareness"]
            tact_scores = [tact.get("positioning", 50), tact.get("decision_making", 50)]
            scores.append(sum(tact_scores) / len(tact_scores) * 0.25)

        if "key_moments" in analysis:
            moments = analysis["key_moments"]
            if moments:
                avg_moment_quality = sum(m.get("quality_rating", 5) for m in moments) / len(moments)
                scores.append(avg_moment_quality * 10 * 0.1)

        return min(100, max(0, int(sum(scores))))

    except Exception as e:
        print(f"Score calculation error: {e}")
        return 50

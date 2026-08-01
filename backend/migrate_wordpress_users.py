"""
WordPress V1 → MongoDB V2 migration script.
Reads dscc_users CSV and inserts into db.users + db.players on production.

Run: python migrate_wordpress_users.py
"""

import asyncio
import csv
import uuid
import os
from datetime import datetime, timezone, date
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

CSV_PATH = r"C:\Users\Lenovo\Downloads\dscc_users (3).csv"
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = "soccermatch"          # production database
DEFAULT_PASSWORD = "SoccerMatch2024!"

# French V1 abbreviated positions → V2 English abbreviations
POSITION_MAP = {
    "G":                    "GK",
    "G (Futsal)":           "GK",
    "DC":                   "CB",
    "DG":                   "LB",
    "DD":                   "RB",
    "MDC":                  "DM",
    "MC":                   "CM",
    "MG":                   "CM",
    "MD":                   "CM",
    "MOC":                  "AM",
    "AG":                   "LW",
    "AD":                   "RW",
    "BU":                   "ST",
    "Ailier (Futsal)":      "LW",
    "Meneur de jeu (Futsal)": "AM",
    "Meneur côté (Futsal)": "AM",
    "Pivot (Futsal)":       "ST",
}

def map_position(raw: str) -> str | None:
    raw = raw.strip()
    if raw in ("", "NULL"):
        return None
    return POSITION_MAP.get(raw, raw)   # fall back to raw string if unknown


def parse_dob(dob_raw: str) -> tuple[str | None, int | None]:
    """
    dob is stored as a Unix timestamp (seconds) in the CSV.
    Returns (date_string "YYYY-MM-DD", age_in_years) or (None, None).
    """
    dob_raw = dob_raw.strip()
    if not dob_raw or dob_raw in ("NULL", "0", ""):
        return None, None
    try:
        ts = int(dob_raw)
        dob_date = datetime.fromtimestamp(ts, tz=timezone.utc).date()
        today = date.today()
        age = today.year - dob_date.year - (
            (today.month, today.day) < (dob_date.month, dob_date.day)
        )
        return dob_date.strftime("%Y-%m-%d"), age
    except (ValueError, OSError):
        return None, None


def clean(value: str) -> str | None:
    v = value.strip()
    return None if v in ("", "NULL") else v


def parse_int(value: str) -> int | None:
    v = value.strip()
    if v in ("", "NULL"):
        return None
    try:
        return int(v)
    except ValueError:
        return None


async def migrate():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    hashed_pw = bcrypt.hashpw(DEFAULT_PASSWORD.encode(), bcrypt.gensalt()).decode()

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    print(f"Total rows in CSV: {len(rows)}")

    created = 0
    skipped = 0
    errors = []

    for i, row in enumerate(rows, 1):
        email = clean(row.get("user_email", ""))
        if not email:
            print(f"  [{i}] No email — skip")
            skipped += 1
            continue

        # Deduplicate by email
        existing = await db.users.find_one({"email": email}, {"_id": 1})
        if existing:
            print(f"  [{i}] {email} already exists — skip")
            skipped += 1
            continue

        user_id = str(uuid.uuid4())

        # ── users document ──────────────────────────────────────────────
        user_doc = {
            "id": user_id,
            "email": email,
            "password": hashed_pw,
            "role": "player",
            "account_status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "email_verified": False,
            "migrated_from_wordpress": True,
            "wordpress_id": clean(row.get("ID", "")),
        }

        # ── players document ─────────────────────────────────────────────
        dob_str, age = parse_dob(row.get("dob", ""))

        nat1 = clean(row.get("nationality", ""))
        nat2 = clean(row.get("nationality_2", ""))
        # V1 sometimes left nationality NULL and put it in nationality_2
        if nat1 is None and nat2 is not None:
            nat1, nat2 = nat2, None

        player_doc = {
            "user_id": user_id,
            "name": clean(row.get("display_name", "")) or email,
            "email": email,
            "approved": True,
            "verified": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "profile_status": "incomplete",
            "migrated_from_wordpress": True,
            # personal info
            "date_of_birth": dob_str,
            "age": age,
            "gender": clean(row.get("gender", "")),
            "nationality": nat1,
            "nationality_2": nat2,
            "residence_country": clean(row.get("country", "")),
            "phone": clean(row.get("phone", "")),
            # soccer info
            "position": map_position(row.get("position", "")),
            "secondary_position": map_position(row.get("position_2", "")),
            "preferred_foot": clean(row.get("preferred_foot", "")),
            "height": parse_int(row.get("height", "")),
            "weight": parse_int(row.get("weight", "")),
            "current_club": clean(row.get("current_club", "")),
            # media
            "highlight_video": clean(row.get("highlight_video", "")),
            "instagram": clean(row.get("instagram", "")),
            # misc
            "full_game_videos": [],
            "looking_for": [],
        }

        try:
            await db.users.insert_one(user_doc)
            await db.players.insert_one(player_doc)
            created += 1
            print(f"  [{i}] Created: {email}")
        except Exception as e:
            errors.append(f"{email}: {e}")
            print(f"  [{i}] ERROR {email}: {e}")

    client.close()

    print()
    print("=" * 50)
    print(f"  Created : {created}")
    print(f"  Skipped : {skipped}")
    print(f"  Errors  : {len(errors)}")
    if errors:
        for e in errors:
            print(f"    {e}")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(migrate())

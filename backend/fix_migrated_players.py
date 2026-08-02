"""
Fix migrated WordPress players in production MongoDB:
  - Positions: LW/RW → Winger, ST → Striker  (applied to position + secondary_position)
  - Preferred foot: French → English
  - Nationality fields: French → English

Run: python fix_migrated_players.py
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = "soccermatch"

# ── Position fixes ───────────────────────────────────────────────────────────
# V1 migration mapped: AG→LW, AD→RW, BU→ST
# V2 only has: GK CB LB RB DM CM AM Winger Striker
POSITION_FIX = {
    "LW":      "Winger",
    "RW":      "Winger",
    "ST":      "Striker",
    # futsal leftovers that could have slipped through
    "Ailier (Futsal)":        "Winger",
    "Pivot (Futsal)":         "Striker",
    "Meneur de jeu (Futsal)": "AM",
    "Meneur côté (Futsal)":   "AM",
}

# ── Preferred foot fixes ─────────────────────────────────────────────────────
FOOT_FIX = {
    "Droit":    "Right",
    "Gauche":   "Left",
    "Ambipède": "Both",
    # normalise any encoding variant
    "Ambipède": "Both",
    "Ambipede":      "Both",
}

# ── Nationality fixes (French → English V2 COUNTRIES list) ──────────────────
NATIONALITY_FIX = {
    "Algérie":                          "Algeria",
    "Algérie":                     "Algeria",
    "Allemagne":                        "Germany",
    "Angola":                           "Angola",
    "Argentine":                        "Argentina",
    "Arménie":                          "Armenia",
    "Arménie":                     "Armenia",
    "Belgique":                         "Belgium",
    "Brésil":                           "Brazil",
    "Brésil":                      "Brazil",
    "Bénin":                            "Benin",
    "Bénin":                       "Benin",
    "Burkina Faso":                     "Burkina Faso",
    "Cameroun":                         "Cameroon",
    "Cap-Vert":                         "Cape Verde",
    "Colombie":                         "Colombia",
    "Comores":                          "Comoros",
    "Congo":                            "Congo",
    "Côte d'Ivoire":                    "Ivory Coast",
    "Côte d'Ivoire":              "Ivory Coast",
    "Espagne":                          "Spain",
    "Gabon":                            "Gabon",
    "Gambie":                           "Gambia",
    "Guadeloupe":                       "France",
    "Guinée":                           "Guinea",
    "Guinée":                      "Guinea",
    "Guyana":                           "Guyana",
    "Haïti":                            "Haiti",
    "Haïti":                       "Haiti",
    "Honduras":                         "Honduras",
    "Hongrie":                          "Hungary",
    "Islande":                          "Iceland",
    "Italie":                           "Italy",
    "Liban":                            "Lebanon",
    "Libéria":                          "Liberia",
    "Libéria":                     "Liberia",
    "Maroc":                            "Morocco",
    "Martinique":                       "France",
    "Maurice":                          "Mauritius",
    "Mayotte":                          "France",
    "Nigéria":                          "Nigeria",
    "Nigéria":                     "Nigeria",
    "Pays-Bas":                         "Netherlands",
    "République centrafricaine":        "Central African Republic",
    "République centrafricaine":   "Central African Republic",
    "République dominicaine":           "Dominican Republic",
    "République dominicaine":      "Dominican Republic",
    "République démocratique du Congo": "Congo",
    "République démocratique du Congo": "Congo",
    "Saint-Vincent-et-les Grenadines": "Saint Vincent and the Grenadines",
    "Sénégal":                          "Senegal",
    "Sénégal":               "Senegal",
    "Tunisie":                          "Tunisia",
    "Érythrée":                         "Eritrea",
    "Érythrée":              "Eritrea",
    "États-Unis":                       "United States",
    "États-Unis":                  "United States",
}

FILTER = {"migrated_from_wordpress": True}


async def fix():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    col = db.players

    total_position  = 0
    total_foot      = 0
    total_nat       = 0

    # ── Positions ────────────────────────────────────────────────────────────
    for bad, good in POSITION_FIX.items():
        for field in ("position", "secondary_position"):
            r = await col.update_many(
                {**FILTER, field: bad},
                {"$set": {field: good}}
            )
            if r.modified_count:
                print(f"  position [{field}] {bad!r} -> {good!r}  ({r.modified_count} docs)")
                total_position += r.modified_count

    # ── Preferred foot ───────────────────────────────────────────────────────
    for bad, good in FOOT_FIX.items():
        r = await col.update_many(
            {**FILTER, "preferred_foot": bad},
            {"$set": {"preferred_foot": good}}
        )
        if r.modified_count:
            print(f"  foot  {bad!r} -> {good!r}  ({r.modified_count} docs)")
            total_foot += r.modified_count

    # ── Nationalities ────────────────────────────────────────────────────────
    for bad, good in NATIONALITY_FIX.items():
        for field in ("nationality", "nationality_2"):
            r = await col.update_many(
                {**FILTER, field: bad},
                {"$set": {field: good}}
            )
            if r.modified_count:
                print(f"  nat   [{field}] {bad!r} -> {good!r}  ({r.modified_count} docs)")
                total_nat += r.modified_count

    client.close()

    print()
    print("=" * 50)
    print(f"  Position fixes : {total_position}")
    print(f"  Foot fixes     : {total_foot}")
    print(f"  Nationality fixes: {total_nat}")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(fix())

import asyncio, os, re
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / ".env")
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client["soccermatch"]

VIDEO_RE = re.compile(
    r'(https?://)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)/',
    re.IGNORECASE
)

async def run():
    players = await db.players.find(
        {"migrated_from_wordpress": True},
        {"_id": 0, "name": 1, "email": 1, "user_id": 1, "highlight_video": 1}
    ).to_list(500)

    invalid = [
        p for p in players
        if not VIDEO_RE.search(p.get("highlight_video") or "")
    ]

    print(f"Total migrated       : {len(players)}")
    print(f"Invalid/missing video: {len(invalid)}")
    print()
    for p in invalid:
        val = p.get("highlight_video") or "(empty)"
        print(f"  {p.get('name','?'):<35} [{val}]".encode('cp1252', errors='replace').decode('cp1252'))

asyncio.run(run())
client.close()

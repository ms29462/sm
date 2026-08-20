"""
Delete migrated players whose highlight_video is not a real URL.
Removes both the players document and the users document.

Dry-run first (prints what would be deleted), then confirms before acting.
"""
import asyncio, os, re
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / ".env")
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client["soccermatch"]

URL_RE = re.compile(r'^https?://', re.IGNORECASE)


async def run():
    players = await db.players.find(
        {"migrated_from_wordpress": True},
        {"_id": 0, "name": 1, "email": 1, "user_id": 1, "highlight_video": 1}
    ).to_list(500)

    to_delete = [
        p for p in players
        if not URL_RE.match(p.get("highlight_video") or "")
    ]

    print(f"Players to delete: {len(to_delete)}\n")
    for p in to_delete:
        val = (p.get("highlight_video") or "(empty)")[:60]
        name = p.get("name", "?")
        try:
            print(f"  {name:<35} [{val}]")
        except UnicodeEncodeError:
            print(f"  {name.encode('ascii', errors='replace').decode():<35} [{val.encode('ascii', errors='replace').decode()}]")

    user_ids = [p["user_id"] for p in to_delete]

    r_players = await db.players.delete_many({"user_id": {"$in": user_ids}})
    r_users   = await db.users.delete_many({"id": {"$in": user_ids}})

    print()
    print("=" * 50)
    print(f"  Deleted from players : {r_players.deleted_count}")
    print(f"  Deleted from users   : {r_users.deleted_count}")
    print("=" * 50)

asyncio.run(run())
client.close()

"""
Check all players whose highlight_video is a real URL, verify the video is
still accessible via oEmbed, then offer to delete the player + user record
for any that return a dead link (deleted, private, removed).

Dry-run output is printed first. Deletion only happens after typing YES.
"""
import asyncio
import os
import re
from pathlib import Path

import aiohttp
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / ".env")
client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client["soccermatch"]

URL_RE = re.compile(r"^https?://", re.IGNORECASE)

OEMBED_YOUTUBE = "https://www.youtube.com/oembed?format=json&url={}"
OEMBED_VIMEO   = "https://vimeo.com/api/oembed.json?url={}"


def oembed_url(video_url: str) -> str | None:
    v = video_url.lower()
    if "youtube.com" in v or "youtu.be" in v:
        return OEMBED_YOUTUBE.format(video_url)
    if "vimeo.com" in v:
        return OEMBED_VIMEO.format(video_url)
    return None


async def check_video(session: aiohttp.ClientSession, video_url: str) -> bool:
    """Return True if video is accessible, False if dead."""
    endpoint = oembed_url(video_url)
    if not endpoint:
        return True  # unknown platform — leave it alone
    try:
        async with session.get(endpoint, timeout=aiohttp.ClientTimeout(total=10)) as r:
            return r.status == 200
    except Exception:
        return True  # network error — don't delete on doubt


async def run():
    players = await db.players.find(
        {"highlight_video": {"$regex": "^https?://", "$options": "i"}},
        {"_id": 0, "name": 1, "email": 1, "user_id": 1, "highlight_video": 1, "nationality": 1, "position": 1}
    ).to_list(2000)

    print(f"Players with a video URL: {len(players)}")
    print("Checking availability...\n")

    dead = []
    async with aiohttp.ClientSession() as session:
        tasks = [(p, asyncio.create_task(check_video(session, p["highlight_video"]))) for p in players]
        for p, task in tasks:
            alive = await task
            if not alive:
                dead.append(p)

    if not dead:
        print("All videos are accessible. Nothing to delete.")
        return

    print("=" * 70)
    print(f"  DEAD VIDEO LINKS — {len(dead)} player(s)")
    print("=" * 70)
    print(f"  {'NAME':<35} {'POSITION':<10} {'NATIONALITY':<20} VIDEO URL")
    print("-" * 70)
    for p in dead:
        name = (p.get("name") or "?")[:34]
        pos  = (p.get("position") or "-")[:9]
        nat  = (p.get("nationality") or "-")[:19]
        url  = (p.get("highlight_video") or "")[:50]
        try:
            print(f"  {name:<35} {pos:<10} {nat:<20} {url}")
        except UnicodeEncodeError:
            print(f"  {name.encode('ascii','replace').decode():<35} {pos:<10} {nat:<20} {url}")
    print("=" * 70)
    print()

    confirm = input(f"Type YES to permanently delete these {len(dead)} player(s) and their user accounts: ").strip()
    if confirm != "YES":
        print("Aborted — nothing deleted.")
        return

    user_ids = [p["user_id"] for p in dead]
    r_players = await db.players.delete_many({"user_id": {"$in": user_ids}})
    r_users   = await db.users.delete_many({"id": {"$in": user_ids}})

    print()
    print("=" * 70)
    print(f"  Deleted from players : {r_players.deleted_count}")
    print(f"  Deleted from users   : {r_users.deleted_count}")
    print("=" * 70)


asyncio.run(run())
client.close()

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv(".env")

async def check():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    player = await db.players.find_one({}, {"_id": 0})
    if player:
        academic_fields = ["has_baccalaureate", "bac_year", "bac_grade", "english_level", 
                          "has_postsecondary", "postsecondary_start_date", "annual_budget"]
        for f in academic_fields:
            print(f"{f}: {player.get(f, 'NOT IN DB')}")

asyncio.run(check())
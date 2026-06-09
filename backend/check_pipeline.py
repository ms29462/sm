import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
load_dotenv()

async def check():
    client = AsyncIOMotorClient(os.environ.get('MONGODB_URL'))
    db = client[os.environ.get('DB_NAME', 'soccermatch')]
    entries = await db.pipeline.find({}, {'_id': 0}).to_list(10)
    for e in entries:
        print(e.get('org_id'), '|', e.get('player_id'), '|', e.get('stage'), '|', e.get('opportunity_id'))

asyncio.run(check())
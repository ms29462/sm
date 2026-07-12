with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

# Sort chat requests oldest to newest
content = content.replace(
    'requests = await db.chat_requests.find({"player_id": user_id}, {"_id": 0}).to_list(100)',
    'requests = await db.chat_requests.find({"player_id": user_id}, {"_id": 0}).sort("created_at", 1).to_list(100)'
)
content = content.replace(
    'requests = await db.chat_requests.find({"requester_id": user_id}, {"_id": 0}).to_list(100)',
    'requests = await db.chat_requests.find({"requester_id": user_id}, {"_id": 0}).sort("created_at", 1).to_list(100)'
)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
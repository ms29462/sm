with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '        # Notify requester about rejection\n        if requester_id:\n            await db.notifications.insert_one({\n                "id": str(uuid.uuid4()),\n                "user_id": requester_id,\n                "type": "chat_request_rejected",\n                "title": "Chat Request Update",\n                "message": "The player has declined your chat request",',
    '''        # Notify requester about rejection
        if requester_id:
            # Get player name
            player_doc = await db.players.find_one({"user_id": chat_request.get("player_id")}, {"_id": 0, "name": 1})
            player_name = player_doc.get("name", "The player") if player_doc else "The player"
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": requester_id,
                "type": "chat_request_rejected",
                "title": "Chat Request Update",
                "message": f"{player_name} has declined your chat request",'''
)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

# Fix player update to allow False values for boolean fields
old = """    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
      
          player = await db.players.find_one({"user_id": current_user['user_id']}, {"_id": 0})"""

new = """    update_data = {k: v for k, v in update.model_dump().items() if v is not None or isinstance(v, bool)}
      
          player = await db.players.find_one({"user_id": current_user['user_id']}, {"_id": 0})"""

content = content.replace(old, new)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
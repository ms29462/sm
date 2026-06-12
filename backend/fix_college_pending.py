with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

# Add college pending check in login
content = content.replace(
    "    # Check if club is pending review\n    if user['role'] == 'club':",
    "    # Check if club or college is pending review\n    if user['role'] in ['club', 'college']:"
)

content = content.replace(
    "        club = await db.clubs.find_one({\"user_id\": user_id}, {\"_id\": 0})\n        if club and club.get('status') == 'pending':",
    "        club = await db.clubs.find_one({\"user_id\": user_id}, {\"_id\": 0})\n        college = await db.colleges.find_one({\"user_id\": user_id}, {\"_id\": 0}) if not club else None\n        org = club or college\n        if org and org.get('status') == 'pending':"
)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Backend Done!")
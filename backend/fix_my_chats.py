with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    """    if role == 'player':
        my_rooms = [r for r in rooms if r.player_id == user_id]
    elif role == 'club':
        my_rooms = [r for r in rooms if r.club_id == user_id]
    else:
        my_rooms = []""",
    """    if role == 'player':
        my_rooms = [r for r in rooms if r.player_id == user_id]
    else:
        # club, specialist, agent, federation, college, analyst all use club_id
        my_rooms = [r for r in rooms if r.club_id == user_id]"""
)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
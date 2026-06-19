with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()
idx = content.find("class ChatRoomManager") 
if idx == -1:
    idx = content.find("chat_room_manager =")
print(repr(content[idx:idx+800]))
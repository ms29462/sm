with open(r"C:\Users\Lenovo\sm\backend\chat_video_manager.py", "r", encoding="utf-8") as f:
    content = f.read()
idx = content.find("class ChatRoomManager")
print(repr(content[idx:idx+1200]))
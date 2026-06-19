with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()
idx = content.find("ChatRoomManager")
print(repr(content[idx-50:idx+1500]))
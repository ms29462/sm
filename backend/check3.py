with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()
import re
matches = list(re.finditer(r'class ChatRoomManager', content))
for m in matches:
    print(repr(content[m.start():m.start()+1000]))
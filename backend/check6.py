with open(r"C:\Users\Lenovo\sm\backend\chat_video_manager.py", "r", encoding="utf-8") as f:
    content = f.read()
import re
matches = list(re.finditer(r'async def \w+', content))
for m in matches:
    print(repr(content[m.start():m.start()+60]))
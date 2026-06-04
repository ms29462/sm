with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()
idx = content.find('@api_router.get("/my-chats")')
print(repr(content[idx:idx+600]))
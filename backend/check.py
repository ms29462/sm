with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()
idx = content.find("role == 'college'")
print(repr(content[idx-50:idx+300]) if idx >= 0 else "NOT FOUND")
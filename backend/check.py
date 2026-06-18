with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()
idx = content.find('"/player/credits/claim-reward"')
print(repr(content[idx:idx+400]))
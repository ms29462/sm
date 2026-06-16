with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '        {"$or": [{"status": "active"}, {"status": {"$exists": False}}, {"status": None}]},',
    '        {},  # Match ALL opportunities'
)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
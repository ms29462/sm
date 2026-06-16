with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

# Fix migration to also catch opportunities with no status
content = content.replace(
    '        {"status": "active"},',
    '        {"$or": [{"status": "active"}, {"status": {"$exists": False}}, {"status": None}]},'
)

# Fix player query - show only published OR opportunities with no status yet (backwards compat)
content = content.replace(
    'query = {"status": "published"}',
    'query = {"status": "published"}'
)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
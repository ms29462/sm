with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

old = "    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),"
new = """    allow_origins=[
        "https://www.soccer-match.org",
        "https://soccer-match.org",
        "http://localhost:3000",
        "*"
    ],"""

content = content.replace(old, new)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
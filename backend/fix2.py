with open(r"C:\Users\Lenovo\sm\backend\server.py", "r", encoding="utf-8") as f:
    content = f.read()

# Sort chat requests newest to oldest (change from 1 to -1)
content = content.replace(
    '.sort("created_at", 1).to_list(100)',
    '.sort("created_at", -1).to_list(100)'
)

with open(r"C:\Users\Lenovo\sm\backend\server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
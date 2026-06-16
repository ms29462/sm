with open(r"C:\Users\Lenovo\sm\backend\email_service.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'FROM_EMAIL = "Soccer Match <noreply@soccermatch.app>"',
    'FROM_EMAIL = "Soccer Match <noreply@soccer-match.org>"'
)

with open(r"C:\Users\Lenovo\sm\backend\email_service.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
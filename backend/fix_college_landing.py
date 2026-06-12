with open(r"C:\Users\Lenovo\sm\frontend\src\pages\Landing.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'path: "/register?role=college"',
    'path: "/college-register"'
)

with open(r"C:\Users\Lenovo\sm\frontend\src\pages\Landing.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Landing Done!")
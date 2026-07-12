with open(r"C:\Users\Lenovo\sm\frontend\src\components\chat\ChatRoom.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "sender_name: user.name || user.email",
    "sender_name: user.name || 'User'"
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\chat\ChatRoom.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
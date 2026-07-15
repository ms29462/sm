with open(r"C:\Users\Lenovo\sm\frontend\src\components\chat\ChatRoom.js", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '{message.sender_role === "player" ? message.sender_name : "Scout / Organization"}',
    '{message.sender_role === "player" ? (message.sender_name || "Player") : (message.sender_name || "Organization")}'
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\chat\ChatRoom.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
with open(r"C:\Users\Lenovo\sm\frontend\src\components\mobile\MobileBottomNav.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add Analytics to federation nav (replace Teams with Analytics or add it)
content = content.replace(
    "    { path: '/federation/teams', icon: Shield, label: 'Teams' },\n    { path: '/federation/chats', icon: MessageCircle, label: 'Chats' }\n  ],",
    "    { path: '/federation/analytics', icon: Activity, label: 'Analytics' },\n    { path: '/federation/chats', icon: MessageCircle, label: 'Chats' }\n  ],"
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\mobile\MobileBottomNav.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
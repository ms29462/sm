with open(r"C:\Users\Lenovo\sm\frontend\src\components\mobile\MobileBottomNav.js", "r", encoding="utf-8") as f:
    content = f.read()

# Fix player nav labels
content = content.replace("{ path: '/player/opportunities', icon: FileText, label: 'Jobs' }", "{ path: '/player/opportunities', icon: FileText, label: 'Opportunities' }")
content = content.replace("{ path: '/player/masterclass', icon: GraduationCap, label: 'Learn' }", "{ path: '/player/masterclass', icon: GraduationCap, label: 'Masterclass' }")
content = content.replace("{ path: '/player/chat-requests', icon: MessageCircle, label: 'Chat' }", "{ path: '/player/chat-requests', icon: MessageCircle, label: 'Chats' }")

# Fix club nav labels
content = content.replace("{ path: '/club/applications', icon: FileText, label: 'Apps' }", "{ path: '/club/applications', icon: FileText, label: 'Applications' }")
content = content.replace("{ path: '/club/scouting', icon: Target, label: 'Scout' }", "{ path: '/club/scouting', icon: Target, label: 'Scouting' }")
content = content.replace("{ path: '/club/chats', icon: MessageCircle, label: 'Chats' }", "{ path: '/club/chats', icon: MessageCircle, label: 'Chats' }")

# Fix federation nav labels  
content = content.replace("{ path: '/federation/scouting', icon: Target, label: 'Scout' }", "{ path: '/federation/scouting', icon: Target, label: 'Scouting' }")

# Fix college nav labels
content = content.replace("{ path: '/college/scouting', icon: Target, label: 'Scout' }", "{ path: '/college/scouting', icon: Target, label: 'Scouting' }")

with open(r"C:\Users\Lenovo\sm\frontend\src\components\mobile\MobileBottomNav.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
# Fix MobileBottomNav - add Scouting Hub for club/college/federation
with open(r"C:\Users\Lenovo\sm\frontend\src\components\mobile\MobileBottomNav.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add Target icon import
content = content.replace(
    "import { Home, User, Users, Heart, FileText, Settings, MessageCircle, Briefcase, Activity, GraduationCap, Flag, Building, Shield } from 'lucide-react';",
    "import { Home, User, Users, Heart, FileText, Settings, MessageCircle, Briefcase, Activity, GraduationCap, Flag, Building, Shield, Target } from 'lucide-react';"
)

# Update club nav to include scouting
content = content.replace(
    """  club: [
    { path: '/club/dashboard', icon: Home, label: 'Home' },
    { path: '/club/profile', icon: Building, label: 'Profile' },
    { path: '/club/players', icon: Users, label: 'Players' },
    { path: '/club/favorites', icon: Heart, label: 'Saved' },
    { path: '/club/opportunities', icon: FileText, label: 'Posts' }
  ],""",
    """  club: [
    { path: '/club/dashboard', icon: Home, label: 'Home' },
    { path: '/club/players', icon: Users, label: 'Players' },
    { path: '/club/scouting', icon: Target, label: 'Scout' },
    { path: '/club/applications', icon: FileText, label: 'Apps' },
    { path: '/club/chats', icon: MessageCircle, label: 'Chats' }
  ],"""
)

# Add college nav
content = content.replace(
    """  federation: [""",
    """  college: [
    { path: '/college/dashboard', icon: Home, label: 'Home' },
    { path: '/college/players', icon: Users, label: 'Players' },
    { path: '/college/scouting', icon: Target, label: 'Scout' },
    { path: '/college/chats', icon: MessageCircle, label: 'Chats' },
    { path: '/college/profile', icon: Building, label: 'Profile' }
  ],
  federation: ["""
)

# Update federation nav
content = content.replace(
    """  federation: [
    { path: '/federation/dashboard', icon: Home, label: 'Home' },
    { path: '/federation/profile', icon: Flag, label: 'Profile' },
    { path: '/federation/players', icon: Users, label: 'Scout' },
    { path: '/federation/favorites', icon: Heart, label: 'Saved' },
    { path: '/federation/teams', icon: Shield, label: 'Teams' }
  ],""",
    """  federation: [
    { path: '/federation/dashboard', icon: Home, label: 'Home' },
    { path: '/federation/players', icon: Users, label: 'Players' },
    { path: '/federation/scouting', icon: Target, label: 'Scout' },
    { path: '/federation/teams', icon: Shield, label: 'Teams' },
    { path: '/federation/chats', icon: MessageCircle, label: 'Chats' }
  ],"""
)

with open(r"C:\Users\Lenovo\sm\frontend\src\components\mobile\MobileBottomNav.js", "w", encoding="utf-8") as f:
    f.write(content)
print("BottomNav Done!")
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Users, Heart, FileText, Settings, MessageCircle, Briefcase, Activity, GraduationCap, Flag, Building, Shield, Target, Star } from 'lucide-react';

const MobileNavConfig = {
  player: [
    { path: '/player/dashboard', icon: Home, label: 'Home' },
    { path: '/player/profile', icon: User, label: 'Profile' },
    { path: '/player/opportunities', icon: FileText, label: 'Opportunities' },
    { path: '/player/credits', icon: Star, label: 'Credits' },
    { path: '/player/specialists', icon: Users, label: 'Experts' },
    { path: '/player/analytics', icon: Activity, label: 'Analytics' },
    { path: '/player/chat-requests', icon: MessageCircle, label: 'Chats' }
  ],
  club: [
    { path: '/club/dashboard', icon: Home, label: 'Home' },
    { path: '/club/players', icon: Users, label: 'Players' },
    { path: '/club/scouting', icon: Target, label: 'Scouting' },
    { path: '/club/opportunities/analytics', icon: Activity, label: 'Analytics' },
    { path: '/club/chats', icon: MessageCircle, label: 'Chats' }
  ],
  college: [
    { path: '/college/dashboard', icon: Home, label: 'Home' },
    { path: '/college/players', icon: Users, label: 'Players' },
    { path: '/college/scouting', icon: Target, label: 'Scouting' },
    { path: '/college/chats', icon: MessageCircle, label: 'Chats' },
    { path: '/college/profile', icon: Building, label: 'Profile' }
  ],
  federation: [
    { path: '/federation/dashboard', icon: Home, label: 'Home' },
    { path: '/federation/players', icon: Users, label: 'Players' },
    { path: '/federation/scouting', icon: Target, label: 'Scouting' },
    { path: '/federation/opportunities/analytics', icon: Activity, label: 'Analytics' },
    { path: '/federation/chats', icon: MessageCircle, label: 'Chats' }
  ],
  agent: [
    { path: '/agent/dashboard', icon: Home, label: 'Home' },
    { path: '/agent/profile', icon: Briefcase, label: 'Profile' },
    { path: '/agent/players', icon: Users, label: 'Players' },
    { path: '/agent/watchlist', icon: Heart, label: 'Watchlist' },
    { path: '/agent/opportunities', icon: FileText, label: 'Jobs' }
  ],
  specialist: [
    { path: '/specialist/dashboard', icon: Home, label: 'Home' },
    { path: '/specialist/profile', icon: Activity, label: 'Profile' },
    { path: '/specialist/players', icon: Users, label: 'Players' },
    { path: '/specialist/clients', icon: Heart, label: 'Clients' }
  ],
  admin: [
    { path: '/admin/dashboard', icon: Home, label: 'Home' },
    { path: '/admin/players', icon: Users, label: 'Players' },
    { path: '/admin/clubs', icon: Building, label: 'Clubs' },
    { path: '/admin/chat-requests', icon: MessageCircle, label: 'Chats' },
    { path: '/admin/masterclass', icon: GraduationCap, label: 'Learn' }
  ]
};

const MobileBottomNav = ({ role }) => {
  const location = useLocation();
  const navItems = MobileNavConfig[role] || MobileNavConfig.player;

  const isActive = (path) => location.pathname.startsWith(path.split('/').slice(0, 3).join('/'));

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50 md:hidden safe-area-bottom"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] mt-1 ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;

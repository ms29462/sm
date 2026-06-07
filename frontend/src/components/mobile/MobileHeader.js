import { useState } from 'react';
import NotificationBell from '@/components/ui/NotificationBell';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, Trophy, LogOut, ChevronRight, Home, User, Users, Heart, FileText, MessageCircle, GraduationCap, Flag, Building, Shield, Target, Briefcase, Activity, Settings } from 'lucide-react';

const NAV_LINKS = {
  player: [
    { to: '/player/news', label: 'News Feed' },
    { to: '/player/dashboard', label: 'Dashboard' },
    { to: '/player/profile', label: 'My Profile' },
    { to: '/player/opportunities', label: 'Opportunities' },
    { to: '/player/applications', label: 'My Applications' },
    { to: '/player/match-scores', label: 'Match Scores' },
    { to: '/player/kato', label: 'College Fit' },
    { to: '/player/masterclass', label: 'Masterclass' },
    { to: '/player/trials', label: 'Trial Invitations' },
    { to: '/player/chats', label: 'My Chats' },
  ],
  club: [
    { to: '/club/news', label: 'News Feed' },
    { to: '/club/dashboard', label: 'Dashboard' },
    { to: '/club/profile', label: 'My Profile' },
    { to: '/club/players', label: 'Browse Players' },
    { to: '/club/opportunities', label: 'Opportunities' },
    { to: '/club/applications', label: 'Applications' },
    { to: '/club/favorites', label: 'Favorites' },
    { to: '/club/trials', label: 'Trial Invitations' },
    { to: '/club/pipeline', label: 'Pipeline' },
    { to: '/club/scouting', label: 'Scouting Hub' },
    { to: '/club/chats', label: 'My Chats' },
  ],
  college: [
    { to: '/college/news', label: 'News Feed' },
    { to: '/college/dashboard', label: 'Dashboard' },
    { to: '/college/profile', label: 'My Profile' },
    { to: '/college/players', label: 'Browse Players' },
    { to: '/college/opportunities', label: 'Opportunities' },
    { to: '/college/applications', label: 'Applications' },
    { to: '/college/favorites', label: 'Favorites' },
    { to: '/college/trials', label: 'Trial Invitations' },
    { to: '/college/pipeline', label: 'Pipeline' },
    { to: '/college/chats', label: 'My Chats' },
  ],
  federation: [
    { to: '/federation/news', label: 'News Feed' },
    { to: '/federation/dashboard', label: 'Dashboard' },
    { to: '/federation/profile', label: 'My Profile' },
    { to: '/federation/players', label: 'Players' },
    { to: '/federation/recommended', label: 'Recommended' },
    { to: '/federation/scouting', label: 'Scouting Hub' },
    { to: '/federation/teams', label: 'Teams' },
    { to: '/federation/favorites', label: 'Favorites' },
    { to: '/federation/chats', label: 'My Chats' },
  ],
  agent: [
    { to: '/agent/news', label: 'News Feed' },
    { to: '/agent/dashboard', label: 'Dashboard' },
    { to: '/agent/profile', label: 'My Profile' },
    { to: '/agent/players', label: 'Players' },
    { to: '/agent/favorites', label: 'Favorites' },
    { to: '/agent/opportunities', label: 'Opportunities' },
  ],
  specialist: [
    { to: '/specialist/news', label: 'News Feed' },
    { to: '/specialist/dashboard', label: 'Dashboard' },
    { to: '/specialist/profile', label: 'My Profile' },
    { to: '/specialist/players', label: 'Players' },
    { to: '/specialist/favorites', label: 'Favorites' },
    { to: '/specialist/chats', label: 'Chats' },
  ],
  analyst: [
    { to: '/analyst/news', label: 'News Feed' },
    { to: '/club/home', label: 'Dashboard' },
    { to: '/analyst/profile', label: 'My Profile' },
    { to: '/analyst/players', label: 'Players' },
    { to: '/analyst/evaluations', label: 'Evaluations' },
    { to: '/analyst/scouting', label: 'Scouting Hub' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/duplicates', label: 'Duplicates' },
    { to: '/admin/news', label: 'News Feed' },
    { to: '/admin/players', label: 'Players' },
    { to: '/admin/clubs', label: 'Clubs' },
    { to: '/admin/federations', label: 'Federations' },
    { to: '/admin/agents', label: 'Agents' },
    { to: '/admin/specialists', label: 'Specialists' },
    { to: '/admin/analysts', label: 'Analysts' },
    { to: '/admin/colleges', label: 'Colleges' },
    { to: '/admin/verification', label: 'Verification' },
    { to: '/admin/opportunities', label: 'Opportunities' },
    { to: '/admin/masterclass', label: 'Masterclass' },
    { to: '/admin/videos', label: 'Videos' },
    { to: '/admin/benchmark', label: 'Benchmark' },
    { to: '/admin/chat-requests', label: 'Chat Requests' },
    { to: '/admin/chats', label: 'Chat Rooms' },
  ],
};

const getRoleLabel = (role) => {
  const labels = { player: 'Player', club: 'Club', federation: 'Federation', agent: 'Agent', specialist: 'Specialist', admin: 'Admin', college: 'College', analyst: 'Analyst' };
  return labels[role] || '';
};

const MobileHeader = ({ title, showMenu = true, children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const confirmLogout = () => setShowLogoutConfirm(true);

  const links = NAV_LINKS[user?.role] || [];

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border md:hidden" style={{paddingTop: "env(safe-area-inset-top)"}}>
        <div className="flex items-center justify-between h-14 px-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold text-lg">{title || 'SOCCERMATCH'}</span>
          </div>
          <div className="flex items-center gap-1">
            {showMenu && (
              <button onClick={() => setMenuOpen(true)} className="p-2 text-foreground">
                <Menu className="w-6 h-6" />
              </button>
            )}
            <NotificationBell />
            <button onClick={confirmLogout} className="p-2 -mr-2 text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        {children}
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-background border-l border-border flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
              <div>
                <p className="font-heading font-bold">{user?.email?.split('@')[0]}</p>
                <p className="text-xs text-primary uppercase">{getRoleLabel(user?.role)}</p>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2 -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {links.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-sm hover:bg-white/5 transition-colors text-sm">
                  <span>{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        confirmVariant="destructive"
        onConfirm={handleLogout}
      />
    </>
  );
};

export default MobileHeader;
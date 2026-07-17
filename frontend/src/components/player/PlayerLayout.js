import { useState, useEffect } from 'react';
﻿import ConfirmDialog from '@/components/ui/ConfirmDialog';
import NotificationBell from '@/components/ui/NotificationBell';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import Badge from '@/components/ui/badge';
import { api } from '@/lib/api';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import MobileHeader from '@/components/mobile/MobileHeader';
import { Star, Trophy, User, Briefcase, FileText, LogOut, Home, MessageCircle, Video, MessageSquare, Target, Sparkles, GraduationCap, CalendarCheck , Newspaper, TrendingUp, Users } from 'lucide-react';

const PlayerLayout = ({ children }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useAuth();
  const [creditBalance, setCreditBalance] = useState(null);

  useEffect(() => {
    api.getMyCredits().then(res => setCreditBalance(res.data.balance)).catch(() => {});
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUnread, totalPending } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const confirmLogout = () => setShowLogoutConfirm(true);

  const _unused = () => {
  };

  const isActive = (path) => location.pathname.includes(path);

  return (
    <>
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Credit Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 bg-card border-b border-border/50">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-sm font-bold text-primary">{creditBalance ?? 0} credits</span>
          </div>
          <Link to="/player/credits?tab=buy" className="text-xs font-bold text-black bg-primary px-3 py-1 rounded-sm hover:bg-primary/90 transition-colors">
            Buy Credits
          </Link>
        </div>
        {/* Mobile Header */}
      <MobileHeader title="SOCCERMATCH" />

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-background fixed h-full hidden md:block">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            
            <div>
              <h1 className="text-xl font-heading font-bold tracking-tight"><img src="/logo.png" alt="Soccer Match" className="h-8 w-auto" /></h1>
              <p className="text-xs text-muted-foreground uppercase">Player Portal</p>
            </div>
          </div>
          <NotificationBell />
        </div>

        <nav className="p-4 space-y-2">
          <Link to="/player/news">
            <Button variant={isActive('/player/news') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Newspaper className="w-4 h-4 mr-3" />
              News Feed
            </Button>
          </Link>
          <Link to="/player/dashboard">
            <Button
              data-testid="nav-dashboard-btn"
              variant={isActive('/player/dashboard') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Home className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
          </Link>
          <Link to="/player/profile">
            <Button
              data-testid="nav-profile-btn"
              variant={isActive('/player/profile') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <User className="w-4 h-4 mr-3" />
              My Profile
            </Button>
          </Link>
          <Link to="/player/opportunities">
            <Button
              data-testid="nav-opportunities-btn"
              variant={isActive('/player/opportunities') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Briefcase className="w-4 h-4 mr-3" />
              Opportunities
            </Button>
          </Link>
          <Link to="/player/kato">
            <Button
              data-testid="nav-kato-btn"
              variant={isActive("/player/kato") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <GraduationCap className="w-4 h-4 mr-3" />
              College Fit
            </Button>
          </Link>
          <Link to="/player/match-scores">
            <Button
              data-testid="nav-match-scores-btn"
              variant={isActive('/player/match-scores') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Target className="w-4 h-4 mr-3" />
              Match Scores
            </Button>
          </Link>
          <Link to="/player/specialists">
            <Button variant={isActive('/player/specialists') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Users className="w-4 h-4 mr-3" />
              Specialists
            </Button>
          </Link>
          <Link to="/player/masterclass">
            <Button
              data-testid="nav-masterclass-btn"
              variant={isActive('/player/masterclass') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <GraduationCap className="w-4 h-4 mr-3" />
              Masterclass
            </Button>
          </Link>
          <Link to="/player/applications">
            <Button
              data-testid="nav-applications-btn"
              variant={isActive('/player/applications') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <FileText className="w-4 h-4 mr-3" />
              My Applications
            </Button>
          </Link>
          <Link to="/player/credits">
            <Button variant={location.pathname === "/player/credits" ? "secondary" : "ghost"} className="w-full justify-start justify-between">
              <span className="flex items-center"><Star className="w-4 h-4 mr-3" /> Credits</span>
              {creditBalance !== null && (
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-sm">{creditBalance}</span>
              )}
            </Button>
          </Link>
          <Link to="/player/analytics">
            <Button variant={location.pathname === "/player/analytics" ? "secondary" : "ghost"} className="w-full justify-start">
              <TrendingUp className="w-4 h-4 mr-3" /> Analytics
            </Button>
          </Link>
          <Link to="/player/chats">
            <Button
              data-testid="nav-chats-btn"
              variant={isActive('/player/chats') ? 'secondary' : 'ghost'}
              className="w-full justify-start relative"
            >
              <MessageCircle className="w-4 h-4 mr-3" />
              Chats
              <Badge count={totalUnread} />
            </Button>
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <Button
            data-testid="logout-btn"
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={confirmLogout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav role="player" />
    </div>
  );
};

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

export default PlayerLayout;

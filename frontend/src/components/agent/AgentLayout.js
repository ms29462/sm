import { useState } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import NotificationBell from '@/components/ui/NotificationBell';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import MobileHeader from '@/components/mobile/MobileHeader';
import { Trophy, Briefcase, Users, Heart, LogOut, Home, UserCircle, FileText } from 'lucide-react';

const AgentLayout = ({ children }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      {/* Mobile Header */}
      <MobileHeader title="SOCCERMATCH" />

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-background fixed h-full hidden md:block">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-heading font-bold tracking-tight">SOCCERMATCH</h1>
              <p className="text-xs text-muted-foreground uppercase flex items-center">
                <Briefcase className="w-3 h-3 mr-1" />
                Agent Portal
              </p>
            </div>
          </div>
          <NotificationBell />
        </div>

        <nav className="p-4 space-y-2">
          <Link to="/agent/dashboard">
            <Button
              data-testid="nav-dashboard-btn"
              variant={isActive('/agent/dashboard') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Home className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
          </Link>
          <Link to="/agent/profile">
            <Button
              data-testid="nav-profile-btn"
              variant={isActive('/agent/profile') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <UserCircle className="w-4 h-4 mr-3" />
              My Profile
            </Button>
          </Link>
          <Link to="/agent/players">
            <Button
              data-testid="nav-players-btn"
              variant={isActive('/agent/players') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Users className="w-4 h-4 mr-3" />
              Search Players
            </Button>
          </Link>
          <Link to="/agent/watchlist">
            <Button
              data-testid="nav-watchlist-btn"
              variant={isActive('/agent/watchlist') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Heart className="w-4 h-4 mr-3" />
              Watchlist
            </Button>
          </Link>
          <Link to="/agent/opportunities">
            <Button
              data-testid="nav-opportunities-btn"
              variant={isActive('/agent/opportunities') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <FileText className="w-4 h-4 mr-3" />
              Opportunities
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
      <MobileBottomNav role="agent" />
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

export default AgentLayout;

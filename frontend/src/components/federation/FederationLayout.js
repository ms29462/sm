import { useState } from 'react';
﻿import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import MobileHeader from '@/components/mobile/MobileHeader';
import { Trophy, Flag, Users, Heart, Briefcase, LogOut, Home, UserCircle, FolderOpen, Sparkles } from 'lucide-react';

const FederationLayout = ({ children }) => {
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
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-heading font-bold tracking-tight">SOCCERMATCH</h1>
              <p className="text-xs text-muted-foreground uppercase flex items-center">
                <Flag className="w-3 h-3 mr-1" />
                Federation Portal
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <Link to="/federation/dashboard">
            <Button
              data-testid="nav-dashboard-btn"
              variant={isActive('/federation/dashboard') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Home className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
          </Link>
          <Link to="/federation/profile">
            <Button
              data-testid="nav-profile-btn"
              variant={isActive('/federation/profile') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <UserCircle className="w-4 h-4 mr-3" />
              Federation Profile
            </Button>
          </Link>
          <Link to="/federation/players">
            <Button
              data-testid="nav-players-btn"
              variant={isActive('/federation/players') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Users className="w-4 h-4 mr-3" />
              Search Players
            </Button>
          </Link>
          <Link to="/federation/recommended">
            <Button
              data-testid="nav-recommended-btn"
              variant={isActive('/federation/recommended') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Briefcase className="w-4 h-4 mr-3" />
              Recommended Players
            </Button>
          </Link>
          <Link to="/federation/scouting">
            <Button
              data-testid="nav-scouting-btn"
              variant={isActive('/federation/scouting') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Heart className="w-4 h-4 mr-3" />
              Scouting List
            </Button>
          </Link>
          <Link to="/federation/teams">
            <Button
              data-testid="nav-teams-btn"
              variant={isActive('/federation/teams') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <FolderOpen className="w-4 h-4 mr-3" />
              Team Groups
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
      <MobileBottomNav role="federation" />
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

export default FederationLayout;


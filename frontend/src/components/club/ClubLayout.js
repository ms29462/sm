import { useState } from 'react';
﻿import ConfirmDialog from '@/components/ui/ConfirmDialog';
import NotificationBell from '@/components/ui/NotificationBell';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import Badge from '@/components/ui/badge';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import MobileHeader from '@/components/mobile/MobileHeader';
import { Trophy, Building, Briefcase, Users, FileText, Heart, LogOut, Home, MessageCircle, Video, Sparkles , Target , Kanban } from 'lucide-react';

const ClubLayout = ({ children, isCollege = false }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useAuth();
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
      {/* Mobile Header */}
      <MobileHeader title="SOCCERMATCH" />

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-background fixed h-full hidden md:block">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-heading font-bold tracking-tight">SOCCERMATCH</h1>
              <p className="text-xs text-muted-foreground uppercase">{isCollege ? "College Portal" : "Club Portal"}</p>
            </div>
          </div>
          <NotificationBell />
        </div>

        <nav className="p-4 space-y-2">
          <Link to={isCollege ? "/college/dashboard" : "/club/dashboard"}>
            <Button
              data-testid="nav-dashboard-btn"
              variant={isActive('/club/dashboard') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Home className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
          </Link>
          <Link to={isCollege ? "/college/profile" : "/club/profile"}>
            <Button
              data-testid="nav-profile-btn"
              variant={isActive('/club/profile') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Building className="w-4 h-4 mr-3" />
              Club Profile
            </Button>
          </Link>
          <Link to={isCollege ? "/college/opportunities" : "/club/opportunities"}>
            <Button
              data-testid="nav-opportunities-btn"
              variant={isActive('/club/opportunities') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Briefcase className="w-4 h-4 mr-3" />
              Opportunities
            </Button>
          </Link>
          <Link to={isCollege ? "/college/players" : "/club/players"}>
            <Button
              data-testid="nav-players-btn"
              variant={isActive('/club/players') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Users className="w-4 h-4 mr-3" />
              Browse Players
            </Button>
          </Link>
          <Link to={isCollege ? "/college/applications" : "/club/applications"}>
            <Button
              data-testid="nav-applications-btn"
              variant={isActive('/club/applications') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <FileText className="w-4 h-4 mr-3" />
              Applications
            </Button>
          </Link>
          <Link to={isCollege ? "/college/favorites" : "/club/favorites"}>
            <Button
              data-testid="nav-favorites-btn"
              variant={isActive('/club/favorites') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Heart className="w-4 h-4 mr-3" />
              Favorites
            </Button>
          </Link>
          <Link to={isCollege ? "/college/pipeline" : "/club/pipeline"}>
            <Button
              variant={isActive("/club/pipeline") || isActive("/college/pipeline") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Kanban className="w-4 h-4 mr-3" />
              Pipeline
            </Button>
          </Link>
          <Link to={isCollege ? "/college/scouting" : "/club/scouting"}>
            <Button
              variant={isActive("/club/scouting") || isActive("/college/scouting") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Target className="w-4 h-4 mr-3" />
              Scouting Hub
            </Button>
          </Link>
          <Link to={isCollege ? "/college/chats" : "/club/chats"}>
            <Button
              data-testid="nav-chats-btn"
              variant={isActive('/club/chats') ? 'secondary' : 'ghost'}
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
      <MobileBottomNav role="club" />
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

export default ClubLayout;


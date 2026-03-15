import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Trophy, Briefcase, Users, Heart, LogOut, Home, UserCircle, FileText } from 'lucide-react';

const AgentLayout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-border bg-background fixed h-full hidden md:block">
        <div className="p-6 border-b border-border">
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
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64">
        {children}
      </main>
    </div>
  );
};

export default AgentLayout;

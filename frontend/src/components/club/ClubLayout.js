import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Trophy, Building, Briefcase, Users, FileText, Heart, LogOut, Home } from 'lucide-react';

const ClubLayout = ({ children }) => {
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
              <p className="text-xs text-muted-foreground uppercase">Club Portal</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <Link to="/club/dashboard">
            <Button
              data-testid="nav-dashboard-btn"
              variant={isActive('/club/dashboard') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Home className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
          </Link>
          <Link to="/club/profile">
            <Button
              data-testid="nav-profile-btn"
              variant={isActive('/club/profile') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Building className="w-4 h-4 mr-3" />
              Club Profile
            </Button>
          </Link>
          <Link to="/club/opportunities">
            <Button
              data-testid="nav-opportunities-btn"
              variant={isActive('/club/opportunities') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Briefcase className="w-4 h-4 mr-3" />
              Opportunities
            </Button>
          </Link>
          <Link to="/club/players">
            <Button
              data-testid="nav-players-btn"
              variant={isActive('/club/players') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Users className="w-4 h-4 mr-3" />
              Browse Players
            </Button>
          </Link>
          <Link to="/club/applications">
            <Button
              data-testid="nav-applications-btn"
              variant={isActive('/club/applications') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <FileText className="w-4 h-4 mr-3" />
              Applications
            </Button>
          </Link>
          <Link to="/club/favorites">
            <Button
              data-testid="nav-favorites-btn"
              variant={isActive('/club/favorites') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Heart className="w-4 h-4 mr-3" />
              Favorites
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

export default ClubLayout;
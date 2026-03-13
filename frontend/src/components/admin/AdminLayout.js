import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Trophy, Shield, Users, Building, Briefcase, LogOut, MessageCircle, Video, MessageSquare, Database } from 'lucide-react';

const AdminLayout = ({ children }) => {
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
                <Shield className="w-3 h-3 mr-1" />
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <Link to="/admin/dashboard">
            <Button
              data-testid="nav-dashboard-btn"
              variant={isActive('/admin/dashboard') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Shield className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
          </Link>
          <Link to="/admin/players">
            <Button
              data-testid="nav-players-btn"
              variant={isActive('/admin/players') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Users className="w-4 h-4 mr-3" />
              Players
            </Button>
          </Link>
          <Link to="/admin/clubs">
            <Button
              data-testid="nav-clubs-btn"
              variant={isActive('/admin/clubs') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Building className="w-4 h-4 mr-3" />
              Clubs
            </Button>
          </Link>
          <Link to="/admin/opportunities">
            <Button
              data-testid="nav-opportunities-btn"
              variant={isActive('/admin/opportunities') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Briefcase className="w-4 h-4 mr-3" />
              Opportunities
            </Button>
          </Link>
          <Link to="/admin/chat-requests">
            <Button
              data-testid="nav-chat-requests-btn"
              variant={isActive('/admin/chat-requests') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <MessageSquare className="w-4 h-4 mr-3" />
              Chat Requests
            </Button>
          </Link>
          <Link to="/admin/chats">
            <Button
              data-testid="nav-chats-btn"
              variant={isActive('/admin/chats') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <MessageCircle className="w-4 h-4 mr-3" />
              Chat Rooms
            </Button>
          </Link>
          <Link to="/admin/videos">
            <Button
              data-testid="nav-videos-btn"
              variant={isActive('/admin/videos') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Video className="w-4 h-4 mr-3" />
              Video Sessions
            </Button>
          </Link>
          <Link to="/admin/benchmark">
            <Button
              data-testid="nav-benchmark-btn"
              variant={isActive('/admin/benchmark') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Database className="w-4 h-4 mr-3" />
              Benchmark Data
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

export default AdminLayout;
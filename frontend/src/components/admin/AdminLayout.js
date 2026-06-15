import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import MobileHeader from '@/components/mobile/MobileHeader';
import { Trophy, Shield, Users, Building, Flag, Briefcase, LogOut, MessageCircle, Video, MessageSquare, Database, GraduationCap, Activity, ShieldCheck, Newspaper, Copy } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <MobileHeader title="ADMIN PANEL" />

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-background fixed h-full hidden md:block">
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            
            <div>
              <h1 className="text-xl font-heading font-bold tracking-tight"><img src="/logo.png" alt="Soccer Match" className="h-7 w-auto" /></h1>
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
          <Link to="/admin/club-applications">
            <Button
              data-testid="nav-clubs-btn"
              variant={isActive('/admin/club-applications') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Building className="w-4 h-4 mr-3" />
              Clubs
            </Button>
          </Link>
          <Link to="/admin/federations">
            <Button
              data-testid="nav-federations-btn"
              variant={isActive('/admin/federations') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Flag className="w-4 h-4 mr-3" />
              Federations
            </Button>
          </Link>
          <Link to="/admin/subscriptions">
            <Button variant={isActive('/admin/subscriptions') ? 'secondary' : 'ghost'} className="w-full justify-start">
              Subscriptions
            </Button>
          </Link>
          <Link to="/admin/analyst-management">
            <Button variant={isActive('/admin/analyst-management') ? 'secondary' : 'ghost'} className="w-full justify-start">
              Analyst Management
            </Button>
          </Link>
          <Link to="/admin/analysts">
            <Button variant={isActive('/admin/analysts') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Activity className="w-4 h-4 mr-3" />
              Analysts
            </Button>
          </Link>
          <Link to="/admin/agents">
            <Button
              data-testid="nav-agents-btn"
              variant={isActive('/admin/agents') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Briefcase className="w-4 h-4 mr-3" />
              Agents
            </Button>
          </Link>
          <Link to="/admin/specialists">
            <Button
              data-testid="nav-specialists-btn"
              variant={isActive('/admin/specialists') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Activity className="w-4 h-4 mr-3" />
              Specialists
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
          <Link to="/admin/colleges">
            <Button variant={isActive('/admin/colleges') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <GraduationCap className="w-4 h-4 mr-3" />
              Colleges
            </Button>
          </Link>
          

          <Link to="/admin/duplicates">
            <Button variant={isActive('/admin/duplicates') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Copy className="w-4 h-4 mr-3" />
              Duplicates
            </Button>
          </Link>
          <Link to="/admin/news">
            <Button variant={isActive('/admin/news') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Newspaper className="w-4 h-4 mr-3" />
              News Feed
            </Button>
          </Link>
          <Link to="/admin/verification">
            <Button variant={isActive('/admin/verification') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <ShieldCheck className="w-4 h-4 mr-3" />
              Verification
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
          <Link to="/admin/masterclass">
            <Button
              data-testid="nav-masterclass-btn"
              variant={isActive('/admin/masterclass') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <GraduationCap className="w-4 h-4 mr-3" />
              Masterclass
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

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav role="admin" />
    </div>
  );
};

export default AdminLayout;
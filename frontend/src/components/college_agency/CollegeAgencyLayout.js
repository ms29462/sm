import { useState } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import NotificationBell from '@/components/ui/NotificationBell';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import Badge from '@/components/ui/badge';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import MobileHeader from '@/components/mobile/MobileHeader';
import { Building, Briefcase, Users, FileText, Heart, LogOut, Home, MessageCircle, Target, Kanban, Newspaper, TrendingUp, CreditCard } from 'lucide-react';

const CollegeAgencyLayout = ({ children }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUnread, unreadChatRequests } = useNotifications();

  const handleLogout = () => { logout(); navigate('/'); };
  const confirmLogout = () => setShowLogoutConfirm(true);
  const isActive = (path) => location.pathname.includes(path);

  return (
    <>
    <div className="h-screen overflow-hidden flex flex-col md:flex-row">
      <MobileHeader title="SOCCERMATCH" />
      <aside className="w-64 border-r border-border bg-background fixed h-full hidden md:block">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-xl font-heading font-bold tracking-tight"><img src="/logo.png" alt="Soccer Match" className="h-8 w-auto" /></h1>
              <p className="text-xs text-muted-foreground uppercase">College Agency Portal</p>
            </div>
          </div>
          <NotificationBell />
        </div>

        <nav className="p-4 space-y-2">
          <Link to="/college-agency/news">
            <Button variant={isActive('/college-agency/news') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Newspaper className="w-4 h-4 mr-3" /> News Feed
            </Button>
          </Link>
          <Link to="/college-agency/dashboard">
            <Button variant={isActive('/college-agency/dashboard') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Home className="w-4 h-4 mr-3" /> Dashboard
            </Button>
          </Link>
          <Link to="/college-agency/profile">
            <Button variant={isActive('/college-agency/profile') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Building className="w-4 h-4 mr-3" /> Agency Profile
            </Button>
          </Link>
          <Link to="/college-agency/opportunities">
            <Button variant={isActive('/college-agency/opportunities') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Briefcase className="w-4 h-4 mr-3" /> Opportunities
            </Button>
          </Link>
          <Link to="/college-agency/opportunities/analytics">
            <Button variant={isActive('/college-agency/opportunities/analytics') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <TrendingUp className="w-4 h-4 mr-3" /> Analytics
            </Button>
          </Link>
          <Link to="/college-agency/players">
            <Button variant={isActive('/college-agency/players') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Users className="w-4 h-4 mr-3" /> Browse Players
            </Button>
          </Link>
          <Link to="/college-agency/applications">
            <Button variant={isActive('/college-agency/applications') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <FileText className="w-4 h-4 mr-3" /> Applications
            </Button>
          </Link>
          <Link to="/college-agency/favorites">
            <Button variant={isActive('/college-agency/favorites') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Heart className="w-4 h-4 mr-3" /> Favorites
            </Button>
          </Link>
          <Link to="/college-agency/pipeline">
            <Button variant={isActive('/college-agency/pipeline') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Kanban className="w-4 h-4 mr-3" /> Pipeline
            </Button>
          </Link>
          <Link to="/college-agency/scouting">
            <Button variant={isActive('/college-agency/scouting') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Target className="w-4 h-4 mr-3" /> Scouting Hub
            </Button>
          </Link>
          <Link to="/college-agency/chats">
            <Button variant={isActive('/college-agency/chats') ? 'secondary' : 'ghost'} className="w-full justify-start relative">
              <MessageCircle className="w-4 h-4 mr-3" /> Chats
              <Badge count={totalUnread + unreadChatRequests} />
            </Button>
          </Link>
          <Link to="/college-agency/subscribe">
            <Button variant={isActive('/college-agency/subscribe') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <CreditCard className="w-4 h-4 mr-3" /> Subscription
            </Button>
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={confirmLogout}>
            <LogOut className="w-4 h-4 mr-3" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 pb-20 md:pb-0 overflow-y-auto">
        {children}
      </main>

      <MobileBottomNav role="college_agency" />
    </div>
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

export default CollegeAgencyLayout;

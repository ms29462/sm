import { useState } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import NotificationBell from '@/components/ui/NotificationBell';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationContext';
import Badge from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import MobileHeader from '@/components/mobile/MobileHeader';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { Trophy, Activity, Users, Heart, LogOut, Home, UserCircle , Newspaper , MessageCircle } from 'lucide-react';

const SpecialistLayout = ({ children }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useAuth();
  const { totalUnread, unreadChatRequests } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const confirmLogout = () => setShowLogoutConfirm(true);

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
                <Activity className="w-3 h-3 mr-1" />
                {t('specialist.layout.portal')}
              </p>
            </div>
          </div>
          <NotificationBell />
        </div>

        <nav className="p-4 space-y-2">
          <Link to="/specialist/news">
            <Button variant={isActive('/specialist/news') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Newspaper className="w-4 h-4 mr-3" />
              {t('specialist.layout.news_feed')}
            </Button>
          </Link>
          <Link to="/specialist/dashboard">
            <Button
              data-testid="nav-dashboard-btn"
              variant={isActive('/specialist/dashboard') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Home className="w-4 h-4 mr-3" />
              {t('specialist.layout.dashboard')}
            </Button>
          </Link>
          <Link to="/specialist/profile">
            <Button
              data-testid="nav-profile-btn"
              variant={isActive('/specialist/profile') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <UserCircle className="w-4 h-4 mr-3" />
              {t('specialist.layout.my_profile')}
            </Button>
          </Link>
          <Link to="/specialist/players">
            <Button
              variant={isActive('/specialist/players') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Users className="w-4 h-4 mr-3" /> {t('specialist.layout.find_players')}
            </Button>
          </Link>
          <Link to="/specialist/clients">
            <Button
              data-testid="nav-clients-btn"
              variant={isActive('/specialist/clients') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Heart className="w-4 h-4 mr-3" />
              {t('specialist.layout.my_clients')}
            </Button>
          </Link>
        </nav>

          <Link to="/specialist/chats">
            <Button variant={isActive('/specialist/chats') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <MessageCircle className="w-4 h-4 mr-3" />
              {t('specialist.layout.chats')}
              <Badge count={totalUnread + unreadChatRequests} />
            </Button>
          </Link>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border space-y-2">
          <LanguageSwitcher />
          <Button
            data-testid="logout-btn"
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={confirmLogout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            {t('specialist.layout.logout')}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav role="specialist" />
    </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title={t('specialist.layout.sign_out')}
        description={t('specialist.layout.sign_out_confirm')}
        confirmLabel={t('specialist.layout.sign_out')}
        confirmVariant="destructive"
        onConfirm={handleLogout}
      />
    </>
  );
};

export default SpecialistLayout;

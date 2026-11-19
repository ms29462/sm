import { useState } from 'react';
﻿import ConfirmDialog from '@/components/ui/ConfirmDialog';
import NotificationBell from '@/components/ui/NotificationBell';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationContext';
import Badge from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import MobileHeader from '@/components/mobile/MobileHeader';
import { Trophy, Flag, Users, Heart, Briefcase, LogOut, Home, UserCircle, FolderOpen, Sparkles, Newspaper, FileText, Kanban, MessageCircle, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

const FederationLayout = ({ children }) => {
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

  const _unused = () => {
  };

  const isActive = (path) => location.pathname.includes(path);

  return (
    <>
    <div className="h-screen overflow-hidden flex flex-col md:flex-row">
      {/* Mobile Header */}
      <MobileHeader title="SOCCERMATCH" />

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-background fixed h-full hidden md:block">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            
            <div>
              <h1 className="text-xl font-heading font-bold tracking-tight"><img src="/logo.png" alt="Soccer Match" className="h-8 w-auto" /></h1>
              <p className="text-xs text-muted-foreground uppercase flex items-center">
                <Flag className="w-3 h-3 mr-1" />
                {t('federation_layout.portal_label')}
              </p>
            </div>
          </div>
          <NotificationBell />
        </div>

        <nav className="p-4 space-y-2">
          <Link to="/federation/news">
            <Button variant={isActive('/federation/news') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Newspaper className="w-4 h-4 mr-3" />
              {t('federation_layout.news_feed')}
            </Button>
          </Link>
          <Link to="/federation/dashboard">
            <Button
              data-testid="nav-dashboard-btn"
              variant={isActive('/federation/dashboard') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Home className="w-4 h-4 mr-3" />
              {t('federation_layout.dashboard')}
            </Button>
          </Link>
          <Link to="/federation/profile">
            <Button
              data-testid="nav-profile-btn"
              variant={isActive('/federation/profile') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <UserCircle className="w-4 h-4 mr-3" />
              {t('federation_layout.federation_profile')}
            </Button>
          </Link>
          <Link to="/federation/players">
            <Button
              data-testid="nav-players-btn"
              variant={isActive('/federation/players') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Users className="w-4 h-4 mr-3" />
              {t('federation_layout.search_players')}
            </Button>
          </Link>
          <Link to="/federation/recommended">
            <Button
              data-testid="nav-recommended-btn"
              variant={isActive('/federation/recommended') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Briefcase className="w-4 h-4 mr-3" />
              {t('federation_layout.recommended_players')}
            </Button>
          </Link>
          <Link to="/federation/scouting">
            <Button
              data-testid="nav-scouting-btn"
              variant={isActive('/federation/scouting') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Heart className="w-4 h-4 mr-3" />
              {t('federation_layout.scouting_list')}
            </Button>
          </Link>
          <Link to="/federation/favorites">
            <Button variant={isActive('/federation/favorites') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Heart className="w-4 h-4 mr-3" />
              {t('federation_layout.favorites')}
            </Button>
          </Link>
          <Link to="/federation/opportunities/analytics">
            <Button variant={isActive('/federation/opportunities/analytics') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <TrendingUp className="w-4 h-4 mr-3" />
              {t('federation_layout.analytics')}
            </Button>
          </Link>
          <Link to="/federation/opportunities">
            <Button variant={isActive('/federation/opportunities') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Briefcase className="w-4 h-4 mr-3" />
              {t('federation_layout.opportunities')}
            </Button>
          </Link>
          <Link to="/federation/applications">
            <Button variant={isActive('/federation/applications') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <FileText className="w-4 h-4 mr-3" />
              {t('federation_layout.applications')}
            </Button>
          </Link>
          <Link to="/federation/pipeline">
            <Button variant={isActive('/federation/pipeline') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <Kanban className="w-4 h-4 mr-3" />
              {t('federation_layout.pipeline')}
            </Button>
          </Link>
          <Link to="/federation/chats">
            <Button variant={isActive('/federation/chats') ? 'secondary' : 'ghost'} className="w-full justify-start">
              <MessageCircle className="w-4 h-4 mr-3" />
              {t('federation_layout.chats')}
              <Badge count={totalUnread + unreadChatRequests} />
            </Button>
          </Link>
          <Link to="/federation/teams">
            <Button
              data-testid="nav-teams-btn"
              variant={isActive('/federation/teams') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <FolderOpen className="w-4 h-4 mr-3" />
              {t('federation_layout.team_groups')}
            </Button>
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border space-y-2">
          <div className="flex justify-center">
            <LanguageSwitcher />
          </div>
          <Button
            data-testid="logout-btn"
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={confirmLogout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            {t('federation_layout.logout')}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 overflow-y-auto pb-20 md:pb-0">
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
        title={t('federation_layout.sign_out')}
        description={t('federation_layout.sign_out_confirm')}
        confirmLabel={t('federation_layout.sign_out')}
        confirmVariant="destructive"
        onConfirm={handleLogout}
      />
    </>
  );
};

export default FederationLayout;


import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import NotificationBell from '@/components/ui/NotificationBell';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationContext';
import Badge from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import MobileHeader from '@/components/mobile/MobileHeader';
import { Users, Briefcase, LogOut, Home, UserCircle, Newspaper, FileText, MessageCircle, GraduationCap, Star } from 'lucide-react';

const AcademyLayout = ({ children }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useAuth();
  const { totalUnread, unreadChatRequests } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleLogout = () => { logout(); navigate('/'); };
  const confirmLogout = () => setShowLogoutConfirm(true);
  const isActive = (path) => location.pathname.includes(path);

  return (
    <>
      <div className="min-h-screen flex flex-col md:flex-row">
        <MobileHeader title="SOCCERMATCH" />

        <aside className="w-64 border-r border-border bg-background fixed h-full hidden md:block">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl font-heading font-bold tracking-tight">
                  <img src="/logo.png" alt="Soccer Match" className="h-8 w-auto" />
                </h1>
                <p className="text-xs text-muted-foreground uppercase flex items-center">
                  <GraduationCap className="w-3 h-3 mr-1" />
                  {t('academy_layout.portal')}
                </p>
              </div>
            </div>
            <NotificationBell />
          </div>

          <nav className="p-4 space-y-2">
            <Link to="/academy/news">
              <Button variant={isActive('/academy/news') ? 'secondary' : 'ghost'} className="w-full justify-start">
                <Newspaper className="w-4 h-4 mr-3" /> {t('academy_layout.news_feed')}
              </Button>
            </Link>
            <Link to="/academy/dashboard">
              <Button variant={isActive('/academy/dashboard') ? 'secondary' : 'ghost'} className="w-full justify-start">
                <Home className="w-4 h-4 mr-3" /> {t('academy_layout.dashboard')}
              </Button>
            </Link>
            <Link to="/academy/profile">
              <Button variant={isActive('/academy/profile') ? 'secondary' : 'ghost'} className="w-full justify-start">
                <UserCircle className="w-4 h-4 mr-3" /> {t('academy_layout.my_profile')}
              </Button>
            </Link>
            <Link to="/academy/players">
              <Button variant={isActive('/academy/players') ? 'secondary' : 'ghost'} className="w-full justify-start">
                <Users className="w-4 h-4 mr-3" /> {t('academy_layout.my_players')}
              </Button>
            </Link>
            <Link to="/academy/opportunities">
              <Button variant={isActive('/academy/opportunities') ? 'secondary' : 'ghost'} className="w-full justify-start">
                <Briefcase className="w-4 h-4 mr-3" /> {t('academy_layout.opportunities')}
              </Button>
            </Link>
            <Link to="/academy/applications">
              <Button variant={isActive('/academy/applications') ? 'secondary' : 'ghost'} className="w-full justify-start">
                <FileText className="w-4 h-4 mr-3" /> {t('academy_layout.applications')}
              </Button>
            </Link>
            <Link to="/academy/chats">
              <Button variant={isActive('/academy/chats') ? 'secondary' : 'ghost'} className="w-full justify-start">
                <MessageCircle className="w-4 h-4 mr-3" /> {t('academy_layout.chats')}
                <Badge count={totalUnread + unreadChatRequests} />
              </Button>
            </Link>
            <Link to="/academy/credits">
              <Button variant={isActive('/academy/credits') ? 'secondary' : 'ghost'} className="w-full justify-start">
                <Star className="w-4 h-4 mr-3" /> {t('academy_layout.credits')}
              </Button>
            </Link>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border space-y-2">
            <div className="flex justify-center">
              <LanguageSwitcher />
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={confirmLogout}
            >
              <LogOut className="w-4 h-4 mr-3" /> {t('academy_layout.logout')}
            </Button>
          </div>
        </aside>

        <main className="flex-1 md:ml-64 pb-20 md:pb-0">
          {children}
        </main>

        <MobileBottomNav role="academy" />
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title={t('academy_layout.sign_out')}
        description={t('academy_layout.sign_out_confirm')}
        confirmLabel={t('academy_layout.sign_out')}
        confirmVariant="destructive"
        onConfirm={handleLogout}
      />
    </>
  );
};

export default AcademyLayout;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, Trophy, LogOut, ChevronRight } from 'lucide-react';

const MobileHeader = ({ title, showMenu = true, children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'player': return 'Player';
      case 'club': return 'Club';
      case 'federation': return 'Federation';
      case 'agent': return 'Agent';
      case 'specialist': return 'Specialist';
      case 'admin': return 'Admin';
      default: return '';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border md:hidden safe-area-top">
        <div 
          className="flex items-center justify-between h-14 px-4"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold text-lg">{title || 'SOCCERMATCH'}</span>
          </div>
          
          {showMenu && (
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 -mr-2 text-foreground"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>
        {children}
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-background border-l border-border animate-in slide-in-from-right">
            <div 
              className="flex items-center justify-between p-4 border-b border-border"
              style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
            >
              <div>
                <p className="font-heading font-bold">{user?.email?.split('@')[0]}</p>
                <p className="text-xs text-primary uppercase">{getRoleLabel()}</p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 -mr-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-4 space-y-2">
              <Link
                to={`/${user?.role}/profile`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-sm hover:bg-white/5 transition-colors"
              >
                <span>My Profile</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
              
              {user?.role === 'player' && (
                <>
                  <Link
                    to="/player/applications"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-sm hover:bg-white/5 transition-colors"
                  >
                    <span>My Applications</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>

                </>
              )}
            </nav>

            <div 
              className="absolute bottom-0 left-0 right-0 p-4 border-t border-border"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
            >
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileHeader;

import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Users, UserCircle, LogOut, 
  TrendingUp, Award, Menu, X, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

// Sub-components
import AnalystDashboardHome from '@/components/analyst/AnalystDashboardHome';
import AnalystEvaluations from '@/components/analyst/AnalystEvaluations';
import AnalystProfile from '@/components/analyst/AnalystProfile';
import PlayersToEvaluate from '@/components/analyst/PlayersToEvaluate';
import EvaluationForm from '@/components/evaluation/EvaluationForm';
import EvaluationView from '@/components/evaluation/EvaluationView';
import PlayerScoutDashboard from '@/components/evaluation/PlayerScoutDashboard';

const AnalystDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.getAnalystProfile();
        setProfile(response.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/analyst/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/analyst/evaluations', icon: FileText, label: 'Mes Évaluations' },
    { path: '/analyst/players', icon: Users, label: 'Joueurs' },
    { path: '/analyst/profile', icon: UserCircle, label: 'Mon Profil' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-heading font-bold tracking-tight text-primary">SOCCERMATCH</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Scout Analytics</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Status */}
          {profile && (
            <div className="px-4 py-3 mx-4 mt-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${profile.approved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-xs text-muted-foreground">
                  {profile.approved ? 'Compte approuvé' : 'En attente d\'approbation'}
                </span>
              </div>
              {profile.verified && (
                <div className="flex items-center gap-2 mt-1">
                  <Award className="w-3 h-3 text-primary" />
                  <span className="text-xs text-primary">Analyste vérifié</span>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive(item.path) 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'}
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive(item.path) && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-heading font-bold text-primary">SOCCERMATCH</h1>
          <div className="w-10" />
        </div>

        {/* Page content */}
        <div className="p-6 lg:p-8">
          <Routes>
            <Route path="dashboard" element={<AnalystDashboardHome />} />
            <Route path="evaluations" element={<AnalystEvaluations />} />
            <Route path="players" element={<PlayersToEvaluate />} />
            <Route path="profile" element={<AnalystProfile />} />
            <Route path="evaluate/:playerId" element={<EvaluationForm />} />
            <Route path="evaluation/:evaluationId" element={<EvaluationView />} />
            <Route path="player/:playerId/dashboard" element={<PlayerScoutDashboard />} />
            <Route path="*" element={<AnalystDashboardHome />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AnalystDashboard;

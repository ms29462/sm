import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import MobileHeader from '@/components/mobile/MobileHeader';
import {
  Shield, Users, Building, Flag, Briefcase, LogOut, MessageCircle, Video,
  MessageSquare, Database, GraduationCap, Activity, ShieldCheck, Newspaper,
  Copy, UserCog, Wallet, ClipboardList, CreditCard, Trash2, AlertTriangle,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: Shield, testId: 'nav-dashboard-btn' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/admin/players', label: 'Players', icon: Users, testId: 'nav-players-btn' },
      { to: '/admin/club-applications', label: 'Clubs', icon: Building, testId: 'nav-clubs-btn' },
      { to: '/admin/colleges', label: 'Colleges', icon: GraduationCap },
      { to: '/admin/federations', label: 'Federations', icon: Flag, testId: 'nav-federations-btn' },
      { to: '/admin/agents', label: 'Agents', icon: Briefcase, testId: 'nav-agents-btn' },
      { to: '/admin/specialists', label: 'Specialists', icon: Activity, testId: 'nav-specialists-btn' },
      { to: '/admin/analyst-management', label: 'Analyst Management', icon: UserCog },
      { to: '/admin/analysts', label: 'Analysts', icon: Activity },
    ],
  },
  {
    label: 'Recruitment',
    items: [
      { to: '/admin/opportunities', label: 'Opportunities', icon: Briefcase, testId: 'nav-opportunities-btn' },
      { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { to: '/admin/credits', label: 'Credits', icon: Wallet },
    ],
  },
  {
    label: 'Communication',
    items: [
      { to: '/admin/chat-requests', label: 'Chat Requests', icon: MessageSquare, testId: 'nav-chat-requests-btn' },
      { to: '/admin/chats', label: 'Chat Rooms', icon: MessageCircle, testId: 'nav-chats-btn' },
      { to: '/admin/videos', label: 'Video Sessions', icon: Video, testId: 'nav-videos-btn' },
    ],
  },
  {
    label: 'Trust & Safety',
    items: [
      { to: '/admin/reports', label: 'Reports', icon: AlertTriangle },
      { to: '/admin/deletion-requests', label: 'Deletion Requests', icon: Trash2 },
      { to: '/admin/verification', label: 'Verification', icon: ShieldCheck },
      { to: '/admin/duplicates', label: 'Duplicates', icon: Copy },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/news', label: 'News Feed', icon: Newspaper },
      { to: '/admin/benchmark', label: 'Benchmark Data', icon: Database, testId: 'nav-benchmark-btn' },
      { to: '/admin/masterclass', label: 'Masterclass', icon: ClipboardList, testId: 'nav-masterclass-btn' },
    ],
  },
];

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
      <aside className="w-64 border-r border-border bg-background fixed h-full hidden md:flex md:flex-col">
        <div className="p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-xl font-heading font-bold tracking-tight">
                <img src="/logo.png" alt="Soccer Match" className="h-7 w-auto" />
              </h1>
              <p className="text-xs text-muted-foreground uppercase flex items-center">
                <Shield className="w-3 h-3 mr-1" />
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-5 flex-1 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.to} to={item.to}>
                      <Button
                        data-testid={item.testId}
                        variant={isActive(item.to) ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border flex-shrink-0">
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
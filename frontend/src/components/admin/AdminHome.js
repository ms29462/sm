import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Users, Building, Flag, FileText, AlertCircle } from 'lucide-react';

const AdminHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.getAdminStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">ADMIN DASHBOARD</h1>
        <p className="text-muted-foreground">Platform overview and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div data-testid="stat-players" className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-primary" />
            <span className="text-3xl font-heading font-bold">{stats?.total_players || 0}</span>
          </div>
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">TOTAL PLAYERS</h3>
        </div>

        <div data-testid="stat-clubs" className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <Building className="w-8 h-8 text-primary" />
            <span className="text-3xl font-heading font-bold">{stats?.total_clubs || 0}</span>
          </div>
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">TOTAL CLUBS</h3>
        </div>

        <div data-testid="stat-federations" className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <Flag className="w-8 h-8 text-primary" />
            <span className="text-3xl font-heading font-bold">{stats?.total_federations || 0}</span>
          </div>
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">FEDERATIONS</h3>
        </div>

        <div data-testid="stat-applications" className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-primary" />
            <span className="text-3xl font-heading font-bold">{stats?.total_applications || 0}</span>
          </div>
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">APPLICATIONS</h3>
        </div>

        <div data-testid="stat-pending" className="bg-card border border-yellow-500/50 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
            <span className="text-3xl font-heading font-bold text-yellow-500">{stats?.pending_approvals || 0}</span>
          </div>
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">PENDING</h3>
        </div>
      </div>

      <div className="mt-8 bg-card border border-border/50 p-8 rounded-sm">
        <h2 className="text-2xl font-heading font-bold uppercase mb-4">ADMIN TOOLS</h2>
        <p className="text-muted-foreground mb-6">
          Use the navigation menu to manage players, clubs, federations and opportunities. You can approve or reject accounts, delete users, and moderate content.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-background p-4 rounded-sm border border-border">
            <h3 className="font-heading font-bold uppercase mb-2 text-primary">PLAYERS</h3>
            <p className="text-muted-foreground">Approve player accounts and manage player profiles</p>
          </div>
          <div className="bg-background p-4 rounded-sm border border-border">
            <h3 className="font-heading font-bold uppercase mb-2 text-primary">CLUBS</h3>
            <p className="text-muted-foreground">Approve club accounts and manage club profiles</p>
          </div>
          <div className="bg-background p-4 rounded-sm border border-border">
            <h3 className="font-heading font-bold uppercase mb-2 text-primary">FEDERATIONS</h3>
            <p className="text-muted-foreground">Approve federation accounts for national teams</p>
          </div>
          <div className="bg-background p-4 rounded-sm border border-border">
            <h3 className="font-heading font-bold uppercase mb-2 text-primary">OPPORTUNITIES</h3>
            <p className="text-muted-foreground">Moderate posted opportunities</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
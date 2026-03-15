import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Users, Heart, FileText, AlertCircle, CheckCircle, Clock, Briefcase } from 'lucide-react';

const AgentHome = () => {
  const [profile, setProfile] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, watchlistRes, opportunitiesRes] = await Promise.all([
        api.getAgentProfile(),
        api.getAgentFavorites().catch(() => ({ data: [] })),
        api.getAgentOpportunities().catch(() => ({ data: [] }))
      ]);
      setProfile(profileRes.data);
      setWatchlist(watchlistRes.data || []);
      setOpportunities(opportunitiesRes.data || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
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
    <div className="p-8" data-testid="agent-dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">DASHBOARD</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.name}</p>
      </div>

      {/* Approval Status */}
      {!profile?.approved && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-sm p-4 mb-6 flex items-center gap-3">
          <Clock className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="font-medium text-yellow-500">Account Pending Approval</p>
            <p className="text-sm text-muted-foreground">Your account is awaiting admin approval. Some features may be limited.</p>
          </div>
        </div>
      )}

      {profile?.approved && !profile?.agency_name && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-sm p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500" />
          <div>
            <p className="font-medium text-blue-500">Complete Your Profile</p>
            <p className="text-sm text-muted-foreground">Add your agency details and credentials to attract players.</p>
            <Link to="/agent/profile">
              <Button size="sm" className="mt-2 bg-blue-500 text-white">Complete Profile</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <Heart className="w-8 h-8 text-red-500" />
            <span className="text-3xl font-heading font-bold">{watchlist.length}</span>
          </div>
          <h3 className="font-heading uppercase text-sm text-muted-foreground">Watchlist</h3>
          <Link to="/agent/watchlist" className="text-primary text-sm hover:underline">View all</Link>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-blue-500" />
            <span className="text-3xl font-heading font-bold">{opportunities.length}</span>
          </div>
          <h3 className="font-heading uppercase text-sm text-muted-foreground">Available Opportunities</h3>
          <Link to="/agent/opportunities" className="text-primary text-sm hover:underline">View all</Link>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            {profile?.verified ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            )}
          </div>
          <h3 className="font-heading uppercase text-sm text-muted-foreground">
            {profile?.verified ? 'Verified Agent' : 'Verification Pending'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {profile?.verified ? 'Your credentials are verified' : 'Complete profile for verification'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-heading font-bold uppercase">FIND PLAYERS</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Search and filter through our database of registered players looking for representation.
          </p>
          <Link to="/agent/players">
            <Button className="bg-primary text-black font-bold">SEARCH PLAYERS</Button>
          </Link>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-heading font-bold uppercase">VIEW OPPORTUNITIES</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Browse club opportunities to match your players with the right positions.
          </p>
          <Link to="/agent/opportunities">
            <Button className="bg-primary text-black font-bold">VIEW OPPORTUNITIES</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AgentHome;

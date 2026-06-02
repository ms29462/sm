import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Users, Heart, AlertCircle, CheckCircle, Clock, Activity, Briefcase } from 'lucide-react';

const AnalystHome = () => {
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, clientsRes] = await Promise.all([
        api.getAnalystProfile(),
        api.getAnalystFavorites().catch(() => ({ data: [] }))
      ]);
      setProfile(profileRes.data);
      setClients(clientsRes.data || []);
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
    <div className="p-8" data-testid="analyst-dashboard">
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

      {profile?.approved && !profile?.analyst_type && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-sm p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500" />
          <div>
            <p className="font-medium text-blue-500">Complete Your Profile</p>
            <p className="text-sm text-muted-foreground">Add your specialization and certifications to attract players.</p>
            <Link to="/analyst/profile">
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
            <span className="text-3xl font-heading font-bold">{clients.length}</span>
          </div>
          <h3 className="font-heading uppercase text-sm text-muted-foreground">Active Clients</h3>
          <Link to="/analyst/clients" className="text-primary text-sm hover:underline">View all</Link>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {profile?.analyst_type || 'Not Set'}
            </span>
          </div>
          <h3 className="font-heading uppercase text-sm text-muted-foreground">Specialization</h3>
          <Link to="/analyst/profile" className="text-primary text-sm hover:underline">Edit profile</Link>
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
            {profile?.verified ? 'Verified Analyst' : 'Verification Pending'}
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
            Search for players who might need your specialized services - from rehab to nutrition.
          </p>
          <Link to="/analyst/players">
            <Button className="bg-primary text-black font-bold">SEARCH PLAYERS</Button>
          </Link>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-heading font-bold uppercase">YOUR SERVICES</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            {profile?.services_offered?.length > 0 
              ? `You offer ${profile.services_offered.length} services`
              : 'Add your services to let players know what you offer'}
          </p>
          <Link to="/analyst/profile">
            <Button className="bg-primary text-black font-bold">MANAGE SERVICES</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AnalystHome;

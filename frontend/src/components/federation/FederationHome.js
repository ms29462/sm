import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Users, Heart, FolderOpen, Flag, AlertCircle } from 'lucide-react';

const FederationHome = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    recommendedPlayers: 0,
    scoutingList: 0,
    teams: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, recommendedRes, favoritesRes, teamsRes] = await Promise.all([
        api.getFederationProfile(),
        api.getRecommendedPlayersForFederation(),
        api.getFederationFavorites(),
        api.getFederationTeams()
      ]);
      
      setProfile(profileRes.data);
      setStats({
        recommendedPlayers: recommendedRes.data.length,
        scoutingList: favoritesRes.data.length,
        teams: teamsRes.data.length
      });
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

  const needsSetup = !profile?.country;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">
          {profile?.name || 'FEDERATION DASHBOARD'}
        </h1>
        <p className="text-muted-foreground">National team scouting and management</p>
      </div>

      {needsSetup && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-sm mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-yellow-500 font-medium">Setup Required</p>
              <p className="text-sm text-muted-foreground">
                Please complete your federation profile and set your country to see recommended players.
              </p>
            </div>
          </div>
        </div>
      )}

      {profile?.country && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-sm mb-6">
          <div className="flex items-center gap-3">
            <Flag className="w-5 h-5 text-primary" />
            <div>
              <p className="text-primary font-medium">Federation Country: {profile.country}</p>
              <p className="text-sm text-muted-foreground">
                Players with {profile.country} nationality will be recommended to you.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-primary" />
            <span className="text-2xl md:text-3xl font-heading font-bold">{stats.recommendedPlayers}</span>
          </div>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wide">Recommended Players</h3>
          <p className="text-xs text-muted-foreground mt-1">Players matching your nationality</p>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <Heart className="w-8 h-8 text-red-500" />
            <span className="text-2xl md:text-3xl font-heading font-bold">{stats.scoutingList}</span>
          </div>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wide">Scouting List</h3>
          <p className="text-xs text-muted-foreground mt-1">Players you're tracking</p>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <FolderOpen className="w-8 h-8 text-blue-500" />
            <span className="text-2xl md:text-3xl font-heading font-bold">{stats.teams}</span>
          </div>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wide">Team Groups</h3>
          <p className="text-xs text-muted-foreground mt-1">Senior, U23, U20, U17, U15</p>
        </div>
      </div>

      {!profile?.approved && (
        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="font-medium">Pending Approval</p>
              <p className="text-sm text-muted-foreground">
                Your federation account is pending admin approval. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FederationHome;

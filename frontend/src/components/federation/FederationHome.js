import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Users, Heart, FolderOpen, Flag, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FederationHome = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    recommendedPlayers: 0,
    scoutingList: 0,
    teams: 0
  });
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, recommendedRes, favoritesRes, teamsRes] = await Promise.allSettled([
        api.getFederationProfile(),
        api.getRecommendedPlayersForFederation(),
        api.getFederationFavorites(),
        api.getFederationTeams()
      ]);
      
      if (profileRes.status === "fulfilled") setProfile(profileRes.value.data);
      setStats({
        recommendedPlayers: recommendedRes.status === "fulfilled" ? recommendedRes.value.data.length : 0,
        scoutingList: favoritesRes.status === "fulfilled" ? favoritesRes.value.data.length : 0,
        teams: teamsRes.status === "fulfilled" ? teamsRes.value.data.length : 0,
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
        <div className="text-primary text-xl font-heading">{t('federation_home.loading')}</div>
      </div>
    );
  }

  const needsSetup = !profile?.country;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">
          {profile?.name || t('federation_home.title')}
        </h1>
        <p className="text-muted-foreground">{t('federation_home.subtitle')}</p>
      </div>

      {needsSetup && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-sm mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-yellow-500 font-medium">{t('federation_home.setup_required')}</p>
              <p className="text-sm text-muted-foreground">{t('federation_home.setup_desc')}</p>
            </div>
          </div>
        </div>
      )}

      {profile?.country && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-sm mb-6">
          <div className="flex items-center gap-3">
            <Flag className="w-5 h-5 text-primary" />
            <div>
              <p className="text-primary font-medium">{t('federation_home.federation_country', { country: profile.country })}</p>
              <p className="text-sm text-muted-foreground">{t('federation_home.country_desc', { country: profile.country })}</p>
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
          <h3 className="text-sm text-muted-foreground uppercase tracking-wide">{t('federation_home.recommended_players')}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t('federation_home.recommended_desc')}</p>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <Heart className="w-8 h-8 text-red-500" />
            <span className="text-2xl md:text-3xl font-heading font-bold">{stats.scoutingList}</span>
          </div>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wide">{t('federation_home.scouting_list')}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t('federation_home.scouting_desc')}</p>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <FolderOpen className="w-8 h-8 text-blue-500" />
            <span className="text-2xl md:text-3xl font-heading font-bold">{stats.teams}</span>
          </div>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wide">{t('federation_home.team_groups')}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t('federation_home.team_groups_desc')}</p>
        </div>
      </div>

      {!profile?.approved && (
        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="font-medium">{t('federation_home.pending_approval')}</p>
              <p className="text-sm text-muted-foreground">{t('federation_home.pending_desc')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FederationHome;

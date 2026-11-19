import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, TrendingUp, AlertCircle, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useSocket from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";

const ClubHome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCollege = user?.role === "college";
  const isCollegeAgency = user?.role === "college_agency";
  const [profile, setProfile] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const { on, off, isConnected } = useSocket();

  useEffect(() => {
    loadProfile();
    loadRecommended();
  }, []);

  // Listen for approval notification from admin
  useEffect(() => {
    const handleApproved = (data) => {
      toast.success(data.message || "Your account has been approved!");
      loadProfile(); // Refresh profile to show updated approval status
    };
    on("account_approved", handleApproved);
    return () => off("account_approved", handleApproved);
  }, [on, off]);

  const loadProfile = async () => {
    try {
      const profileRes = isCollege ? await api.getCollegeProfile() : isCollegeAgency ? await api.getCollegeAgencyProfile() : await api.getClubProfile();
      setProfile(profileRes.data);
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadRecommended = async () => {
    try {
      const recommendedRes = await api.getRecommendedPlayers();
      setRecommended(recommendedRes.data || []);
    } catch (error) {
      setRecommended([]);
    }
  };

  const handleAddFavorite = async (playerId) => {
    try {
      await api.addFavorite(playerId);
      toast.success("Added to favorites!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add favorite");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">{t('club_home.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">{t('club_home.dashboard')}</h1>
        <p className="text-muted-foreground">{t('club_home.welcome_back', { name: profile?.name })}</p>
      </div>

      {!profile?.approved && (
        <div
          data-testid="approval-pending-alert"
          className="bg-card border border-yellow-500/50 p-6 rounded-sm mb-8 flex items-start space-x-4"
        >
          <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-heading font-bold text-lg mb-2">{t('club_home.approval_pending')}</h3>
            <p className="text-muted-foreground">
              {isCollegeAgency ? t('club_home.approval_body_agency') : isCollege ? t('club_home.approval_body_college') : t('club_home.approval_body_club')}
            </p>
            <Button
              data-testid="complete-profile-btn"
              onClick={() => navigate(isCollege ? "/college/profile" : isCollegeAgency ? "/college-agency/profile" : "/club/profile")}
              className="mt-4 bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-10 px-6"
            >
              {t('club_home.complete_profile')}
            </Button>
          </div>
        </div>
      )}

      {profile?.approved && (
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-sm mb-8 flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <p className="text-green-500 text-sm font-medium">{t('club_home.approved_msg')}</p>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-heading font-bold uppercase">{t('club_home.recommended_players')}</h2>
          </div>
          <Button
            data-testid="view-all-players-btn"
            variant="ghost"
            className="text-primary hover:text-primary/80"
            onClick={() => navigate(isCollege ? "/college/players" : user?.role === 'college_agency' ? "/college-agency/players" : "/club/players")}
          >
            {t('club_home.view_all')}
          </Button>
        </div>

        {recommended.length === 0 ? (
          <div data-testid="no-recommendations" className="bg-card border border-border/50 p-12 rounded-sm text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {t('club_home.no_recommendations')}
            </p>
            <Button
              onClick={() => navigate(isCollege ? '/college/opportunities' : '/club/opportunities')}
              className="bg-primary text-black font-bold uppercase rounded-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> {t('club_home.post_opportunity')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommended.slice(0, 6).map((player) => (
              <div
                key={player.user_id}
                data-testid={`player-card-${player.user_id}`}
                onClick={() => navigate(user?.role === 'college_agency' ? `/college-agency/player/${player.user_id}` : `/club/player/${player.user_id}`)}
                className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start space-x-4 mb-4">
                  {player.profile_picture ? (
                    <img
                      src={player.profile_picture}
                      alt={player.name}
                      className="w-16 h-16 rounded-sm object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center border-2 border-border">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-heading font-bold uppercase mb-1">{player.name}</h3>
                    <div className="flex items-center space-x-2">
                      {player.position && (
                        <span className="bg-white/10 text-white border border-white/20 uppercase text-[10px] tracking-wider px-2 py-1">
                          {player.position}
                        </span>
                      )}
                      {player.age && (
                        <span className="text-xs text-muted-foreground">{player.age} {t('club_home.years')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  {player.nationality && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('club_home.nationality')}</span>
                      <span className="font-medium">{player.nationality}</span>
                    </div>
                  )}
                  {player.playing_level && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('club_home.level')}</span>
                      <span className="font-medium">{player.playing_level}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-muted-foreground">G: {player.goals || 0}</span>
                    <span className="text-muted-foreground">A: {player.assists || 0}</span>
                    <span className="text-muted-foreground">GP: {player.games || 0}</span>
                  </div>
                </div>
                <Button
                  data-testid={`favorite-btn-${player.user_id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddFavorite(player.user_id);
                  }}
                  className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-10"
                >
                  {t('club_home.add_favorites')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubHome;


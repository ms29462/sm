import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Users, User, Heart, Eye, Flag } from 'lucide-react';

const FederationRecommended = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [playersRes, profileRes] = await Promise.all([
        api.getRecommendedPlayersForFederation(),
        api.getFederationProfile()
      ]);
      setPlayers(playersRes.data);
      setProfile(profileRes.data);
    } catch (error) {
      toast.error('Failed to load recommended players');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToScouting = async (playerId) => {
    try {
      await api.addFederationFavorite(playerId);
      toast.success('Added to scouting list!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to scouting list');
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
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">RECOMMENDED PLAYERS</h1>
        <p className="text-muted-foreground">Players eligible for your national team</p>
      </div>

      {profile?.country && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-sm mb-6">
          <div className="flex items-center gap-3">
            <Flag className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">Showing players with {profile.country} nationality</p>
              <p className="text-sm text-muted-foreground">
                {players.length} player{players.length !== 1 ? 's' : ''} eligible for selection
              </p>
            </div>
          </div>
        </div>
      )}

      {!profile?.country && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-sm mb-6">
          <p className="text-yellow-500">Please set your federation country in your profile to see recommended players.</p>
        </div>
      )}

      {players.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No recommended players found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.map((player) => (
            <div
              key={player.user_id}
              data-testid={`recommended-player-${player.user_id}`}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start space-x-4 mb-4">
                {player.profile_picture ? (
                  <img
                    src={player.profile_picture}
                    alt={player.name}
                    className="w-16 h-16 rounded-sm object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-heading font-bold uppercase">{player.name}</h3>
                  <p className="text-sm text-muted-foreground">{player.position || 'Position not set'}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {player.age && (
                      <span className="text-xs bg-white/10 text-white px-2 py-0.5 rounded-sm">
                        {player.age} yrs
                      </span>
                    )}
                    {player.playing_level && (
                      <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-sm">
                        {player.playing_level}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              {(player.games || player.goals || player.assists) && (
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-background p-2 rounded-sm">
                    <p className="text-lg font-bold">{player.games || 0}</p>
                    <p className="text-xs text-muted-foreground">Games</p>
                  </div>
                  <div className="bg-background p-2 rounded-sm">
                    <p className="text-lg font-bold">{player.goals || 0}</p>
                    <p className="text-xs text-muted-foreground">Goals</p>
                  </div>
                  <div className="bg-background p-2 rounded-sm">
                    <p className="text-lg font-bold">{player.assists || 0}</p>
                    <p className="text-xs text-muted-foreground">Assists</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  data-testid={`view-player-${player.user_id}`}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/federation/player/${player.user_id}`)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  VIEW
                </Button>
                <Button
                  data-testid={`scout-player-${player.user_id}`}
                  size="sm"
                  onClick={() => handleAddToScouting(player.user_id)}
                  className="flex-1 bg-primary text-black"
                >
                  <Heart className="w-4 h-4 mr-1" />
                  SCOUT
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FederationRecommended;

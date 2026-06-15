import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Heart, User, Eye, Trash2 } from 'lucide-react';

const FederationScouting = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const response = await api.getFederationFavorites();
      setPlayers(response.data);
    } catch (error) {
      toast.error('Failed to load scouting list');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (playerId) => {
    try {
      await api.removeFederationFavorite(playerId);
      toast.success('Removed from scouting list');
      loadPlayers();
    } catch (error) {
      toast.error('Failed to remove from scouting list');
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
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">SCOUTING LIST</h1>
        <p className="text-muted-foreground">Players you're tracking for the national team</p>
      </div>

      {players.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No players in your scouting list</p>
          <p className="text-sm text-muted-foreground mt-2">Add players from the search or recommended sections</p>
        </div>
      ) : (
        <div className="space-y-4">
          {players.map((player) => (
            <div
              key={player.user_id}
              data-testid={`scouting-player-${player.user_id}`}
              className="bg-card border border-border/50 p-6 rounded-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
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
                  <div>
                    <h3 className="font-heading font-bold uppercase">{player.name}</h3>
                    <p className="text-sm text-muted-foreground">{player.position || 'Position not set'}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {player.nationality && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                          {player.nationality}
                        </span>
                      )}
                      {player.age && (
                        <span className="text-xs bg-white/10 text-white px-2 py-0.5 rounded-sm">
                          {player.age} yrs
                        </span>
                      )}
                      {player.current_club && (
                        <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-sm">
                          {player.current_club}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Stats */}
                  <div className="hidden md:flex gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold">{player.games || 0}</p>
                      <p className="text-xs text-muted-foreground">Games</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{player.goals || 0}</p>
                      <p className="text-xs text-muted-foreground">Goals</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{player.assists || 0}</p>
                      <p className="text-xs text-muted-foreground">Assists</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      data-testid={`view-player-${player.user_id}`}
                      variant="outline"
                      onClick={() => navigate(`/federation/player/${player.user_id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      VIEW
                    </Button>
                    <Button
                      data-testid={`remove-player-${player.user_id}`}
                      variant="outline"
                      onClick={() => handleRemove(player.user_id)}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FederationScouting;

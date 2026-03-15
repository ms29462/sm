import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Heart, Eye, MapPin, User, Trash2 } from 'lucide-react';

const AgentWatchlist = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const response = await api.getAgentFavorites();
      setPlayers(response.data || []);
    } catch (error) {
      toast.error('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (playerId) => {
    try {
      await api.removeAgentFavorite(playerId);
      setPlayers(players.filter(p => p.user_id !== playerId));
      toast.success('Removed from watchlist');
    } catch (error) {
      toast.error('Failed to remove from watchlist');
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
    <div className="p-8" data-testid="agent-watchlist">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-heading font-bold uppercase">WATCHLIST</h1>
        </div>
        <p className="text-muted-foreground">Players you're interested in representing</p>
      </div>

      {players.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-sm text-center">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Your watchlist is empty</p>
          <Link to="/agent/players">
            <Button className="bg-primary text-black font-bold">SEARCH PLAYERS</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map(player => (
            <div
              key={player.user_id}
              className="bg-card border border-border/50 rounded-sm overflow-hidden hover:border-primary/50 transition-colors"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {player.profile_picture ? (
                      <img src={player.profile_picture} alt={player.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-heading font-bold uppercase">{player.name}</h3>
                      <p className="text-sm text-primary">{player.position || 'Position N/A'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFavorite(player.user_id)}
                    className="p-2 hover:bg-red-500/10 rounded-sm text-red-500"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  {player.nationality && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{player.nationality}</span>
                    </div>
                  )}
                  {player.age && <p>Age: {player.age}</p>}
                  {player.current_club && <p>Club: {player.current_club}</p>}
                </div>

                <div className="flex gap-2 text-xs mb-4">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-sm">
                    {player.games || 0} Games
                  </span>
                  <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded-sm">
                    {player.goals || 0} Goals
                  </span>
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-sm">
                    {player.assists || 0} Assists
                  </span>
                </div>

                <Link to={`/agent/player/${player.user_id}`}>
                  <Button variant="outline" className="w-full border-primary text-primary">
                    <Eye className="w-4 h-4 mr-2" />
                    VIEW PROFILE
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentWatchlist;

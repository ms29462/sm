import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Heart, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClubFavorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const response = await api.getFavorites();
      setFavorites(response.data);
    } catch (error) {
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (playerId) => {
    try {
      await api.removeFavorite(playerId);
      toast.success('Removed from favorites');
      loadFavorites();
    } catch (error) {
      toast.error('Failed to remove favorite');
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
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">FAVORITE PLAYERS</h1>
        <p className="text-muted-foreground">Your saved players</p>
      </div>

      {favorites.length === 0 ? (
        <div data-testid="no-favorites" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No favorite players yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {favorites.map((player) => (
            <div
              key={player.user_id}
              data-testid={`favorite-card-${player.user_id}`}
              onClick={() => navigate(`/club/player/${player.user_id}`)}
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
                      <span className="text-xs text-muted-foreground">{player.age} years</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4">
                {player.nationality && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nationality:</span>
                    <span className="font-medium">{player.nationality}</span>
                  </div>
                )}
                {player.playing_level && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level:</span>
                    <span className="font-medium">{player.playing_level}</span>
                  </div>
                )}
                {player.current_club && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Club:</span>
                    <span className="font-medium">{player.current_club}</span>
                  </div>
                )}
                <div className="flex justify-between font-mono text-xs pt-2 border-t border-border">
                  <span className="text-muted-foreground">G: {player.goals || 0}</span>
                  <span className="text-muted-foreground">A: {player.assists || 0}</span>
                  <span className="text-muted-foreground">GP: {player.games || 0}</span>
                </div>
              </div>
              <Button
                data-testid={`remove-btn-${player.user_id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(player.user_id);
                }}
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white rounded-sm h-10"
              >
                REMOVE FROM FAVORITES
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubFavorites;
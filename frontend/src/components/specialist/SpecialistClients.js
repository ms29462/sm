import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Heart, Eye, MapPin, User, Trash2 } from 'lucide-react';

const SpecialistClients = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await api.getSpecialistFavorites();
      setPlayers(response.data || []);
    } catch (error) {
      toast.error(t('specialist.clients.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (playerId) => {
    try {
      await api.removeSpecialistFavorite(playerId);
      setPlayers(players.filter(p => p.user_id !== playerId));
      toast.success(t('specialist.clients.removed'));
    } catch (error) {
      toast.error(t('specialist.clients.remove_error'));
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">{t('specialist.clients.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="specialist-clients">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-heading font-bold uppercase">{t('specialist.clients.title')}</h1>
        </div>
        <p className="text-muted-foreground">{t('specialist.clients.subtitle')}</p>
      </div>

      {players.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-sm text-center">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{t('specialist.clients.empty')}</p>
          <Link to="/specialist/players">
            <Button className="bg-primary text-black font-bold">{t('specialist.clients.find_players_btn')}</Button>
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
                      <p className="text-sm text-primary">{player.position || t('specialist.clients.position_na')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFavorite(player.user_id)}
                    className="p-2 hover:bg-red-500/10 rounded-sm text-red-500"
                    title={t('specialist.clients.remove_title')}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{player.nationality || "—"}</span>
                    {player.nationality_2 && <span>/ {player.nationality_2}</span>}
                  </div>
                  <p>{t('specialist.clients.age')} {player.age || "—"}</p>
                  <p>{t('specialist.clients.club')} {player.current_club || "—"}</p>
                </div>

                <Link to={`/specialist/player/${player.user_id}`}>
                  <Button variant="outline" className="w-full border-primary text-primary">
                    <Eye className="w-4 h-4 mr-2" />
                    {t('specialist.clients.view_profile')}
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

export default SpecialistClients;

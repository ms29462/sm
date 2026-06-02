import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, MapPin, Flag, FileText, ChevronRight, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Badge from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const PlayersToEvaluate = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await api.getPlayersForEvaluation();
        setPlayers(response.data);
        setFilteredPlayers(response.data);
      } catch (error) {
        toast.error('Erreur lors du chargement des joueurs');
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = players.filter(p => {
      const fullName = `${p.first_name || ''} ${p.last_name || ''} ${p.name || ''}`.toLowerCase();
      return fullName.includes(query) ||
        p.position?.toLowerCase().includes(query) ||
        p.nationality?.toLowerCase().includes(query) ||
        p.current_club?.toLowerCase().includes(query);
    });
    setFilteredPlayers(filtered);
  }, [searchQuery, players]);

  const getPlayerName = (player) => {
    if (player.first_name && player.last_name) {
      return `${player.first_name} ${player.last_name}`;
    }
    return player.name || 'Joueur Inconnu';
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Joueurs à Évaluer</h1>
        <p className="text-muted-foreground">Sélectionnez un joueur pour créer une évaluation</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, position, nationalité ou club..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-800/50 border-zinc-700"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{filteredPlayers.length} joueurs</span>
      </div>

      {/* Players Grid */}
      {filteredPlayers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun joueur trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => {
            const age = calculateAge(player.date_of_birth);
            return (
              <Card key={player.user_id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {player.profile_picture ? (
                        <img 
                          src={player.profile_picture} 
                          alt={getPlayerName(player)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{getPlayerName(player)}</h3>
                      {player.position && (
                        <p className="text-sm text-primary">{player.position}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                        {age && <span>{age} ans</span>}
                        {player.nationality && (
                          <span className="flex items-center gap-1">
                            <Flag className="w-3 h-3" />
                            {player.nationality}
                          </span>
                        )}
                        {player.current_club && (
                          <span className="truncate">{player.current_club}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Evaluations count */}
                  <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {player.evaluations_count || 0} évaluation{player.evaluations_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {player.evaluations_count > 0 && (
                        <Link to={`/analyst/player/${player.user_id}/dashboard`}>
                          <Button variant="ghost" size="sm">
                            Voir profil
                          </Button>
                        </Link>
                      )}
                      <Link to={`/analyst/evaluate/${player.user_id}`}>
                        <Button size="sm" className="bg-primary text-black hover:bg-primary/90">
                          Évaluer
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlayersToEvaluate;

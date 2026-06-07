import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Flag, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        toast.error('Failed to load players');
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
    return player.name || 'Unknown Player';
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
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-heading font-bold">Players to Evaluate</h1>
        <p className="text-sm text-muted-foreground">Select a player to create an evaluation</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, position, nationality or club..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-800/50 border-zinc-700"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{filteredPlayers.length} players</span>
      </div>

      {/* Players Grid */}
      {filteredPlayers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <User className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 opacity-50" />
            <p>No players found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {filteredPlayers.map((player) => {
            const age = calculateAge(player.date_of_birth);
            return (
              <Card key={player.user_id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-3 lg:p-4">
                  <div className="flex items-start gap-3 lg:gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {player.profile_picture ? (
                        <img 
                          src={player.profile_picture} 
                          alt={getPlayerName(player)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 lg:w-7 lg:h-7 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate text-sm lg:text-base">{getPlayerName(player)}</h3>
                      {player.position && (
                        <p className="text-xs lg:text-sm text-primary">{player.position}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 lg:mt-2 text-xs text-muted-foreground">
                        {age && <span>{age} yrs</span>}
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
                  <div className="mt-3 lg:mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs lg:text-sm">
                      <FileText className="w-3 h-3 lg:w-4 lg:h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {player.evaluations_count || 0} evaluation{player.evaluations_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/analyst/player-profile/${player.user_id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-8 border-white/20">
                          Profile
                        </Button>
                      </Link>
                      {player.evaluations_count > 0 && (
                        <Link to={`/analyst/player/${player.user_id}/dashboard`}>
                          <Button variant="ghost" size="sm" className="text-xs h-8">
                            Evaluations
                          </Button>
                        </Link>
                      )}
                      <Link to={`/analyst/evaluate/${player.user_id}`}>
                        <Button size="sm" className="bg-primary text-black hover:bg-primary/90 text-xs h-8">
                          Evaluate
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

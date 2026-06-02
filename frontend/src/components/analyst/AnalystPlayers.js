import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Search, Heart, Eye, MapPin, User } from 'lucide-react';

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Striker', 'Winger'];
const LEVELS = ['Professional', 'Semi-Professional', 'Amateur', 'Youth Academy', 'College/University'];

const AnalystPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [filters, setFilters] = useState({
    name: '',
    position: '',
    nationality: '',
    level: ''
  });

  useEffect(() => {
    loadPlayers();
    loadFavorites();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.name) params.name = filters.name;
      if (filters.position && filters.position !== 'all') params.position = filters.position;
      if (filters.nationality) params.nationality = filters.nationality;
      if (filters.level && filters.level !== 'all') params.level = filters.level;

      const response = await api.getAnalystPlayers(params);
      setPlayers(response.data || []);
    } catch (error) {
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await api.getAnalystFavorites();
      setFavorites(new Set(response.data.map(p => p.user_id)));
    } catch (error) {
      // Ignore
    }
  };

  const handleSearch = () => {
    loadPlayers();
  };

  const handleClearFilters = () => {
    setFilters({ name: '', position: '', nationality: '', level: '' });
  };

  const toggleFavorite = async (playerId) => {
    try {
      if (favorites.has(playerId)) {
        await api.removeAnalystFavorite(playerId);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(playerId);
          return next;
        });
        toast.success('Removed from client list');
      } else {
        await api.addAnalystFavorite(playerId);
        setFavorites(prev => new Set(prev).add(playerId));
        toast.success('Added to client list');
      }
    } catch (error) {
      toast.error('Failed to update client list');
    }
  };

  return (
    <div className="p-8" data-testid="analyst-players">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold uppercase">FIND PLAYERS</h1>
        </div>
        <p className="text-muted-foreground">Find players who may need your specialized services</p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border/50 p-6 rounded-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Input
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              placeholder="Player name..."
              className="bg-black/20 border-white/10"
            />
          </div>
          <div>
            <Select value={filters.position} onValueChange={(v) => setFilters({ ...filters, position: v })}>
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {POSITIONS.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              value={filters.nationality}
              onChange={(e) => setFilters({ ...filters, nationality: e.target.value })}
              placeholder="Nationality..."
              className="bg-black/20 border-white/10"
            />
          </div>
          <div>
            <Select value={filters.level} onValueChange={(v) => setFilters({ ...filters, level: v })}>
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {LEVELS.map(l => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="bg-primary text-black font-bold flex-1">
              <Search className="w-4 h-4 mr-2" />
              SEARCH
            </Button>
            <Button onClick={handleClearFilters} variant="outline" className="border-white/10">
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-primary text-xl font-heading">LOADING...</div>
        </div>
      ) : players.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-sm text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No players found matching your criteria</p>
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
                    onClick={() => toggleFavorite(player.user_id)}
                    className="p-2 hover:bg-white/5 rounded-sm"
                  >
                    <Heart className={`w-5 h-5 ${favorites.has(player.user_id) ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
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

                <Link to={`/analyst/player/${player.user_id}`}>
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

export default AnalystPlayers;

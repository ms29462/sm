import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Search, User, Heart, Eye } from 'lucide-react';
import { POSITIONS, NATIONALITIES, LEVELS } from '@/lib/constants';

const FederationPlayers = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    position: 'All',
    nationality: 'All',
    level: 'All',
    name: '',
    minAge: '',
    maxAge: ''
  });

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.position !== 'All') params.position = filters.position;
      if (filters.nationality !== 'All') params.nationality = filters.nationality;
      if (filters.level !== 'All') params.level = filters.level;
      if (filters.name) params.name = filters.name;
      if (filters.minAge) params.min_age = parseInt(filters.minAge);
      if (filters.maxAge) params.max_age = parseInt(filters.maxAge);

      const response = await api.getFederationPlayers(params);
      setPlayers(response.data);
    } catch (error) {
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    loadPlayers();
  };

  const handleAddToScouting = async (playerId) => {
    try {
      await api.addFederationFavorite(playerId);
      toast.success('Added to scouting list!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to scouting list');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">SEARCH PLAYERS</h1>
        <p className="text-muted-foreground">Find players for your national team</p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border/50 p-6 rounded-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase mb-1 block">Name</label>
            <Input
              data-testid="name-filter"
              placeholder="Search name..."
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              className="bg-black/20 border-white/10 h-10"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase mb-1 block">Position</label>
            <Select value={filters.position} onValueChange={(v) => handleFilterChange('position', v)}>
              <SelectTrigger data-testid="position-filter" className="bg-black/20 border-white/10 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Positions</SelectItem>
                {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase mb-1 block">Nationality</label>
            <Select value={filters.nationality} onValueChange={(v) => handleFilterChange('nationality', v)}>
              <SelectTrigger data-testid="nationality-filter" className="bg-black/20 border-white/10 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Nationalities</SelectItem>
                {NATIONALITIES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase mb-1 block">Level</label>
            <Select value={filters.level} onValueChange={(v) => handleFilterChange('level', v)}>
              <SelectTrigger data-testid="level-filter" className="bg-black/20 border-white/10 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Levels</SelectItem>
                {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase mb-1 block">Min Age</label>
            <Input
              data-testid="min-age-filter"
              type="number"
              placeholder="15"
              value={filters.minAge}
              onChange={(e) => handleFilterChange('minAge', e.target.value)}
              className="bg-black/20 border-white/10 h-10"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase mb-1 block">Max Age</label>
            <Input
              data-testid="max-age-filter"
              type="number"
              placeholder="40"
              value={filters.maxAge}
              onChange={(e) => handleFilterChange('maxAge', e.target.value)}
              className="bg-black/20 border-white/10 h-10"
            />
          </div>
        </div>
        <Button
          data-testid="search-btn"
          onClick={handleSearch}
          className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm"
        >
          <Search className="w-4 h-4 mr-2" />
          SEARCH
        </Button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-primary text-xl font-heading">LOADING...</div>
        </div>
      ) : players.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No players found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.map((player) => (
            <div
              key={player.user_id}
              data-testid={`player-card-${player.user_id}`}
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
                  </div>
                </div>
              </div>

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

export default FederationPlayers;

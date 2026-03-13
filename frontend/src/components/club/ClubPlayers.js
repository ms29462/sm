import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Search, Heart, CheckCircle } from 'lucide-react';
import { POSITIONS, LEVELS, COUNTRIES } from '@/lib/constants';

const ClubPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    position: 'All',
    level: 'All',
    nationality: 'All',
    name: '',
  });

  useEffect(() => {
    loadPlayers();
  }, [filters]);

  const loadPlayers = async () => {
    try {
      const queryFilters = {};
      if (filters.position !== 'All') queryFilters.position = filters.position;
      if (filters.level !== 'All') queryFilters.level = filters.level;
      if (filters.nationality !== 'All' && filters.nationality) queryFilters.nationality = filters.nationality;
      if (filters.name) queryFilters.name = filters.name;

      const response = await api.getPlayers(queryFilters);
      setPlayers(response.data);
    } catch (error) {
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFavorite = async (playerId) => {
    try {
      await api.addFavorite(playerId);
      toast.success('Added to favorites!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add favorite');
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
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">BROWSE PLAYERS</h1>
        <p className="text-muted-foreground">Find and save talented players</p>
      </div>

      <div className="bg-card border border-border/50 p-6 rounded-sm mb-6">
        <h3 className="text-lg font-heading font-bold uppercase mb-4">FILTERS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium uppercase tracking-wide block mb-2">Player Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="name-filter"
                type="text"
                value={filters.name}
                onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
                className="pl-10 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                placeholder="Search by name..."
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium uppercase tracking-wide block mb-2">Position</label>
            <Select value={filters.position} onValueChange={(value) => setFilters((prev) => ({ ...prev, position: value }))}>
              <SelectTrigger data-testid="position-filter" className="bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['All', ...POSITIONS].map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium uppercase tracking-wide block mb-2">Level</label>
            <Select value={filters.level} onValueChange={(value) => setFilters((prev) => ({ ...prev, level: value }))}>
              <SelectTrigger data-testid="level-filter" className="bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['All', ...LEVELS].map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium uppercase tracking-wide block mb-2">Nationality</label>
            <Select value={filters.nationality} onValueChange={(value) => setFilters((prev) => ({ ...prev, nationality: value }))}>
              <SelectTrigger data-testid="nationality-filter" className="bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="All">All</SelectItem>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {players.length === 0 ? (
        <div data-testid="no-players" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No players found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
                    className="w-16 h-16 rounded-sm object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center border-2 border-border">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-heading font-bold uppercase">{player.name}</h3>
                    {player.verified && (
                      <CheckCircle className="w-4 h-4 text-blue-500" data-testid={`verified-icon-${player.user_id}`} />
                    )}
                  </div>
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
                data-testid={`favorite-btn-${player.user_id}`}
                onClick={() => handleAddFavorite(player.user_id)}
                className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-10"
              >
                <Heart className="w-4 h-4 mr-2" />
                ADD TO FAVORITES
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubPlayers;
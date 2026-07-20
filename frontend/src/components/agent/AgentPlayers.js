import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Search, Heart, Eye, MapPin, User } from 'lucide-react';

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica",
  "Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt",
  "El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon",
  "Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti",
  "Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan",
  "Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia",
  "Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta",
  "Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro",
  "Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger",
  "Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea",
  "Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis",
  "Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia",
  "Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia",
  "South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey",
  "Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay",
  "Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF', 'SS'];
const LEVELS = ['Professional', 'Semi-Professional', 'Amateur', 'College / University', 'National Team'];

const AgentPlayers = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [filterGender, setFilterGender] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [filters, setFilters] = useState({
    name: '',
    position: '',
    nationality: '',
    level: 'All'
  });

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => { loadPlayers(); }, [filters, page]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.name) params.name = filters.name;
      if (filters.position && filters.position !== 'All') params.position = filters.position;
      if (filters.nationality && filters.nationality !== 'All') params.nationality = filters.nationality;
      if (filters.nationality_2) params.nationality_2 = filters.nationality_2;
      if (filters.level && filters.level !== 'All') params.level = filters.level;
      if (filterGender) params.gender = filterGender;

      params.page = page;
      params.limit = 20;
      const response = await api.getPlayers(params);
      setPlayers(response.data || []);
    } catch (error) {
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await api.getAgentFavorites();
      setFavorites(new Set(response.data.map(p => p.user_id)));
    } catch (error) {
      // Ignore
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadPlayers();
  };

  const handleClearFilters = () => {
    setFilters({ name: '', position: '', nationality: '', level: '' });
  };

  const toggleFavorite = async (playerId) => {
    try {
      if (favorites.has(playerId)) {
        await api.removeAgentFavorite(playerId);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(playerId);
          return next;
        });
        toast.success('Removed from watchlist');
      } else {
        await api.addAgentFavorite(playerId);
        setFavorites(prev => new Set(prev).add(playerId));
        toast.success('Added to watchlist');
      }
    } catch (error) {
      toast.error('Failed to update watchlist');
    }
  };

  return (
    <div className="p-8" data-testid="agent-players">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold uppercase">SEARCH PLAYERS</h1>
        </div>
        <p className="text-muted-foreground">Find players looking for representation</p>
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
            <select value={filters.nationality} onChange={(e) => setFilters({ ...filters, nationality: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none">
              <option value="">1st Nationality...</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <select value={filters.nationality_2} onChange={(e) => setFilters({ ...filters, nationality_2: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none">
              <option value="">2nd Nationality...</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Select value={filters.level} onValueChange={(v) => setFilters({ ...filters, level: v })}>
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Levels</SelectItem>
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
                  <button onClick={() => navigate(`/agent/player/${player.user_id}`)} className="text-xs text-primary hover:underline">View Profile</button>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{player.nationality || "—"}</span>
                    {player.nationality_2 && <span>/ {player.nationality_2}</span>}
                  </div>
                  <p>Age: {player.age || "—"}</p>
                  <p>Club: {player.current_club || "—"}</p>
                  <p>Level: {player.playing_level || "—"}</p>
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
      <div className="flex items-center justify-center gap-3 mt-6">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="px-4 py-2 text-sm border border-white/10 rounded-sm disabled:opacity-30 hover:border-white/30 transition-colors">
          Previous
        </button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={players.length < 20}
          className="px-4 py-2 text-sm border border-white/10 rounded-sm disabled:opacity-30 hover:border-white/30 transition-colors">
          Next
        </button>
      </div>
    </div>
  );
};

export default AgentPlayers;

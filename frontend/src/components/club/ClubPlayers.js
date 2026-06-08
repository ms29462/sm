import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Search, Heart, CheckCircle } from 'lucide-react';
import { POSITIONS, LEVELS, COUNTRIES } from '@/lib/constants';

const BADGE_ICONS = {
  verified_profile: "✓", match_ready: "⚡", scout_approved: "👁", professional_experience: "🏆",
  international_player: "🌍", university_eligible: "🎓", top_prospect: "⭐",
  diaspora_eligible: "🌐", video_verified: "🎥"
};
const QUALITY_COLORS = {
  Bronze: "text-amber-600 border-amber-600/30 bg-amber-600/10",
  Silver: "text-gray-300 border-gray-300/30 bg-gray-300/10",
  Gold: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  Elite: "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

const ClubPlayers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState({});
  const [filterBadge, setFilterBadge] = useState('');
  const [filterRepresentation, setFilterRepresentation] = useState('');
  const [filterMandate, setFilterMandate] = useState('');
  const [filterQuality, setFilterQuality] = useState('');
  const [filters, setFilters] = useState({
    position: 'All',
    level: 'All',
    nationality: 'All',
    name: '',
  });

  useEffect(() => {
    loadPlayers();
  }, [filters, filterBadge, filterQuality, filterRepresentation, filterMandate]);

  const loadPlayers = async () => {
    try {
      const queryFilters = {};
      if (filters.position !== 'All') queryFilters.position = filters.position;
      if (filters.level !== 'All') queryFilters.level = filters.level;
      if (filters.nationality !== 'All' && filters.nationality) queryFilters.nationality = filters.nationality;
      if (filters.name) queryFilters.name = filters.name;
      if (filters.has_highlights) queryFilters.has_highlights = true;
      if (filters.has_full_game) queryFilters.has_full_game = true;
      if (filterBadge) queryFilters.badge = filterBadge;
      if (filterQuality) queryFilters.quality_level = filterQuality;
      if (filterRepresentation) queryFilters.representation_status = filterRepresentation;
      if (filterMandate) queryFilters.mandate_status = filterMandate;

      const response = await api.getPlayers(queryFilters);
      setPlayers(response.data);
      // Load verifications for all players
      const verifResults = await Promise.allSettled((response.data || []).map(async (p) => {
        const v = await api.getPlayerVerification(p.user_id);
        return { userId: p.user_id, data: v.data };
      }));
      const verifs = {};
      verifResults.forEach(r => {
        if (r.status === 'fulfilled' && r.value?.data) {
          verifs[r.value.userId] = r.value.data;
        }
      });
      setVerifications({...verifs});
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
          <div className="col-span-1 md:col-span-2 lg:col-span-4 flex items-center gap-6 pt-3 border-t border-border/30 mt-2">
            <label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Video:</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.has_highlights}
                onChange={e => setFilters(prev => ({...prev, has_highlights: e.target.checked}))}
                className="accent-primary w-4 h-4" />
              <span className="text-sm">Has Highlights</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.has_full_game}
                onChange={e => setFilters(prev => ({...prev, has_full_game: e.target.checked}))}
                className="accent-primary w-4 h-4" />
              <span className="text-sm">Has Full Game</span>
            </label>
          </div>
          {/* Badge & Quality Filters */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-4 pt-3 border-t border-border/30 mt-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Badge:</label>
              <select value={filterBadge} onChange={e => setFilterBadge(e.target.value)}
                className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none appearance-none cursor-pointer">
                <option value="">All Badges</option>
                <option value="verified_profile">✓ Verified Profile</option>
                <option value="match_ready">⚡ Match Ready</option>
                <option value="scout_approved">👁 Scout Approved</option>
                <option value="professional_experience">🏆 Professional Experience</option>
                <option value="international_player">🌍 International Player</option>
                <option value="university_eligible">🎓 University Eligible</option>
                <option value="top_prospect">⭐ Top Prospect</option>
                <option value="diaspora_eligible">🌐 Diaspora Eligible</option>
                <option value="video_verified">🎥 Video Verified</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Quality:</label>
              <select value={filterQuality} onChange={e => setFilterQuality(e.target.value)}
                className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none appearance-none cursor-pointer">
                <option value="">All Levels</option>
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Elite">Elite</option>
              </select>
            </div>
            {(filterBadge || filterQuality) && (
              <button onClick={() => { setFilterBadge(''); setFilterQuality(''); }}
                className="text-xs text-muted-foreground hover:text-white border border-white/10 rounded-sm px-3 py-1.5 transition-colors">
                Clear
              </button>
            )}
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
              onClick={() => navigate(user?.role === 'analyst' ? `/analyst/player-profile/${player.user_id}` : `/club/player/${player.user_id}`)}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors cursor-pointer flex flex-col"
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
                    {verifications[player.user_id]?.quality_level && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border font-bold ${QUALITY_COLORS[verifications[player.user_id].quality_level]}`}>
                        {verifications[player.user_id].quality_level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    {player.representation_status && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${
                        player.representation_status === "represented" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        player.representation_status === "not_represented" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        player.representation_status === "previously_represented" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                        "bg-white/5 text-muted-foreground border-white/10"
                      }`}>
                        {player.representation_status === "represented" ? "Agent" :
                         player.representation_status === "not_represented" ? "No Agent" :
                         player.representation_status === "previously_represented" ? "Free" : "—"}
                      </span>
                    )}
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
              <div className="space-y-2 text-sm mb-4 flex-1">
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
              {verifications[player.user_id]?.badges?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {verifications[player.user_id].badges.slice(0, 4).map(badge => (
                    <span key={badge} title={badge.replace(/_/g,' ')} className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-sm bg-white/5 border border-white/10 text-muted-foreground">
                      {BADGE_ICONS[badge]}
                    </span>
                  ))}
                  {verifications[player.user_id].badges.length > 4 && (
                    <span className="text-[10px] text-muted-foreground ml-1">+{verifications[player.user_id].badges.length - 4}</span>
                  )}
                </div>
              )}
              <Button
                data-testid={`favorite-btn-${player.user_id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddFavorite(player.user_id);
                }}
                className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-10 mt-auto"
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
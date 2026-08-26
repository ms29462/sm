import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ApprovedGate } from '@/components/ui/PermissionGate';
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
  diaspora_eligible: "🌐", video_verified: "🎥",
  ncaa_ready: "🏈", njcaa_ready: "🏟️", usports_ready: "🍁"
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
  const [filterMinScore, setFilterMinScore] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterNationality2, setFilterNationality2] = useState('');
  const [filterMinAge, setFilterMinAge] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterMaxAge, setFilterMaxAge] = useState('');
  const [filterMinHeight, setFilterMinHeight] = useState('');
  const [filterMaxHeight, setFilterMaxHeight] = useState('');
  const [filterFoot, setFilterFoot] = useState('');
  const [filterLookingFor, setFilterLookingFor] = useState('');
  const [filterContractStatus, setFilterContractStatus] = useState('');
  const [filterSecondaryPosition, setFilterSecondaryPosition] = useState('');
  const [filterMinWeight, setFilterMinWeight] = useState('');
  const [filterMaxWeight, setFilterMaxWeight] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterMandate, setFilterMandate] = useState('');
  const [filterQuality, setFilterQuality] = useState('');
  const [filters, setFilters] = useState({
    position: 'All',
    level: 'All',
    nationality: 'All',
    name: '',
  });

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [filters, filterBadge, filterQuality, filterRepresentation, filterMandate, filterMinScore, filterTeam, filterNationality2, filterMinAge, filterMaxAge, filterGender, filterMinHeight, filterMaxHeight, filterFoot, filterLookingFor, filterContractStatus, filterSecondaryPosition, filterMinWeight, filterMaxWeight]);

  // Reload whenever page or any filter changes
  useEffect(() => {
    loadPlayers();
  }, [page, filters, filterBadge, filterQuality, filterRepresentation, filterMandate, filterMinScore, filterTeam, filterNationality2, filterMinAge, filterMaxAge, filterGender, filterMinHeight, filterMaxHeight, filterFoot, filterLookingFor, filterContractStatus, filterSecondaryPosition, filterMinWeight, filterMaxWeight]);

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
      if (filterMinScore) queryFilters.min_quality_score = parseInt(filterMinScore);
      if (filterTeam) queryFilters.national_team = filterTeam;
      if (filterNationality2) queryFilters.nationality_2 = filterNationality2;
      if (filterMinAge) queryFilters.min_age = parseInt(filterMinAge);
      if (filterMaxAge) queryFilters.max_age = parseInt(filterMaxAge);
      if (filterGender) queryFilters.gender = filterGender;
      if (filterMinHeight) queryFilters.min_height = parseInt(filterMinHeight);
      if (filterMaxHeight) queryFilters.max_height = parseInt(filterMaxHeight);
      if (filterFoot) queryFilters.preferred_foot = filterFoot;
      if (filterLookingFor) queryFilters.looking_for = filterLookingFor;
      if (filterContractStatus) queryFilters.contract_status = filterContractStatus;
      if (filterSecondaryPosition) queryFilters.secondary_position = filterSecondaryPosition;
      if (filterMinWeight) queryFilters.min_weight = parseInt(filterMinWeight);
      if (filterMaxWeight) queryFilters.max_weight = parseInt(filterMaxWeight);
      queryFilters.page = page;
      queryFilters.limit = 20;

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

  const clearAllFilters = () => {
    setFilters({ position: 'All', level: 'All', nationality: 'All', name: '' });
    setFilterBadge(''); setFilterQuality(''); setFilterRepresentation(''); setFilterMandate('');
    setFilterMinScore(''); setFilterTeam(''); setFilterNationality2('');
    setFilterMinAge(''); setFilterMaxAge(''); setFilterGender(''); setFilterMinHeight('');
    setFilterMaxHeight(''); setFilterFoot(''); setFilterLookingFor(''); setFilterContractStatus('');
    setFilterSecondaryPosition(''); setFilterMinWeight(''); setFilterMaxWeight('');
  };

  const hasActiveFilters = filters.name || filters.position !== 'All' || filters.level !== 'All' ||
    filters.nationality !== 'All' || filters.has_highlights || filters.has_full_game ||
    filterBadge || filterQuality || filterRepresentation || filterMandate || filterMinScore ||
    filterTeam || filterNationality2 || filterMinAge || filterMaxAge ||
    filterGender || filterMinHeight || filterMaxHeight || filterFoot || filterLookingFor ||
    filterContractStatus || filterSecondaryPosition || filterMinWeight || filterMaxWeight;

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
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">BROWSE PLAYERS</h1>
        <p className="text-muted-foreground">Find and save talented players</p>
      </div>

      <div className="bg-card border border-border/50 p-4 md:p-6 rounded-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-bold uppercase">FILTERS</h3>
          {hasActiveFilters && (
            <button onClick={clearAllFilters}
              className="text-xs text-primary border border-primary/30 rounded-sm px-3 py-1.5 hover:bg-primary/10 transition-colors">
              Reset All
            </button>
          )}
        </div>

        {/* Row 1: Name + Main Football Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Player Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input data-testid="name-filter" type="text" value={filters.name}
                onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
                className="pl-10 bg-black/20 border-white/10 focus:border-primary rounded-sm h-10"
                placeholder="Search by name..." />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Position</label>
            <Select value={filters.position} onValueChange={(value) => setFilters((prev) => ({ ...prev, position: value }))}>
              <SelectTrigger data-testid="position-filter" className="bg-black/20 border-white/10 focus:border-primary rounded-sm h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['All', ...POSITIONS].map((pos) => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Secondary Position</label>
            <select value={filterSecondaryPosition} onChange={e => setFilterSecondaryPosition(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none w-full cursor-pointer">
              <option value="">All</option>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Playing Level</label>
            <Select value={filters.level} onValueChange={(value) => setFilters((prev) => ({ ...prev, level: value }))}>
              <SelectTrigger data-testid="level-filter" className="bg-black/20 border-white/10 focus:border-primary rounded-sm h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['All', ...LEVELS].map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Nationality + Contract + Looking For + Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Nationality</label>
            <Select value={filters.nationality} onValueChange={(value) => setFilters((prev) => ({ ...prev, nationality: value }))}>
              <SelectTrigger data-testid="nationality-filter" className="bg-black/20 border-white/10 focus:border-primary rounded-sm h-10">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="All">All</SelectItem>
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">2nd Nationality</label>
            <Select value={filterNationality2 || "All"} onValueChange={(value) => setFilterNationality2(value === "All" ? "" : value)}>
              <SelectTrigger className="bg-black/20 border-white/10 focus:border-primary rounded-sm h-10">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="All">All</SelectItem>
                {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Contract Status</label>
            <select value={filterContractStatus} onChange={e => setFilterContractStatus(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none w-full cursor-pointer">
              <option value="">All</option>
              <option value="Free Agent">Free Agent</option>
              <option value="Under Contract">Under Contract</option>
              <option value="Loan Available">Loan Available</option>
              <option value="Open to Offers">Open to Offers</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Looking For</label>
            <select value={filterLookingFor} onChange={e => setFilterLookingFor(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none w-full cursor-pointer">
              <option value="">All</option>
              <option value="Professional Opportunities">Professional</option>
              <option value="Semi-Professional Opportunities">Semi-Professional</option>
              <option value="University Opportunities">University / College</option>
            </select>
          </div>
        </div>

        {/* Row 3: Age + Height + Weight + Physical */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-3">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Min Age</label>
            <input type="number" value={filterMinAge} onChange={e => setFilterMinAge(e.target.value)}
              placeholder="e.g. 18" className="bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none w-full" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Max Age</label>
            <input type="number" value={filterMaxAge} onChange={e => setFilterMaxAge(e.target.value)}
              placeholder="e.g. 30" className="bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none w-full" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Min Height (cm)</label>
            <input type="number" value={filterMinHeight} onChange={e => setFilterMinHeight(e.target.value)}
              placeholder="e.g. 170" className="bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none w-full" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Max Height (cm)</label>
            <input type="number" value={filterMaxHeight} onChange={e => setFilterMaxHeight(e.target.value)}
              placeholder="e.g. 195" className="bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none w-full" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Min Weight (kg)</label>
            <input type="number" value={filterMinWeight} onChange={e => setFilterMinWeight(e.target.value)}
              placeholder="e.g. 60" className="bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none w-full" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Max Weight (kg)</label>
            <input type="number" value={filterMaxWeight} onChange={e => setFilterMaxWeight(e.target.value)}
              placeholder="e.g. 90" className="bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none w-full" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Gender</label>
            <select value={filterGender} onChange={e => setFilterGender(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none w-full cursor-pointer">
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">Preferred Foot</label>
            <select value={filterFoot} onChange={e => setFilterFoot(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none w-full cursor-pointer">
              <option value="">All</option>
              <option value="Right">Right</option>
              <option value="Left">Left</option>
              <option value="Both">Both</option>
            </select>
          </div>
        </div>

        {/* Row 4: Video checkboxes */}
        <div className="flex flex-wrap items-center gap-6 pb-3 border-b border-border/30 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!filters.has_highlights}
              onChange={e => setFilters(prev => ({...prev, has_highlights: e.target.checked}))}
              className="accent-primary w-4 h-4" />
            <span className="text-sm whitespace-nowrap">Has Highlights</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!filters.has_full_game}
              onChange={e => setFilters(prev => ({...prev, has_full_game: e.target.checked}))}
              className="accent-primary w-4 h-4" />
            <span className="text-sm whitespace-nowrap">Has Full Game</span>
          </label>
        </div>

        {/* Row 5: Badge / Quality / Score (advanced) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Badge:</label>
            <select value={filterBadge} onChange={e => setFilterBadge(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none cursor-pointer">
              <option value="">All</option>
              <option value="verified_profile">✓ Verified</option>
              <option value="match_ready">⚡ Match Ready</option>
              <option value="scout_approved">👁 Scout Approved</option>
              <option value="professional_experience">🏆 Pro Experience</option>
              <option value="international_player">🌍 International</option>
              <option value="university_eligible">🎓 University Eligible</option>
              <option value="top_prospect">⭐ Top Prospect</option>
              <option value="diaspora_eligible">🌐 Diaspora</option>
              <option value="video_verified">🎥 Video Verified</option>
              <option value="ncaa_ready">🏈 NCAA Ready</option>
              <option value="njcaa_ready">🏟️ NJCAA Ready</option>
              <option value="usports_ready">🍁 U SPORTS Ready</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Quality:</label>
            <select value={filterQuality} onChange={e => setFilterQuality(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none cursor-pointer">
              <option value="">All</option>
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Elite">Elite</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Min Score:</label>
            <select value={filterMinScore} onChange={e => setFilterMinScore(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none cursor-pointer">
              <option value="">Any</option>
              <option value="25">25+</option>
              <option value="50">50+</option>
              <option value="60">60+</option>
              <option value="70">70+</option>
              <option value="80">80+</option>
              <option value="90">90+</option>
            </select>
          </div>
        </div>
      </div>

      {players.length === 0 ? (
        <div data-testid="no-players" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No players found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.map((player) => (
            <div
              key={player.user_id}
              data-testid={`player-card-${player.user_id}`}
              onClick={() => window.open(user?.role === 'analyst' ? `/analyst/player-profile/${player.user_id}` : user?.role === 'federation' ? `/federation/player/${player.user_id}` : `/club/player/${player.user_id}`, '_blank')}
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
      {/* Pagination */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
          className="px-4 py-2 text-sm border border-white/10 rounded-sm disabled:opacity-30 hover:border-white/30 transition-colors">
          Previous
        </button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <button onClick={() => setPage(p => p+1)} disabled={players.length < 20}
          className="px-4 py-2 text-sm border border-white/10 rounded-sm disabled:opacity-30 hover:border-white/30 transition-colors">
          Next
        </button>
      </div>

    </div>
  );
};

export default ClubPlayers;
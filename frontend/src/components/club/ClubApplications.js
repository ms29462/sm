import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, X, User, Trophy, Activity, Flag, Ruler, Weight, Footprints, Building, ExternalLink } from "lucide-react";
import RequestChatDialog from '@/components/club/RequestChatDialog';

const STATUS_OPTIONS = ["submitted", "viewed", "shortlisted", "interview_requested", "accepted", "rejected"];
const STATUS_COLORS = {
  submitted: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  viewed: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  shortlisted: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  interview_requested: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  accepted: "bg-green-500/10 text-green-500 border-green-500/20",
};

const BADGE_LABELS = {
  verified_profile: "Verified", match_ready: "Match Ready", scout_approved: "Scout Approved",
  professional_experience: "Pro Experience", international_player: "International",
  university_eligible: "Uni Eligible", top_prospect: "Top Prospect",
  diaspora_eligible: "Diaspora", video_verified: "Video Verified"
};
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

const PlayerProfilePopup = ({ player, onClose, verifications = {} }) => {
  const navigate = useNavigate();
  const goToFullProfile = () => { onClose(); navigate(`/club/player/${player.user_id}`); };
  if (!player) return null;
  const nationalities = [player.nationality_1, player.nationality_2, player.nationality_3]
    .filter(Boolean).join(", ") || player.nationality || "N/A";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="bg-card border border-border/50 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            {player.profile_picture ? (
              <img src={player.profile_picture} alt={player.name} className="w-16 h-16 rounded-sm object-cover border-2 border-primary" />
            ) : (
              <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center border-2 border-border">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-heading font-bold uppercase cursor-pointer hover:text-primary transition-colors" onClick={goToFullProfile}>{player.name}</h2>
              <p className="text-sm text-muted-foreground">{player.position} - {player.playing_level}</p>
              <div className="flex items-center gap-2 mt-1">
                {player.verified && (
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-sm bg-blue-500/10 text-blue-500 border border-blue-500/20">Verified</span>
                )}
                {player.approved && (
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-sm bg-green-500/10 text-green-500 border border-green-500/20">Approved</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToFullProfile} className="px-2 py-1 border border-primary text-primary hover:bg-primary hover:text-black rounded-sm text-[10px] font-bold uppercase tracking-wide transition-colors">
              Profile
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Personal Information</h3>
            {/* Badges & Quality Score */}
            {verifications[player?.user_id] && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {verifications[player?.user_id]?.quality_score > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-black/20 border border-white/10 rounded-sm">
                    <span className="text-xs text-muted-foreground">Score</span>
                    <span className="text-xs font-bold text-primary">{verifications[player?.user_id].quality_score}/100</span>
                  </div>
                )}
                {verifications[player?.user_id]?.quality_level && (
                  <span className={`text-xs px-2 py-0.5 rounded-sm border font-bold ${QUALITY_COLORS[verifications[player?.user_id].quality_level]}`}>
                    {verifications[player?.user_id].quality_level}
                  </span>
                )}
                {verifications[player?.user_id]?.badges?.slice(0, 3).map(badge => (
                  <span key={badge} title={BADGE_LABELS[badge]} className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-sm bg-white/5 border border-white/10 text-muted-foreground">
                    {BADGE_ICONS[badge]} <span className="hidden sm:inline">{BADGE_LABELS[badge]}</span>
                  </span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-background border border-border/50 rounded-sm p-3">
                <div className="flex items-center gap-2 mb-1"><Activity className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground uppercase">Age</span></div>
                <span className="font-medium">{player.age ? player.age + " years" : "N/A"}</span>
              </div>
              <div className="bg-background border border-border/50 rounded-sm p-3">
                <div className="flex items-center gap-2 mb-1"><Flag className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground uppercase">Nationality</span></div>
                <span className="font-medium">{nationalities}</span>
              </div>
              <div className="bg-background border border-border/50 rounded-sm p-3">
                <div className="flex items-center gap-2 mb-1"><Footprints className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground uppercase">Preferred Foot</span></div>
                <span className="font-medium">{player.preferred_foot || "N/A"}</span>
              </div>
              <div className="bg-background border border-border/50 rounded-sm p-3">
                <div className="flex items-center gap-2 mb-1"><Ruler className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground uppercase">Height</span></div>
                <span className="font-medium">{player.height ? player.height + " cm" : "N/A"}</span>
              </div>
              <div className="bg-background border border-border/50 rounded-sm p-3">
                <div className="flex items-center gap-2 mb-1"><Weight className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground uppercase">Weight</span></div>
                <span className="font-medium">{player.weight ? player.weight + " kg" : "N/A"}</span>
              </div>
              <div className="bg-background border border-border/50 rounded-sm p-3">
                <div className="flex items-center gap-2 mb-1"><Building className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground uppercase">Current Club</span></div>
                <span className="font-medium">{player.current_club || "Free Agent"}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Season Statistics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-background border border-border/50 rounded-sm p-4 text-center">
                <div className="text-3xl font-heading font-bold text-primary mb-1">{player.games || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Games</div>
              </div>
              <div className="bg-background border border-border/50 rounded-sm p-4 text-center">
                <div className="text-3xl font-heading font-bold text-primary mb-1">{player.goals || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Goals</div>
              </div>
              <div className="bg-background border border-border/50 rounded-sm p-4 text-center">
                <div className="text-3xl font-heading font-bold text-primary mb-1">{player.assists || 0}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Assists</div>
              </div>
            </div>
          </div>
          {player.video_analysis_score && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">AI Video Analysis Score</h3>
              <div className="bg-background border border-border/50 rounded-sm p-4 flex items-center gap-4">
                <div className="text-4xl font-heading font-bold text-primary">{player.video_analysis_score}</div>
                <div className="flex-1 bg-border rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: player.video_analysis_score + "%" }} />
                </div>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {player.highlight_video && (
              <a href={player.highlight_video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-primary text-black font-bold text-xs uppercase tracking-wide rounded-sm hover:bg-primary/90 transition-colors whitespace-nowrap">
                <Trophy className="w-4 h-4" />
                Watch Highlights
              </a>
            )}
            {player.transfermarkt_url && (
              <a href={player.transfermarkt_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white/10 text-white font-bold text-xs uppercase tracking-wide rounded-sm hover:bg-white/20 transition-colors whitespace-nowrap">
                <ExternalLink className="w-4 h-4" />
                Transfermarkt
              </a>
            )}
          </div>
          <div className="border-t border-border pt-4 mt-2">
            <RequestChatDialog playerId={player.user_id} playerName={player.name} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ClubApplications = () => {
  const [applications, setApplications] = useState([]);
  const [verifications, setVerifications] = useState({});
  const [matchScores, setMatchScores] = useState({});
  const [expandedOpps, setExpandedOpps] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [candidateFilters, setCandidateFilters] = useState({});
  const [candidateSort, setCandidateSort] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await api.getClubApplications();
      setApplications(response.data || []);
      // Load verifications for all players
      const verifs = {};
      await Promise.allSettled((response.data || []).map(async (app) => {
        try {
          const v = await api.getPlayerVerification(app.player_id);
          if (v.data) verifs[app.player_id] = v.data;
        } catch (e) {}
      }));
      setVerifications({...verifs});
    } catch (error) {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await api.updateApplicationStatus(applicationId, newStatus);
      toast.success("Status updated");
      loadApplications();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Group applications by opportunity
  const grouped = applications.reduce((acc, app) => {
    const oppId = app.opportunity_id;
    if (!acc[oppId]) {
      acc[oppId] = {
        opportunity: app.opportunity,
        applications: []
      };
    }
    acc[oppId].applications.push(app);
    return acc;
  }, {});

  // Get unique positions and statuses
  const allPositions = [...new Set(Object.values(grouped).map(g => g.opportunity?.position).filter(Boolean))];

  // Filter by search, position and status
  const filteredGroups = Object.entries(grouped).filter(([_, group]) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch = (
        group.opportunity?.position?.toLowerCase().includes(q) ||
        group.opportunity?.league_level?.toLowerCase().includes(q) ||
        group.applications.some(a => a.player_name?.toLowerCase().includes(q))
      );
      if (!matchesSearch) return false;
    }
    if (filterPosition && group.opportunity?.position !== filterPosition) return false;
    if (filterStatus) {
      const hasStatus = group.applications.some(a => a.status === filterStatus);
      if (!hasStatus) return false;
    }
    return true;
  });

  const updateCandidateFilter = (oppId, field, value) => {
    setCandidateFilters(prev => ({
      ...prev,
      [oppId]: { ...(prev[oppId] || {}), [field]: value }
    }));
  };

  const getFilteredCandidates = (oppId, apps) => {
    const f = candidateFilters[oppId] || {};
    const sort = candidateSort[oppId] || 'none';
    let filtered = apps.filter(app => {
      if (f.name && !app.player_name?.toLowerCase().includes(f.name.toLowerCase())) return false;
      if (f.minScore) {
        const score = verifications[app.player_id]?.quality_score || 0;
        if (score < parseInt(f.minScore)) return false;
      }
      if (f.badge) {
        const badges = verifications[app.player_id]?.badges || [];
        if (!badges.includes(f.badge)) return false;
      }
      return true;
    });
    if (sort === 'fit') {
      filtered = [...filtered].sort((a, b) => (matchScores[b.opportunity_id] || 0) - (matchScores[a.opportunity_id] || 0));
    } else if (sort === 'quality') {
      filtered = [...filtered].sort((a, b) => (verifications[b.player_id]?.quality_score || 0) - (verifications[a.player_id]?.quality_score || 0));
    }
    return filtered;
  };

  const toggleOpp = (oppId) => {
    setExpandedOpps(prev => ({ ...prev, [oppId]: !prev[oppId] }));
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
      {selectedPlayer && <PlayerProfilePopup player={selectedPlayer} onClose={() => setSelectedPlayer(null)} verifications={verifications} />}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">APPLICATIONS</h1>
        <p className="text-muted-foreground">Review and manage player applications - click a card to view full profile</p>
      </div>
      {applications.length === 0 ? (
        <div data-testid="no-applications" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No applications received yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by opportunity, position, player..."
              className="w-full bg-black/20 border border-white/10 rounded-sm h-10 px-4 text-sm text-white outline-none focus:border-primary"
            />
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-2">
            <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none cursor-pointer">
              <option value="">All Positions</option>
              {allPositions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none cursor-pointer">
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="viewed">Viewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_requested">Interview Requested</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            {(filterPosition || filterStatus || searchQuery) && (
              <button onClick={() => { setFilterPosition(''); setFilterStatus(''); setSearchQuery(''); }}
                className="text-xs text-muted-foreground hover:text-white border border-white/10 rounded-sm px-3 py-1.5">
                Clear Filters
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{filteredGroups.length} opportunities · {applications.length} total applications</p>
          {filteredGroups.map(([oppId, group]) => (
            <div key={oppId} className="bg-card border border-border/50 rounded-sm overflow-hidden">
              {/* Opportunity Header */}
              <button
                onClick={() => toggleOpp(oppId)}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-white/5 transition-colors gap-2"
              >
                <div className="flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-heading font-bold uppercase">{group.opportunity?.position || "Position N/A"}</h3>
                    <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-sm">
                      {group.applications.length} applicant{group.applications.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{group.opportunity?.league_level} · {group.opportunity?.salary_range || "Salary N/A"}</p>
                </div>
                <span className="text-muted-foreground text-sm">{expandedOpps[oppId] ? '▲ Collapse' : '▼ Expand'}</span>
              </button>

              {/* Applications List */}
              {expandedOpps[oppId] && (
                <div className="border-t border-border/50">
                  {/* Candidate Filters */}
                  <div className="flex flex-wrap gap-2 p-3 bg-black/10 border-b border-border/30">
                    <input
                      value={candidateFilters[oppId]?.name || ''}
                      onChange={e => updateCandidateFilter(oppId, 'name', e.target.value)}
                      placeholder="Filter by player name..."
                      className="flex-1 min-w-[140px] bg-black/20 border border-white/10 rounded-sm h-8 px-3 text-xs text-white outline-none focus:border-primary"
                    />
                    <select value={candidateFilters[oppId]?.minScore || ''} onChange={e => updateCandidateFilter(oppId, 'minScore', e.target.value)}
                      className="bg-black/20 border border-white/10 rounded-sm h-8 px-2 text-xs text-white outline-none cursor-pointer">
                      <option value="">Any Score</option>
                      <option value="25">25+</option>
                      <option value="50">50+</option>
                      <option value="60">60+</option>
                      <option value="70">70+</option>
                      <option value="80">80+</option>
                    </select>
                    <select value={candidateFilters[oppId]?.badge || ''} onChange={e => updateCandidateFilter(oppId, 'badge', e.target.value)}
                      className="bg-black/20 border border-white/10 rounded-sm h-8 px-2 text-xs text-white outline-none cursor-pointer">
                      <option value="">Any Badge</option>
                      <option value="verified_profile">✓ Verified</option>
                      <option value="match_ready">⚡ Match Ready</option>
                      <option value="scout_approved">👁 Scout Approved</option>
                      <option value="top_prospect">⭐ Top Prospect</option>
                      <option value="professional_experience">🏆 Pro Experience</option>
                      <option value="international_player">🌍 International</option>
                      <option value="university_eligible">🎓 Uni Eligible</option>
                      <option value="video_verified">🎥 Video Verified</option>
                    </select>
                    {(candidateFilters[oppId]?.name || candidateFilters[oppId]?.minScore || candidateFilters[oppId]?.badge) && (
                      <button onClick={() => setCandidateFilters(prev => ({ ...prev, [oppId]: {} }))}
                        className="text-[10px] text-muted-foreground hover:text-white border border-white/10 rounded-sm px-2 py-1">
                        Clear
                      </button>
                    )}
                    <select value={candidateSort[oppId] || 'none'} onChange={e => setCandidateSort(prev => ({...prev, [oppId]: e.target.value}))}
                      className="bg-black/20 border border-white/10 rounded-sm h-8 px-2 text-xs text-white outline-none cursor-pointer">
                      <option value="none">Sort by...</option>
                      <option value="quality">Quality Score</option>
                    </select>
                    <span className="text-xs text-muted-foreground self-center">
                      {getFilteredCandidates(oppId, group.applications).length} / {group.applications.length} candidates
                    </span>
                  </div>
                  <div className="divide-y divide-border/30">
                  {getFilteredCandidates(oppId, group.applications).map((app) => (
            <div key={app.id} data-testid={"application-card-" + app.id} onClick={() => setSelectedPlayer(app.player)} className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-heading font-bold uppercase">{app.player.name}</h3>
                    <span className="text-xs text-muted-foreground border border-border/50 px-2 py-0.5 rounded-sm">Click to view profile</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Applied for: {app.opportunity.position} - {app.opportunity.league_level}</p>
                </div>
                <span data-testid={"status-" + app.id} className={"px-3 py-1 text-[10px] uppercase tracking-wider border rounded-sm " + STATUS_COLORS[app.status]}>{app.status}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
                {app.player.position && (<div><span className="text-muted-foreground block mb-1">Position</span><span className="font-medium">{app.player.position}</span></div>)}
                {app.player.age && (<div><span className="text-muted-foreground block mb-1">Age</span><span className="font-medium">{app.player.age} years</span></div>)}
                {app.player.nationality && (<div><span className="text-muted-foreground block mb-1">Nationality</span><span className="font-medium">{app.player.nationality}</span></div>)}
                {app.player.playing_level && (<div><span className="text-muted-foreground block mb-1">Level</span><span className="font-medium">{app.player.playing_level}</span></div>)}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center space-x-6 font-mono text-xs text-muted-foreground">
                  <span>GOALS: {app.player.goals || 0}</span>
                  <span>ASSISTS: {app.player.assists || 0}</span>
                  <span>GAMES: {app.player.games || 0}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Update Status:</span>
                  <select
                    data-testid={"status-select-" + app.id}
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className="w-full sm:w-auto bg-black/20 border border-white/10 rounded-sm h-9 px-2 text-sm text-white outline-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status.replace(/_/g, " ").toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubApplications;



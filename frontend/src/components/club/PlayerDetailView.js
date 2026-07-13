import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, User, CheckCircle, Heart, ExternalLink, Download, Video, Play, Target, Kanban, CalendarCheck } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import RequestChatDialog from './RequestChatDialog';
import ReportUserDialog from '@/components/shared/ReportUserDialog';

const BADGE_LABELS = {
  verified_profile: "Verified Profile", match_ready: "Match Ready", scout_approved: "Scout Approved",
  professional_experience: "Professional Experience", international_player: "International Player",
  university_eligible: "University Eligible", top_prospect: "Top Prospect",
  diaspora_eligible: "Diaspora Eligible", video_verified: "Video Verified"
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


const PlayerDetailView = () => {
  const [chatRequestStatus, setChatRequestStatus] = useState(null);
  const [trialSent] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialForm, setTrialForm] = useState({});
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchArchive, setMatchArchive] = useState([]);
  const [isTracked, setIsTracked] = useState(false);
  const [inPipeline, setInPipeline] = useState(false);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [verification, setVerification] = useState(null);
  const [agentRep, setAgentRep] = useState(null);
        const [showTrackConfirm, setShowTrackConfirm] = useState(false);
  const [showFavConfirm, setShowFavConfirm] = useState(false);

  useEffect(() => {
    loadPlayerProfile();
    checkPipelineStatus();
    checkTrackStatus();
    loadVerification();
    checkChatRequestStatus();
  }, [playerId]);

  const checkChatRequestStatus = async () => {
    try {
      const res = await api.getMyChatRequests();
      const existing = (res.data || []).find(r => r.player_id === playerId && (r.status === "pending" || r.status === "accepted"));
      setChatRequestStatus(existing ? existing.status : null);
    } catch (e) { console.error("Chat request status error:", e); }
  };

  const loadVerification = async () => {
    try {
      const res = await api.getPlayerVerification(playerId);
      console.log('Verification data:', JSON.stringify(res.data));
      setVerification(res.data);
    } catch (e) { console.error('Verification error:', e); }
  };

  const checkTrackStatus = async () => {
    try {
      const res = await api.getTrackedPlayers();
      const tracked = (res.data || []).some(p => p.user_id === playerId);
      setIsTracked(tracked);
    } catch (e) {}
  };

  const checkPipelineStatus = async () => {
    try {
      const res = await api.getPipeline();
      const inPipe = (res.data || []).some(p => p.player_id === playerId);
      setInPipeline(inPipe);
    } catch (e) {}
    finally { setPipelineLoading(false); }
  };

  const loadPlayerProfile = async () => {
    try {
      const [playerRes, archiveRes] = await Promise.all([
        api.getPlayerDetail(playerId),
        api.getPlayerMatchArchivePublic(playerId).catch(() => ({ data: [] }))
      ]);
      setPlayer(playerRes.data);
      setMatchArchive(archiveRes.data || []);
    } catch (error) {
      toast.error('Failed to load player profile');
    } finally {
      setLoading(false);
    }
  };

  
  const handleAddToPipeline = async () => {
    try {
      await api.addToPipeline({ player_id: playerId, stage: "New Application" });
      setInPipeline(true);
      toast.success("Added to recruitment pipeline!");
    } catch (e) {
      if (e.response?.data?.detail === "Player already in pipeline") {
        setInPipeline(true);
        toast.info("Player is already in your pipeline");
      } else {
        toast.error(e.response?.data?.detail || "Failed to add to pipeline");
      }
    }
  };

  const handleTrackPlayer = async () => {
    try {
      if (isTracked) {
        await api.untrackPlayer(playerId);
        setIsTracked(false);
        toast.success('Removed from watchlist');
      } else {
        await api.trackPlayer(playerId);
        setIsTracked(true);
        toast.success('Added to watchlist!');
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update watchlist');
    }
  };

  const handleAddFavorite = async () => {
    try {
      await api.addFavorite(playerId);
      toast.success('Added to favorites!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to favorites');
    }
  };

  const handleDownloadCV = () => {
    if (player?.cv) window.open(player.cv, '_blank');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">LOADING...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Player not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const nationalities = [player.nationality_1, player.nationality_2, player.nationality_3]
    .filter(Boolean).join(', ') || player.nationality || 'N/A';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              {player.profile_picture ? (
                <img src={player.profile_picture} alt={player.name} className="w-20 h-20 rounded-sm object-cover border-2 border-primary" />
              ) : (
                <div className="w-20 h-20 rounded-sm bg-muted flex items-center justify-center border-2 border-border">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-heading font-bold uppercase">{player.name}</h1>
                <p className="text-muted-foreground">{player.position} · {player.playing_level}</p>
                <div className="flex items-center gap-2 mt-1">
                  {player.verified && (
                    <span className="inline-flex items-center px-3 py-1 text-xs uppercase tracking-wider rounded-sm bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <CheckCircle className="w-3 h-3 mr-1" /> Verified
                    </span>
                  )}

                  {player.approved && (
                    <span className="bg-primary/10 text-primary border border-primary/20 uppercase text-sm tracking-wider px-4 py-2 rounded-sm font-bold">
                      Approved
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          
            {/* Agent Representation */}
            {agentRep?.representation_status && (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className={`text-xs px-2 py-1 rounded-sm border ${
                  agentRep.representation_status === "represented" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  agentRep.representation_status === "not_represented" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                  agentRep.representation_status === "previously_represented" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                  "bg-white/5 text-muted-foreground border-white/10"
                }`}>
                  {agentRep.representation_status === "represented" ? "🤝 Agent Represented" :
                   agentRep.representation_status === "not_represented" ? "✓ No Agent" :
                   agentRep.representation_status === "previously_represented" ? "Free from Mandate" : "Agent Status Unknown"}
                </span>
                {agentRep.mandate_status && agentRep.mandate_status !== "unknown" && (
                  <span className="text-xs px-2 py-1 rounded-sm border bg-white/5 text-muted-foreground border-white/10">
                    {agentRep.mandate_status === "active" ? "Mandate Active" :
                     agentRep.mandate_status === "exclusive" ? "Exclusive Mandate" :
                     agentRep.mandate_status === "expiring_soon" ? "Mandate Expiring" :
                     agentRep.mandate_status === "no_mandate" ? "No Mandate" : agentRep.mandate_status}
                  </span>
                )}
                {agentRep.representation_status === "represented" && agentRep.allow_contact_sharing && agentRep.agent_name && (
                  <span className="text-xs text-muted-foreground">Agent: {agentRep.agent_name}{agentRep.agency_name ? ` (${agentRep.agency_name})` : ""}</span>
                )}
              </div>
            )}

            {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleTrackPlayer}
              variant="outline"
              className={`rounded-sm h-12 px-6 font-bold uppercase tracking-wide ${isTracked ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black" : "border-white/20 text-white hover:bg-white/10"}`}
            >
              <Target className="w-4 h-4 mr-2" />
              {isTracked ? "Tracked ✓" : "Track Player"}
            </Button>
            <Button
              onClick={handleAddToPipeline}
              disabled={inPipeline || pipelineLoading}
              variant="outline"
              className={`rounded-sm h-12 px-6 font-bold uppercase tracking-wide ${inPipeline ? "border-purple-500 text-purple-400 cursor-not-allowed opacity-70" : "border-white/20 text-white hover:bg-white/10"}`}
            >
              <Kanban className="w-4 h-4 mr-2" />
              {inPipeline ? "In Pipeline ✓" : "Add to Pipeline"}
            </Button>
            
            <Button
              data-testid="add-favorite-btn"
              onClick={handleAddFavorite}
              className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12 px-6"
            >
              <Heart className="w-4 h-4 mr-2" />
              ADD TO FAVORITES
            </Button>
            {chatRequestStatus === "pending" ? (
              <Button disabled className="bg-muted text-muted-foreground rounded-sm h-12 px-6 cursor-not-allowed">
                Request Pending
              </Button>
            ) : chatRequestStatus === "accepted" ? (
              <Button disabled className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-sm h-12 px-6 cursor-not-allowed">
                Chat Active
              </Button>
            ) : (
              <RequestChatDialog playerId={player.user_id} playerName={player.name} onSent={() => setChatRequestStatus("pending")} />
            )}
            <ReportUserDialog reportedUserId={player.user_id} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          {/* Badges & Quality */}
          {(verification?.badges?.length > 0 || verification?.quality_level || verification?.quality_score > 0) && (
            <div className="bg-card border border-border/50 rounded-sm p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                {verification?.quality_level && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Level:</span>
                    <span className={`inline-flex items-center px-3 py-1 text-xs uppercase tracking-wider rounded-sm border font-bold ${QUALITY_COLORS[verification.quality_level]}`}>
                      {verification.quality_level}
                    </span>
                  </div>
                )}
                {verification?.quality_score > 0 && (
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Profile Score</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{width: `${verification.quality_score}%`}} />
                    </div>
                    <span className="text-xs font-bold text-primary">{verification.quality_score}/100</span>
                  </div>
                )}
              </div>
              {verification?.badges?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {verification.badges.map(badge => (
                    <span key={badge} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm bg-white/5 border border-white/10 text-white">
                      <span>{BADGE_ICONS[badge]}</span>
                      <span>{BADGE_LABELS[badge]}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

        <h3 className="text-xl font-heading font-bold uppercase mb-6 pb-3 border-b border-border">Player Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: "Age", value: player.age ? `${player.age} years` : "N/A" },
            { label: "Nationality", value: nationalities },
            { label: "Height", value: player.height ? `${player.height} cm` : "N/A" },
            { label: "Weight", value: player.weight ? `${player.weight} kg` : "N/A" },
            { label: "Preferred Foot", value: player.preferred_foot || "N/A" },
            { label: "Current Club", value: player.current_club || "Free Agent" },
            { label: "Games", value: player.season_games ?? player.games ?? 0 },
            { label: "Goals", value: player.season_goals ?? player.goals ?? 0 },
            { label: "Assists", value: player.season_assists ?? player.assists ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background border border-border/50 rounded-sm p-3">
              <p className="text-xs text-muted-foreground uppercase mb-1">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Current Season Stats */}
      {player.season_label && (
        <div className="bg-card border border-border/50 p-6 rounded-sm mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
            Current Season — {player.season_label}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Games", value: player.season_games },
              { label: "Goals", value: player.season_goals },
              { label: "Assists", value: player.season_assists },
              { label: "Minutes", value: player.season_minutes_played },
              { label: "Clean Sheets", value: player.season_clean_sheets },
              { label: "Yellow Cards", value: player.season_yellow_cards },
              { label: "Red Cards", value: player.season_red_cards },
            ].filter(s => s.value !== null && s.value !== undefined).map(({ label, value }) => (
              <div key={label} className="bg-background border border-border/50 rounded-sm p-3">
                <p className="text-xs text-muted-foreground uppercase mb-1">{label}</p>
                <p className="text-2xl font-heading font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media */}
      {(player.highlight_video || player.cv || player.transfermarkt_url) && (
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <h3 className="text-xl font-heading font-bold uppercase mb-6 pb-3 border-b border-border">Media & Links</h3>
          <div className="space-y-4">
            {player.highlight_video && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-background rounded-sm border border-border">
                <div>
                  <p className="font-medium mb-1">Highlight Video</p>
                  <p className="text-sm text-muted-foreground">YouTube / Vimeo</p>
                </div>
                <Button variant="outline" onClick={() => window.open(player.highlight_video, '_blank')}
                  className="border-primary text-primary hover:bg-primary hover:text-black text-xs px-3 py-1.5">
                  <ExternalLink className="w-3 h-3 mr-1" /> Watch Video
                </Button>
              </div>
            )}
            {player.cv && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-background rounded-sm border border-border">
                <div>
                  <p className="font-medium mb-1">CV / Resume</p>
                  <p className="text-sm text-muted-foreground">Player curriculum vitae</p>
                </div>
                <Button variant="outline" onClick={handleDownloadCV}
                  className="border-white/20 text-white hover:bg-white/10">
                  <Download className="w-4 h-4 mr-2" /> DOWNLOAD CV
                </Button>
              </div>
            )}
            {player.transfermarkt_url && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-background rounded-sm border border-border">
                <div>
                  <p className="font-medium mb-1">Transfermarkt Profile</p>
                  <p className="text-sm text-muted-foreground">Professional stats and market value</p>
                </div>
                <Button variant="outline" onClick={() => window.open(player.transfermarkt_url, '_blank')}
                  className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                  <ExternalLink className="w-4 h-4 mr-2" /> VIEW PROFILE
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match Video Archive */}
      {matchArchive.length > 0 && (
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <h3 className="text-xl font-heading font-bold uppercase mb-6 pb-3 border-b border-border">
            Match Video Archive
          </h3>
          <div className="space-y-3">
            {matchArchive.map((match) => (
              <div key={match.id} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-background rounded-sm border border-border hover:border-primary/50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium">{match.opponent}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span>{match.match_date ? new Date(match.match_date).toLocaleDateString("en-US", {year:"numeric", month:"short", day:"numeric"}) : ""}</span>
                    {match.competition_level && <span className="bg-white/10 px-1.5 py-0.5 rounded-sm text-[10px]xs uppercase">{match.competition_level}</span>}
                    {match.position_played && <span>· {match.position_played}</span>}
                  </div>
                  {match.description && <p className="text-xs text-muted-foreground mt-1">{match.description}</p>}
                </div>
                {match.video_link && (
                  <a href={match.video_link} target="_blank" rel="noopener noreferrer"
                    className="ml-4 px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-black rounded-sm text-sm font-medium transition-colors">
                    Watch
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    <ConfirmDialog
        open={showTrackConfirm}
        onOpenChange={setShowTrackConfirm}
        title={isTracked ? "Remove from Watchlist" : "Track Player"}
        description={isTracked ? "Remove this player from your scouting watchlist?" : "Add this player to your scouting watchlist?"}
        confirmLabel={isTracked ? "Remove" : "Track"}
        confirmVariant={isTracked ? "destructive" : "primary"}
        onConfirm={() => { setShowTrackConfirm(false); handleTrackPlayer(); }}
      />
      <ConfirmDialog
        open={showFavConfirm}
        onOpenChange={setShowFavConfirm}
        title="Add to Favorites"
        description="Add this player to your favorites list?"
        confirmLabel="Add to Favorites"
        confirmVariant="primary"
        onConfirm={() => { setShowFavConfirm(false); handleAddFavorite(); }}
      />
      {/* Trial Invitation Modal */}
          </div>
  );
};

export default PlayerDetailView;
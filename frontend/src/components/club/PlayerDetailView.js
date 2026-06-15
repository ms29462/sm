import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, User, CheckCircle, Heart, ExternalLink, Download, Video, Play, Target, Kanban, CalendarCheck } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import RequestChatDialog from './RequestChatDialog';

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
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchArchive, setMatchArchive] = useState([]);
  const [isTracked, setIsTracked] = useState(false);
  const [inPipeline, setInPipeline] = useState(false);
  const [verification, setVerification] = useState(null);
  const [agentRep, setAgentRep] = useState(null);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialForm, setTrialForm] = useState({ trial_date: '', location: '', message: '' });
  const [trialSent, setTrialSent] = useState(false);
  const [showTrackConfirm, setShowTrackConfirm] = useState(false);
  const [showFavConfirm, setShowFavConfirm] = useState(false);

  useEffect(() => {
    loadPlayerProfile();
    checkPipelineStatus();
    checkTrackStatus();
    loadVerification();
  }, [playerId]);

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

  const handleSendTrial = async () => {
    try {
      await api.sendTrialInvitation({ player_id: playerId, ...trialForm });
      toast.success("Trial invitation sent!");
      setShowTrialModal(false);
      setTrialSent(true);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to send invitation");
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
              disabled={inPipeline}
              variant="outline"
              className={`rounded-sm h-12 px-6 font-bold uppercase tracking-wide ${inPipeline ? "border-purple-500 text-purple-400 cursor-not-allowed opacity-70" : "border-white/20 text-white hover:bg-white/10"}`}
            >
              <Kanban className="w-4 h-4 mr-2" />
              {inPipeline ? "In Pipeline ✓" : "Add to Pipeline"}
            </Button>
            <Button
              onClick={() => setShowTrialModal(true)}
              disabled={trialSent}
              variant="outline"
              className={`rounded-sm h-12 px-6 font-bold uppercase tracking-wide ${trialSent ? "border-green-500 text-green-400 cursor-not-allowed opacity-70" : "border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"}`}
            >
              <CalendarCheck className="w-4 h-4 mr-2" />
              {trialSent ? "Invitation Sent ✓" : "Send Trial Invite"}
            </Button>
            <Button
              data-testid="add-favorite-btn"
              onClick={handleAddFavorite}
              className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12 px-6"
            >
              <Heart className="w-4 h-4 mr-2" />
              ADD TO FAVORITES
            </Button>
            <RequestChatDialog playerId={player.user_id} playerName={player.name} />
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
            { label: "Games", value: player.games || 0 },
            { label: "Goals", value: player.goals || 0 },
            { label: "Assists", value: player.assists || 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background border border-border/50 rounded-sm p-3">
              <p className="text-xs text-muted-foreground uppercase mb-1">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

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
      {showTrialModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card border border-border/50 rounded-sm p-6 w-full max-w-md mx-4">
            <h3 className="font-heading font-bold uppercase mb-4">Send Trial Invitation</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Trial Date *</label>
                <input type="date" value={trialForm.trial_date} onChange={e => setTrialForm(f => ({...f, trial_date: e.target.value}))}
                  style={{colorScheme: "dark"}} className="w-full mt-1 bg-black/20 border border-white/10 focus:border-primary rounded-sm h-10 px-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Location *</label>
                <input value={trialForm.location} onChange={e => setTrialForm(f => ({...f, location: e.target.value}))}
                  placeholder="e.g. Training ground, City" className="w-full mt-1 bg-black/20 border border-white/10 focus:border-primary rounded-sm h-10 px-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide">Message (optional)</label>
                <textarea value={trialForm.message} onChange={e => setTrialForm(f => ({...f, message: e.target.value}))}
                  placeholder="Add a personal message..." rows={3} className="w-full mt-1 bg-black/20 border border-white/10 focus:border-primary rounded-sm p-3 text-sm text-white outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowTrialModal(false)} className="flex-1 border border-white/20 rounded-sm py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
                <button onClick={handleSendTrial} className="flex-1 bg-primary text-black font-bold rounded-sm py-2 text-sm">Send Invitation</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDetailView;
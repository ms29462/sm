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

const PlayerProfilePopup = ({ player, onClose }) => {
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
            <button onClick={goToFullProfile} className="px-3 py-1.5 border border-primary text-primary hover:bg-primary hover:text-black rounded-sm text-xs font-bold uppercase tracking-wide transition-colors">
              View Full Profile
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Personal Information</h3>
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
          <div className="flex items-center gap-3 pt-2">
            {player.highlight_video && (
              <a href={player.highlight_video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold text-sm uppercase tracking-wide rounded-sm hover:bg-primary/90 transition-colors">
                <Trophy className="w-4 h-4" />
                Watch Highlights
              </a>
            )}
            {player.transfermarkt_url && (
              <a href={player.transfermarkt_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white font-bold text-sm uppercase tracking-wide rounded-sm hover:bg-white/20 transition-colors">
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
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await api.getClubApplications();
      setApplications(response.data);
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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {selectedPlayer && <PlayerProfilePopup player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
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
          {applications.map((app) => (
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
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground uppercase tracking-wide">UPDATE STATUS:</span>
                  <Select value={app.status} onValueChange={(value) => handleStatusChange(app.id, value)}>
                    <SelectTrigger data-testid={"status-select-" + app.id} className="w-40 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>{status.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubApplications;



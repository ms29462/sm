import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Shield, Star, Award, CheckCircle, X, Plus, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const BADGES = [
  { id: "verified_profile", label: "Verified Profile", icon: "✓" },
  { id: "match_ready", label: "Match Ready", icon: "⚡" },
  { id: "scout_approved", label: "Scout Approved", icon: "👁" },
  { id: "professional_experience", label: "Professional Experience", icon: "🏆" },
  { id: "international_player", label: "International Player", icon: "🌍" },
  { id: "university_eligible", label: "University Eligible", icon: "🎓" },
  { id: "top_prospect", label: "Top Prospect", icon: "⭐" },
  { id: "diaspora_eligible", label: "Diaspora Eligible", icon: "🌐" },
  { id: "video_verified", label: "Video Verified", icon: "🎥" },
];

const QUALITY_LEVELS = ["Bronze", "Silver", "Gold", "Elite"];

const QUALITY_COLORS = {
  Bronze: "text-amber-600 border-amber-600/30 bg-amber-600/10",
  Silver: "text-gray-300 border-gray-300/30 bg-gray-300/10",
  Gold: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  Elite: "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

const AdminVerification = () => {
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteInput, setNoteInput] = useState("");
  const [scoreInput, setScoreInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const res = await api.getAllPlayers();
      setPlayers(res.data || []);
    } catch (e) {
      toast.error("Failed to load players");
    }
    setLoading(false);
  };

  const loadVerification = async (userId) => {
    try {
      const res = await api.getPlayerVerificationAdmin(userId);
      setVerification(res.data);
      setScoreInput(res.data.quality_score || "");
    } catch (e) {
      toast.error("Failed to load verification data");
    }
  };

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    loadVerification(player.user_id);
  };

  const handleToggleVerify = async () => {
    try {
      await api.toggleVerification(selectedPlayer.user_id, { verified: !verification.verified });
      toast.success("Verification updated!");
      loadVerification(selectedPlayer.user_id);
    } catch (e) {
      toast.error("Failed to update verification");
    }
  };

  const handleBadge = async (badge, action) => {
    try {
      await api.updateBadge(selectedPlayer.user_id, { badge, action });
      toast.success(`Badge ${action === "add" ? "added" : "removed"}!`);
      loadVerification(selectedPlayer.user_id);
    } catch (e) {
      toast.error("Failed to update badge");
    }
  };

  const handleQualityLevel = async (level) => {
    try {
      await api.updateQuality(selectedPlayer.user_id, { quality_level: level });
      toast.success("Quality level updated!");
      loadVerification(selectedPlayer.user_id);
    } catch (e) {
      toast.error("Failed to update quality level");
    }
  };

  const handleScoreUpdate = async () => {
    try {
      await api.updateQuality(selectedPlayer.user_id, { quality_score: parseInt(scoreInput) });
      toast.success("Score updated!");
      loadVerification(selectedPlayer.user_id);
    } catch (e) {
      toast.error("Failed to update score");
    }
  };

  const handleAddNote = async () => {
    if (!noteInput.trim()) return;
    try {
      await api.addAdminNote(selectedPlayer.user_id, { content: noteInput });
      toast.success("Note added!");
      setNoteInput("");
      loadVerification(selectedPlayer.user_id);
    } catch (e) {
      toast.error("Failed to add note");
    }
  };

  const filteredPlayers = players.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Player List */}
      <div className="w-80 border-r border-border/50 flex flex-col">
        <div className="p-4 border-b border-border/50">
          <h2 className="font-heading font-bold uppercase mb-3">Players</h2>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search players..." className="w-full bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : filteredPlayers.map(player => (
            <div key={player.user_id} onClick={() => handleSelectPlayer(player)}
              className={`flex items-center gap-3 p-3 border-b border-border/30 cursor-pointer hover:bg-white/5 transition-colors ${selectedPlayer?.user_id === player.user_id ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}>
              {player.profile_picture ? (
                <img src={player.profile_picture} alt={player.name} className="w-9 h-9 rounded-sm object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-sm bg-muted flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{player.name}</p>
                <p className="text-xs text-muted-foreground">{player.position} · {player.nationality}</p>
              </div>
              {player.verified && <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Verification Panel */}
      {!selectedPlayer ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Select a player to manage verification</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Player Header */}
          <div className="flex items-center gap-4">
            {selectedPlayer.profile_picture ? (
              <img src={selectedPlayer.profile_picture} alt={selectedPlayer.name} className="w-16 h-16 rounded-sm object-cover border border-primary" />
            ) : (
              <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center border border-border">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-heading font-bold uppercase">{selectedPlayer.name}</h2>
              <p className="text-muted-foreground">{selectedPlayer.position} · {selectedPlayer.nationality} · {selectedPlayer.age} yrs</p>
              <p className="text-sm text-muted-foreground">{selectedPlayer.current_club || "No club"} · {selectedPlayer.playing_level}</p>
            </div>
          </div>

          {verification && (
            <>
              {/* Quality Score */}
              <div className="bg-card border border-border/50 rounded-sm p-4">
                <h3 className="font-heading font-bold uppercase text-sm mb-3">Profile Quality Score</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-bold text-primary">{verification.quality_score || 0}/100</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{width: `${verification.quality_score || 0}%`}} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={scoreInput} onChange={e => setScoreInput(e.target.value)}
                      min="0" max="100" className="w-16 bg-black/20 border border-white/10 rounded-sm h-9 px-2 text-sm text-white outline-none" />
                    <Button onClick={handleScoreUpdate} size="sm" className="bg-primary text-black font-bold rounded-sm">Set</Button>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div className="bg-card border border-border/50 rounded-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold uppercase text-sm">Verification Status</h3>
                    <p className="text-xs text-muted-foreground mt-1">{verification.verified ? "Profile is verified" : "Profile is not verified"}</p>
                  </div>
                  <Button onClick={handleToggleVerify}
                    className={verification.verified ? "bg-red-500/10 text-red-400 border border-red-500/30 rounded-sm" : "bg-primary text-black font-bold rounded-sm"}>
                    {verification.verified ? <><X className="w-4 h-4 mr-1" /> Revoke</> : <><CheckCircle className="w-4 h-4 mr-1" /> Verify</>}
                  </Button>
                </div>
              </div>

              {/* Quality Level */}
              <div className="bg-card border border-border/50 rounded-sm p-4">
                <h3 className="font-heading font-bold uppercase text-sm mb-3">Quality Level</h3>
                <div className="flex gap-2 flex-wrap">
                  {QUALITY_LEVELS.map(level => (
                    <button key={level} onClick={() => handleQualityLevel(level)}
                      className={`px-4 py-2 rounded-sm border text-sm font-bold transition-colors ${
                        verification.quality_level === level
                          ? QUALITY_COLORS[level]
                          : "border-white/10 text-muted-foreground hover:border-white/30"
                      }`}>
                      {level}
                    </button>
                  ))}
                  {verification.quality_level && (
                    <button onClick={() => handleQualityLevel("")}
                      className="px-4 py-2 rounded-sm border border-white/10 text-muted-foreground text-sm hover:border-red-500/30 hover:text-red-400">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="bg-card border border-border/50 rounded-sm p-4">
                <h3 className="font-heading font-bold uppercase text-sm mb-3">Badges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {BADGES.map(badge => {
                    const hasIt = verification.badges?.includes(badge.id);
                    return (
                      <div key={badge.id} className={`flex items-center justify-between p-3 rounded-sm border transition-colors ${hasIt ? "border-primary/30 bg-primary/5" : "border-border/30"}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{badge.icon}</span>
                          <span className="text-sm font-medium">{badge.label}</span>
                        </div>
                        <button onClick={() => handleBadge(badge.id, hasIt ? "remove" : "add")}
                          className={`text-xs px-2 py-1 rounded-sm border transition-colors ${hasIt ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-primary/30 text-primary hover:bg-primary/10"}`}>
                          {hasIt ? "Remove" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="bg-card border border-border/50 rounded-sm p-4">
                <h3 className="font-heading font-bold uppercase text-sm mb-3">Internal Notes</h3>
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {(verification.admin_notes || []).map(note => (
                    <div key={note.id} className="bg-background border border-border/30 rounded-sm p-3">
                      <p className="text-sm">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(note.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                  {(!verification.admin_notes?.length) && <p className="text-sm text-muted-foreground">No notes yet</p>}
                </div>
                <div className="flex gap-2">
                  <input value={noteInput} onChange={e => setNoteInput(e.target.value)}
                    placeholder="Add internal note..." className="flex-1 bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none" />
                  <Button onClick={handleAddNote} size="sm" className="bg-primary text-black font-bold rounded-sm">Add</Button>
                </div>
              </div>

              {/* Activity Log */}
              <div className="bg-card border border-border/50 rounded-sm p-4">
                <h3 className="font-heading font-bold uppercase text-sm mb-3">Activity Log</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(verification.activity_log || []).slice().reverse().map((log, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground py-1 border-b border-border/20">
                      <span className="text-primary font-mono">{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                  {(!verification.activity_log?.length) && <p className="text-sm text-muted-foreground">No activity yet</p>}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminVerification;
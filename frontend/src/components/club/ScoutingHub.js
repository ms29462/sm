import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Users, FileText, Target, MessageSquare, Plus, Trash2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TABS = ["Tracked Players"];

const RatingBar = ({ value, label }) => {
  const color = value >= 8 ? "#22c55e" : value >= 6 ? "#eab308" : "#ef4444";
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold" style={{ color }}>{value}/10</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value * 10}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const RecommendationBadge = ({ rec }) => {
  const styles = {
    sign: "bg-green-500/10 text-green-500 border-green-500/20",
    monitor: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    reject: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded-sm text-xs font-bold uppercase border ${styles[rec]}`}>
      {rec === "sign" ? "✅ Sign" : rec === "monitor" ? "⚠️ Monitor" : "❌ Reject"}
    </span>
  );
};

const inputClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-10 px-3 text-sm text-white outline-none";
const textareaClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm p-3 text-sm text-white outline-none resize-none";
const labelClass = "text-xs text-muted-foreground uppercase tracking-wide";

const ScoutingHub = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Tracked Players");
  const [trackedPlayers, setTrackedPlayers] = useState([]);
  const [groups, setGroups] = useState([]);

  // Per-player expanded state
  const [filterName, setFilterName] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterNationality, setFilterNationality] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({});
  const [expandedReports, setExpandedReports] = useState({});
  const [playerNotes, setPlayerNotes] = useState({});
  const [playerReports, setPlayerReports] = useState({});

  // Modals
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(null);
  const [activePlayerId, setActivePlayerId] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [editingReport, setEditingReport] = useState(null);

  // Forms
  const [groupForm, setGroupForm] = useState({ name: "", description: "", visibility: "private" });
  const [noteForm, setNoteForm] = useState({ player_id: "", content: "", visibility: "private" });
  const [reportForm, setReportForm] = useState({
    player_id: "", match_date: "", opponent: "", position_played: "",
    overall_rating: 7, physical: 7, technical: 7, tactical: 7, mental: 7,
    strengths: "", weaknesses: "", recommendation: "monitor", visibility: "private"
  });
  const [groupMessages, setGroupMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    loadTrackedPlayers();
    loadGroups();
  }, []);

  const loadTrackedPlayers = async () => {
    try {
      const res = await api.getTrackedPlayers();
      setTrackedPlayers(res.data || []);
    } catch (e) {}
  };

  const loadGroups = async () => {
    try {
      const res = await api.getScoutingGroups();
      setGroups(res.data || []);
    } catch (e) {}
  };

  const loadPlayerNotes = async (playerId) => {
    try {
      const res = await api.getScoutingNotes(playerId);
      setPlayerNotes(prev => ({ ...prev, [playerId]: res.data || [] }));
    } catch (e) {}
  };

  const loadPlayerReports = async (playerId) => {
    try {
      const res = await api.getPostMortems(playerId);
      setPlayerReports(prev => ({ ...prev, [playerId]: res.data || [] }));
    } catch (e) {}
  };

  const toggleNotes = async (playerId) => {
    const isExpanded = expandedNotes[playerId];
    setExpandedNotes(prev => ({ ...prev, [playerId]: !isExpanded }));
    if (!isExpanded && !playerNotes[playerId]) {
      await loadPlayerNotes(playerId);
    }
  };

  const toggleReports = async (playerId) => {
    const isExpanded = expandedReports[playerId];
    setExpandedReports(prev => ({ ...prev, [playerId]: !isExpanded }));
    if (!isExpanded && !playerReports[playerId]) {
      await loadPlayerReports(playerId);
    }
  };

  const handleUntrack = async (playerId) => {
    try {
      await api.untrackPlayer(playerId);
      setTrackedPlayers(prev => prev.filter(p => p.user_id !== playerId));
      toast.success("Player removed from watchlist");
    } catch (e) {
      toast.error("Failed to untrack player");
    }
  };

  const openNoteModal = (playerId) => {
    setActivePlayerId(playerId);
    setNoteForm({ player_id: playerId, content: "", visibility: "private" });
    setShowNoteModal(true);
  };

  const openReportModal = (playerId) => {
    setActivePlayerId(playerId);
    setReportForm(f => ({ ...f, player_id: playerId, match_date: "", opponent: "", position_played: "", strengths: "", weaknesses: "" }));
    setShowReportModal(true);
  };

  const handleCreateNote = async () => {
    try {
      const res = await api.createScoutingNote(noteForm);
      toast.success("Note saved!");
      setShowNoteModal(false);
      setPlayerNotes(prev => ({
        ...prev,
        [activePlayerId]: [res.data, ...(prev[activePlayerId] || [])]
      }));
      setExpandedNotes(prev => ({ ...prev, [activePlayerId]: true }));
    } catch (e) {
      toast.error("Failed to save note");
    }
  };

  const handleCreateReport = async () => {
    try {
      const res = await api.createPostMortem(reportForm);
      toast.success("Game report saved!");
      setShowReportModal(false);
      setPlayerReports(prev => ({
        ...prev,
        [activePlayerId]: [res.data, ...(prev[activePlayerId] || [])]
      }));
      setExpandedReports(prev => ({ ...prev, [activePlayerId]: true }));
    } catch (e) {
      toast.error("Failed to save game report");
    }
  };

  const handleDeleteNote = async (noteId, playerId) => {
    try {
      await api.deleteScoutingNote(noteId);
      setPlayerNotes(prev => ({ ...prev, [playerId]: prev[playerId].filter(n => n.id !== noteId) }));
      toast.success("Note deleted");
    } catch (e) {
      toast.error("Failed to delete note");
    }
  };

  const handleDeleteReport = async (pmId, playerId) => {
    try {
      await api.deletePostMortem(pmId);
      setPlayerReports(prev => ({ ...prev, [playerId]: prev[playerId].filter(p => p.id !== pmId) }));
      toast.success("Report deleted");
    } catch (e) {
      toast.error("Failed to delete report");
    }
  };

  const handleEditNote = async () => {
    try {
      await api.updateScoutingNote(editingNote.id, {
        content: editingNote.content,
        visibility: editingNote.visibility
      });
      setPlayerNotes(prev => ({
        ...prev,
        [editingNote.player_id]: prev[editingNote.player_id].map(n =>
          n.id === editingNote.id ? { ...n, content: editingNote.content, visibility: editingNote.visibility } : n
        )
      }));
      toast.success("Note updated!");
      setEditingNote(null);
    } catch (e) {
      toast.error("Failed to update note");
    }
  };

  const handleCreateGroup = async () => {
    try {
      await api.createScoutingGroup(groupForm);
      toast.success("Group created!");
      setShowCreateGroup(false);
      setGroupForm({ name: "", description: "", visibility: "private" });
      loadGroups();
    } catch (e) {
      toast.error("Failed to create group");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await api.deleteScoutingGroup(groupId);
      toast.success("Group deleted");
      loadGroups();
    } catch (e) {
      toast.error("Failed to delete group");
    }
  };

  const copyInviteLink = (token) => {
    const link = `${window.location.origin}/scout/join/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  const openGroupChat = async (group) => {
    setShowGroupChat(group);
    try {
      const res = await api.getGroupMessages(group.id);
      setGroupMessages(res.data || []);
    } catch (e) {}
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !showGroupChat) return;
    try {
      const res = await api.sendGroupMessage(showGroupChat.id, { content: newMessage });
      setGroupMessages(prev => [...prev, res.data]);
      setNewMessage("");
    } catch (e) {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase">Scouting Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">Track players, write notes and game reports, collaborate with your team</p>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium uppercase tracking-wide transition-colors border-b-2 -mb-px ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tracked Players */}
      {activeTab === "Tracked Players" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-card border border-border/50 p-4 rounded-sm grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Player name with suggestions */}
            <div className="relative">
              <input
                value={filterName} onChange={e => setFilterName(e.target.value)}
                placeholder="Search by name..."
                className="w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-10 px-3 text-sm text-white outline-none"
              />
              {filterName && (
                <div className="absolute top-11 left-0 right-0 bg-card border border-border/50 rounded-sm z-50 shadow-lg max-h-48 overflow-y-auto">
                  {trackedPlayers.filter(p => p.name?.toLowerCase().includes(filterName.toLowerCase())).map(p => (
                    <div key={p.user_id} onClick={() => navigate(`/club/scouting/${p.user_id}`)}
                      className="flex items-center gap-3 p-2 hover:bg-white/5 cursor-pointer">
                      {p.profile_picture ? (
                        <img src={p.profile_picture} alt={p.name} className="w-8 h-8 rounded-sm object-cover border border-primary" />
                      ) : (
                        <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center border border-border">
                          <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.position} · {p.nationality}</p>
                      </div>
                    </div>
                  ))}
                  {trackedPlayers.filter(p => p.name?.toLowerCase().includes(filterName.toLowerCase())).length === 0 && (
                    <p className="text-xs text-muted-foreground p-3">No players found</p>
                  )}
                </div>
              )}
            </div>

            {/* Position dropdown */}
            <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}
              className="bg-black/20 border border-white/10 focus:border-primary rounded-sm h-10 px-3 text-sm text-white outline-none appearance-none cursor-pointer">
              <option value="">All Positions</option>
              {[...new Set(trackedPlayers.map(p => p.position).filter(Boolean))].sort().map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>

            {/* Nationality dropdown */}
            <select value={filterNationality} onChange={e => setFilterNationality(e.target.value)}
              className="bg-black/20 border border-white/10 focus:border-primary rounded-sm h-10 px-3 text-sm text-white outline-none appearance-none cursor-pointer">
              <option value="">All Nationalities</option>
              {[...new Set(trackedPlayers.map(p => p.nationality).filter(Boolean))].sort().map(nat => (
                <option key={nat} value={nat}>{nat}</option>
              ))}
            </select>
          </div>

          {(() => {
            const filtered = trackedPlayers.filter(p => {
              const name = filterName.toLowerCase();
              const pos = filterPosition.toLowerCase();
              const nat = filterNationality.toLowerCase();
              return (
                (!name || p.name?.toLowerCase().includes(name)) &&
                (!pos || p.position?.toLowerCase().includes(pos)) &&
                (!nat || p.nationality?.toLowerCase().includes(nat))
              );
            });
            return filtered.length === 0 && trackedPlayers.length > 0 ? (
              <div className="bg-card border border-border/50 p-8 rounded-sm text-center">
                <p className="text-muted-foreground">No players match your filters.</p>
              </div>
            ) : null;
          })()}

          {trackedPlayers.length === 0 ? (
            <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No players tracked yet. Visit a player profile and click "Track Player".</p>
            </div>
          ) : (
            trackedPlayers.filter(p => {
              const name = filterName.toLowerCase();
              const pos = filterPosition.toLowerCase();
              const nat = filterNationality.toLowerCase();
              return (
                (!name || p.name?.toLowerCase().includes(name)) &&
                (!pos || p.position?.toLowerCase().includes(pos)) &&
                (!nat || p.nationality?.toLowerCase().includes(nat))
              );
            }).map(player => (
              <div key={player.user_id} className="bg-card border border-border/50 rounded-sm overflow-hidden">
                {/* Player Header */}
                <div className="p-5 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {player.profile_picture ? (
                      <img src={player.profile_picture} alt={player.name} className="w-12 h-12 rounded-sm object-cover border border-primary" />
                    ) : (
                      <div className="w-12 h-12 rounded-sm bg-muted flex items-center justify-center border border-border">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-heading font-bold uppercase">{player.name}</p>
                      <p className="text-xs text-muted-foreground">{player.position} · {player.nationality} {player.age && `· ${player.age} yrs`}</p>
                      <p className="text-xs text-muted-foreground">{player.playing_level}</p>
                    </div>
                  </div>
                  <button onClick={() => handleUntrack(player.user_id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="px-5 pb-3 grid grid-cols-2 gap-2">
                  <button onClick={() => openNoteModal(player.user_id)}
                    className="flex items-center justify-center gap-1.5 text-xs border border-white/10 hover:border-primary text-muted-foreground hover:text-primary rounded-sm py-2 transition-colors">
                    <FileText className="w-3 h-3" /> Create Note
                  </button>
                  <button onClick={() => openReportModal(player.user_id)}
                    className="flex items-center justify-center gap-1.5 text-xs border border-white/10 hover:border-primary text-muted-foreground hover:text-primary rounded-sm py-2 transition-colors">
                    <Target className="w-3 h-3" /> Create Game Report
                  </button>
                  <button onClick={() => navigate(`/club/scouting/${player.user_id}`)}
                    className="col-span-2 flex items-center justify-center gap-1.5 text-xs border border-primary/50 hover:border-primary text-primary rounded-sm py-2 transition-colors">
                    More Scouting Info →
                  </button>
                  <button onClick={() => toggleNotes(player.user_id)}
                    className="flex items-center justify-center gap-1.5 text-xs border border-white/10 hover:border-primary text-muted-foreground hover:text-primary rounded-sm py-2 transition-colors">
                    {expandedNotes[player.user_id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Notes History
                  </button>
                  <button onClick={() => toggleReports(player.user_id)}
                    className="flex items-center justify-center gap-1.5 text-xs border border-white/10 hover:border-primary text-muted-foreground hover:text-primary rounded-sm py-2 transition-colors">
                    {expandedReports[player.user_id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Game Reports History
                  </button>
                  <button onClick={() => navigate(`/club/scouting/${player.user_id}`)}
                    className="col-span-2 flex items-center justify-center gap-1.5 text-xs border border-primary/50 hover:border-primary text-primary rounded-sm py-2 transition-colors font-medium">
                    More Scouting Info
                  </button>
                </div>

                {/* Notes History */}
                {expandedNotes[player.user_id] && (
                  <div className="border-t border-border/50 px-5 py-4 space-y-3 bg-background/50">
                    <p className="text-xs text-primary uppercase font-bold tracking-wide">Notes</p>
                    {!playerNotes[player.user_id] ? (
                      <p className="text-xs text-muted-foreground">Loading...</p>
                    ) : playerNotes[player.user_id].length === 0 ? (
                      <p className="text-xs text-muted-foreground">No notes yet.</p>
                    ) : (
                      playerNotes[player.user_id].map(note => (
                        <div key={note.id} className="bg-card border border-border/50 rounded-sm p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-primary">{note.author_name}</span>
                              <span className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">{note.visibility}</span>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setEditingNote({...note})} className="text-muted-foreground hover:text-primary transition-colors text-xs">Edit</button>
                              <button onClick={() => handleDeleteNote(note.id, player.user_id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{note.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Game Reports History */}
                {expandedReports[player.user_id] && (
                  <div className="border-t border-border/50 px-5 py-4 space-y-3 bg-background/50">
                    <p className="text-xs text-primary uppercase font-bold tracking-wide">Game Reports</p>
                    {!playerReports[player.user_id] ? (
                      <p className="text-xs text-muted-foreground">Loading...</p>
                    ) : playerReports[player.user_id].length === 0 ? (
                      <p className="text-xs text-muted-foreground">No game reports yet.</p>
                    ) : (
                      playerReports[player.user_id].map(pm => (
                        <div key={pm.id} className="bg-card border border-border/50 rounded-sm p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-primary">{pm.author_name}</span>
                                <span className="text-xs text-muted-foreground">{new Date(pm.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm font-medium">vs {pm.opponent} · {pm.match_date} {pm.position_played && `· ${pm.position_played}`}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <RecommendationBadge rec={pm.recommendation} />
                              <button onClick={() => setEditingReport({...pm})} className="text-muted-foreground hover:text-primary transition-colors text-xs">Edit</button>
                              <button onClick={() => handleDeleteReport(pm.id, player.user_id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <RatingBar value={pm.overall_rating} label="Overall" />
                              <RatingBar value={pm.physical} label="Physical" />
                              <RatingBar value={pm.technical} label="Technical" />
                            </div>
                            <div>
                              <RatingBar value={pm.tactical} label="Tactical" />
                              <RatingBar value={pm.mental} label="Mental" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-primary font-bold mb-1">Strengths</p>
                              <p className="text-muted-foreground">{pm.strengths}</p>
                            </div>
                            <div>
                              <p className="text-red-400 font-bold mb-1">Weaknesses</p>
                              <p className="text-muted-foreground">{pm.weaknesses}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Groups */}
      {activeTab === "Groups" && (
        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No groups yet. Create one to collaborate with your team.</p>
            </div>
          ) : (
            groups.map(group => (
              <div key={group.id} className="bg-card border border-border/50 p-6 rounded-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-bold uppercase">{group.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-sm border uppercase ${
                        group.visibility === "private" ? "border-yellow-500/20 text-yellow-500 bg-yellow-500/10" : "border-green-500/20 text-green-500 bg-green-500/10"
                      }`}>
                        {group.visibility === "private" ? "Private" : "Org-wide"}
                      </span>
                    </div>
                    {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{group.members.length} member(s) · {group.players_tracked.length} players tracked</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => copyInviteLink(group.invite_token)}
                      className="text-xs border border-white/10 hover:border-primary text-muted-foreground hover:text-primary rounded-sm px-3 py-1.5 transition-colors flex items-center gap-1">
                      <Copy className="w-3 h-3" /> Invite
                    </button>
                    <button onClick={() => openGroupChat(group)}
                      className="text-xs border border-primary text-primary hover:bg-primary hover:text-black rounded-sm px-3 py-1.5 transition-colors flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Chat
                    </button>
                    <button onClick={() => handleDeleteGroup(group.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent className="bg-card border border-border/50 max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading uppercase">Edit Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className={labelClass}>Note</label>
                <textarea value={editingNote.content} onChange={e => setEditingNote(n => ({...n, content: e.target.value}))}
                  rows={5} className={textareaClass + " mt-1"} />
              </div>
              <div>
                <label className={labelClass}>Visibility</label>
                <select value={editingNote.visibility} onChange={e => setEditingNote(n => ({...n, visibility: e.target.value}))}
                  className={inputClass + " mt-1 appearance-none cursor-pointer"}>
                  <option value="private">Private (only me)</option>
                  <option value="group">Shared with groups</option>
                  <option value="org">Organization-wide</option>
                </select>
              </div>
              <Button onClick={handleEditNote} className="w-full bg-primary text-black font-bold rounded-sm">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Report Modal */}
      {editingReport && (
        <Dialog open={!!editingReport} onOpenChange={() => setEditingReport(null)}>
          <DialogContent className="bg-card border border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading uppercase">Edit Game Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Match Date</label>
                  <input type="date" style={{colorScheme: "dark"}} value={editingReport.match_date} onChange={e => setEditingReport(r => ({...r, match_date: e.target.value}))}
                    className={inputClass + " mt-1"} />
                </div>
                <div>
                  <label className={labelClass}>Opponent</label>
                  <input value={editingReport.opponent} onChange={e => setEditingReport(r => ({...r, opponent: e.target.value}))}
                    className={inputClass + " mt-1"} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Position Played</label>
                  <input value={editingReport.position_played || ""} onChange={e => setEditingReport(r => ({...r, position_played: e.target.value}))}
                    className={inputClass + " mt-1"} />
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <p className={labelClass + " mb-3"}>Ratings</p>
                {["overall_rating", "physical", "technical", "tactical", "mental"].map(field => (
                  <div key={field} className="flex items-center gap-3 mb-2">
                    <label className="text-xs text-muted-foreground w-24 capitalize">{field.replace("_", " ")}</label>
                    <input type="range" min="1" max="10" value={editingReport[field]}
                      onChange={e => setEditingReport(r => ({...r, [field]: parseInt(e.target.value)}))}
                      className="flex-1" />
                    <span className="text-sm font-bold w-6 text-center">{editingReport[field]}</span>
                  </div>
                ))}
              </div>
              <div>
                <label className={labelClass}>Strengths</label>
                <textarea value={editingReport.strengths} onChange={e => setEditingReport(r => ({...r, strengths: e.target.value}))}
                  rows={2} className={textareaClass + " mt-1"} />
              </div>
              <div>
                <label className={labelClass}>Weaknesses</label>
                <textarea value={editingReport.weaknesses} onChange={e => setEditingReport(r => ({...r, weaknesses: e.target.value}))}
                  rows={2} className={textareaClass + " mt-1"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Recommendation</label>
                  <select value={editingReport.recommendation} onChange={e => setEditingReport(r => ({...r, recommendation: e.target.value}))}
                    className={inputClass + " mt-1 appearance-none cursor-pointer"}>
                    <option value="sign">✅ Sign</option>
                    <option value="monitor">⚠️ Monitor</option>
                    <option value="reject">❌ Reject</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Visibility</label>
                  <select value={editingReport.visibility} onChange={e => setEditingReport(r => ({...r, visibility: e.target.value}))}
                    className={inputClass + " mt-1 appearance-none cursor-pointer"}>
                    <option value="private">Private</option>
                    <option value="group">Groups</option>
                    <option value="org">Organization</option>
                  </select>
                </div>
              </div>
              <Button onClick={async () => {
                try {
                  await api.updatePostMortem(editingReport.id, editingReport);
                  setPlayerReports(prev => ({
                    ...prev,
                    [editingReport.player_id]: prev[editingReport.player_id].map(p =>
                      p.id === editingReport.id ? editingReport : p
                    )
                  }));
                  toast.success("Game report updated!");
                  setEditingReport(null);
                } catch (e) {
                  toast.error("Failed to update report");
                }
              }} className="w-full bg-primary text-black font-bold rounded-sm">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Group Modal */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="bg-card border border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase">Create Scouting Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className={labelClass}>Group Name *</label>
              <input value={groupForm.name} onChange={e => setGroupForm(f => ({...f, name: e.target.value}))}
                placeholder="e.g. U23 Scouting Team" className={inputClass + " mt-1"} />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea value={groupForm.description} onChange={e => setGroupForm(f => ({...f, description: e.target.value}))}
                placeholder="Optional description..." rows={3} className={textareaClass + " mt-1"} />
            </div>
            <div>
              <label className={labelClass}>Visibility</label>
              <select value={groupForm.visibility} onChange={e => setGroupForm(f => ({...f, visibility: e.target.value}))}
                className={inputClass + " mt-1 appearance-none cursor-pointer"}>
                <option value="private">Private (invite only)</option>
                <option value="org_wide">Organization-wide</option>
              </select>
            </div>
            <Button onClick={handleCreateGroup} className="w-full bg-primary text-black font-bold rounded-sm">
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent className="bg-card border border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase">New Scouting Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className={labelClass}>Note *</label>
              <textarea value={noteForm.content} onChange={e => setNoteForm(f => ({...f, content: e.target.value}))}
                placeholder="Write your scouting observations..." rows={5} className={textareaClass + " mt-1"} />
            </div>
            <div>
              <label className={labelClass}>Visibility</label>
              <select value={noteForm.visibility} onChange={e => setNoteForm(f => ({...f, visibility: e.target.value}))}
                className={inputClass + " mt-1 appearance-none cursor-pointer"}>
                <option value="private">Private (only me)</option>
                <option value="group">Shared with groups</option>
                <option value="org">Organization-wide</option>
              </select>
            </div>
            <Button onClick={handleCreateNote} className="w-full bg-primary text-black font-bold rounded-sm">
              Save Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Game Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="bg-card border border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase">New Game Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Match Date</label>
                <input type="date" style={{colorScheme: "dark"}} value={reportForm.match_date} onChange={e => setReportForm(f => ({...f, match_date: e.target.value}))}
                  className={inputClass + " mt-1"} />
              </div>
              <div>
                <label className={labelClass}>Opponent</label>
                <input value={reportForm.opponent} onChange={e => setReportForm(f => ({...f, opponent: e.target.value}))}
                  placeholder="e.g. FC Barcelona" className={inputClass + " mt-1"} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Position Played</label>
                <input value={reportForm.position_played} onChange={e => setReportForm(f => ({...f, position_played: e.target.value}))}
                  placeholder="e.g. CM" className={inputClass + " mt-1"} />
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className={labelClass + " mb-3"}>Ratings</p>
              {["overall_rating", "physical", "technical", "tactical", "mental"].map(field => (
                <div key={field} className="flex items-center gap-3 mb-2">
                  <label className="text-xs text-muted-foreground w-24 capitalize">{field.replace("_", " ")}</label>
                  <input type="range" min="1" max="10" value={reportForm[field]}
                    onChange={e => setReportForm(f => ({...f, [field]: parseInt(e.target.value)}))}
                    className="flex-1" />
                  <span className="text-sm font-bold w-6 text-center">{reportForm[field]}</span>
                </div>
              ))}
            </div>

            <div>
              <label className={labelClass}>Strengths</label>
              <textarea value={reportForm.strengths} onChange={e => setReportForm(f => ({...f, strengths: e.target.value}))}
                placeholder="Key strengths observed..." rows={2} className={textareaClass + " mt-1"} />
            </div>
            <div>
              <label className={labelClass}>Weaknesses</label>
              <textarea value={reportForm.weaknesses} onChange={e => setReportForm(f => ({...f, weaknesses: e.target.value}))}
                placeholder="Areas for improvement..." rows={2} className={textareaClass + " mt-1"} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Recommendation</label>
                <select value={reportForm.recommendation} onChange={e => setReportForm(f => ({...f, recommendation: e.target.value}))}
                  className={inputClass + " mt-1 appearance-none cursor-pointer"}>
                  <option value="sign">✅ Sign</option>
                  <option value="monitor">⚠️ Monitor</option>
                  <option value="reject">❌ Reject</option>
                </select>
              </div>
            </div>

            <Button onClick={handleCreateReport} className="w-full bg-primary text-black font-bold rounded-sm">
              Save Game Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Chat Modal */}
      {showGroupChat && (
        <Dialog open={!!showGroupChat} onOpenChange={() => setShowGroupChat(null)}>
          <DialogContent className="bg-card border border-border/50 max-w-lg flex flex-col" style={{maxHeight: "90vh"}}>
            <DialogHeader>
              <DialogTitle className="font-heading uppercase">{showGroupChat.name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-3 py-4" style={{minHeight: "300px", maxHeight: "400px"}}>
              {groupMessages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
              ) : (
                groupMessages.map(msg => (
                  <div key={msg.id} className="bg-background rounded-sm p-3 border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-primary">{msg.author_name}</span>
                      <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 pt-3 border-t border-border">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..." className={inputClass + " flex-1"} />
              <Button onClick={sendMessage} className="bg-primary text-black font-bold rounded-sm px-4">Send</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ScoutingHub;
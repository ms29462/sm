import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, X, ChevronDown, Star, Flag, User, FileText, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

const STAGES = [
  "New Application", "Under Review", "Video Reviewed", "Live Scouting",
  "Shortlisted", "Contacted", "Trial Planned", "Negotiation", "Signed", "Rejected"
];

const STAGE_LABELS = {
  "New Application": "New Application",
  "Under Review": "Under Review",
  "Video Reviewed": "Video Reviewed",
  "Live Scouting": "Live Scouting",
  "Shortlisted": "Shortlisted",
  "Contacted": "Contacted",
  "Trial Planned": "Trial Planned",
  "Negotiation": "Negotiation",
  "Signed": "Signed",
  "Rejected": "Rejected"
};

const PRIORITY_COLORS = {
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  high: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  urgent: "bg-red-500/20 text-red-400 border-red-500/30"
};

const STAGE_COLORS = {
  "New Application": "border-gray-500/30",
  "Under Review": "border-blue-500/30",
  "Video Reviewed": "border-purple-500/30",
  "Live Scouting": "border-cyan-500/30",
  "Shortlisted": "border-yellow-500/30",
  "Contacted": "border-orange-500/30",
  "Trial Planned": "border-pink-500/30",
  "Negotiation": "border-indigo-500/30",
  "Signed": "border-green-500/30",
  "Rejected": "border-red-500/30"
};

const PipelineCard = ({ pp, onDragStart, onUpdate, onRemove, onOpenDetail, scoutingBase }) => {
  const navigate = useNavigate();
  const player = pp.player || {};

  return (
    <div
      draggable
      onDragStart={() => onDragStart(pp)}
      className="bg-background border border-border/50 rounded-sm p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors mb-2"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {player.profile_picture ? (
            <img src={player.profile_picture} alt={player.name} className="w-8 h-8 rounded-sm object-cover border border-primary/50" />
          ) : (
            <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center border border-border">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="text-xs font-bold uppercase">{player.name || "Unknown"}</p>
            <p className="text-[10px] text-muted-foreground">{player.position} · {player.nationality}</p>
          </div>
        </div>
        <button onClick={() => onRemove(pp.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Details */}
      <div className="flex items-center gap-1 flex-wrap mb-2">
        {player.age && <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded">{player.age}y</span>}
        {player.current_club && <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded truncate max-w-[80px]">{player.current_club}</span>}
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[pp.priority]}`}>{pp.priority}</span>
      </div>

      {/* Rating */}
      {pp.internal_rating && (
        <div className="flex items-center gap-1 mb-2">
          {[1,2,3,4,5].map(s => (
            <Star key={s} className={`w-3 h-3 ${s <= pp.internal_rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
          ))}
        </div>
      )}

      {/* Notes count */}
      {pp.notes?.length > 0 && (
        <p className="text-[10px] text-muted-foreground">{pp.notes.length} note{pp.notes.length > 1 ? "s" : ""}</p>
      )}

      {/* Actions */}
      <div className="flex gap-1 mt-2">
        <button onClick={() => onOpenDetail(pp)}
          className="flex-1 text-[10px] border border-white/10 hover:border-primary text-muted-foreground hover:text-primary rounded-sm py-1 transition-colors">
          Details
        </button>
        <button onClick={() => navigate(`${scoutingBase}/${pp.player_id}`)}
          className="flex-1 text-[10px] border border-white/10 hover:border-primary text-muted-foreground hover:text-primary rounded-sm py-1 transition-colors">
          Profile
        </button>
      </div>
    </div>
  );
};

const RecruitmentPipeline = () => {
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [selectedPp, setSelectedPp] = useState(null);
  const [noteForm, setNoteForm] = useState({ content: "", type: "note" });
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [viewMode, setViewMode] = useState('opportunity'); // 'kanban' or 'opportunity'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOpps, setExpandedOpps] = useState({});
  const [opportunities, setOpportunities] = useState([]);
  const [addStage, setAddStage] = useState("New Application");
  const [trackedPlayers, setTrackedPlayers] = useState([]);
  const [editingPp, setEditingPp] = useState(null);
  const { user } = require("@/context/AuthContext").useAuth();
  const scoutingBase = user?.role === "college" ? "/college/scouting" : user?.role === "federation" ? "/federation/scouting" : "/club/scouting";

  useEffect(() => {
    loadPipeline();
    loadTrackedPlayers();
  }, []);

  const loadPipeline = async () => {
    try {
      const [res, oppsRes] = await Promise.all([
      api.getPipeline(),
      api.getClubOpportunities().catch(() => ({ data: [] }))
    ]);
    setOpportunities(oppsRes.data || []);
      setPipeline(res.data || []);
    } catch (e) {
      toast.error("Failed to load pipeline");
    }
    setLoading(false);
  };

  const loadTrackedPlayers = async () => {
    try {
      const res = await api.getTrackedPlayers();
      setTrackedPlayers(res.data || []);
    } catch (e) {}
  };

  const handleDragStart = (pp) => setDraggedItem(pp);

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDrop = async (e, stage) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.stage === stage) {
      setDraggedItem(null);
      setDragOverStage(null);
      return;
    }
    try {
      await api.updatePipelinePlayer(draggedItem.id, { stage });
      setPipeline(prev => prev.map(p => p.id === draggedItem.id ? { ...p, stage } : p));
      toast.success(`Moved to ${stage}`);
    } catch (e) {
      toast.error("Failed to move player");
    }
    setDraggedItem(null);
    setDragOverStage(null);
  };

  const handleRemove = (ppId) => {
    setConfirmRemoveId(ppId);
  };

  const confirmRemove = async () => {
    try {
      await api.removeFromPipeline(confirmRemoveId);
      setPipeline(prev => prev.filter(p => p.id !== confirmRemoveId));
      toast.success("Removed from pipeline");
    } catch (e) {
      toast.error("Failed to remove");
    }
    setConfirmRemoveId(null);
  };

  const handleAddPlayer = async (playerId) => {
    try {
      const res = await api.addToPipeline({ player_id: playerId, stage: addStage, opportunity_id: addOpportunityId || null });
      await loadPipeline();
      setShowAddPlayer(false);
      toast.success("Player added to pipeline!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to add player");
    }
  };

  const handleAddNote = async () => {
    if (!noteForm.content.trim()) return;
    try {
      const res = await api.addPipelineNote(selectedPp.id, noteForm);
      const newNote = res.data;
      setPipeline(prev => prev.map(p => p.id === selectedPp.id ? { ...p, notes: [...(p.notes || []), newNote] } : p));
      setSelectedPp(prev => ({ ...prev, notes: [...(prev.notes || []), newNote] }));
      setNoteForm({ content: "", type: "note" });
      toast.success("Note added!");
    } catch (e) {
      toast.error("Failed to add note");
    }
  };

  const handleUpdatePp = async (ppId, data) => {
    try {
      await api.updatePipelinePlayer(ppId, data);
      setPipeline(prev => prev.map(p => p.id === ppId ? { ...p, ...data } : p));
      if (selectedPp?.id === ppId) setSelectedPp(prev => ({ ...prev, ...data }));
      toast.success("Updated!");
    } catch (e) {
      toast.error("Failed to update");
    }
  };

  const inputClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-9 px-3 text-sm text-white outline-none";
  const labelClass = "text-xs text-muted-foreground uppercase tracking-wide";

  if (loading) return <div className="p-8 text-center text-primary font-heading">LOADING PIPELINE...</div>;

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase">Recruitment Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">{pipeline.length} players tracked across {STAGES.length} stages</p>
        </div>
        <Button onClick={() => setShowAddPlayer(true)} className="bg-primary text-black font-bold rounded-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Player
        </Button>
      </div>

      {/* View Toggle & Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded-sm border border-white/10 overflow-hidden">
          <button onClick={() => setViewMode('opportunity')}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors ${viewMode === 'opportunity' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'}`}>
            By Opportunity
          </button>
          <button onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors ${viewMode === 'kanban' ? 'bg-primary text-black' : 'text-muted-foreground hover:text-white'}`}>
            Kanban
          </button>
        </div>
        {viewMode === 'opportunity' && (
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search opportunities or players..."
            className="flex-1 min-w-[200px] bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none focus:border-primary" />
        )}
      </div>

      {/* Opportunity View */}
      {viewMode === 'opportunity' && (() => {
        // Group pipeline players by opportunity
        const oppGroups = { 'unassigned': { opportunity: null, players: [], label: 'General Pipeline' } };
        pipeline.forEach(pp => {
          const oppId = pp.opportunity_id || 'unassigned';
          if (!oppGroups[oppId]) {
            const opp = opportunities.find(o => o.id === oppId);
            oppGroups[oppId] = { opportunity: opp, players: [], label: opp ? `${opp.positions?.[0] || opp.position || 'N/A'} - ${opp.league_level || ''}` : 'General Pipeline' };
          }
          oppGroups[oppId].players.push(pp);
        });

        const filteredGroups = Object.entries(oppGroups).filter(([_, g]) => {
          if (!searchQuery) return true;
          const q = searchQuery.toLowerCase();
          return g.label.toLowerCase().includes(q) || g.players.some(p => p.player?.name?.toLowerCase().includes(q));
        });

        return (
          <div className="space-y-3 mb-6">
            {filteredGroups.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">No pipeline players found</div>
            )}
            {filteredGroups.map(([oppId, group]) => (
              <div key={oppId} className="bg-card border border-border/50 rounded-sm overflow-hidden">
                <button onClick={() => setExpandedOpps(prev => ({ ...prev, [oppId]: !prev[oppId] }))}
                  className="w-full flex flex-wrap items-center justify-between p-4 hover:bg-white/5 transition-colors gap-2 text-left">
                  <div>
                    <p className="font-heading font-bold uppercase text-sm">{group.label}</p>
                    {group.opportunity && <p className="text-xs text-muted-foreground mt-0.5">{group.opportunity.salary_range || 'Salary N/A'}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-sm">
                      {group.players.length} candidate{group.players.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">{expandedOpps[oppId] ? '▲' : '▼'}</span>
                  </div>
                </button>
                {expandedOpps[oppId] && (
                  <div className="border-t border-border/50 divide-y divide-border/30">
                    {group.players.map(pp => {
                      const player = pp.player || {};
                      return (
                        <div key={pp.id} className="flex flex-wrap items-center justify-between p-3 gap-3 hover:bg-white/5 transition-colors">
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedPp(pp)}>
                            <p className="font-bold text-sm">{player.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{player.position || '—'} · {player.nationality || '—'}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-sm border ${PRIORITY_COLORS[pp.priority] || PRIORITY_COLORS.low}`}>{pp.priority || 'low'}</span>
                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-sm">{STAGE_LABELS[pp.stage] || pp.stage}</span>
                            <button onClick={() => handleRemove(pp.id)} className="text-muted-foreground hover:text-red-500 transition-colors ml-1">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Kanban Board */}
      {viewMode === 'kanban' &&
      <div className="space-y-4">
        {[STAGES.slice(0, 5), STAGES.slice(5, 10)].map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-5 gap-3">
            {row.map((stage, colIdx) => {
              const stageNum = rowIdx * 5 + colIdx + 1;
              const stagePlayers = pipeline.filter(p => p.stage === stage);
              const isDragOver = dragOverStage === stage;
              return (
                <div
                  key={stage}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDrop={(e) => handleDrop(e, stage)}
                  className={`rounded-sm border ${STAGE_COLORS[stage]} ${isDragOver ? "border-primary bg-primary/5" : ""} flex flex-col`}
                  style={{minHeight: "200px"}}
                >
                  <div className="p-2 border-b border-border/30">
                    <p className="text-xs font-bold uppercase tracking-wide truncate">
                      <span className="text-primary mr-1">{stageNum}.</span>{stage}
                    </p>
                    <p className="text-xs text-muted-foreground">{stagePlayers.length} player{stagePlayers.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="p-2 space-y-2 flex-1">
                    {stagePlayers.map(pp => (
                      <div
                        key={pp.id}
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); setDraggedItem(pp); }}
                        onClick={() => setSelectedPp(pp)}
                        className="bg-card p-2 rounded-sm border border-primary/30 cursor-pointer hover:border-primary transition-colors text-xs shadow-sm"
                      >
                        <p className="font-bold text-white truncate">{pp.player?.name || pp.player_name || "Unknown"}</p>
                        <p className="text-muted-foreground truncate">{pp.player?.position || pp.position || "—"}</p>
                        <p className="text-muted-foreground truncate">{pp.player?.nationality || "—"}</p>
                        {pp.priority && <span className="text-[10px] text-primary">{pp.priority}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      }
      {/* Confirm Remove Dialog */}
      {confirmRemoveId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm p-6 max-w-sm w-full">
            <h3 className="font-heading font-bold uppercase mb-2">Remove from Pipeline</h3>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to remove this player from the pipeline? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRemoveId(null)}
                className="flex-1 border border-white/10 text-muted-foreground hover:text-white rounded-sm py-2 text-sm transition-colors">
                Cancel
              </button>
              <button onClick={confirmRemove}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-sm py-2 text-sm transition-colors">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
        <DialogContent className="bg-card border border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase">Add Player to Pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className={labelClass}>Stage</label>
              <select value={addStage} onChange={e => setAddStage(e.target.value)}
                className={inputClass + " mt-1 appearance-none cursor-pointer"}>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Select from Tracked Players</label>
              <div className="mt-1 space-y-2 max-h-60 overflow-y-auto">
                {trackedPlayers.filter(p => !pipeline.find(pp => pp.player_id === p.user_id)).map(player => (
                  <div key={player.user_id} onClick={() => handleAddPlayer(player.user_id)}
                    className="flex items-center gap-3 p-3 bg-background border border-border/50 rounded-sm hover:border-primary cursor-pointer transition-colors">
                    {player.profile_picture ? (
                      <img src={player.profile_picture} alt={player.name} className="w-8 h-8 rounded-sm object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold">{player.name}</p>
                      <p className="text-xs text-muted-foreground">{player.position} · {player.nationality}</p>
                    </div>
                  </div>
                ))}
                {trackedPlayers.filter(p => !pipeline.find(pp => pp.player_id === p.user_id)).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">All tracked players are already in the pipeline.</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Player Detail Modal */}
      {selectedPp && (
        <Dialog open={!!selectedPp} onOpenChange={() => setSelectedPp(null)}>
          <DialogContent className="bg-card border border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading uppercase">
                {selectedPp.player?.name || "Player"} — {selectedPp.stage}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Priority & Rating */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Priority</label>
                  <select value={selectedPp.priority}
                    onChange={e => { handleUpdatePp(selectedPp.id, { priority: e.target.value }); setSelectedPp(p => ({...p, priority: e.target.value})); }}
                    className={inputClass + " mt-1 appearance-none cursor-pointer"}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Internal Rating (1-5)</label>
                  <div className="flex items-center gap-1 mt-2">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => { handleUpdatePp(selectedPp.id, { internal_rating: s }); setSelectedPp(p => ({...p, internal_rating: s})); }}>
                        <Star className={`w-5 h-5 ${s <= (selectedPp.internal_rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stage */}
              <div>
                <label className={labelClass}>Move to Stage</label>
                <select value={selectedPp.stage}
                  onChange={e => { handleUpdatePp(selectedPp.id, { stage: e.target.value }); setSelectedPp(p => ({...p, stage: e.target.value})); }}
                  className={inputClass + " mt-1 appearance-none cursor-pointer"}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className={labelClass}>Tags (comma separated)</label>
                <input
                  defaultValue={selectedPp.tags?.join(", ")}
                  onBlur={e => {
                    const tags = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                    handleUpdatePp(selectedPp.id, { tags });
                    setSelectedPp(p => ({...p, tags}));
                  }}
                  placeholder="e.g. fast, technical, left-foot"
                  className={inputClass + " mt-1"}
                />
                {selectedPp.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPp.tags.map(tag => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-sm">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className={labelClass}>Notes ({selectedPp.notes?.length || 0})</label>
                <div className="mt-1 space-y-2 max-h-40 overflow-y-auto">
                  {(selectedPp.notes || []).map(note => (
                    <div key={note.id} className="bg-background border border-border/50 rounded-sm p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-primary uppercase">{note.type}</span>
                        <span className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{note.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 space-y-2">
                  <select value={noteForm.type} onChange={e => setNoteForm(f => ({...f, type: e.target.value}))}
                    className={inputClass + " appearance-none cursor-pointer"}>
                    <option value="note">Note</option>
                    <option value="scouting">Scouting</option>
                    <option value="evaluation">Evaluation</option>
                  </select>
                  <textarea value={noteForm.content} onChange={e => setNoteForm(f => ({...f, content: e.target.value}))}
                    placeholder="Add a note..." rows={3}
                    className="w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm p-3 text-sm text-white outline-none resize-none" />
                  <Button onClick={handleAddNote} className="w-full bg-primary text-black font-bold rounded-sm">
                    Add Note
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RecruitmentPipeline;
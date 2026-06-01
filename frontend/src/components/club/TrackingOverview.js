import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Users, FileText, Target, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase border ${styles[rec]}`}>
      {rec === "sign" ? "✅ Sign" : rec === "monitor" ? "⚠️ Monitor" : "❌ Reject"}
    </span>
  );
};

const inputClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-10 px-3 text-sm text-white outline-none";
const textareaClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm p-3 text-sm text-white outline-none resize-none";
const labelClass = "text-xs text-muted-foreground uppercase tracking-wide";

const TrackingOverview = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [notes, setNotes] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Notes");
  const [editingNote, setEditingNote] = useState(null);
  const [editingReport, setEditingReport] = useState(null);

  useEffect(() => {
    loadData();
  }, [playerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [playerRes, notesRes, reportsRes] = await Promise.all([
        api.getPlayerDetail(playerId),
        api.getScoutingNotes(playerId),
        api.getPostMortems(playerId),
      ]);
      setPlayer(playerRes.data);
      setNotes(notesRes.data || []);
      setReports(reportsRes.data || []);
    } catch (e) {
      toast.error("Failed to load tracking data");
    }
    setLoading(false);
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await api.deleteScoutingNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success("Note deleted");
    } catch (e) {
      toast.error("Failed to delete note");
    }
  };

  const handleDeleteReport = async (pmId) => {
    try {
      await api.deletePostMortem(pmId);
      setReports(prev => prev.filter(p => p.id !== pmId));
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
      setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, ...editingNote } : n));
      toast.success("Note updated!");
      setEditingNote(null);
    } catch (e) {
      toast.error("Failed to update note");
    }
  };

  const handleEditReport = async () => {
    try {
      await api.updatePostMortem(editingReport.id, editingReport);
      setReports(prev => prev.map(r => r.id === editingReport.id ? editingReport : r));
      toast.success("Report updated!");
      setEditingReport(null);
    } catch (e) {
      toast.error("Failed to update report");
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
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Scouting Hub
      </button>

      {/* Player Header */}
      {player && (
        <div className="bg-card border border-border/50 p-6 rounded-sm mb-6 flex items-center gap-4">
          {player.profile_picture ? (
            <img src={player.profile_picture} alt={player.name} className="w-16 h-16 rounded-sm object-cover border-2 border-primary" />
          ) : (
            <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center border-2 border-border">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold uppercase">{player.name}</h1>
            <p className="text-muted-foreground">{player.position} · {player.nationality} {player.age && `· ${player.age} yrs`}</p>
            <p className="text-sm text-muted-foreground">{player.playing_level} · {player.current_club || "Free Agent"}</p>
          </div>
          <div className="text-right">
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-heading font-bold text-primary">{notes.length}</p>
                <p className="text-xs text-muted-foreground uppercase">Notes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-heading font-bold text-primary">{reports.length}</p>
                <p className="text-xs text-muted-foreground uppercase">Reports</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {["Notes", "Game Reports"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium uppercase tracking-wide transition-colors border-b-2 -mb-px ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-white"
            }`}>
            {tab} {tab === "Notes" ? `(${notes.length})` : `(${reports.length})`}
          </button>
        ))}
      </div>

      {/* Notes Tab */}
      {activeTab === "Notes" && (
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notes yet for this player.</p>
            </div>
          ) : (
            notes.map(note => (
              <div key={note.id} className="bg-card border border-border/50 p-5 rounded-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-sm text-primary">{note.author_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      {note.updated_at !== note.created_at && " · edited"}
                    </p>
                    <span className="text-xs bg-white/5 px-2 py-0.5 rounded mt-1 inline-block">{note.visibility}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingNote({...note})} className="text-muted-foreground hover:text-primary transition-colors p-1">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteNote(note.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{note.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Game Reports Tab */}
      {activeTab === "Game Reports" && (
        <div className="space-y-6">
          {reports.length === 0 ? (
            <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No game reports yet for this player.</p>
            </div>
          ) : (
            reports.map(pm => (
              <div key={pm.id} className="bg-card border border-border/50 p-6 rounded-sm">
                {/* Report Header */}
                <div className="flex items-start justify-between mb-5 pb-4 border-b border-border">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-heading font-bold uppercase">vs {pm.opponent}</h3>
                      <RecommendationBadge rec={pm.recommendation} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(pm.match_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      {pm.position_played && ` · ${pm.position_played}`}
                    </p>
                    <p className="text-xs text-primary mt-1">By {pm.author_name} · {new Date(pm.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingReport({...pm})} className="text-muted-foreground hover:text-primary transition-colors p-1">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteReport(pm.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Overall Rating */}
                <div className="mb-5 text-center">
                  <div className="text-5xl font-heading font-bold mb-1" style={{
                    color: pm.overall_rating >= 8 ? "#22c55e" : pm.overall_rating >= 6 ? "#eab308" : "#ef4444"
                  }}>
                    {pm.overall_rating}<span className="text-2xl text-muted-foreground">/10</span>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Overall Rating</p>
                </div>

                {/* Ratings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
                  <div>
                    <RatingBar value={pm.physical} label="Physical" />
                    <RatingBar value={pm.technical} label="Technical" />
                  </div>
                  <div>
                    <RatingBar value={pm.tactical} label="Tactical" />
                    <RatingBar value={pm.mental} label="Mental" />
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-background/50 rounded-sm">
                  <div>
                    <p className="text-xs text-green-400 font-bold uppercase mb-2">✅ Strengths</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pm.strengths}</p>
                  </div>
                  <div>
                    <p className="text-xs text-red-400 font-bold uppercase mb-2">❌ Weaknesses</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pm.weaknesses}</p>
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
                  <option value="private">Private</option>
                  <option value="group">Groups</option>
                  <option value="org">Organization</option>
                </select>
              </div>
              <Button onClick={handleEditNote} className="w-full bg-primary text-black font-bold rounded-sm">Save Changes</Button>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Match Date</label>
                  <input type="date" value={editingReport.match_date} onChange={e => setEditingReport(r => ({...r, match_date: e.target.value}))}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <Button onClick={handleEditReport} className="w-full bg-primary text-black font-bold rounded-sm">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TrackingOverview;
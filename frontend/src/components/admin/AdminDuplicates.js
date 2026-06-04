import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { AlertTriangle, Shield, Eye, CheckCircle, XCircle, X, ChevronDown, ChevronUp, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const RISK_STYLES = {
  high: { bg: "bg-red-500/10 border-red-500/30", text: "text-red-400", badge: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertTriangle },
  medium: { bg: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: AlertTriangle },
  low: { bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Shield },
};

const PlayerCard = ({ player, highlight = [] }) => (
  <div className="bg-black/20 border border-white/10 rounded-sm p-4">
    <div className="flex items-center gap-3 mb-4">
      {player.profile_picture ? (
        <img src={player.profile_picture} alt={player.name} className="w-14 h-14 rounded-sm object-cover border border-primary" />
      ) : (
        <div className="w-14 h-14 rounded-sm bg-muted flex items-center justify-center border border-border">
          <User className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <div>
        <h3 className={`font-heading font-bold uppercase ${highlight.includes("name") ? "text-red-400" : ""}`}>{player.name}</h3>
        <p className="text-xs text-muted-foreground">{player.position} · {player.playing_level}</p>
        {player.verified && <span className="text-xs text-blue-400">✓ Verified</span>}
      </div>
    </div>
    <div className="space-y-2 text-sm">
      {[
        { label: "Nationality", value: player.nationality, key: "nationality" },
        { label: "Date of Birth", value: player.date_of_birth, key: "date_of_birth" },
        { label: "Height", value: player.height ? `${player.height} cm` : null, key: "height" },
        { label: "Weight", value: player.weight ? `${player.weight} kg` : null, key: "weight" },
        { label: "Current Club", value: player.current_club, key: "current_club" },
        { label: "Email", value: player.email, key: "email" },
        { label: "Phone", value: player.phone, key: "phone" },
      ].map(({ label, value, key }) => value ? (
        <div key={key} className={`flex justify-between py-1 border-b border-white/5 ${highlight.includes(key) ? "bg-red-500/10 px-2 rounded-sm" : ""}`}>
          <span className="text-muted-foreground">{label}</span>
          <span className={`font-medium ${highlight.includes(key) ? "text-red-400" : ""}`}>{value}</span>
        </div>
      ) : null)}
      {player.created_at && (
        <div className="flex justify-between py-1 border-b border-white/5">
          <span className="text-muted-foreground">Joined</span>
          <span className="text-xs">{new Date(player.created_at).toLocaleDateString()}</span>
        </div>
      )}
    </div>
    <a href={`/admin/players`} className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
      <Eye className="w-3 h-3" /> View Full Profile
    </a>
  </div>
);

const AdminDuplicates = () => {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [actions, setActions] = useState({});
  const [noteInput, setNoteInput] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => { loadDuplicates(); }, []);

  const loadDuplicates = async () => {
    try {
      const res = await api.getDuplicateProfiles();
      setDuplicates(res.data || []);
    } catch (e) {
      toast.error("Failed to load duplicate profiles");
    }
    setLoading(false);
  };

  const handleExpand = async (dup) => {
    if (expanded === dup.id) { setExpanded(null); return; }
    setExpanded(dup.id);
    try {
      const res = await api.getDuplicateAction(dup.id);
      setActions(prev => ({ ...prev, [dup.id]: res.data }));
      setNoteInput(res.data?.note || "");
    } catch (e) {}
  };

  const handleAction = async (dupId, action) => {
    try {
      await api.handleDuplicateAction(dupId, { action, note: noteInput });
      setActions(prev => ({ ...prev, [dupId]: { action, note: noteInput } }));
      toast.success("Action saved!");
    } catch (e) {
      toast.error("Failed to save action");
    }
  };

  const getHighlightFields = (reasons) => {
    const map = {
      "Same phone number": ["phone"],
      "Same email address": ["email"],
      "Same date of birth": ["date_of_birth"],
      "Same profile photo": ["profile_picture"],
      "Same nationality and position": ["nationality"],
      "Same height and weight": ["height", "weight"],
      "Identical name": ["name"],
      "Similar name": ["name"],
    };
    return reasons.flatMap(r => map[r] || []);
  };

  const filtered = duplicates.filter(d => filter === "all" || d.risk === filter)
    .filter(d => !actions[d.id]?.action || actions[d.id]?.action === "add_note");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase">Potential Duplicate Profiles</h1>
          <p className="text-muted-foreground text-sm mt-1">Identify and investigate suspicious profile similarities</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "high", "medium", "low"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-sm border font-bold capitalize transition-colors ${filter === f ? "bg-primary text-black border-primary" : "border-white/20 text-muted-foreground"}`}>
              {f === "all" ? "All" : `${f} Risk`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {["high", "medium", "low"].map(risk => {
          const style = RISK_STYLES[risk];
          const count = duplicates.filter(d => d.risk === risk).length;
          return (
            <div key={risk} className={`border rounded-sm p-4 ${style.bg}`}>
              <p className={`text-2xl font-bold ${style.text}`}>{count}</p>
              <p className="text-sm text-muted-foreground capitalize">{risk} Risk Matches</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12 text-primary font-heading">ANALYZING PROFILES...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-muted-foreground">No suspicious duplicate profiles detected.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(dup => {
            const style = RISK_STYLES[dup.risk];
            const isExpanded = expanded === dup.id;
            const currentAction = actions[dup.id];
            const highlightFields = getHighlightFields(dup.reasons);

            return (
              <div key={dup.id} className={`border rounded-sm ${style.bg}`}>
                {/* Summary Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer" onClick={() => handleExpand(dup)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-sm border font-bold uppercase ${style.badge}`}>
                        {dup.risk} Risk
                      </span>
                      <span className="text-xs text-muted-foreground">{dup.similarity_score}% similarity</span>
                      {currentAction?.action && (
                        <span className="text-xs px-2 py-0.5 rounded-sm bg-white/10 text-muted-foreground border border-white/10">
                          {currentAction.action.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <p className="font-bold">{dup.player1.name} <span className="text-muted-foreground font-normal">vs</span> {dup.player2.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dup.reasons.map((r, i) => (
                        <span key={i} className="text-xs bg-black/20 border border-white/10 px-1.5 py-0.5 rounded-sm text-muted-foreground">{r}</span>
                      ))}
                    </div>
                  </div>
                  {/* Score bar */}
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${dup.risk === "high" ? "bg-red-500" : dup.risk === "medium" ? "bg-yellow-500" : "bg-blue-500"}`}
                        style={{ width: `${dup.similarity_score}%` }} />
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded View */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4">
                    {/* Side by side comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <PlayerCard player={dup.player1} highlight={highlightFields} />
                      <PlayerCard player={dup.player2} highlight={highlightFields} />
                    </div>

                    {/* Admin Actions */}
                    <div className="bg-black/20 border border-white/10 rounded-sm p-4">
                      <h4 className="font-heading font-bold uppercase text-sm mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Admin Actions
                      </h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button onClick={() => handleAction(dup.id, "mark_legitimate")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm border transition-colors ${currentAction?.action === "mark_legitimate" ? "bg-green-500/20 text-green-400 border-green-500/30" : "border-white/20 text-muted-foreground hover:border-green-500/30 hover:text-green-400"}`}>
                          <CheckCircle className="w-3 h-3" /> Mark as Legitimate
                        </button>
                        <button onClick={() => handleAction(dup.id, "mark_duplicate")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm border transition-colors ${currentAction?.action === "mark_duplicate" ? "bg-red-500/20 text-red-400 border-red-500/30" : "border-white/20 text-muted-foreground hover:border-red-500/30 hover:text-red-400"}`}>
                          <XCircle className="w-3 h-3" /> Mark as Duplicate
                        </button>
                        <button onClick={() => handleAction(dup.id, "dismiss")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm border transition-colors ${currentAction?.action === "dismiss" ? "bg-white/10 text-muted-foreground border-white/20" : "border-white/20 text-muted-foreground hover:border-white/40"}`}>
                          <X className="w-3 h-3" /> Dismiss Alert
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input value={noteInput} onChange={e => setNoteInput(e.target.value)}
                          placeholder="Add internal note..."
                          className="flex-1 bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none" />
                        <Button onClick={() => handleAction(dup.id, "add_note")} size="sm" className="bg-primary text-black font-bold rounded-sm">
                          Save Note
                        </Button>
                      </div>
                      {currentAction?.note && (
                        <p className="text-xs text-muted-foreground mt-2 p-2 bg-black/20 rounded-sm border border-white/10">
                          Note: {currentAction.note}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDuplicates;
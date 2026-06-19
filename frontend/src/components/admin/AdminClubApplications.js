import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const DISCOVERY_STATUSES = ["Not Contacted","Contacted","Call Scheduled","Call Completed","Approved","Rejected","Additional Information Required"];
const TIERS = ["Amateur Club","Semi-Professional Club","Professional Club"];
const STATUS_COLORS = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  approved: "text-green-400 bg-green-500/10 border-green-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
};

const Field = ({ label, value }) => (
  <div className="bg-black/20 rounded-sm p-3">
    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
    <p className="text-sm font-medium">{value || "—"}</p>
  </div>
);

const AdminClubApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("pending");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = applications.filter(a => {
    if (tab === "all") return true;
    if (tab === "pending") return !a.status || a.status === "pending";
    return a.status === tab;
  });

  useEffect(() => { loadApplications(); }, []);

  const loadApplications = async () => {
    try {
      const res = await api.getAdminClubApplications();
      setApplications(res.data);
    } catch (e) {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (clubId, updates) => {
    setSaving(true);
    try {
      await api.updateClubApplication(clubId, updates);
      toast.success("Updated!");
      loadApplications();
      setSelected(prev => prev ? { ...prev, ...updates } : null);
    } catch (e) {
      toast.error("Failed to update");
    }
    setSaving(false);
  };

  const handleDelete = async (clubId) => {
    if (!window.confirm("Delete this club permanently?")) return;
    try {
      await api.deleteClub(clubId);
      toast.success("Club deleted!");
      setSelected(null);
      loadApplications();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1">Club Management</h1>
      <p className="text-muted-foreground mb-4">Review and manage club registrations</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {["pending","approved","rejected","all"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold uppercase rounded-sm border transition-colors ${tab === t ? "bg-primary text-black border-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
            {t} ({applications.filter(a => t === "all" ? true : t === "pending" ? (!a.status || a.status === "pending") : a.status === t).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* List */}
        <div className="space-y-2 lg:col-span-1">
          {filtered.length === 0 && (
            <div className="bg-card border border-border/50 rounded-sm p-8 text-center text-muted-foreground text-sm">No applications</div>
          )}
          {filtered.map(app => (
            <div key={app.user_id} onClick={() => { setSelected(app); setNotes(app.internal_notes || ""); }}
              className={`bg-card border rounded-sm p-4 cursor-pointer transition-colors ${selected?.user_id === app.user_id ? "border-primary" : "border-border/50 hover:border-white/30"}`}>
              <div className="flex items-start justify-between mb-1">
                <p className="font-bold text-sm">{app.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${STATUS_COLORS[app.status] || STATUS_COLORS.pending}`}>
                  {app.status || "pending"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{app.country} — {app.league || app.competition_level}</p>
              <div className="flex items-center gap-2">
                {app.institution_type && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-sm">{app.institution_type}</span>}
                <p className="text-xs text-muted-foreground">{app.playing_level || app.competition_level} • {app.created_at?.slice(0,10)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-card border border-border/50 rounded-sm p-12 text-center text-muted-foreground">Select an application</div>
          ) : (
            <div className="bg-card border border-border/50 rounded-sm p-4 md:p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-heading font-bold uppercase">{selected.name}</h2>
                  <p className="text-sm text-muted-foreground">{selected.country} — {selected.league}</p>
                </div>
                {selected.logo && <img src={selected.logo} alt="Logo" className="w-14 h-14 object-contain border border-white/10 rounded-sm" />}
              </div>

              {/* Club Info */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Club Information</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Field label="Club Name" value={selected.name} />
                  <Field label="Country" value={selected.country} />
                  <Field label="League" value={selected.league} />
                  <Field label="Division" value={selected.division} />
                  <Field label="Category" value={selected.playing_level} />
                  <Field label="Submitted" value={selected.created_at?.slice(0,10)} />
                </div>
              </div>

              {/* Description */}
              {selected.description && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Description</p>
                  <div className="bg-black/20 rounded-sm p-3 text-sm leading-relaxed">{selected.description}</div>
                </div>
              )}

              {/* Verification Links */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Verification Links</p>
                <div className="bg-black/20 rounded-sm p-3 space-y-1 text-sm">
                  {selected.website && <a href={selected.website} target="_blank" rel="noreferrer" className="text-primary hover:underline block">🌐 {selected.website}</a>}
                  {selected.instagram && <a href={selected.instagram} target="_blank" rel="noreferrer" className="text-primary hover:underline block">📷 {selected.instagram}</a>}
                  {selected.facebook && <a href={selected.facebook} target="_blank" rel="noreferrer" className="text-primary hover:underline block">👤 {selected.facebook}</a>}
                  {selected.linkedin && <a href={selected.linkedin} target="_blank" rel="noreferrer" className="text-primary hover:underline block">💼 {selected.linkedin}</a>}
                  {!selected.website && !selected.instagram && !selected.facebook && !selected.linkedin && <p className="text-muted-foreground">No links provided</p>}
                </div>
              </div>

              {/* Representative - Admin Only */}
              <div>
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Representative (Admin Only)</p>
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-sm p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="First Name" value={selected.rep_first_name} />
                    <Field label="Last Name" value={selected.rep_last_name} />
                    <Field label="Role" value={selected.rep_role} />
                    <Field label="Phone" value={selected.rep_phone} />
                  </div>
                  <div className="mt-2 bg-black/20 rounded-sm p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Email</p>
                    <p className="text-sm text-primary">{selected.rep_email || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Discovery Call */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Discovery Call Status</p>
                <select value={selected.discovery_call_status || "Not Contacted"}
                  onChange={e => handleUpdate(selected.user_id, { discovery_call_status: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 h-10 text-sm text-white outline-none cursor-pointer">
                  {DISCOVERY_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Recommended Tier */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Recommended Subscription Tier</p>
                <select value={selected.recommended_tier || ""}
                  onChange={e => handleUpdate(selected.user_id, { recommended_tier: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 h-10 text-sm text-white outline-none cursor-pointer">
                  <option value="">Select tier...</option>
                  {TIERS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Subscription Access Control */}
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-sm">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Subscription Access</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Status: <span className="font-bold text-white">{selected.club_sub_status || "pending_review"}</span>
                  {selected.active_plan && <span className="ml-2 text-green-400">({selected.active_plan})</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={async () => {
                      await api.adminUpdateClubSubscription(selected.user_id, { club_sub_status: "approved_awaiting_payment" });
                      handleUpdate(selected.user_id, { club_sub_status: "approved_awaiting_payment" });
                    }}
                    className="text-xs px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-sm hover:bg-blue-500/30 transition-colors">
                    Allow Payment
                  </button>
                  <button onClick={async () => {
                      await api.adminUpdateClubSubscription(selected.user_id, { club_sub_status: "active", active_plan: selected.recommended_tier || "club_amateur" });
                      handleUpdate(selected.user_id, { club_sub_status: "active" });
                    }}
                    className="text-xs px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-sm hover:bg-green-500/30 transition-colors">
                    Manually Activate
                  </button>
                  <button onClick={async () => {
                      await api.adminUpdateClubSubscription(selected.user_id, { club_sub_status: "cancelled" });
                      handleUpdate(selected.user_id, { club_sub_status: "cancelled" });
                    }}
                    className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-sm hover:bg-red-500/30 transition-colors">
                    Suspend Access
                  </button>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Internal Notes</p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  placeholder="Add internal notes..."
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-sm text-white outline-none focus:border-primary resize-none" />
                <button onClick={() => handleUpdate(selected.user_id, { internal_notes: notes })}
                  className="mt-1 text-xs border border-white/10 rounded-sm px-3 py-1.5 hover:bg-white/10 transition-colors">
                  Save Notes
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={() => handleUpdate(selected.user_id, { status: "approved", approved: true })}
                  className="flex-1 bg-green-500 text-black font-bold rounded-sm py-2.5 text-sm hover:bg-green-400 transition-colors">
                  ✓ Approve
                </button>
                <button onClick={() => handleUpdate(selected.user_id, { status: "rejected", approved: false })}
                  className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-sm py-2.5 text-sm hover:bg-red-500/30 transition-colors">
                  ✗ Reject
                </button>
                <button onClick={() => handleDelete(selected.user_id)}
                  className="px-4 bg-red-900/30 text-red-400 border border-red-500/30 font-bold rounded-sm py-2.5 text-sm hover:bg-red-900/50 transition-colors">
                  🗑 Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminClubApplications;
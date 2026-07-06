import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const STATUS_COLORS = {
  pending_review: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  approved: "text-green-400 bg-green-500/10 border-green-500/20",
  published: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
  changes_requested: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  draft: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  closed: "text-gray-400 bg-gray-500/10 border-gray-500/20",
};

const TIERS = [
  { id: "amateur", label: "Amateur", credits: 2 },
  { id: "semi_professional", label: "Semi-Professional", credits: 5 },
  { id: "university", label: "University", credits: 5 },
  { id: "professional", label: "Professional", credits: 10 },
];

const Field = ({ label, value }) => (
  <div className="bg-black/20 rounded-sm p-3">
    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
    <p className="text-sm font-medium">{value || "—"}</p>
  </div>
);

const AdminOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editMaxApplicants, setEditMaxApplicants] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [tab, setTab] = useState("pending_review");
  const [tier, setTier] = useState('amateur');
  const [adminNotes, setAdminNotes] = useState("");
  const [publicFeedback, setPublicFeedback] = useState("");

  const getStatus = (o) => o.status || "pending_review";
  const filtered = opportunities.filter(o => tab === "all" ? true : getStatus(o) === tab);

  useEffect(() => { loadOpportunities(); }, []);

  const loadOpportunities = async () => {
    try {
      const res = await api.getAdminOpportunities();
      setOpportunities(res.data);
    } catch (e) {
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };

  const selectOpp = (opp) => {
    setSelected(opp);
    setEditMaxApplicants(opp.max_applicants ?? "");
    setEditDeadline(opp.deadline ?? "");
    setEditStatus(opp.status ?? "");
    setTier(opp.tier || 'amateur');
    setAdminNotes(opp.admin_notes || "");
    setPublicFeedback(opp.public_feedback || "");
  };

  const handleApprove = async () => {
    try {
      await api.approveOpportunity(selected.id, { tier });
      toast.success("Opportunity approved and published!");
      loadOpportunities();
      setSelected(null);
    } catch (e) {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async () => {
    if (!publicFeedback) { toast.error("Please add feedback for the organization"); return; }
    try {
      await api.rejectOpportunity(selected.id, { feedback: publicFeedback, notes: adminNotes });
      toast.success("Opportunity rejected");
      loadOpportunities();
      setSelected(prev => ({ ...prev, status: "rejected" }));
    } catch (e) {
      toast.error("Failed to reject");
    }
  };

  const handleRequestChanges = async () => {
    if (!publicFeedback) { toast.error("Please add feedback for the organization"); return; }
    try {
      await api.requestOpportunityChanges(selected.id, { feedback: publicFeedback, notes: adminNotes });
      toast.success("Changes requested");
      loadOpportunities();
      setSelected(prev => ({ ...prev, status: "changes_requested" }));
    } catch (e) {
      toast.error("Failed to request changes");
    }
  };

  const handleSaveOpportunityFields = async () => {
    try {
      await api.updateAdminOpportunity(selected.id, {
        max_applicants: editMaxApplicants === "" ? null : Number(editMaxApplicants),
        deadline: editDeadline || null,
        status: editStatus,
      });
      toast.success("Opportunity updated");
      loadOpportunities();
      setSelected(prev => prev ? { ...prev, max_applicants: editMaxApplicants === "" ? null : Number(editMaxApplicants), deadline: editDeadline, status: editStatus } : null);
    } catch (e) {
      toast.error("Failed to update opportunity");
    }
  };

  const handleSaveNotes = async () => {
    try {
      await api.updateAdminOpportunity(selected.id, { admin_notes: adminNotes });
      toast.success("Notes saved");
    } catch (e) {
      toast.error("Failed to save notes");
    }
  };

  const tabs = [
    { id: "pending_review", label: "Pending Review", count: opportunities.filter(o => getStatus(o) === "pending_review").length },
    { id: "changes_requested", label: "Changes Requested", count: opportunities.filter(o => getStatus(o) === "changes_requested").length },
    { id: "published", label: "Published", count: opportunities.filter(o => getStatus(o) === "published").length },
    { id: "rejected", label: "Rejected", count: opportunities.filter(o => getStatus(o) === "rejected").length },
    { id: "all", label: "All", count: opportunities.length },
  ];

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1">Opportunity Review</h1>
        <p className="text-muted-foreground text-sm">Review, approve and assign credits to opportunities</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs font-bold uppercase rounded-sm border transition-colors ${tab === t.id ? "bg-primary text-black border-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="bg-card border border-border/50 rounded-sm p-8 text-center text-muted-foreground text-sm">No opportunities</div>
          )}
          {filtered.map(opp => (
            <div key={opp.id} onClick={() => selectOpp(opp)}
              className={`bg-card border rounded-sm p-4 cursor-pointer transition-colors ${selected?.id === opp.id ? "border-primary" : "border-border/50 hover:border-white/30"}`}>
              <div className="flex items-start justify-between mb-2">
                <p className="font-bold text-sm">{opp.title || opp.position}</p>
                <p className="text-xs text-primary">{opp.club_name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${STATUS_COLORS[getStatus(opp)] || STATUS_COLORS.draft}`}>
                  {getStatus(opp).replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{opp.country} • {opp.league_level}</p>
              <p className="text-xs text-muted-foreground">{opp.created_at?.slice(0,10)}</p>
              {opp.credit_cost && (
                <p className="text-xs text-primary mt-1">⭐ {opp.credit_cost} credit{opp.credit_cost > 1 ? "s" : ""}</p>
              )}
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-card border border-border/50 rounded-sm p-12 text-center text-muted-foreground">
              Select an opportunity to review
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-sm p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-heading font-bold uppercase">{selected.title || selected.position}</h2>
                  <p className="text-sm text-muted-foreground">{selected.country} • {selected.league_level}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-sm border ${STATUS_COLORS[selected.status] || STATUS_COLORS.draft}`}>
                  {selected.status?.replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Field label="Position" value={selected.position} />
                <Field label="League Level" value={selected.league_level} />
                <Field label="Country" value={selected.country} />
                <Field label="Contract Type" value={selected.contract_type} />
                <Field label="Deadline" value={selected.deadline} />
                <Field label="Max Applicants" value={selected.max_applicants} />
                <Field label="Spots Remaining" value={selected.max_applicants ? Math.max(selected.max_applicants - (selected.applicants_count ?? 0), 0) + "/" + selected.max_applicants : "—"} />
              </div>

              <div className="bg-black/20 rounded-sm p-3 space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Admin Edit — Capacity & Status</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Max Applicants</p>
                    <input type="number" value={editMaxApplicants} onChange={e => setEditMaxApplicants(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-sm px-2 h-9 text-sm text-white outline-none focus:border-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Deadline</p>
                    <input type="date" style={{colorScheme: "dark"}} value={editDeadline} onChange={e => setEditDeadline(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-sm px-2 h-9 text-sm text-white outline-none focus:border-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Status</p>
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-sm px-2 h-9 text-sm text-white outline-none focus:border-primary cursor-pointer">
                      {["pending_review", "published", "changes_requested", "rejected", "filled", "closed"].map(s => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={handleSaveOpportunityFields}
                  className="text-xs border border-primary/30 text-primary rounded-sm px-3 py-1.5 hover:bg-primary/10 transition-colors">
                  Save Changes
                </button>
              </div>

              {selected.description && (
                <div className="bg-black/20 rounded-sm p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Description</p>
                  <p className="text-sm">{selected.description}</p>
                </div>
              )}

              {/* Credit Cost Assignment */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Opportunity Tier</p>
                <div className="grid grid-cols-2 gap-2">
                  {TIERS.map(t => (
                    <button key={t.id} onClick={() => setTier(t.id)} type="button"
                      className={`px-3 py-2 text-xs rounded-sm border transition-all text-left ${tier === t.id ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      <p className="font-bold">{t.label}</p>
                      <p className="text-[10px] mt-0.5">{t.credits} credits to apply</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Public Feedback */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Public Feedback <span className="text-muted-foreground font-normal normal-case">(visible to organization)</span></p>
                <textarea value={publicFeedback} onChange={e => setPublicFeedback(e.target.value)} rows={3}
                  placeholder="Feedback for the organization (required for rejection or changes)..."
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-sm text-white outline-none focus:border-primary resize-none" />
              </div>

              {/* Internal Notes */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Internal Notes <span className="text-muted-foreground font-normal normal-case">(admin only)</span></p>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2}
                  placeholder="Internal notes (never visible to organizations or players)..."
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-sm text-white outline-none focus:border-primary resize-none" />
                <button onClick={handleSaveNotes} className="mt-1 text-xs border border-white/10 rounded-sm px-3 py-1.5 hover:bg-white/10 transition-colors">
                  Save Notes
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                {selected.status !== "published" && (
                  <button onClick={handleApprove}
                    className="flex-1 bg-green-500 text-black font-bold rounded-sm py-2.5 text-sm hover:bg-green-400 transition-colors">
                    {`✓ Approve & Publish (${TIERS.find(t => t.id === tier)?.credits || 2} credits)`}
                  </button>
                )}
                <button onClick={handleRequestChanges}
                  className="flex-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold rounded-sm py-2.5 text-sm hover:bg-orange-500/30 transition-colors">
                  Request Changes
                </button>
                <button onClick={handleReject}
                  className="px-4 bg-red-900/30 text-red-400 border border-red-500/30 font-bold rounded-sm py-2.5 text-sm hover:bg-red-900/50 transition-colors">
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOpportunities;
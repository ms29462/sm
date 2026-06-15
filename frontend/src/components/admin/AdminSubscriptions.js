import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const PLAN_COLORS = {
  player_free: "text-gray-400 border-gray-500/30 bg-gray-500/10",
  player_premium: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  club_amateur: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  club_semi_pro: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  club_professional: "text-green-400 border-green-500/30 bg-green-500/10",
  college_plan: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  university_plan: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
  federation_plan: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  agent_plan: "text-pink-400 border-pink-500/30 bg-pink-500/10",
  specialist_plan: "text-teal-400 border-teal-500/30 bg-teal-500/10",
};

const STATUS_COLORS = {
  active: "text-green-400 bg-green-500/10 border-green-500/20",
  expired: "text-red-400 bg-red-500/10 border-red-500/20",
  cancelled: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  trial: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  none: "text-muted-foreground bg-white/5 border-white/10",
};

const ALL_PLANS = [
  { id: "player_free", name: "Player Free", role: "player" },
  { id: "player_premium", name: "Player Premium", role: "player" },
  { id: "club_amateur", name: "Amateur Club", role: "club" },
  { id: "club_semi_pro", name: "Semi-Professional Club", role: "club" },
  { id: "club_professional", name: "Professional Club", role: "club" },
  { id: "college_plan", name: "College Plan", role: "college" },
  { id: "university_plan", name: "University Plan", role: "college" },
  { id: "federation_plan", name: "Federation Plan", role: "federation" },
  { id: "agent_plan", name: "Agent Plan", role: "agent" },
  { id: "specialist_plan", name: "Specialist Plan", role: "specialist" },
];

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ user_id: "", plan_id: "", billing: "yearly" });
  const [searchEmail, setSearchEmail] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [subRes, playersRes, clubsRes] = await Promise.all([
        api.getAllSubscriptions(),
        api.getAllPlayers(),
        api.getAllClubs(),
      ]);
      setSubscriptions(subRes.data);
      setUsers([
        ...(playersRes.data || []).map(p => ({ ...p, role: "player" })),
        ...(clubsRes.data || []).map(c => ({ ...c, role: "club" })),
      ]);
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!form.user_id || !form.plan_id) { toast.error("Please select a user and plan"); return; }
    try {
      await api.assignSubscription(form);
      toast.success("Subscription assigned!");
      setShowAssign(false);
      setForm({ user_id: "", plan_id: "", billing: "yearly" });
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to assign");
    }
  };

  const handleCancel = async (userId) => {
    if (!window.confirm("Cancel this subscription?")) return;
    try {
      await api.cancelSubscription({ user_id: userId });
      toast.success("Subscription cancelled!");
      loadData();
    } catch (e) {
      toast.error("Failed to cancel");
    }
  };

  const filteredSubs = subscriptions.filter(s =>
    !searchEmail || s.user_id?.toLowerCase().includes(searchEmail.toLowerCase()) ||
    s.plan_id?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1">Subscription Management</h1>
          <p className="text-muted-foreground text-sm">Manage platform subscriptions before Stripe integration</p>
        </div>
        <button onClick={() => setShowAssign(true)}
          className="bg-primary text-black font-bold uppercase rounded-sm px-4 h-10 text-sm hover:bg-primary/90 transition-colors">
          + Assign Subscription
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: subscriptions.length, color: "text-white" },
          { label: "Active", value: subscriptions.filter(s => s.status === "active").length, color: "text-green-400" },
          { label: "Expired", value: subscriptions.filter(s => s.status === "expired").length, color: "text-red-400" },
          { label: "Cancelled", value: subscriptions.filter(s => s.status === "cancelled").length, color: "text-gray-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border/50 rounded-sm p-4 text-center">
            <p className={`text-2xl font-bold font-heading ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
        placeholder="Search by user ID or plan..."
        className="w-full bg-black/20 border border-white/10 rounded-sm px-4 h-10 text-sm text-white outline-none focus:border-primary mb-4" />

      {/* Subscriptions List */}
      <div className="space-y-2">
        {filteredSubs.length === 0 && (
          <div className="bg-card border border-border/50 rounded-sm p-8 text-center text-muted-foreground">
            No subscriptions yet. Assign plans manually until Stripe is connected.
          </div>
        )}
        {filteredSubs.map(sub => (
          <div key={sub.user_id} className="bg-card border border-border/50 rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-bold">{sub.user_id}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${PLAN_COLORS[sub.plan_id] || "text-white border-white/10"}`}>
                    {sub.plan_name || sub.plan_id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${STATUS_COLORS[sub.status] || STATUS_COLORS.none}`}>
                    {sub.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{sub.billing_cycle}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Started: {sub.started_at?.slice(0,10)}</span>
              <span>Expires: {sub.expires_at?.slice(0,10)}</span>
              {sub.status === "active" && (
                <button onClick={() => handleCancel(sub.user_id)}
                  className="text-red-400 border border-red-500/30 rounded-sm px-2 py-1 hover:bg-red-500/10 transition-colors">
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm p-6 max-w-md w-full">
            <h3 className="font-heading font-bold uppercase text-lg mb-4">Assign Subscription</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">User ID *</p>
                <input value={form.user_id} onChange={e => setForm(f => ({...f, user_id: e.target.value}))}
                  placeholder="Paste user_id here..."
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 h-10 text-sm text-white outline-none focus:border-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Plan *</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {ALL_PLANS.map(plan => (
                    <button key={plan.id} onClick={() => setForm(f => ({...f, plan_id: plan.id}))} type="button"
                      className={`w-full text-left px-3 py-2 text-sm rounded-sm border transition-all ${form.plan_id === plan.id ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({plan.role})</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Billing Cycle</p>
                <div className="flex gap-3">
                  {["monthly", "yearly"].map(b => (
                    <button key={b} onClick={() => setForm(f => ({...f, billing: b}))} type="button"
                      className={`flex-1 py-2 text-sm rounded-sm border transition-all capitalize ${form.billing === b ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground"}`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAssign(false)} className="flex-1 border border-white/10 text-muted-foreground rounded-sm py-2.5 text-sm hover:text-white transition-colors">Cancel</button>
                <button onClick={handleAssign} className="flex-1 bg-primary text-black font-bold rounded-sm py-2.5 text-sm hover:bg-primary/90 transition-colors">Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptions;
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const TRANSACTION_LABELS = {
  email_verification: "Email verification reward",
  profile_completion: "Profile completion reward",
  highlights_uploaded: "Highlights uploaded reward",
  referral_reward: "Referral reward",
  credit_purchase: "Credit pack purchase",
  application_spend: "Application",
  refund: "Refund",
  admin_adjustment: "Admin adjustment",
};

const AdminCredits = () => {
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustNote, setAdjustNote] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { loadPlayers(); }, []);

  const loadPlayers = async () => {
    try {
      const res = await api.getAllPlayers();
      setPlayers(res.data || []);
    } catch (e) {
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerCredits = async (player) => {
    setSelected(player);
    setCredits(null);
    try {
      const res = await api.getAdminPlayerCredits(player.user_id);
      setCredits(res.data);
    } catch (e) {
      toast.error("Failed to load credits");
    }
  };

  const handleAdjust = async () => {
    if (!adjustNote) { toast.error("Internal note required"); return; }
    if (adjustAmount === 0) { toast.error("Amount cannot be 0"); return; }
    try {
      await api.adminAdjustCredits({
        user_id: selected.user_id,
        amount: adjustAmount,
        note: adjustNote,
      });
      toast.success("Credits adjusted!");
      setAdjustAmount(0);
      setAdjustNote("");
      loadPlayerCredits(selected);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to adjust");
    }
  };

  const handleRefund = async (applicationId) => {
    try {
      await api.adminRefundCredits(applicationId);
      toast.success("Credits refunded!");
      loadPlayerCredits(selected);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to refund");
    }
  };

  const filtered = players.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1">Credit Management</h1>
        <p className="text-muted-foreground text-sm">View balances, adjust credits and issue refunds</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Player List */}
        <div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search players..."
            className="w-full bg-black/20 border border-white/10 rounded-sm px-3 h-10 text-sm text-white outline-none focus:border-primary mb-3" />
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filtered.map(p => (
              <div key={p.user_id} onClick={() => loadPlayerCredits(p)}
                className={`bg-card border rounded-sm p-3 cursor-pointer transition-colors ${selected?.user_id === p.user_id ? "border-primary" : "border-border/50 hover:border-white/30"}`}>
                <p className="font-bold text-sm">{p.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                  <span className="text-xs font-bold text-primary">⭐ {p.credits || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-card border border-border/50 rounded-sm p-12 text-center text-muted-foreground">
              Select a player to view credits
            </div>
          ) : (
            <div className="space-y-4">
              {/* Balance */}
              <div className="bg-card border border-border/50 rounded-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">{selected.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-heading font-bold text-primary">{credits?.balance ?? selected.credits ?? 0}</p>
                  <p className="text-xs text-muted-foreground">credits</p>
                </div>
              </div>

              {/* Manual Adjustment */}
              <div className="bg-card border border-border/50 rounded-sm p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Manual Adjustment</p>
                <div className="flex gap-3 mb-3">
                  <input type="number" value={adjustAmount} onChange={e => setAdjustAmount(Number(e.target.value))}
                    placeholder="Amount (+ or -)"
                    className="w-32 bg-black/20 border border-white/10 rounded-sm px-3 h-10 text-sm text-white outline-none focus:border-primary" />
                  <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)}
                    placeholder="Internal note (required)..."
                    className="flex-1 bg-black/20 border border-white/10 rounded-sm px-3 h-10 text-sm text-white outline-none focus:border-primary" />
                  <button onClick={handleAdjust}
                    className={`px-4 h-10 font-bold rounded-sm text-sm transition-colors ${adjustAmount > 0 ? "bg-green-500 text-black hover:bg-green-400" : "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"}`}>
                    {adjustAmount > 0 ? `+${adjustAmount}` : adjustAmount}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Use positive numbers to add credits, negative to deduct.</p>
              </div>

              {/* Transaction History */}
              <div className="bg-card border border-border/50 rounded-sm p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Transaction History</p>
                {!credits ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : credits.transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transactions</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {credits.transactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-black/20 rounded-sm">
                        <div>
                          <p className="text-sm font-medium">{TRANSACTION_LABELS[tx.type] || tx.type}</p>
                          <p className="text-xs text-muted-foreground">{tx.created_at?.slice(0,10)}</p>
                          {tx.reason && <p className="text-xs text-muted-foreground">{tx.reason}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <p className={`font-bold text-sm ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                            {tx.amount > 0 ? "+" : ""}{tx.amount} cr.
                          </p>
                          {tx.type === "highlights_uploaded" && (
                            <button onClick={() => handleAdjust_revoke(selected.user_id, -1, "Highlight video revoked by admin")}
                              className="text-xs border border-red-500/30 text-red-400 rounded-sm px-2 py-1 hover:bg-red-500/10 transition-colors">
                              Revoke
                            </button>
                          )}
                          {tx.type === "application_spend" && !tx.refunded && (
                            <button onClick={() => handleRefund(tx.reference)}
                              className="text-xs border border-primary/30 text-primary rounded-sm px-2 py-1 hover:bg-primary/10 transition-colors">
                              Refund
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCredits;
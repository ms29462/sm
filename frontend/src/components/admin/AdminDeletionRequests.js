import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Trash2, CheckCircle, XCircle } from "lucide-react";

const AdminDeletionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [log, setLog] = useState([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const res = await api.getAllDeletionRequests();
      setRequests(res.data);
    } catch (e) {
      toast.error("Failed to load deletion requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("This will permanently delete the account and all associated data. Continue?")) return;
    try {
      await api.approveDeletionRequest(id);
      toast.success("Account deleted");
      loadRequests();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to delete account");
    }
  };

  const handleDismiss = async (id) => {
    try {
      await api.dismissDeletionRequest(id);
      toast.success("Request dismissed");
      loadRequests();
    } catch (e) {
      toast.error("Failed to dismiss request");
    }
  };

  const pending = requests.filter(r => r.status === "pending");

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1 flex items-center gap-2">
          <Trash2 className="w-6 h-6 text-primary" /> Account Deletion Requests
        </h1>
        <p className="text-muted-foreground text-sm">{pending.length} pending request{pending.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('pending')}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-sm border transition-colors ${tab === 'pending' ? "bg-primary text-black border-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
          Pending ({requests.filter(r => r.status === "pending").length})
        </button>
        <button onClick={() => setTab('history')}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-sm border transition-colors ${tab === 'history' ? "bg-primary text-black border-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
          Deletion History ({log.length})
        </button>
      </div>

      {tab === 'history' && (
        <div className="space-y-2">
          {log.length === 0 && <div className="bg-card border border-border/50 rounded-sm p-8 text-center text-muted-foreground text-sm">No deleted accounts yet</div>}
          {log.map(entry => (
            <div key={entry.id} className="bg-card border border-border/50 rounded-sm p-4">
              <p className="font-bold text-sm">{entry.name || entry.email || entry.user_id}</p>
              <p className="text-xs text-muted-foreground capitalize">{entry.role} • Deleted {entry.deleted_at?.slice(0,10)}</p>
              {entry.reason && <p className="text-xs text-muted-foreground mt-1">Reason: "{entry.reason}"</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'pending' && <div className="space-y-2">
        {requests.length === 0 && (
          <div className="bg-card border border-border/50 rounded-sm p-8 text-center text-muted-foreground text-sm">
            No deletion requests
          </div>
        )}
        {requests.map(r => (
          <div key={r.id} className="bg-card border border-border/50 rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-sm">{r.name || r.email || r.user_id}</p>
              <p className="text-xs text-muted-foreground capitalize">{r.role} • {r.created_at?.slice(0,10)}</p>
              {r.reason && <p className="text-xs text-muted-foreground mt-1">"{r.reason}"</p>}
              <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-sm border ${
                r.status === "pending" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" : "text-gray-400 bg-gray-500/10 border-gray-500/20"
              }`}>
                {r.status}
              </span>
            </div>
            {r.status === "pending" && (
              <div className="flex gap-2">
                <button onClick={() => handleApprove(r.id)}
                  className="flex items-center gap-1 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-sm text-xs hover:bg-red-500/20 transition-colors">
                  <CheckCircle className="w-3.5 h-3.5" /> Approve & Delete
                </button>
                <button onClick={() => handleDismiss(r.id)}
                  className="flex items-center gap-1 px-3 py-2 bg-white/5 text-muted-foreground border border-white/10 rounded-sm text-xs hover:bg-white/10 transition-colors">
                  <XCircle className="w-3.5 h-3.5" /> Dismiss
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDeletionRequests;
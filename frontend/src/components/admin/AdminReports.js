import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Flag, AlertTriangle, Ban, ShieldOff, CheckCircle } from "lucide-react";

const CATEGORY_LABELS = {
  suspicious_behavior: "Suspicious Behavior",
  harassment: "Harassment",
  inappropriate_communication: "Inappropriate Communication",
  other: "Other",
};

const STATUS_COLORS = {
  open: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  reviewing: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  resolved: "text-green-400 bg-green-500/10 border-green-500/20",
  dismissed: "text-gray-400 bg-gray-500/10 border-gray-500/20",
};

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("open");
  const [notes, setNotes] = useState("");

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try {
      const res = await api.getAllReports();
      setReports(res.data);
    } catch (e) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const filtered = reports.filter(r => tab === "all" ? true : r.status === tab);

  const handleUpdateStatus = async (reportId, status) => {
    try {
      await api.updateReport(reportId, { status });
      toast.success("Report updated");
      loadReports();
      setSelected(prev => prev ? { ...prev, status } : null);
    } catch (e) {
      toast.error("Failed to update report");
    }
  };

  const handleSaveNotes = async () => {
    try {
      await api.updateReport(selected.id, { admin_notes: notes });
      toast.success("Notes saved");
    } catch (e) {
      toast.error("Failed to save notes");
    }
  };

  const handleAccountAction = async (userId, status) => {
    try {
      await api.updateAccountStatus(userId, { status });
      toast.success(`Account ${status}`);
    } catch (e) {
      toast.error("Failed to update account status");
    }
  };

  const tabs = [
    { id: "open", label: "Open", count: reports.filter(r => r.status === "open").length },
    { id: "reviewing", label: "Reviewing", count: reports.filter(r => r.status === "reviewing").length },
    { id: "resolved", label: "Resolved", count: reports.filter(r => r.status === "resolved").length },
    { id: "dismissed", label: "Dismissed", count: reports.filter(r => r.status === "dismissed").length },
    { id: "all", label: "All", count: reports.length },
  ];

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1 flex items-center gap-2">
          <Flag className="w-6 h-6 text-primary" /> Safety Reports
        </h1>
        <p className="text-muted-foreground text-sm">Review user reports and take action</p>
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
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="bg-card border border-border/50 rounded-sm p-8 text-center text-muted-foreground text-sm">No reports</div>
          )}
          {filtered.map(r => (
            <div key={r.id} onClick={() => { setSelected(r); setNotes(r.admin_notes || ""); }}
              className={`bg-card border rounded-sm p-4 cursor-pointer transition-colors ${selected?.id === r.id ? "border-primary" : "border-border/50 hover:border-white/30"}`}>
              <div className="flex items-start justify-between mb-2">
                <p className="font-bold text-sm flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                  {CATEGORY_LABELS[r.category] || r.category}
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${STATUS_COLORS[r.status] || STATUS_COLORS.open}`}>
                  {r.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Reported: {r.reported_name || r.reported_email || r.reported_user_id} ({r.reported_role})</p>
              <p className="text-xs text-muted-foreground">By: {r.reporter_name || r.reporter_email || r.reporter_id} ({r.reporter_role})</p>
              <p className="text-xs text-muted-foreground">{r.created_at?.slice(0,10)}</p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-card border border-border/50 rounded-sm p-12 text-center text-muted-foreground">
              Select a report to review
            </div>
          ) : (
            <div className="bg-card border border-border/50 rounded-sm p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-heading font-bold uppercase">{CATEGORY_LABELS[selected.category] || selected.category}</h2>
                  <p className="text-sm text-muted-foreground">{selected.created_at?.slice(0,10)}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-sm border ${STATUS_COLORS[selected.status] || STATUS_COLORS.open}`}>
                  {selected.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-black/20 rounded-sm p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Reported User</p>
                  <p className="text-sm font-medium">{selected.reported_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{selected.reported_email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{selected.reported_role}</p>
                </div>
                <div className="bg-black/20 rounded-sm p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Reported By</p>
                  <p className="text-sm font-medium">{selected.reporter_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{selected.reporter_email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{selected.reporter_role}</p>
                </div>
              </div>

              {selected.description && (
                <div className="bg-black/20 rounded-sm p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Description</p>
                  <p className="text-sm">{selected.description}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Report Status</p>
                <div className="flex flex-wrap gap-2">
                  {["open","reviewing","resolved","dismissed"].map(s => (
                    <button key={s} onClick={() => handleUpdateStatus(selected.id, s)}
                      className={`px-3 py-1.5 text-xs rounded-sm border transition-all capitalize ${selected.status === s ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Internal Notes</p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-sm text-white outline-none focus:border-primary resize-none" />
                <button onClick={handleSaveNotes}
                  className="mt-1 text-xs border border-white/10 rounded-sm px-3 py-1.5 hover:bg-white/10 transition-colors">
                  Save Notes
                </button>
              </div>

              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-sm">
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">Account Action — Reported User</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleAccountAction(selected.reported_user_id, "active")}
                    className="flex items-center gap-1 px-3 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-sm text-xs hover:bg-green-500/20 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Reinstate
                  </button>
                  <button onClick={() => handleAccountAction(selected.reported_user_id, "suspended")}
                    className="flex items-center gap-1 px-3 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-sm text-xs hover:bg-yellow-500/20 transition-colors">
                    <ShieldOff className="w-3.5 h-3.5" /> Suspend
                  </button>
                  <button onClick={() => handleAccountAction(selected.reported_user_id, "banned")}
                    className="flex items-center gap-1 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-sm text-xs hover:bg-red-500/20 transition-colors">
                    <Ban className="w-3.5 h-3.5" /> Ban
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
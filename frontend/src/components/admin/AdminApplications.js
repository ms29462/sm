import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const STATUS_COLORS = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  under_review: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  shortlisted: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  selected: "text-green-400 bg-green-500/10 border-green-500/20",
  not_selected: "text-red-400 bg-red-500/10 border-red-500/20",
};

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { loadApplications(); }, []);

  const loadApplications = async () => {
    try {
      const res = await api.getAdminApplications();
      setApplications(res.data || []);
    } catch (e) {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const filtered = applications.filter(app => {
    const matchSearch = !search ||
      app.player_name?.toLowerCase().includes(search.toLowerCase()) ||
      app.opportunity_title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || app.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-heading font-bold uppercase">All Applications</h2>
          <p className="text-sm text-muted-foreground">{applications.length} total applications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search player or opportunity..."
          className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none w-64" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-black/20 border border-white/10 rounded-sm h-9 px-3 text-sm text-white outline-none">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="selected">Selected</option>
          <option value="not_selected">Not Selected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase">
              <th className="text-left px-4 py-3">Player</th>
              <th className="text-left px-4 py-3">Opportunity</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Fit Score</th>
              <th className="text-left px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((app, i) => (
              <tr key={app.id || i} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium">{app.player_name || app.player_id}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{app.opportunity_title || app.opportunity_id}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${STATUS_COLORS[app.status] || "text-muted-foreground bg-white/5 border-white/10"}`}>
                    {app.status?.replace(/_/g, " ").toUpperCase() || "PENDING"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{app.fit_score ? `${app.fit_score}/100` : "—"}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{app.created_at ? new Date(app.created_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No applications found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminApplications;

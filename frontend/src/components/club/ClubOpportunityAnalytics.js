import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Eye, FileText, TrendingUp } from "lucide-react";

const STATUS_LABELS = {
  pending_review: "Under Review",
  published: "Published",
  changes_requested: "Changes Requested",
  rejected: "Rejected",
};

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-card border border-border/50 rounded-sm p-5">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <Icon className={`w-4 h-4 ${accent || "text-primary"}`} />
    </div>
    <p className="text-3xl font-heading font-bold">{value}</p>
  </div>
);

const ClubOpportunityAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOrgOpportunityAnalytics()
      .then(res => setData(res.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" /> Opportunity Analytics
        </h1>
        <p className="text-muted-foreground text-sm">Performance of your posted opportunities</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard icon={Eye} label="Total Views" value={data?.total_views ?? 0} />
        <StatCard icon={FileText} label="Total Applications" value={data?.total_applications ?? 0} accent="text-green-400" />
        <StatCard icon={TrendingUp} label="Conversion Rate" value={`${data?.overall_conversion_rate ?? 0}%`} accent="text-blue-400" />
      </div>

      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-border/50 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span className="col-span-2">Opportunity</span>
          <span className="text-right">Views</span>
          <span className="text-right">Applications</span>
          <span className="text-right">Conversion</span>
        </div>
        {(!data?.opportunities || data.opportunities.length === 0) ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No opportunities posted yet</div>
        ) : (
          data.opportunities.map(opp => (
            <div key={opp.opportunity_id} className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-border/30 text-sm items-center">
              <div className="col-span-2">
                <p className="font-medium">{opp.position} — {opp.league_level}</p>
                <span className="text-xs text-muted-foreground">{STATUS_LABELS[opp.status] || opp.status}</span>
              </div>
              <span className="text-right">{opp.views}</span>
              <span className="text-right">{opp.applications}</span>
              <span className="text-right text-primary font-bold">{opp.conversion_rate}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClubOpportunityAnalytics;
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import PremiumUpgrade from "@/components/player/PremiumUpgrade";
import { Eye, Heart, Target, TrendingUp } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-card border border-border/50 rounded-sm p-5">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <Icon className={`w-4 h-4 ${accent || "text-primary"}`} />
    </div>
    <p className="text-3xl font-heading font-bold">{value}</p>
  </div>
);

const PlayerAnalytics = () => {
  const [isPremium, setIsPremium] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyPermissions()
      .then(res => setIsPremium(res.data.status === "premium"))
      .catch(() => setIsPremium(false));
  }, []);

  useEffect(() => {
    if (isPremium) {
      api.getPlayerAnalytics()
        .then(res => setData(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (isPremium === false) {
      setLoading(false);
    }
  }, [isPremium]);

  if (isPremium === null || loading) {
    return <div className="p-8 text-primary font-heading">LOADING...</div>;
  }

  if (!isPremium) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
        <PremiumUpgrade />
      </div>
    );
  }

  const maxDayViews = data?.views_by_day ? Math.max(...Object.values(data.views_by_day), 1) : 1;
  const sortedDays = data?.views_by_day ? Object.entries(data.views_by_day).sort((a, b) => a[0].localeCompare(b[0])) : [];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" /> Profile Analytics
        </h1>
        <p className="text-muted-foreground text-sm">See how organizations are engaging with your profile</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Eye} label="Total Profile Views" value={data?.total_views ?? 0} />
        <StatCard icon={Eye} label="Views (Last 30 Days)" value={data?.views_last_30_days ?? 0} accent="text-blue-400" />
        <StatCard icon={Heart} label="Favorited By Orgs" value={data?.favorites_count ?? 0} accent="text-red-400" />
        <StatCard icon={Target} label="Matching Opportunities" value={data?.matching_opportunities ?? 0} accent="text-green-400" />
      </div>

      <div className="bg-card border border-border/50 rounded-sm p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Views — Last 30 Days</p>
        {sortedDays.length === 0 ? (
          <p className="text-sm text-muted-foreground">No views recorded yet in this period.</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {sortedDays.map(([day, count]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full bg-primary/30 hover:bg-primary/50 rounded-sm transition-colors"
                  style={{ height: `${Math.max((count / maxDayViews) * 100, 4)}%` }}
                  title={`${day}: ${count} view${count !== 1 ? "s" : ""}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 bg-card border border-border/50 rounded-sm p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Profile Completion</p>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${data?.profile_completion ?? 0}%` }} />
        </div>
        <p className="text-sm text-muted-foreground mt-2">{data?.profile_completion ?? 0}% complete</p>
      </div>
    </div>
  );
};

export default PlayerAnalytics;
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Check } from "lucide-react";

const FEATURES = [
  "Player Search & Profiles",
  "Direct Messaging",
  "Opportunity Publishing",
  "Recruitment Pipeline",
  "Watchlists & Favorites",
  "Scouting Tools",
  "Verified Agent Badge",
];

const AgentSubscribe = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => { loadStatus(); }, []);

  const loadStatus = async () => {
    try {
      const res = await api.getAgentSubscriptionStatus();
      setStatus(res.data);
    } catch (e) {
      toast.error("Failed to load subscription status");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setCheckingOut(true);
    try {
      const res = await api.createAgentCheckout();
      window.location.href = res.data.checkout_url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to start checkout");
      setCheckingOut(false);
    }
  };

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  if (status?.sub_status !== "approved_awaiting_payment" && status?.sub_status !== "active" && status?.sub_status !== "past_due" && status?.sub_status !== "cancelled" && status?.sub_status !== "expired") {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-heading font-bold uppercase mb-3">Application Under Review</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Your agent profile is currently in our review process. Once approved, you'll be able to activate your subscription here.
        </p>
      </div>
    );
  }

  if (status?.sub_status === "active") {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-4">
          <Check className="w-7 h-7 text-green-400" />
        </div>
        <h1 className="text-2xl font-heading font-bold uppercase mb-2">Subscription Active</h1>
        <p className="text-sm text-muted-foreground">You have full access to Soccer Match recruitment tools.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="bg-card border border-border/50 rounded-sm p-6 md:p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-heading font-bold uppercase mb-2">Agent Plan</h1>
        <div className="mb-6">
          <span className="text-4xl font-bold text-primary">$299</span>
          <span className="text-sm text-muted-foreground">/year</span>
        </div>
        <ul className="space-y-2 mb-6 text-left">
          {FEATURES.map(f => (
            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
        <button onClick={handleSubscribe} disabled={checkingOut}
          className="w-full bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
          {checkingOut ? "Loading..." : "Activate Subscription"}
        </button>
      </div>
    </div>
  );
};

export default AgentSubscribe;
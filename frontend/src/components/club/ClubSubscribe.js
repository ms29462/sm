import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Check, Star } from "lucide-react";

const PLANS = [
  {
    id: "club_amateur",
    name: "Amateur Club",
    price: "$299",
    period: "/year",
  },
  {
    id: "club_semi_pro",
    name: "Semi-Professional Club",
    price: "$699",
    period: "/year",
  },
  {
    id: "club_professional",
    name: "Professional Club",
    price: "$1,499",
    period: "/year",
  },
];

const FEATURES = [
  "Player Search & Profiles",
  "Unlimited Opportunity Publishing",
  "Applications Management",
  "Direct Messaging",
  "Recruitment Pipeline",
  "Scouting Tools & Reports",
  "Watchlists & Favorites",
];

const ClubSubscribe = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(null);

  useEffect(() => { loadStatus(); }, []);

  const loadStatus = async () => {
    try {
      const res = await api.getClubSubscriptionStatus();
      setStatus(res.data);
    } catch (e) {
      toast.error("Failed to load subscription status");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    setCheckingOut(planId);
    try {
      const res = await api.createClubCheckout(planId);
      window.location.href = res.data.checkout_url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to start checkout");
      setCheckingOut(null);
    }
  };

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  if (status?.sub_status !== "approved_awaiting_payment" && status?.sub_status !== "active" && status?.sub_status !== "past_due" && status?.sub_status !== "cancelled" && status?.sub_status !== "expired") {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-heading font-bold uppercase mb-3">Application Under Review</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Your club is currently in our review process. Once approved, you'll be able to select a subscription plan here.
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
        <p className="text-sm text-muted-foreground">Your club has full access to Soccer Match recruitment tools.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">Choose Your Plan</h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Your club has been approved! Complete your annual subscription to activate full access to Soccer Match.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {PLANS.map(plan => {
          const recommended = status?.recommended_plan === plan.id;
          return (
            <div key={plan.id} className={`bg-card border rounded-sm p-6 relative flex flex-col ${recommended ? "border-primary" : "border-border/50"}`}>
              {recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 bg-primary text-black rounded-sm uppercase tracking-wide">
                  Recommended
                </span>
              )}
              <h3 className="font-heading font-bold text-lg uppercase mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleSubscribe(plan.id)} disabled={checkingOut === plan.id}
                className={`w-full font-bold rounded-sm py-3 text-sm transition-colors disabled:opacity-50 ${recommended ? "bg-primary text-black hover:bg-primary/90" : "border border-white/20 text-white hover:bg-white/5"}`}>
                {checkingOut === plan.id ? "Loading..." : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClubSubscribe;
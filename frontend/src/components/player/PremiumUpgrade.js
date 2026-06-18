import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Star, Check, Zap } from "lucide-react";

const PREMIUM_FEATURES = [
  { icon: "💬", label: "Unlimited Messaging", desc: "Reply and initiate conversations without limits" },
  { icon: "🎓", label: "College Fit Assessment", desc: "Access detailed college matching and compatibility scores" },
  { icon: "⭐", label: "Premium Badge", desc: "Stand out with a Premium Player badge on your profile" },
  { icon: "📊", label: "Advanced Analytics", desc: "Profile views, opportunity matches, and performance insights" },
  { icon: "🚀", label: "Featured Visibility", desc: "Boost your visibility in player search results" },
  { icon: "🎯", label: "20 Credits Included", desc: "20 application credits included every year" },
];

const PremiumUpgrade = ({ onClose, compact = false }) => {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await api.createPremiumCheckout();
      window.location.href = res.data.checkout_url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to start checkout");
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm">
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <p className="text-sm font-bold text-primary">Premium Feature</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">This feature requires Player Premium.</p>
        <button onClick={handleUpgrade} disabled={loading}
          className="w-full bg-primary text-black font-bold rounded-sm py-2 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
          {loading ? "Loading..." : "Upgrade to Premium"}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border/50 rounded-sm p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star className="w-7 h-7 text-primary fill-primary" />
          </div>
          <h2 className="text-2xl font-heading font-bold uppercase mb-1">Player Premium</h2>
          <p className="text-sm text-muted-foreground">Unlock your full recruiting potential</p>
          <div className="mt-3">
            
            <span className="text-4xl font-heading font-bold text-primary">$49.99</span>
            <span className="text-sm text-muted-foreground">/year</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {PREMIUM_FEATURES.map(f => (
            <div key={f.label} className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{f.icon}</span>
              <div>
                <p className="text-sm font-bold">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleUpgrade} disabled={loading}
          className="w-full bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 mb-3">
          {loading ? "Loading..." : "Upgrade to Player Premium"}
        </button>
        {onClose && (
          <button onClick={onClose} className="w-full text-muted-foreground text-sm hover:text-white transition-colors">
            Maybe later
          </button>
        )}
      </div>
    </div>
  );
};

export default PremiumUpgrade;
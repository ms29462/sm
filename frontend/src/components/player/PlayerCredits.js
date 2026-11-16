import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Star, Check, Clock, ShoppingCart, History } from "lucide-react";
import PremiumUpgrade from "@/components/player/PremiumUpgrade";
import { useTranslation } from 'react-i18next';

const PACKS = [
  { id: "starter", credits: 10, price: "$4.99", color: "border-blue-500/30 bg-blue-500/5" },
  { id: "standard", credits: 25, price: "$9.99", color: "border-primary/30 bg-primary/5", popular: true },
  { id: "pro", credits: 75, price: "$24.99", color: "border-purple-500/30 bg-purple-500/5" },
  { id: "elite", credits: 200, price: "$59.99", color: "border-orange-500/30 bg-orange-500/5" },
];

const PlayerCredits = () => {
  const { t } = useTranslation();

  const REWARDS = [
    { type: "email_verification", label: t('credits.reward_email_label'), credits: 1, description: t('credits.reward_email_desc') },
    { type: "profile_completion", label: t('credits.reward_profile_label'), credits: 1, description: t('credits.reward_profile_desc'), auto: true },
    { type: "highlights_uploaded", label: t('credits.reward_highlights_label'), credits: 1, description: t('credits.reward_highlights_desc'), auto: true },
  ];

  const TRANSACTION_LABELS = {
    email_verification: t('credits.tx_email_verification'),
    profile_completion: t('credits.tx_profile_completion'),
    highlights_uploaded: t('credits.tx_highlights_uploaded'),
    referral_reward: t('credits.tx_referral_reward'),
    credit_purchase: t('credits.tx_credit_purchase'),
    application_spend: t('credits.tx_application_spend'),
    refund: t('credits.tx_refund'),
    admin_adjustment: t('credits.tx_admin_adjustment'),
  };

  const PACK_NAMES = {
    starter: t('credits.pack_starter'),
    standard: t('credits.pack_standard'),
    pro: t('credits.pack_pro'),
    elite: t('credits.pack_elite'),
  };

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [showPremium, setShowPremium] = useState(false);
  const [claiming, setClaiming] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadCredits();
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam) setTab(tabParam);
    if (params.get("success") === "true") {
      toast.success("Payment successful! Credits added to your account.");
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("cancelled") === "true") {
      toast.info("Payment cancelled.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const loadCredits = async () => {
    try {
      const res = await api.getMyCredits();
      setBalance(res.data.balance || 0);
      setTransactions(res.data.transactions || []);
      const types = res.data.transactions.map(t => t.type);
      setClaimedRewards(types);
    } catch (e) {
      toast.error("Failed to load credits");
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerification = async () => {
    try {
      await api.sendVerificationEmail();
      toast.success("Verification email sent! Check your inbox.");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to send email");
    }
  };

  const handleClaimReward = async (rewardType) => {
    setClaiming(rewardType);
    try {
      const res = await api.claimReward(rewardType);
      toast.success(`+${res.data.amount} credits earned!`);
      loadCredits();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Already claimed");
    }
    setClaiming(null);
  };

  const handleBuyPack = async (packId) => {
    try {
      const res = await api.createCheckout(packId);
      window.location.href = res.data.checkout_url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to start checkout");
    }
  };

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  return (
    <div className="p-4 md:p-6">
      {/* Balance Header */}
      <div className="bg-card border border-border/50 rounded-sm p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('credits.credit_balance')}</p>
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-primary fill-primary" />
            <p className="text-4xl font-heading font-bold text-primary">{balance}</p>
            <p className="text-sm text-muted-foreground">{t('opportunities.credits')}</p>
          </div>
        </div>
        <button onClick={() => setTab("buy")}
          className="flex items-center gap-2 bg-primary text-black font-bold rounded-sm px-4 py-2.5 text-sm hover:bg-primary/90 transition-colors">
          <ShoppingCart className="w-4 h-4" /> {t('credits.buy')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { id: "overview", label: t('credits.tab_overview') },
          { id: "earn", label: t('credits.tab_earn') },
          { id: "buy", label: t('credits.tab_buy') },
          { id: "history", label: t('credits.tab_history') },
        ].map(tab_ => (
          <button key={tab_.id} onClick={() => setTab(tab_.id)}
            className={`px-3 py-2 text-xs font-bold uppercase rounded-sm border transition-colors ${tab === tab_.id ? "bg-primary text-black border-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
            {tab_.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-card border border-border/50 rounded-sm p-4 text-center">
              <p className="text-2xl font-heading font-bold text-primary">{balance}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('credits.available_credits')}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-sm p-4 text-center">
              <p className="text-2xl font-heading font-bold text-green-400">
                +{transactions.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t('credits.total_earned')}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-sm p-4 text-center">
              <p className="text-2xl font-heading font-bold text-red-400">
                {transactions.filter(t => t.amount < 0).reduce((a, t) => a + t.amount, 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t('credits.total_spent')}</p>
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-sm p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">{t('credits.how_work_title')}</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>{t('credits.how_work_1')}</p>
              <p>{t('credits.how_work_2')}</p>
              <p>{t('credits.how_work_3')}</p>
              <p>{t('credits.how_work_4')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Premium Banner */}
      {tab === "overview" && !isPremium && (
        <div className="bg-primary/5 border border-primary/20 rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <p className="font-bold text-primary flex items-center gap-2"><Star className="w-4 h-4 fill-primary" /> {t('credits.player_premium')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('credits.premium_desc')}</p>
          </div>
          <button onClick={() => setShowPremium(true)}
            className="flex-shrink-0 bg-primary text-black font-bold rounded-sm px-4 py-2 text-sm hover:bg-primary/90 transition-colors">
            {t('credits.upgrade_btn')}
          </button>
        </div>
      )}

      {/* Earn Free Credits */}
      {tab === "earn" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground mb-4">{t('credits.earn_intro')}</p>
          {REWARDS.map(reward => {
            const claimed = claimedRewards.includes(reward.type);
            return (
              <div key={reward.type} className={`bg-card border rounded-sm p-4 flex items-center justify-between gap-4 ${claimed ? "border-green-500/20" : "border-border/50"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${claimed ? "bg-green-500/10 border border-green-500/20" : "bg-primary/10 border border-primary/20"}`}>
                    {claimed ? <Check className="w-5 h-5 text-green-400" /> : <Star className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{reward.label}</p>
                    <p className="text-xs text-muted-foreground">{reward.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary">+{reward.credits} cr.</span>
                  {claimed ? (
                    <span className="text-xs text-green-400 font-bold">{t('credits.claimed')}</span>
                  ) : (
                    reward.type === "email_verification" ? (
                      <button onClick={handleSendVerification}
                        className="px-3 py-1.5 bg-blue-500 text-white font-bold rounded-sm text-xs hover:bg-blue-400 transition-colors">
                        {t('credits.resend_email')}
                      </button>
                    ) : (
                      <button onClick={() => handleClaimReward(reward.type)} disabled={claiming === reward.type}
                        className="px-3 py-1.5 bg-primary text-black font-bold rounded-sm text-xs hover:bg-primary/90 transition-colors disabled:opacity-50">
                        {claiming === reward.type ? "..." : t('credits.claim')}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
              </div>
      )}

      {/* Buy Credits */}
      {tab === "buy" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground mb-4">{t('credits.buy_intro')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PACKS.map(pack => (
              <div key={pack.id} className={`border rounded-sm p-5 relative ${pack.color}`}>
                {pack.popular && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 bg-primary text-black rounded-sm">{t('credits.popular')}</span>
                )}
                <p className="font-heading font-bold text-lg uppercase mb-1">{PACK_NAMES[pack.id]}</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  <p className="text-3xl font-bold text-primary">{pack.credits}</p>
                  <p className="text-sm text-muted-foreground">{t('opportunities.credits')}</p>
                </div>
                <p className="text-xl font-bold mb-4">{pack.price}</p>
                <button onClick={() => handleBuyPack(pack.id)}
                  className="w-full bg-primary text-black font-bold rounded-sm py-2.5 text-sm hover:bg-primary/90 transition-colors">
                  {t('credits.buy_now')}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">{t('credits.stripe_note')}</p>
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-2">
          {transactions.length === 0 && (
            <div className="bg-card border border-border/50 rounded-sm p-8 text-center text-muted-foreground text-sm">
              {t('credits.no_transactions')}
            </div>
          )}
          {transactions.map(tx => (
            <div key={tx.id} className="bg-card border border-border/50 rounded-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${tx.amount > 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  {tx.amount > 0 ? <span className="text-green-400 text-xs font-bold">+</span> : <span className="text-red-400 text-xs font-bold">-</span>}
                </div>
                <div>
                  <p className="text-sm font-medium">{TRANSACTION_LABELS[tx.type] || tx.type}</p>
                  <p className="text-xs text-muted-foreground">{tx.created_at?.slice(0,10)}</p>
                </div>
              </div>
              <p className={`font-bold text-sm ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                {tx.amount > 0 ? "+" : ""}{tx.amount} cr.
              </p>
            </div>
          ))}
        </div>
      )}
      {showPremium && <PremiumUpgrade onClose={() => setShowPremium(false)} />}
    </div>
  );
};

export default PlayerCredits;
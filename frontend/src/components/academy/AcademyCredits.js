import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Star, ShoppingCart } from "lucide-react";

const PACKS = [
  { id: "starter", nameKey: "pack_starter", credits: 10, price: "$4.99", color: "border-blue-500/30 bg-blue-500/5" },
  { id: "standard", nameKey: "pack_standard", credits: 25, price: "$9.99", color: "border-primary/30 bg-primary/5", popular: true },
  { id: "pro", nameKey: "pack_pro", credits: 75, price: "$24.99", color: "border-purple-500/30 bg-purple-500/5" },
  { id: "elite", nameKey: "pack_elite", credits: 200, price: "$59.99", color: "border-orange-500/30 bg-orange-500/5" },
];

const TRANSACTION_KEYS = {
  credit_purchase: "tx_credit_purchase",
  application_spend: "tx_application_spend",
  refund: "tx_refund",
  admin_adjustment: "tx_admin_adjustment",
};

const AcademyCredits = () => {
  const { t } = useTranslation();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    loadCredits();
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam) setTab(tabParam);
    if (params.get("success") === "true") {
      toast.success(t('academy_credits.payment_success'));
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("cancelled") === "true") {
      toast.info(t('academy_credits.payment_cancelled'));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const loadCredits = async () => {
    try {
      const res = await api.getAcademyCredits();
      setBalance(res.data.balance || 0);
      setTransactions(res.data.transactions || []);
    } catch {
      toast.error(t('academy_credits.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPack = async (packId) => {
    try {
      const res = await api.createAcademyCheckout(packId);
      window.location.href = res.data.checkout_url;
    } catch (e) {
      toast.error(e.response?.data?.detail || t('academy_credits.checkout_error'));
    }
  };

  if (loading) return <div className="p-8 text-primary font-heading">{t('academy_credits.loading')}</div>;

  const PACK_NAMES = {
    starter: "Starter Pack",
    standard: "Standard Pack",
    pro: "Pro Pack",
    elite: "Elite Pack",
  };

  return (
    <div className="p-4 md:p-6">
      {/* Balance Header */}
      <div className="bg-card border border-border/50 rounded-sm p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('academy_credits.credit_balance')}</p>
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-primary fill-primary" />
            <p className="text-4xl font-heading font-bold text-primary">{balance}</p>
            <p className="text-sm text-muted-foreground">{t('academy_credits.credits')}</p>
          </div>
        </div>
        <button onClick={() => setTab("buy")}
          className="flex items-center gap-2 bg-primary text-black font-bold rounded-sm px-4 py-2.5 text-sm hover:bg-primary/90 transition-colors">
          <ShoppingCart className="w-4 h-4" /> {t('academy_credits.buy_credits')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { id: "overview", labelKey: "tab_overview" },
          { id: "buy", labelKey: "tab_buy" },
          { id: "history", labelKey: "tab_history" },
        ].map(tabItem => (
          <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
            className={`px-3 py-2 text-xs font-bold uppercase rounded-sm border transition-colors ${tab === tabItem.id ? "bg-primary text-black border-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
            {t(`academy_credits.${tabItem.labelKey}`)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-card border border-border/50 rounded-sm p-4 text-center">
              <p className="text-2xl font-heading font-bold text-primary">{balance}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('academy_credits.available_credits')}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-sm p-4 text-center">
              <p className="text-2xl font-heading font-bold text-green-400">
                +{transactions.filter(tx => tx.amount > 0).reduce((a, tx) => a + tx.amount, 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t('academy_credits.total_purchased')}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-sm p-4 text-center">
              <p className="text-2xl font-heading font-bold text-red-400">
                {transactions.filter(tx => tx.amount < 0).reduce((a, tx) => a + tx.amount, 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t('academy_credits.total_spent')}</p>
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-sm p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">{t('academy_credits.how_credits_title')}</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>{t('academy_credits.how_credits_1')}</p>
              <p>{t('academy_credits.how_credits_2')}</p>
              <p>{t('academy_credits.how_credits_3')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Buy Credits */}
      {tab === "buy" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground mb-4">{t('academy_credits.buy_intro')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PACKS.map(pack => (
              <div key={pack.id} className={`border rounded-sm p-5 relative ${pack.color}`}>
                {pack.popular && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 bg-primary text-black rounded-sm">{t('academy_credits.popular')}</span>
                )}
                <p className="font-heading font-bold text-lg uppercase mb-1">{PACK_NAMES[pack.id]}</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  <p className="text-3xl font-bold text-primary">{pack.credits}</p>
                  <p className="text-sm text-muted-foreground">{t('academy_credits.credits')}</p>
                </div>
                <p className="text-xl font-bold mb-4">{pack.price}</p>
                <button onClick={() => handleBuyPack(pack.id)}
                  className="w-full bg-primary text-black font-bold rounded-sm py-2.5 text-sm hover:bg-primary/90 transition-colors">
                  {t('academy_credits.buy_now')}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">{t('academy_credits.stripe_note')}</p>
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-2">
          {transactions.length === 0 && (
            <div className="bg-card border border-border/50 rounded-sm p-8 text-center text-muted-foreground text-sm">
              {t('academy_credits.no_transactions')}
            </div>
          )}
          {transactions.map(tx => (
            <div key={tx.id} className="bg-card border border-border/50 rounded-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${tx.amount > 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  {tx.amount > 0
                    ? <span className="text-green-400 text-xs font-bold">+</span>
                    : <span className="text-red-400 text-xs font-bold">-</span>}
                </div>
                <div>
                  <p className="text-sm font-medium">{TRANSACTION_KEYS[tx.type] ? t(`academy_credits.${TRANSACTION_KEYS[tx.type]}`) : tx.type}</p>
                  {tx.reason && <p className="text-xs text-muted-foreground">{tx.reason}</p>}
                  <p className="text-xs text-muted-foreground">{tx.created_at?.slice(0, 10)}</p>
                </div>
              </div>
              <p className={`font-bold text-sm ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                {tx.amount > 0 ? "+" : ""}{tx.amount} cr.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcademyCredits;

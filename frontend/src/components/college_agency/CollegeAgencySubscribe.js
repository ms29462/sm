import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Check, Clock, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const CollegeAgencySubscribe = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStatus(); }, []);

  const loadStatus = async () => {
    try {
      const res = await api.getCollegeAgencySubscriptionStatus();
      setStatus(res.data);
    } catch {
      toast.error("Failed to load subscription status");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-primary font-heading">{t("college_agency_subscribe.loading")}</div>;

  const sub = status?.sub_status;

  if (!sub || sub === "pending_review") {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-7 h-7 text-yellow-400" />
        </div>
        <h1 className="text-2xl font-heading font-bold uppercase mb-3">{t("college_agency_subscribe.under_review_title")}</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {t("college_agency_subscribe.under_review_body")}
        </p>
      </div>
    );
  }

  if (sub === "active") {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-4">
          <Check className="w-7 h-7 text-green-400" />
        </div>
        <h1 className="text-2xl font-heading font-bold uppercase mb-2">{t("college_agency_subscribe.active_title")}</h1>
        <p className="text-sm text-muted-foreground">{t("college_agency_subscribe.active_body")}</p>
      </div>
    );
  }

  if (sub === "cancelled" || sub === "expired") {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-2xl font-heading font-bold uppercase mb-2">
          {sub === "cancelled" ? t("college_agency_subscribe.cancelled_title") : t("college_agency_subscribe.expired_title")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          {t("college_agency_subscribe.inactive_body")}
        </p>
        <a href="mailto:contact@soccermatch.ca"
          className="inline-block bg-primary text-black font-bold rounded-sm px-6 py-2.5 text-sm hover:bg-primary/90 transition-colors">
          {t("college_agency_subscribe.contact_support")}
        </a>
      </div>
    );
  }

  // approved_awaiting_payment
  return (
    <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mb-4">
        <Check className="w-7 h-7 text-primary" />
      </div>
      <h1 className="text-2xl font-heading font-bold uppercase mb-3">{t("college_agency_subscribe.approved_title")}</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {t("college_agency_subscribe.approved_body")}
      </p>
      <a href="mailto:contact@soccermatch.ca"
        className="inline-block bg-primary text-black font-bold rounded-sm px-6 py-2.5 text-sm hover:bg-primary/90 transition-colors">
        {t("college_agency_subscribe.contact_activate")}
      </a>
    </div>
  );
};

export default CollegeAgencySubscribe;

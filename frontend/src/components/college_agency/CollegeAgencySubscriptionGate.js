import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CollegeAgencySubscriptionGate = ({ children }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getCollegeAgencySubscriptionStatus()
      .then(res => setStatus(res.data))
      .catch(() => setStatus({ has_access: false }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-primary font-heading">{t("college_agency_sub_gate.loading")}</div>;

  if (!status?.is_approved) {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-heading font-bold uppercase mb-3">{t("college_agency_approval_gate.pending_title")}</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {t("college_agency_approval_gate.pending_body")}
        </p>
      </div>
    );
  }

  if (!status?.has_access) {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-heading font-bold uppercase mb-3">{t("college_agency_sub_gate.sub_required_title")}</h1>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {t("college_agency_sub_gate.sub_required_body")}
        </p>
        <button onClick={() => navigate("/college-agency/subscribe")}
          className="bg-primary text-black font-bold rounded-sm px-6 py-3 text-sm hover:bg-primary/90 transition-colors">
          {t("college_agency_sub_gate.view_sub_btn")}
        </button>
      </div>
    );
  }

  return children;
};

export default CollegeAgencySubscriptionGate;

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useTranslation } from "react-i18next";

const CollegeAgencyApprovalGate = ({ children }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCollegeAgencySubscriptionStatus()
      .then(res => setStatus(res.data))
      .catch(() => setStatus({ is_approved: false }))
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

  return children;
};

export default CollegeAgencyApprovalGate;

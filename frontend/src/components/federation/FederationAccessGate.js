import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useTranslation } from 'react-i18next';

const FederationAccessGate = ({ children }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    api.getFederationAccessStatus()
      .then(res => setStatus(res.data))
      .catch((err) => {
        // If 404 - no federation doc found, still show access pending
        // If 403 - not a federation role, let parent handle
        // Default to no access on any error
        setStatus({ has_access: false, error: err?.response?.status });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-primary font-heading">{t('federation_access_gate.loading')}</div>;

  if (!status?.has_access) {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-heading font-bold uppercase mb-3">{t('federation_access_gate.access_pending_title')}</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          {t('federation_access_gate.access_pending_desc')}
        </p>
        <p className="text-xs text-muted-foreground mt-4">
          {t('federation_access_gate.questions')} <a href="mailto:contact@soccermatch.ca" className="text-primary">contact@soccermatch.ca</a>
        </p>
      </div>
    );
  }

  return children;
};

export default FederationAccessGate;
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { useTranslation } from 'react-i18next';

const API = process.env.REACT_APP_API_URL || "https://sm-production-c5c8.up.railway.app";

const VerifyEmail = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    fetch(`${API}/api/verify-email/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.message === "Email verified successfully!") setStatus("success");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <img src="/logo.png" alt="Soccer Match" className="h-10 w-auto mb-10" />
      <div className="max-w-md w-full bg-card border border-border/50 rounded-sm p-8 text-center">
        {status === "loading" && (
          <p className="text-muted-foreground">{t('verify.verifying')}</p>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-heading font-bold uppercase mb-3">{t('verify.success_title')}</h1>
            <p className="text-sm text-muted-foreground mb-2">{t('verify.success_body')}</p>
            <p className="text-sm text-primary font-bold mb-5">{t('verify.success_credit')}</p>
            <Link to="/player/credits" className="inline-block bg-primary text-black font-bold rounded-sm px-6 py-3 text-sm hover:bg-primary/90 transition-colors">
              {t('verify.view_credits')}
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-heading font-bold uppercase mb-3">{t('verify.error_title')}</h1>
            <p className="text-sm text-muted-foreground mb-5">{t('verify.error_body')}</p>
            <Link to="/player/dashboard" className="inline-block bg-primary text-black font-bold rounded-sm px-6 py-3 text-sm hover:bg-primary/90 transition-colors">
              {t('verify.go_dashboard')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
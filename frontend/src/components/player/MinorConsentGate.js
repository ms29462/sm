import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const MinorConsentGate = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMinorStatus()
      .then(res => setStatus(res.data))
      .catch(() => setStatus({ has_access: true }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  if (status && !status.has_access) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <img src="/logo.png" alt="Soccer Match" className="h-10 w-auto mb-8" />
        <div className="max-w-md bg-card border border-border/50 rounded-sm p-8">
          <h1 className="text-2xl font-heading font-bold uppercase mb-3">Parental Consent Pending</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Since you are under 18, a parent or legal guardian must complete and sign our consent form
            before you can access your Soccer Match account.
          </p>
          <a href="/parental_consent_form.pdf" target="_blank" rel="noopener noreferrer"
            className="inline-block bg-primary text-black font-bold rounded-sm px-6 py-3 text-sm hover:bg-primary/90 transition-colors mb-4">
            Download Consent Form
          </a>
          <p className="text-xs text-muted-foreground mb-6">
            Please have a parent or legal guardian complete, sign, and email the form to{" "}
            <a href="mailto:contact@soccermatch.ca" className="text-primary">contact@soccermatch.ca</a>.
            Your account will be activated once the form is received and reviewed.
          </p>
          <button onClick={() => { logout(); navigate("/login"); }}
            className="text-xs text-muted-foreground hover:text-white underline transition-colors">
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default MinorConsentGate;
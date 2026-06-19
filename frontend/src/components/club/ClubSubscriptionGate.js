import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const ClubSubscriptionGate = ({ children }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getClubSubscriptionStatus()
      .then(res => setStatus(res.data))
      .catch(() => setStatus({ has_access: false }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  if (!status?.has_access) {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-heading font-bold uppercase mb-3">Subscription Required</h1>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Your club has been approved. Please complete your subscription to activate your account.
        </p>
        <button onClick={() => navigate("/club/subscribe")}
          className="bg-primary text-black font-bold rounded-sm px-6 py-3 text-sm hover:bg-primary/90 transition-colors">
          Activate Subscription
        </button>
      </div>
    );
  }

  return children;
};

export default ClubSubscriptionGate;
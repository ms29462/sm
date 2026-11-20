import { useState, useEffect } from "react";
import { api } from "@/lib/api";

const ClubApprovalGate = ({ children }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getClubSubscriptionStatus()
      .then(res => setStatus(res.data))
      .catch(() => setStatus({ is_approved: false }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  if (!status?.is_approved) {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-heading font-bold uppercase mb-3">Pending Admin Approval</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Your club is currently under review. Once approved by our team, you will be able to publish opportunities, manage applications, and chat with players.
        </p>
      </div>
    );
  }

  return children;
};

export default ClubApprovalGate;

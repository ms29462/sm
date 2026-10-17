import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Check, Clock, XCircle } from "lucide-react";

const CollegeAgencySubscribe = () => {
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

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  const sub = status?.sub_status;

  if (!sub || sub === "pending_review") {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-7 h-7 text-yellow-400" />
        </div>
        <h1 className="text-2xl font-heading font-bold uppercase mb-3">Application Under Review</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Your agency is currently in our review process. Once approved, you'll be able to activate your subscription here.
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
        <h1 className="text-2xl font-heading font-bold uppercase mb-2">Subscription Active</h1>
        <p className="text-sm text-muted-foreground">Your agency has full access to Soccer Match recruitment tools.</p>
      </div>
    );
  }

  if (sub === "cancelled" || sub === "expired") {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-2xl font-heading font-bold uppercase mb-2">Subscription {sub === "cancelled" ? "Cancelled" : "Expired"}</h1>
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          Your agency's access has been suspended. Please contact us to reactivate.
        </p>
        <a href="mailto:contact@soccermatch.ca"
          className="inline-block bg-primary text-black font-bold rounded-sm px-6 py-2.5 text-sm hover:bg-primary/90 transition-colors">
          Contact Support
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
      <h1 className="text-2xl font-heading font-bold uppercase mb-3">Agency Approved</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Your agency application has been approved. To activate full access, please contact us to complete your subscription.
      </p>
      <a href="mailto:contact@soccermatch.ca"
        className="inline-block bg-primary text-black font-bold rounded-sm px-6 py-2.5 text-sm hover:bg-primary/90 transition-colors">
        Contact Us to Activate
      </a>
    </div>
  );
};

export default CollegeAgencySubscribe;

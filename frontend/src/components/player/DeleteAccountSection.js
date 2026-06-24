import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const DeleteAccountSection = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getDeletionStatus()
      .then(res => setPending(res.data.has_pending_request))
      .catch(() => {});
  }, []);

  const handleRequest = async () => {
    setLoading(true);
    try {
      await api.requestAccountDeletion({ reason });
      toast.success("Your deletion request has been submitted.");
      setPending(true);
      setShowConfirm(false);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await api.cancelDeletionRequest();
      toast.success("Deletion request cancelled");
      setPending(false);
    } catch (e) {
      toast.error("Failed to cancel request");
    }
  };

  return (
    <div className="bg-card border border-red-500/20 rounded-sm p-6 mt-6">
      <h2 className="text-lg font-heading font-bold uppercase text-red-400 flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5" /> Delete My Account
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Requesting account deletion will permanently remove your profile, applications, messages, and
        credit history once processed by our team. This action cannot be undone.
      </p>

      {pending ? (
        <div className="space-y-3">
          <p className="text-sm text-yellow-400">Your deletion request is pending review.</p>
          <button onClick={handleCancel}
            className="text-sm border border-white/20 text-white px-4 py-2 rounded-sm hover:bg-white/5 transition-colors">
            Cancel Deletion Request
          </button>
        </div>
      ) : !showConfirm ? (
        <button onClick={() => setShowConfirm(true)}
          className="text-sm bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 rounded-sm hover:bg-red-500/20 transition-colors">
          Request Account Deletion
        </button>
      ) : (
        <div className="space-y-3">
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Optional: tell us why you're leaving..."
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-sm text-white outline-none focus:border-primary resize-none" />
          <div className="flex gap-3">
            <button onClick={() => setShowConfirm(false)}
              className="text-sm border border-white/20 text-white px-4 py-2 rounded-sm hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button onClick={handleRequest} disabled={loading}
              className="text-sm bg-red-500 text-white px-4 py-2 rounded-sm hover:bg-red-600 transition-colors disabled:opacity-50">
              {loading ? "Submitting..." : "Confirm Deletion Request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteAccountSection;
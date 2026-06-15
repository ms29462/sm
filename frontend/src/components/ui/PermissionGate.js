import { usePermissions } from "@/context/PermissionsContext";
import { Lock } from "lucide-react";

const ACCESS_MESSAGES = {
  premium: "This feature requires a Premium subscription.",
  approved: "This feature is only available to approved organizations.",
  default: "This feature is not available for your account type.",
};

export const PermissionGate = ({ permission, fallback, children, message }) => {
  const { can, loading } = usePermissions();
  if (loading) return null;
  if (can(permission)) return children;
  if (fallback) return fallback;
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mb-4">
        <Lock className="w-5 h-5 text-yellow-400" />
      </div>
      <p className="text-sm font-bold text-yellow-400 mb-1">Access Restricted</p>
      <p className="text-xs text-muted-foreground max-w-xs">{message || ACCESS_MESSAGES.default}</p>
    </div>
  );
};

export const PremiumGate = ({ children, message }) => {
  const { isPremium, loading } = usePermissions();
  if (loading) return null;
  if (isPremium()) return children;
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center border border-primary/20 bg-primary/5 rounded-sm">
      <p className="text-sm font-bold text-primary mb-1">⭐ Premium Feature</p>
      <p className="text-xs text-muted-foreground max-w-xs">{message || ACCESS_MESSAGES.premium}</p>
      <button className="mt-3 text-xs bg-primary text-black font-bold px-4 py-2 rounded-sm hover:bg-primary/90 transition-colors">
        Upgrade to Premium
      </button>
    </div>
  );
};

export const ApprovedGate = ({ children, message }) => {
  const { isApproved, isPending, loading } = usePermissions();
  if (loading) return null;
  if (isApproved()) return children;
  if (isPending()) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">⏳</span>
        </div>
        <p className="text-sm font-bold text-yellow-400 mb-1">Account Pending Review</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {message || "Your account is currently under review. You will receive access once approved by Soccer Match."}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Lock className="w-8 h-8 text-muted-foreground mb-3" />
      <p className="text-xs text-muted-foreground">{message || ACCESS_MESSAGES.approved}</p>
    </div>
  );
};

export default PermissionGate;
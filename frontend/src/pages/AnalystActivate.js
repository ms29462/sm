import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, Check } from "lucide-react";

const AnalystActivate = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleActivate = async () => {
    if (!password || password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setSaving(true);
    try {
      const res = await api.activateAnalyst(token, password);
      const { token: authToken, role, user_id, email } = res.data;
      login(authToken, role, user_id, email, null, null);
      setActivated(true);
      setTimeout(() => navigate("/analyst/dashboard"), 2000);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Activation failed");
    }
    setSaving(false);
  };

  const inputClass = "w-full bg-black/20 border border-white/15 focus:border-primary rounded-sm px-4 h-12 text-sm text-white outline-none transition-colors";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <img src="/logo.png" alt="Soccer Match" className="h-10 w-auto mb-10" />
      <div className="max-w-md w-full bg-card border border-border/50 rounded-sm p-8">
        {activated ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-heading font-bold uppercase mb-3">Account Activated!</h1>
            <p className="text-sm text-muted-foreground mb-2">Welcome to Soccer Match.</p>
            <div className="inline-block px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-sm mt-2">
              <p className="text-xs font-bold text-purple-400">⭐ Soccer Match Certified Analyst</p>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-heading font-bold uppercase mb-2">Activate Your Account</h1>
            <div className="h-0.5 w-12 bg-primary mb-5" />
            <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-sm mb-5">
              <p className="text-xs text-purple-400">You have been invited as a <strong>Soccer Match Certified Analyst</strong>. Set your password to activate your account.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">Password *</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters" className={inputClass + " pr-12"} />
                  <button onClick={() => setShowPw(!showPw)} type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">Confirm Password *</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password" className={inputClass} />
                {confirm && password !== confirm && <p className="text-xs text-red-400 mt-1">Passwords do not match</p>}
              </div>
              <button onClick={handleActivate} disabled={saving}
                className="w-full bg-primary text-black font-bold uppercase rounded-sm h-12 hover:bg-primary/90 transition-colors disabled:opacity-50 mt-2">
                {saving ? "Activating..." : "Activate Account"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalystActivate;
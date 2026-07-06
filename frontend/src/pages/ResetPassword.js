import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirm) { toast.error("Please fill in both fields"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid or expired reset link. Please request a new one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Soccer Match" className="h-10 w-auto mx-auto mb-6" />
          <h2 className="text-2xl font-heading uppercase text-muted-foreground">New Password</h2>
        </div>

        <div className="bg-card border border-border/50 p-8 rounded-sm">
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="font-heading font-bold uppercase text-lg mb-2">Password Updated</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your password has been successfully updated. You can now log in with your new password.
              </p>
              <Button onClick={() => navigate("/login")} className="w-full bg-primary text-black font-bold uppercase">
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-sm font-medium uppercase tracking-wide">New Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
                />
              </div>
              <div>
                <Label className="text-sm font-medium uppercase tracking-wide">Confirm Password</Label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12">
                {loading ? "Updating..." : "Set New Password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
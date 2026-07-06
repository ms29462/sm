import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ArrowLeft, Mail } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email"); return; }
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Soccer Match" className="h-10 w-auto mx-auto mb-6" />
          <h2 className="text-2xl font-heading uppercase text-muted-foreground">
            Reset Password
          </h2>
        </div>

        <div className="bg-card border border-border/50 p-8 rounded-sm">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-heading font-bold uppercase text-lg mb-2">Check your email</h3>
              <p className="text-sm text-muted-foreground mb-6">
                If an account exists for <strong className="text-white">{email}</strong>, you'll receive a password reset link shortly. The link expires in 1 hour.
              </p>
              <Button onClick={() => navigate("/login")} className="w-full bg-primary text-black font-bold uppercase">
                Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </p>
              <div>
                <Label htmlFor="email" className="text-sm font-medium uppercase tracking-wide">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12">
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <button type="button" onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
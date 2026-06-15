import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Trophy, ArrowLeft } from "lucide-react";

const Login = ({ admin = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = admin
        ? await api.adminLogin({ email, password })
        : await api.login({ email, password });

      const { token, role, user_id, email: userEmail } = response.data;
      login(token, role, user_id, userEmail, response.data.refresh_token, response.data.name);
      toast.success("Login successful!");

      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "player") {
        navigate("/player/dashboard");
      } else if (role === "club") {
        navigate("/club/dashboard");
      } else if (role === "federation") {
        navigate("/federation/dashboard");
      } else if (role === "agent") {
        navigate("/agent/dashboard");
      } else if (role === "analyst") {
        navigate("/analyst/dashboard");
      } else if (role === "specialist") {
        navigate("/specialist/dashboard");
      } else if (role === "college") {
        navigate("/college/dashboard");
      }
    } catch (error) {
      if (error.response?.data?.detail === 'PENDING_REVIEW') {
        setShowPendingModal(true);
      } else {
        toast.error('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight"><img src="/logo.png" alt="Soccer Match" className="h-10 w-auto" /></h1>
          </div>
          <h2 className="text-2xl font-heading uppercase text-muted-foreground">
            {admin ? "ADMIN LOGIN" : "LOGIN"}
          </h2>
        </div>

        <div className="bg-card border border-border/50 p-8 rounded-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium uppercase tracking-wide">Email</Label>
              <Input
                id="email"
                data-testid="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium uppercase tracking-wide">Password</Label>
              <Input
                id="password"
                data-testid="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                placeholder="Enter your password"
                required
              />
            </div>
            <Button
              data-testid="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12"
            >
              {loading ? "LOGGING IN..." : "LOGIN"}
            </Button>
          </form>

          {!admin && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  data-testid="login-register-link"
                  onClick={() => navigate("/")}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Register
                </button>
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            data-testid="back-to-home-btn"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-primary inline-flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to home</span>
          </button>
        </div>
      </div>
      {showPendingModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm p-6 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⏳</span>
            </div>
            <h3 className="font-heading font-bold uppercase text-lg mb-3">Application Under Review</h3>
            <div className="inline-block px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-sm mb-4">
              <p className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Pending Review</p>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Your club application is currently being reviewed by the Soccer Match team.
            </p>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              A member of our team will contact you within <strong className="text-white">48 hours</strong> to verify your club and finalize your account activation.
            </p>
            <p className="text-sm text-muted-foreground mb-5">
              Questions? <a href="mailto:contact@soccermatch.ca" className="text-primary hover:underline">contact@soccermatch.ca</a>
            </p>
            <button onClick={() => setShowPendingModal(false)}
              className="w-full bg-primary text-black font-bold uppercase rounded-sm h-11 hover:bg-primary/90 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
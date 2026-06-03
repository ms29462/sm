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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = admin
        ? await api.adminLogin({ email, password })
        : await api.login({ email, password });

      const { token, role, user_id, email: userEmail } = response.data;
      login(token, role, user_id, userEmail, response.data.refresh_token);
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
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Trophy className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-heading font-bold tracking-tight">SOCCERMATCH</h1>
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
                  onClick={() => navigate("/register")}
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
    </div>
  );
};

export default Login;
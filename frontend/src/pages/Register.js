import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Trophy, ArrowLeft } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(searchParams.get('role') || 'player');
  const isOrgFlow = searchParams.get('role') === 'club';
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.register({ name, email, password, role });
      const { token, role: userRole, user_id, email: userEmail } = response.data;
      login(token, userRole, user_id, userEmail, response.data.refresh_token);
      toast.success('Registration successful!');

      if (userRole === 'player') {
        navigate('/player/dashboard');
      } else if (userRole === 'club') {
        navigate('/club/dashboard');
      } else if (userRole === 'federation') {
        navigate('/federation/dashboard');
      } else if (userRole === 'agent') {
        navigate('/agent/dashboard');
      } else if (userRole === 'specialist') {
        navigate('/specialist/dashboard');
      } else if (userRole === 'analyst') {
        navigate('/analyst/dashboard');
      }
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0]?.msg || 'Registration failed' : (typeof detail === 'string' ? detail : 'Registration failed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Trophy className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-heading font-bold tracking-tight">SOCCERMATCH</h1>
          </div>
          <h2 className="text-2xl font-heading uppercase text-muted-foreground">CREATE ACCOUNT</h2>
        </div>

        <div className="bg-card border border-border/50 p-8 rounded-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide mb-3 block">I AM A</Label>
              <RadioGroup value={role} onValueChange={setRole} className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  {!isOrgFlow && (
                    <>
                      <RadioGroupItem value="player" id="player" data-testid="role-player-radio" />
                      <Label htmlFor="player" className="cursor-pointer">Player</Label>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="club" id="club" data-testid="role-club-radio" />
                  <Label htmlFor="club" className="cursor-pointer">Club</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="federation" id="federation" data-testid="role-federation-radio" />
                  <Label htmlFor="federation" className="cursor-pointer">Federation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="agent" id="agent" data-testid="role-agent-radio" />
                  <Label htmlFor="agent" className="cursor-pointer">Agent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specialist" id="specialist" data-testid="role-specialist-radio" />
                  <Label htmlFor="specialist" className="cursor-pointer">Specialist</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="analyst" id="analyst" data-testid="role-analyst-radio" />
                  <Label htmlFor="analyst" className="cursor-pointer">Analyst</Label>
                </div>
                <div className="flex items-center space-x-2">
  <RadioGroupItem value="college" id="college" data-testid="role-college-radio" />
  <Label htmlFor="college" className="cursor-pointer">College / University</Label>
</div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="name" className="text-sm font-medium uppercase tracking-wide">
                {role === 'player' ? 'Full Name' : role === 'club' ? 'Club Name' : role === 'federation' ? 'Federation Name' : role === 'agent' ? 'Agent/Agency Name' : role === 'college' ? 'College / University Name' : 'Full Name'}
              </Label>
              <Input
                id="name"
                data-testid="register-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                placeholder={
                  role === 'player' ? 'Enter your full name' : 
                  role === 'club' ? 'Enter club name' : 
                  role === 'federation' ? 'Enter federation name (e.g., Cameroon Football Federation)' :
                  role === 'agent' ? 'Enter your name or agency name' :
                  'Enter your full name'
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium uppercase tracking-wide">
                Email
              </Label>
              <Input
                id="email"
                data-testid="register-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium uppercase tracking-wide">
                Password
              </Label>
              <Input
                id="password"
                data-testid="register-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                placeholder="Create a password"
                required
              />
            </div>

            <Button
              data-testid="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12"
            >
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                data-testid="register-login-link"
                onClick={() => navigate('/login')}
                className="text-primary hover:text-primary/80 font-medium"
              >
                Login
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            data-testid="back-to-home-btn"
            onClick={() => navigate('/')}
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

export default Register;




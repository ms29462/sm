import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Trophy, ChevronRight } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1697562160779-fed83c21a2cd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHw0fHxlbXB0eSUyMG1vZGVybiUyMGZvb3RiYWxsJTIwc3RhZGl1bSUyMG5pZ2h0JTIwZmxvb2RsaWdodHMlMjB3aWRlJTIwYW5nbGV8ZW58MHx8fHwxNzczMzk5NDk2fDA&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <nav className="relative z-10 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-heading font-bold tracking-tight">SOCCERMATCH</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              data-testid="landing-login-btn"
              variant="ghost"
              className="text-white hover:text-primary"
              onClick={() => navigate('/login')}
            >
              LOGIN
            </Button>
              </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold uppercase mb-6 leading-tight">
            YOUR NEXT MOVE
            <br />
            <span className="text-primary">STARTS HERE</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            SoccerMatch connects players with clubs, universities, federations and agents worldwide. Build your profile, showcase your talent, get discovered — and use College Fit to find your path to US college soccer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div
            data-testid="player-card"
            className="bg-card border border-border/50 p-8 rounded-sm hover:border-primary/50 transition-colors group cursor-pointer"
            onClick={() => navigate('/register?role=player')}
          >
            <Users className="w-12 h-12 text-primary mb-6" />
            <h3 className="text-2xl font-heading font-bold uppercase mb-4">FOR PLAYERS</h3>
            <p className="text-muted-foreground mb-6">
              Create your profile, showcase your skills, and connect with clubs worldwide. Get discovered by scouts and agents.
            </p>
            <ul className="space-y-2 mb-8 text-sm">
              <li className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                <span>Build professional profile</span>
              </li>
              <li className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                <span>Upload highlight videos</span>
              </li>
              <li className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                <span>Apply to opportunities</span>
              </li>
              <li className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                <span>Track application status</span>
              </li>
            </ul>
            <Button
              data-testid="player-register-btn"
              className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12"
            >
              JOIN AS PLAYER
            </Button>
          </div>

          <div
            data-testid="club-card"
            className="bg-card border border-border/50 p-8 rounded-sm hover:border-primary/50 transition-colors group cursor-pointer"
            onClick={() => navigate('/register?role=club')}
          >
            <Trophy className="w-12 h-12 text-primary mb-6" />
            <h3 className="text-2xl font-heading font-bold uppercase mb-4">FOR ORGANIZATIONS</h3>
            <p className="text-muted-foreground mb-6">
              Post opportunities, discover talented players, and build your network. Clubs, universities, federations and agents welcome.
            </p>
            <ul className="space-y-2 mb-8 text-sm">
              <li className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                <span>Post opportunities</span>
              </li>
              <li className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                <span>Browse player profiles</span>
              </li>
              <li className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                <span>Filter by position & level</span>
              </li>
              <li className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-primary" />
                <span>Save favorite players</span>
              </li>
            </ul>
            <Button
              data-testid="club-register-btn"
              className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12"
            >
              JOIN AS ORGANIZATION
            </Button>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 text-center text-muted-foreground text-sm">
          <div className="flex items-center justify-center gap-6 mb-4 flex-wrap">
            <button onClick={() => navigate('/cgu')} className="hover:text-primary transition-colors">Terms of Use</button>
            <button onClick={() => navigate('/mentions-legales')} className="hover:text-primary transition-colors">Mentions Légales</button>
            <button onClick={() => navigate('/privacy-policy')} className="hover:text-primary transition-colors">Privacy Policy</button>
            <a href="mailto:contact@soccermatch.ca" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <p>&copy; 2026 Soccer Match Inc. — Montréal, Québec, Canada. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
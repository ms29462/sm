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
            
            <h1 className="text-2xl font-heading font-bold tracking-tight"><img src="/logo.png" alt="Soccer Match" className="h-10 w-auto" /></h1>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
          {[
            {
              role: "player", label: "For Players", icon: "👤", btn: "Join as Player", path: "/player-register",
              desc: "Create your profile, showcase your skills and get discovered by clubs worldwide.",
              points: ["Build a professional profile", "Upload highlight videos", "Apply to opportunities", "Track your applications"]
            },
            {
              role: "club", label: "For Clubs", icon: "🏟️", btn: "Join as Club", path: "/club-register",
              desc: "Find the right talent for your squad. Post opportunities and manage your recruitment.",
              points: ["Post recruitment opportunities", "Browse & filter players", "Manage applications", "Build your pipeline"]
            },
            {
              role: "college", label: "For Colleges", icon: "🎓", btn: "Join as College", path: "/college-register",
              desc: "Identify international student-athletes that match your program's academic and athletic standards.",
              points: ["Search eligible players", "Post scholarships", "Filter by NCAA eligibility", "Manage recruitment"]
            },
            {
              role: "federation", label: "For Federations", icon: "🌍", btn: "Join as Federation", path: "/register?role=federation",
              desc: "Identify and track talent for your national teams across all age categories.",
              points: ["Scout national team talent", "Manage team groups", "Track player development", "Collaborate with clubs"]
            },
            {
              role: "agent", label: "For Agents", icon: "🤝", btn: "Join as Agent", path: "/agent-register",
              desc: "Represent your players and connect them with the right opportunities worldwide.",
              points: ["Manage player portfolios", "Browse opportunities", "Connect with clubs", "Track player careers"]
            },
            {
              role: "specialist", label: "For Specialists", icon: "📊", btn: "Join as Specialist", path: "/register?role=specialist",
              desc: "Offer your expertise to players and organizations looking to improve performance.",
              points: ["Connect with players", "Offer specialized services", "Build your network", "Grow your practice"]
            },
            {
              role: "analyst", label: "For Analysts", icon: "🔍", btn: "Join as Analyst", path: "/register?role=analyst",
              desc: "Evaluate players and provide professional scouting reports for organizations.",
              points: ["Evaluate player profiles", "Write scouting reports", "Browse player database", "Collaborate with clubs"]
            },
          ].map(card => (
            <div key={card.role}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors cursor-pointer flex flex-col"
              onClick={() => navigate(card.path)}
            >
              <div className="text-3xl mb-4">{card.icon}</div>
              <h3 className="text-lg font-heading font-bold uppercase mb-3">{card.label}</h3>
              <p className="text-muted-foreground text-sm mb-4 flex-1">{card.desc}</p>
              <ul className="space-y-1.5 mb-5 text-sm">
                {card.points.map((pt, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{pt}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={e => { e.stopPropagation(); navigate(card.path); }}
                className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-10 text-sm"
              >
                {card.btn}
              </Button>
            </div>
          ))}
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
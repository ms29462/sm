import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Users, Trophy, ChevronRight } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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

      <nav className="relative z-50 bg-black/40 backdrop-blur-xl border-b border-white/10 overflow-visible">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            
            <h1 className="text-2xl font-heading font-bold tracking-tight"><img src="/logo.png" alt="Soccer Match" className="h-10 w-auto" /></h1>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
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

      <main className="relative z-0 max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold uppercase mb-6 leading-tight">
            {t("landing.hero_line1")}
            <br />
            <span className="text-primary">{t("landing.hero_line2")}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            SoccerMatch connects players with clubs, universities, federations and agents worldwide. Build your profile, showcase your talent, get discovered — and use College Fit to find your path to US college soccer.
          </p>
        </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
          {[
            {
              role: "player", label: t("landing.for_players"), icon: "👤", btn: t("landing.btn_player"), path: "/player-register",
              desc: t("landing.desc_player"),
              points: [t("landing.pt_player_1"), t("landing.pt_player_2"), t("landing.pt_player_3"), t("landing.pt_player_4")]
            },
            {
              role: "club", label: t("landing.for_clubs"), icon: "🏟️", btn: t("landing.btn_club"), path: "/club-register",
              desc: t("landing.desc_club"),
              points: [t("landing.pt_club_1"), t("landing.pt_club_2"), t("landing.pt_club_3"), t("landing.pt_club_4")]
            },
            {
              role: "college", label: t("landing.for_colleges"), icon: "🎓", btn: t("landing.btn_college"), path: "/college-register",
              desc: t("landing.desc_college"),
              points: [t("landing.pt_college_1"), t("landing.pt_college_2"), t("landing.pt_college_3"), t("landing.pt_college_4")]
            },
            {
              role: "federation", label: t("landing.for_federations"), icon: "🌍", btn: t("landing.btn_federation"), path: "/federation-register",
              desc: t("landing.desc_federation"),
              points: [t("landing.pt_fed_1"), t("landing.pt_fed_2"), t("landing.pt_fed_3"), t("landing.pt_fed_4")]
            },
            {
              role: "agent", label: t("landing.for_agents"), icon: "🤝", btn: t("landing.btn_agent"), path: "/agent-register",
              desc: t("landing.desc_agent"),
              points: [t("landing.pt_agent_1"), t("landing.pt_agent_2"), t("landing.pt_agent_3"), t("landing.pt_agent_4")]
            },
            {
              role: "specialist", label: t("landing.for_specialists"), icon: "📊", btn: t("landing.btn_specialist"), path: "/specialist-register",
              desc: t("landing.desc_specialist"),
              points: [t("landing.pt_spec_1"), t("landing.pt_spec_2"), t("landing.pt_spec_3"), t("landing.pt_spec_4")]
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
                className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm min-h-10 text-sm py-2 px-3"
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
            <button onClick={() => navigate('/mentions-legales')} className="hover:text-primary transition-colors">{t("landing.legal")}</button>
            <button onClick={() => navigate('/privacy-policy')} className="hover:text-primary transition-colors">{t("landing.privacy_policy")}</button>
            <a href="mailto:contact@soccermatch.ca" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <p>&copy; 2026 Soccer Match Inc. — Montréal, Québec, Canada. {t("landing.all_rights")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
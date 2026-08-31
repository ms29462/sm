import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Users, Trophy, ChevronRight, Newspaper, Pin, ArrowRight, X, Menu } from 'lucide-react';
import { api } from '@/lib/api';

const getYouTubeId = (url) => {
  const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
};

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [newsPosts, setNewsPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api.getPublicNewsFeed().then(res => setNewsPosts(res.data.posts || [])).catch(() => {});
  }, []);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

      <nav className="relative z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img src="/logo.png" alt="Soccer Match" className="h-10 w-auto" />
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {newsPosts.length > 0 && (
              <button onClick={() => scrollTo('landing-news')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors rounded-sm hover:bg-white/5">
                <Newspaper className="w-4 h-4" /> News
              </button>
            )}
            <button onClick={() => scrollTo('landing-partners')}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors rounded-sm hover:bg-white/5">
              Partners
            </button>
            <button onClick={() => scrollTo('landing-register')}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors rounded-sm hover:bg-white/5">
              Register
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block"><LanguageSwitcher /></div>
            <Button data-testid="landing-login-btn" variant="ghost"
              className="text-white hover:text-primary text-sm font-bold"
              onClick={() => navigate('/login')}>
              LOGIN
            </Button>
            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenuOpen(v => !v)}
              className="md:hidden p-2 text-muted-foreground hover:text-white transition-colors">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/60 backdrop-blur-xl">
            <div className="px-6 py-4 space-y-1">
              {newsPosts.length > 0 && (
                <button onClick={() => scrollTo('landing-news')}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-white hover:bg-white/5 rounded-sm transition-colors text-left">
                  <Newspaper className="w-4 h-4" /> News
                </button>
              )}
              <button onClick={() => scrollTo('landing-partners')}
                className="flex w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-white hover:bg-white/5 rounded-sm transition-colors text-left">
                Partners
              </button>
              <button onClick={() => scrollTo('landing-register')}
                className="flex w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-white hover:bg-white/5 rounded-sm transition-colors text-left">
                Register
              </button>
              <div className="pt-2 border-t border-white/10">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        )}
      </nav>

      <main id="landing-register" className="relative z-0 max-w-7xl mx-auto px-6 md:px-12 py-20">
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
              role: "academy", label: "For Academies", icon: "🏫", btn: "Join as Academy", path: "/academy-register",
              desc: "Register your academy and submit your players to professional opportunities worldwide.",
              points: ["Manage your player roster", "Apply to opportunities on behalf of your players", "Get discovered by clubs and federations", "Track all your applications in one place"]
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

      {/* News Feed Section */}
      {newsPosts.length > 0 && (
        <section id="landing-news" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 mt-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Newspaper className="w-6 h-6 text-primary" />
              <div>
                <h3 className="text-2xl font-heading font-bold uppercase">Latest News</h3>
                <p className="text-sm text-muted-foreground">Updates from SoccerMatch</p>
              </div>
            </div>
            <button onClick={() => navigate('/login')}
              className="text-xs font-bold text-primary border border-primary/30 rounded-sm px-4 py-1.5 hover:bg-primary/10 transition-colors">
              View all →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newsPosts.map(post => (
              <div key={post.id} onClick={() => setSelectedPost(post)}
                className="bg-card border border-border/50 hover:border-primary/50 rounded-sm overflow-hidden cursor-pointer transition-colors group">
                {post.media_type === 'image' && post.media_url && (
                  <img src={post.media_url} alt={post.title} className="w-full h-40 object-cover group-hover:opacity-90 transition-opacity" />
                )}
                {post.media_type === 'youtube' && getYouTubeId(post.media_url) && (
                  <div className="relative h-40 bg-black/40">
                    <img src={`https://img.youtube.com/vi/${getYouTubeId(post.media_url)}/hqdefault.jpg`} alt={post.title} className="w-full h-full object-cover opacity-70" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 ml-0.5" style={{borderTop:'6px solid transparent', borderBottom:'6px solid transparent', borderLeft:'10px solid white'}} />
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {post.pinned && (
                      <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-sm font-bold uppercase flex items-center gap-1">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <h4 className="font-heading font-bold uppercase mb-2 group-hover:text-primary transition-colors text-sm leading-snug">{post.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
                  <div className="flex items-center gap-1 text-xs text-primary font-bold">
                    Read more <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Article Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 py-8">
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              {selectedPost.media_type === 'image' && selectedPost.media_url && (
                <img src={selectedPost.media_url} alt={selectedPost.title} className="w-full h-64 object-cover" />
              )}
              {selectedPost.media_type === 'youtube' && getYouTubeId(selectedPost.media_url) && (
                <div className="aspect-video">
                  <iframe src={`https://www.youtube.com/embed/${getYouTubeId(selectedPost.media_url)}`} className="w-full h-full" allowFullScreen title={selectedPost.title} />
                </div>
              )}
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-primary font-bold">{selectedPost.author}</span>
                    <span> · </span>
                    <span>{new Date(selectedPost.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </p>
                  <button onClick={() => setSelectedPost(null)} className="text-muted-foreground hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-6">{selectedPost.title}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partners Section */}
      <section id="landing-partners" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 mt-20 mb-12">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Our Partners</p>
          <h3 className="text-2xl font-heading font-bold uppercase">Trusted by the best in football</h3>
        </div>
        <div className="flex justify-center">
          <a
            href="https://ratiofootball.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-card border border-border/50 hover:border-primary/50 rounded-sm p-8 flex flex-col items-center gap-5 transition-all duration-200 max-w-sm w-full"
          >
            {/* Logo */}
            <img
              src="/ratio-football-logo.png"
              alt="Ratio Football"
              className="h-16 w-auto object-contain"
            />
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Highlight reels · Video analysis · Personalized coaching
            </p>
            <span className="text-xs font-bold text-primary border border-primary/30 rounded-sm px-4 py-1.5 group-hover:bg-primary group-hover:text-black transition-all">
              Visit Partner →
            </span>
          </a>
        </div>
      </section>

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
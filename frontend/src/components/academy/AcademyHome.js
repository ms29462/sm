import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { Users, Briefcase, FileText, GraduationCap } from 'lucide-react';

const AcademyHome = () => {
  const [profile, setProfile] = useState(null);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    api.getAcademyProfile().then(r => setProfile(r.data)).catch(() => {});
    api.getAcademyPlayers().then(r => setPlayers(r.data || [])).catch(() => {});
  }, []);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">
          {profile?.name || "Academy Dashboard"}
        </h1>
        <p className="text-muted-foreground">Manage your academy and submit players to opportunities</p>
        {profile && !profile.approved && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-sm">
            <p className="text-yellow-500 text-sm font-medium">Your academy is pending admin approval. You can add players in the meantime.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Academy Players", value: players.length, icon: Users, to: "/academy/players", color: "text-primary" },
          { label: "Opportunities", value: "Browse", icon: Briefcase, to: "/academy/opportunities", color: "text-blue-400" },
          { label: "Applications", value: "View", icon: FileText, to: "/academy/applications", color: "text-green-400" },
        ].map(stat => (
          <Link key={stat.label} to={stat.to} className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
              <span className={`text-2xl font-heading font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">{stat.label}</p>
          </Link>
        ))}
      </div>

      {players.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No players added yet</p>
          <Link to="/academy/players" className="inline-block px-6 py-2 bg-primary text-black font-bold text-sm rounded-sm hover:bg-primary/90 transition-colors uppercase tracking-wide">
            Add Your First Player
          </Link>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-heading font-bold uppercase mb-4">Recent Players</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {players.slice(0, 6).map(p => (
              <Link key={p.user_id} to={`/academy/player/${p.user_id}`}
                className="bg-card border border-border/50 p-4 rounded-sm hover:border-primary/50 transition-colors flex items-center gap-3">
                {p.profile_picture ? (
                  <img src={p.profile_picture} alt={p.name} className="w-12 h-12 rounded-sm object-cover border border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-sm bg-muted flex items-center justify-center border border-border">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm uppercase">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.position} {p.age ? `· ${p.age}y` : ""}</p>
                </div>
              </Link>
            ))}
          </div>
          {players.length > 6 && (
            <Link to="/academy/players" className="mt-4 inline-block text-sm text-primary hover:underline">
              View all {players.length} players →
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default AcademyHome;

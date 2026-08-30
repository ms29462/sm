import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { User, MapPin, Briefcase, Star, Globe, Award, CheckCircle } from 'lucide-react';

const BrowseAgents = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { loadAgents(); }, []);

  const loadAgents = async () => {
    try {
      const res = await api.getAgents();
      setAgents(res.data || []);
    } catch {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const MARKETS = [...new Set(agents.map(a => a.primary_market).filter(Boolean))];

  const filtered = agents.filter(a => {
    if (filter && a.primary_market !== filter) return false;
    return true;
  });

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-primary text-xl font-heading">LOADING...</div>
    </div>
  );

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1">Browse Agents</h1>
        <p className="text-muted-foreground text-sm">Find a licensed agent to represent you and advance your career</p>
      </div>

      {/* Market filter */}
      {MARKETS.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setFilter('')}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border transition-colors ${!filter ? 'bg-primary text-black border-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
            All Markets
          </button>
          {MARKETS.map(market => (
            <button key={market} onClick={() => setFilter(market)}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border transition-colors ${filter === market ? 'bg-primary text-black border-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
              {market}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No agents found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(agent => (
            <div key={agent.user_id} className="bg-card border border-border/50 rounded-sm p-5 hover:border-primary/50 transition-colors flex flex-col">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                {agent.profile_picture ? (
                  <img src={agent.profile_picture} alt={agent.name} className="w-14 h-14 rounded-sm object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-sm bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-7 h-7 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold uppercase truncate">{agent.name}</h3>
                  {agent.agency_name && (
                    <p className="text-xs text-muted-foreground truncate">{agent.agency_name}</p>
                  )}
                  {agent.license_verified && agent.license_type ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-sm mt-1">
                      <CheckCircle className="w-2.5 h-2.5" /> Licensed — {agent.license_type}
                    </span>
                  ) : !agent.license_verified && agent.license_number ? (
                    <span className="text-[10px] bg-white/5 text-muted-foreground border border-white/10 px-2 py-0.5 rounded-sm mt-1 inline-block">
                      License pending
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4 flex-1">
                {agent.country && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span>{agent.country}</span>
                  </div>
                )}
                {agent.years_experience && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-3 h-3 flex-shrink-0" />
                    <span>{agent.years_experience} years experience</span>
                  </div>
                )}
                {agent.primary_market && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="w-3 h-3 flex-shrink-0" />
                    <span>{agent.primary_market}</span>
                  </div>
                )}
                {(agent.players_represented > 0 || agent.successful_transfers > 0) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="w-3 h-3 flex-shrink-0" />
                    <span>
                      {agent.players_represented > 0 ? `${agent.players_represented} players` : ''}
                      {agent.players_represented > 0 && agent.successful_transfers > 0 ? ' · ' : ''}
                      {agent.successful_transfers > 0 ? `${agent.successful_transfers} transfers` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Specializations */}
              {agent.specializations?.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {agent.specializations.slice(0, 3).map((s, i) => (
                      <span key={i} className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-sm">{s}</span>
                    ))}
                    {agent.specializations.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{agent.specializations.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Bio */}
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[2rem]">{agent.bio || ''}</p>

              {/* CTA */}
              <button
                onClick={() => navigate(`/player/agents/${agent.user_id}`)}
                className="w-full border border-white/20 text-white font-bold uppercase text-xs py-2.5 rounded-sm hover:bg-white/5 transition-colors"
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseAgents;

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Users, Check, X, Trash2, CheckCircle, XCircle,
  ChevronDown, ChevronUp, ExternalLink, Play, Globe,
  Instagram, Twitter, Linkedin, Phone, Mail, Calendar, MapPin
} from 'lucide-react';

const Field = ({ label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-0.5">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
};

const VideoLink = ({ url }) => {
  if (!url) return <span className="text-sm text-muted-foreground italic">No highlight video</span>;
  const isYouTube = /youtube\.com|youtu\.be/.test(url);
  const isVimeo = /vimeo\.com/.test(url);
  const platform = isYouTube ? 'YouTube' : isVimeo ? 'Vimeo' : 'Video';
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 text-primary rounded-sm text-sm font-bold hover:bg-primary/20 transition-colors"
    >
      <Play className="w-4 h-4" />
      Watch {platform} Highlights
      <ExternalLink className="w-3 h-3 opacity-60" />
    </a>
  );
};

const AdminPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ageFilter, setAgeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState({});

  useEffect(() => { loadPlayers(); }, []);

  const loadPlayers = async () => {
    try {
      const response = await api.getAllPlayers();
      setPlayers(response.data);
    } catch (error) {
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, currentStatus) => {
    try {
      await api.approvePlayer(userId, !currentStatus);
      toast.success(currentStatus ? 'Player unapproved' : 'Player approved');
      loadPlayers();
    } catch (error) {
      toast.error('Failed to update approval status');
    }
  };

  const handleVerify = async (userId, currentStatus) => {
    try {
      await api.verifyPlayer(userId, !currentStatus);
      toast.success(currentStatus ? 'Player unverified' : 'Player verified');
      loadPlayers();
    } catch (error) {
      toast.error('Failed to update verification status');
    }
  };

  const handleTogglePremium = async (userId, currentPremium) => {
    try {
      if (currentPremium) {
        await api.cancelSubscription({ user_id: userId });
        toast.success('Premium removed');
      } else {
        await api.assignSubscription({ user_id: userId, plan_id: 'player_premium', billing: 'yearly' });
        toast.success('Premium activated');
      }
      loadPlayers();
    } catch (error) {
      toast.error('Failed to update premium status');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    try {
      await api.deleteUser(userId);
      toast.success('Player deleted');
      loadPlayers();
    } catch (error) {
      toast.error('Failed to delete player');
    }
  };

  const toggleExpanded = (userId) =>
    setExpanded(prev => ({ ...prev, [userId]: !prev[userId] }));

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const filteredPlayers = players
    .filter(p => {
      if (ageFilter === 'minors' && !p.is_minor) return false;
      if (ageFilter === 'adults' && p.is_minor) return false;
      if (ageFilter === 'new') {
        const created = p.created_at ? new Date(p.created_at) : null;
        if (!created || created < thirtyDaysAgo) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.nationality?.toLowerCase().includes(q) ||
          p.position?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.current_club?.toLowerCase().includes(q) ||
          p.residence_country?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (ageFilter === 'new') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return 0;
    });

  const newPlayersCount = players.filter(p => {
    const created = p.created_at ? new Date(p.created_at) : null;
    return created && created >= thirtyDaysAgo;
  }).length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">PLAYER MANAGEMENT</h1>
        <p className="text-muted-foreground">Approve and manage player accounts</p>
      </div>

      <div className="mb-4">
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, nationality, position, club, country..."
          className="w-full bg-black/20 border border-white/10 rounded-sm h-10 px-4 text-sm text-white outline-none focus:border-primary"
        />
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'all', label: 'All Players', count: players.length },
          { id: 'new', label: 'New (30d)', count: newPlayersCount },
          { id: 'minors', label: 'Minors', count: players.filter(p => p.is_minor).length },
          { id: 'adults', label: 'Adults', count: players.filter(p => !p.is_minor).length },
        ].map(f => (
          <button key={f.id} onClick={() => setAgeFilter(f.id)}
            className={`px-4 py-2 text-xs font-bold uppercase rounded-sm border transition-colors ${
              ageFilter === f.id
                ? f.id === 'new' ? 'bg-green-500 text-black border-green-500' : 'bg-primary text-black border-primary'
                : f.id === 'new' && f.count > 0 ? 'border-green-500/50 text-green-400 hover:border-green-500' : 'border-white/10 text-muted-foreground hover:border-white/30'
            }`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {players.length === 0 ? (
        <div data-testid="no-players" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No players registered yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPlayers.map((player) => (
            <div
              key={player.user_id}
              data-testid={`player-card-${player.user_id}`}
              className="bg-card border border-border/50 rounded-sm hover:border-primary/50 transition-colors"
            >
              {/* ── Header row ── */}
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start space-x-4 flex-1">
                    {player.profile_picture ? (
                      <img src={player.profile_picture} alt={player.name}
                        className="w-16 h-16 rounded-sm object-cover border-2 border-primary shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center border-2 border-border shrink-0">
                        <Users className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-heading font-bold uppercase">{player.name}</h3>
                        <span data-testid={`status-${player.user_id}`}
                          className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-sm ${
                            player.approved
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }`}>
                          {player.approved ? 'APPROVED' : 'PENDING'}
                        </span>
                        {player.verified && (
                          <span data-testid={`verified-badge-${player.user_id}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-sm bg-blue-500/10 text-blue-500 border-blue-500/20">
                            <CheckCircle className="w-3 h-3" /> VERIFIED
                          </span>
                        )}
                        {player.is_premium && (
                          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-sm bg-primary/10 text-primary border-primary/20">
                            ⭐ PREMIUM
                          </span>
                        )}
                        {player.is_minor && (
                          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-sm bg-orange-500/10 text-orange-400 border-orange-500/20">
                            MINOR
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{player.email}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {player.position && <span className="text-muted-foreground">{player.position}</span>}
                        {player.age && <span className="text-muted-foreground">{player.age} yrs</span>}
                        {(player.nationality_1 || player.nationality) && (
                          <span className="text-muted-foreground">
                            {player.nationality_1 || player.nationality}
                          </span>
                        )}
                        {player.playing_level && <span className="text-muted-foreground">{player.playing_level}</span>}
                        {player.residence_country && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-3 h-3" />{player.residence_country}
                          </span>
                        )}
                        {player.created_at && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(player.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <Button size="sm" variant="outline"
                      onClick={() => toggleExpanded(player.user_id)}
                      className="border-border rounded-sm text-xs gap-1">
                      {expanded[player.user_id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {expanded[player.user_id] ? 'Less' : 'Details'}
                    </Button>
                    <Button data-testid={`approve-btn-${player.user_id}`} size="icon"
                      onClick={() => handleApprove(player.user_id, player.approved)}
                      className={player.approved ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-primary hover:bg-primary/90'}
                      title={player.approved ? 'Unapprove' : 'Approve'}>
                      {player.approved ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </Button>
                    <Button data-testid={`verify-btn-${player.user_id}`} size="icon"
                      onClick={() => handleVerify(player.user_id, player.verified)}
                      className={player.verified ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-500 hover:bg-blue-600'}
                      title={player.verified ? 'Unverify' : 'Verify'}>
                      {player.verified ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </Button>
                    <Button data-testid={`delete-btn-${player.user_id}`} size="icon" variant="ghost"
                      onClick={() => handleDelete(player.user_id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* ── Expanded detail panel ── */}
              {expanded[player.user_id] && (
                <div className="border-t border-border/50 px-6 pb-6 pt-5 space-y-6">

                  {/* Highlight video — most prominent */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Highlight Video</p>
                    <VideoLink url={player.highlight_video} />
                    {player.full_game_videos?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {player.full_game_videos.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white border border-border/50 px-2 py-1 rounded-sm transition-colors">
                            <Play className="w-3 h-3" /> Full Game {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                    {player.transfermarkt_url && (
                      <a href={player.transfermarkt_url} target="_blank" rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white border border-border/50 px-2 py-1 rounded-sm transition-colors">
                        <ExternalLink className="w-3 h-3" /> Transfermarkt Profile
                      </a>
                    )}
                  </div>

                  {/* Player info */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Player Information</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Field label="Date of Birth" value={player.date_of_birth} />
                      <Field label="Age" value={player.age ? `${player.age} years` : null} />
                      <Field label="Gender" value={player.gender} />
                      <Field label="Height" value={player.height ? `${player.height} cm` : null} />
                      <Field label="Weight" value={player.weight ? `${player.weight} kg` : null} />
                      <Field label="Preferred Foot" value={player.preferred_foot} />
                      <Field label="Jersey Number" value={player.jersey_number} />
                      <Field label="National Team" value={player.national_team} />
                    </div>
                  </div>

                  {/* Nationality */}
                  {(player.nationality_1 || player.nationality || player.nationality_2 || player.nationality_3) && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Nationality</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Field label="Nationality 1" value={player.nationality_1 || player.nationality} />
                        <Field label="Nationality 2" value={player.nationality_2} />
                        <Field label="Nationality 3" value={player.nationality_3} />
                        <Field label="Residence Country" value={player.residence_country} />
                      </div>
                    </div>
                  )}

                  {/* Career */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Career</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Field label="Position" value={player.position} />
                      <Field label="Secondary Position" value={player.secondary_position} />
                      <Field label="Playing Level" value={player.playing_level} />
                      <Field label="Current Club" value={player.current_club} />
                      <Field label="League" value={player.league} />
                      <Field label="Contract Status" value={player.contract_status} />
                      <Field label="Contract End" value={player.contract_end_date} />
                      <Field label="Market Value" value={player.market_value} />
                    </div>
                    {player.looking_for?.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Looking For</span>
                        <div className="flex flex-wrap gap-1.5">
                          {player.looking_for.map((item, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs border border-border/50 rounded-sm text-muted-foreground">{item}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {player.bio && (
                      <div className="mt-3">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Bio</span>
                        <p className="text-sm text-muted-foreground leading-relaxed">{player.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Education */}
                  {(player.has_baccalaureate || player.has_postsecondary || player.english_level) && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Education</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {player.has_baccalaureate && <Field label="Baccalaureate" value={`Year ${player.bac_year || '—'} · Grade ${player.bac_grade || '—'}`} />}
                        {player.has_postsecondary && <Field label="Post-secondary start" value={player.postsecondary_start_date} />}
                        <Field label="English Level" value={player.english_level ? `${player.english_level}/10` : null} />
                        {player.languages?.length > 0 && <Field label="Languages" value={player.languages.join(', ')} />}
                      </div>
                    </div>
                  )}

                  {/* Contact & Social */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Contact & Social</p>
                    <div className="flex flex-wrap gap-3">
                      {player.email && (
                        <a href={`mailto:${player.email}`}
                          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white border border-border/50 px-2 py-1 rounded-sm transition-colors">
                          <Mail className="w-3.5 h-3.5" /> {player.email}
                        </a>
                      )}
                      {player.phone && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border/50 px-2 py-1 rounded-sm">
                          <Phone className="w-3.5 h-3.5" /> {player.phone}
                        </span>
                      )}
                      {player.instagram && (
                        <a href={player.instagram} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-pink-400 hover:text-pink-300 border border-pink-500/20 px-2 py-1 rounded-sm transition-colors">
                          <Instagram className="w-3.5 h-3.5" /> Instagram
                        </a>
                      )}
                      {player.twitter && (
                        <a href={player.twitter} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300 border border-sky-500/20 px-2 py-1 rounded-sm transition-colors">
                          <Twitter className="w-3.5 h-3.5" /> Twitter/X
                        </a>
                      )}
                      {player.linkedin && (
                        <a href={player.linkedin} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 border border-blue-500/20 px-2 py-1 rounded-sm transition-colors">
                          <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Admin actions */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50">
                    {player.is_minor && (
                      <Button size="sm" variant="outline"
                        onClick={async () => {
                          try {
                            await api.adminUpdateParentalConsent(player.user_id, { parental_consent_form_received: !player.parental_consent_form_received });
                            setPlayers(prev => prev.map(p => p.user_id === player.user_id ? { ...p, parental_consent_form_received: !p.parental_consent_form_received } : p));
                            toast.success(player.parental_consent_form_received ? 'Consent form mark removed' : 'Consent form marked as received');
                          } catch (error) {
                            toast.error('Failed to update consent status');
                          }
                        }}
                        className={player.parental_consent_form_received
                          ? 'border-green-500 text-green-400 hover:bg-green-500/10 text-xs'
                          : 'border-orange-500 text-orange-400 hover:bg-orange-500/10 text-xs'}>
                        {player.parental_consent_form_received ? 'Consent Form ✓ Received' : 'Mark Consent Form Received'}
                      </Button>
                    )}
                    <Button size="sm" variant="outline"
                      onClick={() => handleTogglePremium(player.user_id, player.is_premium)}
                      className={player.is_premium
                        ? 'border-red-500 text-red-400 hover:bg-red-500/10 text-xs'
                        : 'border-primary text-primary hover:bg-primary/10 text-xs'}>
                      {player.is_premium ? 'Remove Premium' : 'Grant Premium'}
                    </Button>
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPlayers;

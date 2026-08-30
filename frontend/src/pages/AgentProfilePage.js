import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { User, MapPin, Star, Globe, ArrowLeft, Briefcase, Award, CheckCircle, Send, X } from 'lucide-react';

const AgentProfilePage = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [existingRequest, setExistingRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { loadAgent(); }, [agentId]);
  useEffect(() => {
    if (user?.role === 'player') loadMyRequests();
  }, [agentId, user]);

  const loadAgent = async () => {
    try {
      const res = await api.getAgentById(agentId);
      setAgent(res.data);
    } catch {
      toast.error('Failed to load agent profile');
    } finally {
      setLoading(false);
    }
  };

  const loadMyRequests = async () => {
    try {
      const res = await api.getRepresentationRequests();
      const match = (res.data || []).find(r => r.agent_id === agentId);
      setExistingRequest(match || null);
    } catch {}
  };

  const handleSendRequest = async () => {
    setSending(true);
    try {
      await api.sendRepresentationRequest({ player_id: user.userId, message: message.trim() || undefined });
      toast.success('Representation request sent!');
      setShowModal(false);
      setMessage('');
      loadMyRequests();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-primary text-xl font-heading">LOADING...</div>
    </div>
  );

  if (!agent) return (
    <div className="p-8 text-center text-muted-foreground">Agent not found.</div>
  );

  return (
    <div className="p-4 md:p-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Hero Header */}
      <div className="bg-card border border-border/50 rounded-sm p-6 md:p-8 mb-4">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {agent.profile_picture ? (
            <img src={agent.profile_picture} alt={agent.name}
              className="w-32 h-32 rounded-sm object-cover flex-shrink-0 border border-border/50" />
          ) : (
            <div className="w-32 h-32 rounded-sm bg-muted flex items-center justify-center flex-shrink-0">
              <User className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1">{agent.name}</h1>
            {agent.agency_name && (
              <p className="text-muted-foreground mb-2">{agent.agency_name}</p>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              {agent.license_verified ? (
                <span className="inline-flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-sm font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Licensed Agent{agent.license_type ? ` — ${agent.license_type}` : ''}
                </span>
              ) : agent.license_number ? (
                <span className="inline-flex items-center gap-1.5 text-xs bg-white/5 text-muted-foreground border border-white/10 px-3 py-1.5 rounded-sm">
                  <CheckCircle className="w-3.5 h-3.5" /> License pending verification
                </span>
              ) : null}
              {agent.fifa_registered && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-sm">
                  FIFA Registered
                </span>
              )}
            </div>
            {agent.country && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" /> {agent.country}
              </div>
            )}
            <div className="flex flex-wrap gap-4">
              {agent.years_experience && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{agent.years_experience} years experience</span>
                </div>
              )}
              {agent.players_represented > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{agent.players_represented} players represented</span>
                </div>
              )}
              {agent.successful_transfers > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{agent.successful_transfers} successful transfers</span>
                </div>
              )}
              {agent.primary_market && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{agent.primary_market}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Representation — only visible to players */}
      {user?.role === 'player' && (
        <div className="mb-4">
          {!existingRequest ? (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-primary text-black font-bold uppercase text-sm px-6 py-3 rounded-sm hover:bg-primary/90 transition-colors">
              <Send className="w-4 h-4" /> Request Representation
            </button>
          ) : (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-sm border text-sm font-medium ${
              existingRequest.status === 'pending' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
              existingRequest.status === 'accepted' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
              'border-red-500/30 text-red-400 bg-red-500/10'
            }`}>
              {existingRequest.status === 'pending' && '⏳ Request Pending'}
              {existingRequest.status === 'accepted' && '✓ Representation Accepted'}
              {existingRequest.status === 'declined' && '✗ Request Declined'}
            </div>
          )}
        </div>
      )}

      {/* Request modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold uppercase">Request Representation</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Send a representation request to <span className="text-white font-medium">{agent?.name}</span>
              {agent?.agency_name ? ` (${agent.agency_name})` : ''}. They will be notified and can accept or decline.
            </p>
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wide mb-2 block">Message (optional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                placeholder="Introduce yourself, share your goals, or ask any questions..."
                className="w-full bg-black/20 border border-white/10 rounded-sm p-3 text-sm text-white outline-none focus:border-primary resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-white/20 rounded-sm py-2.5 text-sm hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleSendRequest} disabled={sending}
                className="flex-1 bg-primary text-black font-bold rounded-sm py-2.5 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {sending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bio */}
        {agent.bio && (
          <div className="bg-card border border-border/50 rounded-sm p-6 md:col-span-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">About</h2>
            <p className="text-sm leading-relaxed">{agent.bio}</p>
          </div>
        )}

        {/* Specializations */}
        {agent.specializations?.length > 0 && (
          <div className="bg-card border border-border/50 rounded-sm p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {agent.specializations.map((s, i) => (
                <span key={i} className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-sm">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Markets */}
        {(agent.primary_market || agent.secondary_markets?.length > 0) && (
          <div className="bg-card border border-border/50 rounded-sm p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Markets</h2>
            <div className="flex flex-wrap gap-2">
              {agent.primary_market && (
                <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-sm">
                  {agent.primary_market} (Primary)
                </span>
              )}
              {(agent.secondary_markets || []).map((m, i) => (
                <span key={i} className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-sm">{m}</span>
              ))}
            </div>
          </div>
        )}

        {/* Licensing */}
        {(agent.license_type || agent.licensing_authority) && (
          <div className="bg-card border border-border/50 rounded-sm p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Licensing</h2>
            <div className="space-y-2">
              {agent.license_type && (
                <p className="text-sm"><span className="text-muted-foreground">Type: </span>{agent.license_type}</p>
              )}
              {agent.licensing_authority && (
                <p className="text-sm"><span className="text-muted-foreground">Authority: </span>{agent.licensing_authority}</p>
              )}
              {agent.license_number && (
                <p className="text-sm"><span className="text-muted-foreground">Number: </span>{agent.license_number}</p>
              )}
            </div>
          </div>
        )}

        {/* Links */}
        {(agent.website || agent.linkedin || agent.instagram) && (
          <div className="bg-card border border-border/50 rounded-sm p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Links</h2>
            <div className="space-y-2">
              {agent.website && (
                <a href={agent.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Globe className="w-4 h-4" /> {agent.website}
                </a>
              )}
              {agent.linkedin && (
                <a href={agent.linkedin} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Award className="w-4 h-4" /> LinkedIn
                </a>
              )}
              {agent.instagram && (
                <a href={agent.instagram} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Globe className="w-4 h-4" /> Instagram
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentProfilePage;

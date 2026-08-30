import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { User, MapPin, Star, CheckCircle, X, Clock, Briefcase } from 'lucide-react';

const STATUS_STYLE = {
  pending:  { cls: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10', label: 'Pending' },
  accepted: { cls: 'border-green-500/30 text-green-400 bg-green-500/10',   label: 'Accepted' },
  declined: { cls: 'border-red-500/30 text-red-400 bg-red-500/10',         label: 'Declined' },
};

const RepresentationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const res = await api.getRepresentationRequests();
      setRequests(res.data || []);
    } catch {
      toast.error('Failed to load representation requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id, status) => {
    setResponding(id + status);
    try {
      await api.respondRepresentationRequest(id, status);
      toast.success(status === 'accepted' ? 'Representation accepted!' : 'Request declined');
      loadRequests();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to respond');
    } finally {
      setResponding(null);
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-primary text-xl font-heading">LOADING...</div>
    </div>
  );

  const pending  = requests.filter(r => r.status === 'pending');
  const responded = requests.filter(r => r.status !== 'pending');

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1">Representation Requests</h1>
        <p className="text-muted-foreground text-sm">Agents who want to represent you</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-muted-foreground">No representation requests yet</p>
          <p className="text-xs text-muted-foreground mt-2">Agents can request to represent you from your profile</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Pending ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map(req => (
                  <RequestCard key={req.id} req={req} onRespond={handleRespond} responding={responding} />
                ))}
              </div>
            </div>
          )}

          {/* Responded */}
          {responded.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Past Requests
              </h2>
              <div className="space-y-3">
                {responded.map(req => (
                  <RequestCard key={req.id} req={req} onRespond={handleRespond} responding={responding} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RequestCard = ({ req, onRespond, responding }) => {
  const agent = req.agent_info || {};
  const st = STATUS_STYLE[req.status] || STATUS_STYLE.pending;

  return (
    <div className="bg-card border border-border/50 rounded-sm p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {agent.profile_picture ? (
          <img src={agent.profile_picture} alt={agent.name} className="w-14 h-14 rounded-sm object-cover flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-sm bg-muted flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-muted-foreground" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div>
              <p className="font-heading font-bold uppercase">{agent.name || 'Unknown Agent'}</p>
              {agent.agency_name && <p className="text-sm text-muted-foreground">{agent.agency_name}</p>}
            </div>
            <span className={`text-xs px-2 py-1 rounded-sm border flex-shrink-0 ${st.cls}`}>{st.label}</span>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
            {agent.country && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{agent.country}</span>
            )}
            {agent.years_experience && (
              <span className="flex items-center gap-1"><Star className="w-3 h-3" />{agent.years_experience}y exp</span>
            )}
            {agent.license_number && (
              <span className="flex items-center gap-1 text-primary"><CheckCircle className="w-3 h-3" />Licensed</span>
            )}
            {agent.primary_market && (
              <span>{agent.primary_market}</span>
            )}
          </div>

          {req.message && (
            <div className="bg-background border border-border/30 rounded-sm p-3 mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Message</p>
              <p className="text-sm">{req.message}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground mb-3">
            Received {new Date(req.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>

          {req.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => onRespond(req.id, 'accepted')}
                disabled={!!responding}
                className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-black font-bold text-xs py-2 rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                <CheckCircle className="w-3.5 h-3.5" />
                {responding === req.id + 'accepted' ? 'Accepting...' : 'Accept'}
              </button>
              <button
                onClick={() => onRespond(req.id, 'declined')}
                disabled={!!responding}
                className="flex-1 flex items-center justify-center gap-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs py-2 rounded-sm transition-colors disabled:opacity-50">
                <X className="w-3.5 h-3.5" />
                {responding === req.id + 'declined' ? 'Declining...' : 'Decline'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepresentationRequests;

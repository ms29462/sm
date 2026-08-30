import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { User, Clock, CheckCircle, X, Send, Briefcase } from 'lucide-react';

const STATUS_STYLE = {
  pending:  { cls: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10', label: 'Pending',  icon: Clock },
  accepted: { cls: 'border-green-500/30 text-green-400 bg-green-500/10',   label: 'Accepted', icon: CheckCircle },
  declined: { cls: 'border-red-500/30 text-red-400 bg-red-500/10',         label: 'Declined', icon: X },
};

const AgentRepresentationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-primary text-xl font-heading">LOADING...</div>
    </div>
  );

  const pending  = requests.filter(r => r.status === 'pending');
  const accepted = requests.filter(r => r.status === 'accepted');
  const declined = requests.filter(r => r.status === 'declined');

  const Section = ({ title, items, icon: Icon, color }) => items.length === 0 ? null : (
    <div>
      <h2 className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${color}`}>
        <Icon className="w-3.5 h-3.5" /> {title} ({items.length})
      </h2>
      <div className="space-y-3 mb-6">
        {items.map(req => {
          const player = req.player_info || {};
          const st = STATUS_STYLE[req.status];
          const StatusIcon = st.icon;
          return (
            <div key={req.id} className="bg-card border border-border/50 rounded-sm p-5">
              <div className="flex items-start gap-4">
                {player.profile_picture ? (
                  <img src={player.profile_picture} alt={player.name} className="w-12 h-12 rounded-sm object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-sm bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                    <div>
                      <p className="font-heading font-bold uppercase">{player.name || 'Unknown Player'}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {player.position && <span>{player.position}</span>}
                        {player.nationality && <span>· {player.nationality}</span>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-sm border flex items-center gap-1 flex-shrink-0 ${st.cls}`}>
                      <StatusIcon className="w-3 h-3" /> {st.label}
                    </span>
                  </div>
                  {req.message && (
                    <div className="bg-background border border-border/30 rounded-sm p-3 mt-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your message</p>
                      <p className="text-sm">{req.message}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Sent {new Date(req.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    {req.responded_at && ` · Responded ${new Date(req.responded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1">Representation Requests</h1>
        <p className="text-muted-foreground text-sm">Players you've sent representation requests to</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-muted-foreground">No requests sent yet</p>
          <p className="text-xs text-muted-foreground mt-2">Browse players and send representation requests from their profiles</p>
        </div>
      ) : (
        <div>
          <Section title="Pending" items={pending} icon={Clock} color="text-yellow-400" />
          <Section title="Accepted" items={accepted} icon={CheckCircle} color="text-green-400" />
          <Section title="Declined" items={declined} icon={X} color="text-red-400" />
        </div>
      )}
    </div>
  );
};

export default AgentRepresentationRequests;

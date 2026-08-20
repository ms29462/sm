import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, Users, X, ChevronDown } from 'lucide-react';

const STATUS_COLORS = {
  submitted: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  under_review: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  interested: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

const AcademyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [pendingOpportunityId, setPendingOpportunityId] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [appsRes, playersRes] = await Promise.all([
        api.getAcademyApplications(),
        api.getAcademyPlayers(),
      ]);
      setApplications(appsRes.data || []);
      setPlayers(playersRes.data || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const openApplyModal = (opportunityId) => {
    if (players.length === 0) { toast.error('Add players to your academy before applying'); return; }
    setPendingOpportunityId(opportunityId);
    setSelectedPlayerId(players[0]?.user_id || '');
    setShowPlayerModal(true);
  };

  const handleApply = async () => {
    if (!selectedPlayerId || !pendingOpportunityId) return;
    setApplying(true);
    try {
      await api.createAcademyApplication({ opportunity_id: pendingOpportunityId, player_id: selectedPlayerId });
      toast.success('Application submitted!');
      setShowPlayerModal(false);
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to apply');
    } finally { setApplying(false); }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="text-primary text-xl font-heading">LOADING...</div></div>;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">APPLICATIONS</h1>
        <p className="text-muted-foreground">Track applications submitted on behalf of your players</p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No applications yet</p>
          <p className="text-xs text-muted-foreground mt-2">Apply to opportunities from the Opportunities page</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className="bg-card border border-border/50 p-6 rounded-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-heading font-bold uppercase text-base mb-1">
                    {app.opportunity_title || app.position || 'Opportunity'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    {app.club_name || 'Club'} {app.club_country ? `· ${app.club_country}` : ''}
                  </p>
                  {app.player_name && (
                    <p className="text-xs text-primary">Player: {app.player_name}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs uppercase tracking-wider border rounded-sm font-bold ${STATUS_COLORS[app.status] || STATUS_COLORS.submitted}`}>
                  {(app.status || 'submitted').replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Player selection modal */}
      {showPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="bg-card border border-border/50 rounded-sm w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-heading font-bold uppercase">Select Player to Apply</h2>
              <button onClick={() => setShowPlayerModal(false)} className="text-muted-foreground hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">Choose which player from your academy to submit for this opportunity.</p>
              <div className="relative mb-6">
                <select
                  value={selectedPlayerId}
                  onChange={e => setSelectedPlayerId(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-sm h-12 px-3 pr-10 text-sm text-white outline-none appearance-none cursor-pointer focus:border-primary"
                >
                  {players.map(p => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.name}{p.position ? ` — ${p.position}` : ''}{p.age ? ` (${p.age}y)` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {selectedPlayerId && (() => {
                const p = players.find(x => x.user_id === selectedPlayerId);
                if (!p) return null;
                return (
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-sm mb-6">
                    {p.profile_picture ? (
                      <img src={p.profile_picture} alt={p.name} className="w-10 h-10 rounded-sm object-cover border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center"><Users className="w-5 h-5 text-muted-foreground" /></div>
                    )}
                    <div>
                      <p className="font-bold text-sm uppercase">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{[p.position, p.nationality, p.playing_level].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                );
              })()}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowPlayerModal(false)} className="flex-1 rounded-sm border-white/20">Cancel</Button>
                <Button onClick={handleApply} disabled={applying || !selectedPlayerId} className="flex-1 bg-primary text-black font-bold rounded-sm hover:bg-primary/90">
                  {applying ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademyApplications;

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Briefcase, Search, X, ChevronDown, Users, Star } from 'lucide-react';

const AcademyOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [applying, setApplying] = useState(false);
  const [creditBalance, setCreditBalance] = useState(null);

  useEffect(() => { loadPlayers(); loadCreditBalance(); }, []);
  useEffect(() => { loadOpportunities(); }, [page]);

  const loadPlayers = async () => {
    try {
      const res = await api.getAcademyPlayers();
      setPlayers(res.data || []);
    } catch {}
  };

  const loadCreditBalance = async () => {
    try {
      const res = await api.getAcademyCredits();
      setCreditBalance(res.data.balance);
    } catch {}
  };

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const res = await api.getOpportunities(page, 10);
      const data = res.data || [];
      setHasMore(data.length === 10);
      setOpportunities(data);
    } catch { toast.error('Failed to load opportunities'); }
    finally { setLoading(false); }
  };

  const openApply = (opp) => {
    if (players.length === 0) { toast.error('Add players to your academy first'); return; }
    setSelectedOpp(opp);
    setSelectedPlayerId(players[0]?.user_id || '');
    setShowModal(true);
  };

  const handleApply = async () => {
    if (!selectedPlayerId || !selectedOpp) return;
    setApplying(true);
    try {
      await api.createAcademyApplication({ opportunity_id: selectedOpp.id, player_id: selectedPlayerId });
      toast.success('Application submitted!');
      setShowModal(false);
      loadCreditBalance();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to apply');
    } finally { setApplying(false); }
  };

  const displayed = search
    ? opportunities.filter(o =>
        o.position?.toLowerCase().includes(search.toLowerCase()) ||
        o.country?.toLowerCase().includes(search.toLowerCase()) ||
        o.club_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.league_level?.toLowerCase().includes(search.toLowerCase())
      )
    : opportunities;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">OPPORTUNITIES</h1>
          <p className="text-muted-foreground">Browse and apply on behalf of your players</p>
        </div>
        {creditBalance !== null && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-sm px-4 py-2">
            <Star className="w-4 h-4 text-primary" />
            <span className="font-bold text-primary text-sm">{creditBalance}</span>
            <span className="text-xs text-muted-foreground">credits</span>
          </div>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by position, country, league..."
          className="pl-12 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center"><div className="text-primary text-xl font-heading">LOADING...</div></div>
      ) : displayed.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No opportunities found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(opp => (
            <div key={opp.id} className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-heading font-bold uppercase text-base">{opp.country || opp.club_country || 'International'}</h3>
                    <span className="bg-white/10 text-white border border-white/20 uppercase text-[10px] tracking-wider px-2 py-0.5">{opp.position}</span>
                    {(opp.status === 'closed' || opp.status === 'filled') && (
                      <span className={`uppercase text-[10px] px-2 py-0.5 border rounded-sm font-bold ${opp.status === 'filled' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {opp.status === 'filled' ? 'Filled' : 'Closed'}
                      </span>
                    )}
                  </div>
                  {opp.club_name && opp.club_id !== 'anonymous' && (
                    <p className="text-sm text-primary font-medium mb-1">{opp.club_name}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {opp.league_level && <span>League: {opp.league_level}</span>}
                    {opp.salary_range && <span>Salary: {opp.salary_range}</span>}
                    {opp.contract_duration && <span>Duration: {opp.contract_duration}</span>}
                  </div>
                  {opp.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{opp.description}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {opp.credit_cost > 0 && (
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-sm border ${creditBalance !== null && creditBalance < opp.credit_cost ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                      <Star className="w-3 h-3" /> {opp.credit_cost} credits
                    </span>
                  )}
                  <Button
                    onClick={() => openApply(opp)}
                    disabled={opp.status === 'closed' || opp.status === 'filled'}
                    className="bg-primary text-black font-bold uppercase text-xs rounded-sm h-10 px-4 hover:bg-primary/90"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 mt-8">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="px-4 py-2 text-sm border border-white/10 rounded-sm disabled:opacity-30 hover:border-white/30 transition-colors">
          Previous
        </button>
        <span className="text-sm text-muted-foreground">Page {page}{!hasMore ? ` / ${page}` : ''}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={!hasMore}
          className="px-4 py-2 text-sm border border-white/10 rounded-sm disabled:opacity-30 hover:border-white/30 transition-colors">
          Next
        </button>
      </div>

      {/* Player selection modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="bg-card border border-border/50 rounded-sm w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-heading font-bold uppercase">Select Player</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Applying for: <span className="text-white font-bold">{selectedOpp?.position}</span></p>
              {selectedOpp?.country && <p className="text-xs text-muted-foreground mb-2">{selectedOpp.country}</p>}
              {selectedOpp?.credit_cost > 0 && (
                <div className={`flex items-center justify-between p-3 rounded-sm border mb-4 ${creditBalance !== null && creditBalance < selectedOpp.credit_cost ? 'bg-red-500/10 border-red-500/30' : 'bg-primary/5 border-primary/20'}`}>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold">Cost: {selectedOpp.credit_cost} credits</span>
                  </div>
                  <span className={`text-sm font-bold ${creditBalance !== null && creditBalance < selectedOpp.credit_cost ? 'text-red-400' : 'text-primary'}`}>
                    Balance: {creditBalance ?? '…'}
                    {creditBalance !== null && creditBalance < selectedOpp.credit_cost && (
                      <span className="ml-2 text-xs font-normal text-red-400">Insufficient</span>
                    )}
                  </span>
                </div>
              )}
              <div className="relative mb-6">
                <select value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-sm h-12 px-3 pr-10 text-sm text-white outline-none appearance-none cursor-pointer focus:border-primary">
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
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-sm border-white/20">Cancel</Button>
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

export default AcademyOpportunities;

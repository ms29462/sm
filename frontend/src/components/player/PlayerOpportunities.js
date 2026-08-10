import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Briefcase, Search, Target, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import OpportunityCard from '@/components/player/OpportunityCard';

const PlayerOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [matchScores, setMatchScores] = useState({});
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterLeague, setFilterLeague] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({ countries: [], positions: [], leagues: [] });

  // Load dropdown options once on mount
  useEffect(() => {
    api.getOpportunityFilters().then(res => setFilterOptions(res.data)).catch(() => {});
    loadMatchScores();
    loadMyApplications();
  }, []);

  // Reset to page 1 when any server-side filter changes
  useEffect(() => {
    setPage(1);
  }, [filterCountry, filterPosition, filterLeague]);

  // Reload when page or server-side filters change
  useEffect(() => {
    loadOpportunities();
  }, [page, filterCountry, filterPosition, filterLeague]);

  const loadMyApplications = async () => {
    try {
      const res = await api.getMyApplications();
      const ids = new Set((res.data || []).map(a => a.opportunity_id));
      setAppliedIds(ids);
    } catch (e) {}
  };

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const activeFilters = {};
      if (filterCountry) activeFilters.country = filterCountry;
      if (filterPosition) activeFilters.position = filterPosition;
      if (filterLeague) activeFilters.league = filterLeague;
      const response = await api.getOpportunities(page, 5, activeFilters);
      const data = response.data || [];
      setHasMore(data.length === 5);
      setOpportunities(data);
    } catch (error) {
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const loadMatchScores = async () => {
    try {
      const response = await api.getPlayerMatchScores();
      if (response.data.scores && !response.data.error) {
        const scoresMap = {};
        response.data.scores.forEach(score => {
          scoresMap[score.opportunity_id] = score;
        });
        setMatchScores(scoresMap);
      }
    } catch (error) {
      // Silently fail - match scores are optional
    }
  };

  const handleApply = (opportunityId) => {
    // Card already handles the API call and toast - just update local state
    setAppliedIds(prev => new Set([...prev, opportunityId]));
  };

  const getFitScoreColor = (score) => {
    if (score === null || score === undefined) return 'text-muted-foreground';
    if (score >= 75) return 'text-green-500';
    if (score >= 65) return 'text-emerald-500';
    if (score >= 55) return 'text-yellow-500';
    if (score >= 45) return 'text-orange-500';
    return 'text-red-500';
  };

  const getFitScoreBg = (score) => {
    if (score === null || score === undefined) return 'bg-muted/10';
    if (score >= 75) return 'bg-green-500/10';
    if (score >= 65) return 'bg-emerald-500/10';
    if (score >= 55) return 'bg-yellow-500/10';
    if (score >= 45) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

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
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">OPPORTUNITIES</h1>
        <p className="text-muted-foreground">Browse and apply to club opportunities</p>
      </div>

      <div className="mb-6 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                data-testid="search-opportunities-input"
                type="text"
                placeholder="Search by club, position, or league..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(f => !f)}
              className={`rounded-sm h-12 px-4 border-white/20 ${showFilters ? "border-primary text-primary" : "text-muted-foreground"}`}>
              Filters {(filterPosition || filterCountry || filterLeague) ? "●" : ""}
            </Button>
            {(filterPosition || filterCountry || filterLeague) && (
              <Button variant="ghost" onClick={() => { setFilterPosition(""); setFilterCountry(""); setFilterLeague(""); }}
                className="rounded-sm h-12 text-muted-foreground hover:text-white">Clear</Button>
            )}
          </div>
          {showFilters && (
            <div className="bg-card border border-border/50 p-4 rounded-sm grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Country</label>
                <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none appearance-none cursor-pointer">
                  <option value="">All Countries</option>
                  {filterOptions.countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Position</label>
                <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none appearance-none cursor-pointer">
                  <option value="">All Positions</option>
                  {filterOptions.positions.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">League</label>
                <select value={filterLeague} onChange={e => setFilterLeague(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-sm h-10 px-3 text-sm text-white outline-none appearance-none cursor-pointer">
                  <option value="">All Leagues</option>
                  {filterOptions.leagues.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

      {(() => {
        const displayed = searchTerm
          ? opportunities.filter(o =>
              o.club_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              o.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              o.league_level?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : opportunities;
        return displayed.length === 0 ? (
          <div data-testid="no-opportunities" className="bg-card border border-border/50 p-12 rounded-sm text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No opportunities found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayed.map((opp) => {
            const score = matchScores[opp.id];
            return (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                score={score}
                testId={`opportunity-card-${opp.id}`}
                onApply={(id) => handleApply(id)}
                hasApplied={appliedIds.has(opp.id)}
              />
            );
            })}
          </div>
        );
      })()}
      <div className="flex items-center justify-center gap-3 mt-8">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="px-4 py-2 text-sm border border-white/10 rounded-sm disabled:opacity-30 hover:border-white/30 transition-colors">
          Previous
        </button>
        <span className="text-sm text-muted-foreground">Page {page}{!hasMore ? ` / ${page}` : ""}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={!hasMore}
          className="px-4 py-2 text-sm border border-white/10 rounded-sm disabled:opacity-30 hover:border-white/30 transition-colors">
          Next
        </button>
      </div>
    </div>
  );
};

export default PlayerOpportunities;
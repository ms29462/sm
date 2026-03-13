import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Briefcase, Search, Target, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

const PlayerOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState([]);
  const [matchScores, setMatchScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOpportunities();
    loadMatchScores();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = opportunities.filter(
        (opp) =>
          opp.club_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opp.league_level.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOpportunities(filtered);
    } else {
      setFilteredOpportunities(opportunities);
    }
  }, [searchTerm, opportunities]);

  const loadOpportunities = async () => {
    try {
      const response = await api.getOpportunities();
      setOpportunities(response.data);
      setFilteredOpportunities(response.data);
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

  const handleApply = async (opportunityId) => {
    try {
      await api.createApplication({ opportunity_id: opportunityId });
      toast.success('Application submitted!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to apply');
    }
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">OPPORTUNITIES</h1>
        <p className="text-muted-foreground">Browse and apply to club opportunities</p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
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
      </div>

      {filteredOpportunities.length === 0 ? (
        <div data-testid="no-opportunities" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No opportunities found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOpportunities.map((opp) => {
            const score = matchScores[opp.id];
            return (
              <div
                key={opp.id}
                data-testid={`opportunity-card-${opp.id}`}
                className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-heading font-bold uppercase mb-1">{opp.club_name}</h3>
                    <p className="text-sm text-muted-foreground">{opp.club_country || 'International'}</p>
                  </div>
                  <span className="bg-white/10 text-white border border-white/20 uppercase text-[10px] tracking-wider px-2 py-1">
                    {opp.position}
                  </span>
                </div>

                {/* Match Score Badge */}
                {score && score.fit_score !== null && (
                  <div className={`mb-4 p-3 rounded-sm ${getFitScoreBg(score.fit_score)} border border-border/30`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">Match Score</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xl font-heading font-bold ${getFitScoreColor(score.fit_score)}`}>
                          {Math.round(score.fit_score)}
                        </span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-muted-foreground">{score.fit_label}</span>
                      {score.position_match && (
                        <span className="text-primary flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Position match
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">League Level:</span>
                    <span className="font-medium">{opp.league_level}</span>
                  </div>
                  {opp.salary_range && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Salary:</span>
                      <span className="font-medium font-mono">{opp.salary_range}</span>
                    </div>
                  )}
                  {opp.contract_duration && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{opp.contract_duration}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{opp.description}</p>
                <Button
                  data-testid={`apply-btn-${opp.id}`}
                  onClick={() => handleApply(opp.id)}
                  className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-10"
                >
                  APPLY NOW
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlayerOpportunities;
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Briefcase, Search, Target, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import OpportunityCard from '@/components/player/OpportunityCard';

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
              <OpportunityCard
                key={opp.id}
                opp={opp}
                score={score}
                testId={`opportunity-card-${opp.id}`}
                onApply={handleApply}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlayerOpportunities;
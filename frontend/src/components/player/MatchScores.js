import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TrendingUp, AlertCircle, CheckCircle, XCircle, Target, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MatchScores = () => {
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [opportunities, setOpportunities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMatchScores();
  }, []);

  const loadMatchScores = async () => {
    try {
      // First load opportunities to get details
      const oppsResponse = await api.getOpportunities();
      const oppsMap = {};
      oppsResponse.data.forEach(opp => {
        oppsMap[opp.id] = opp;
      });
      setOpportunities(oppsMap);

      // Then load match scores
      const response = await api.getPlayerMatchScores();
      if (response.data.error) {
        setError(response.data.error);
        setScores([]);
      } else {
        // Sort by fit_score descending
        const sortedScores = (response.data.scores || []).sort((a, b) => {
          if (a.fit_score === null) return 1;
          if (b.fit_score === null) return -1;
          return b.fit_score - a.fit_score;
        });
        setScores(sortedScores);
      }
    } catch (err) {
      setError('Failed to load match scores');
      toast.error('Failed to load match scores');
    } finally {
      setLoading(false);
    }
  };

  const getFitScoreColor = (score) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 75) return 'text-green-500';
    if (score >= 65) return 'text-emerald-500';
    if (score >= 55) return 'text-yellow-500';
    if (score >= 45) return 'text-orange-500';
    return 'text-red-500';
  };

  const getFitScoreBg = (score) => {
    if (score === null) return 'bg-muted/20';
    if (score >= 75) return 'bg-green-500/10 border-green-500/20';
    if (score >= 65) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 55) return 'bg-yellow-500/10 border-yellow-500/20';
    if (score >= 45) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getLevelIcon = (label) => {
    if (label === 'Overqualified' || label === 'Above level') {
      return <TrendingUp className="w-4 h-4 text-blue-500" />;
    }
    if (label === 'League level') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (label === 'Borderline') {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">ANALYZING MATCHES...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold uppercase mb-2">MY MATCH SCORES</h1>
          <p className="text-muted-foreground">AI-powered opportunity matching based on your Transfermarkt profile</p>
        </div>
        <div className="bg-card border border-border/50 p-8 rounded-sm text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-lg mb-4">{error}</p>
          <Button onClick={() => navigate('/player/profile')} className="bg-primary text-black">
            UPDATE PROFILE
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">MY MATCH SCORES</h1>
        <p className="text-muted-foreground">AI-powered opportunity matching based on your Transfermarkt profile</p>
      </div>

      {scores.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No opportunities available for matching</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scores.map((score, index) => {
            const opp = opportunities[score.opportunity_id];
            if (!opp) return null;

            return (
              <div
                key={score.opportunity_id}
                data-testid={`match-score-${score.opportunity_id}`}
                className={`bg-card border p-6 rounded-sm ${getFitScoreBg(score.fit_score)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      <h3 className="text-lg font-heading font-bold uppercase">{opp.club_name}</h3>
                      {score.position_match && (
                        <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-sm">
                          POSITION MATCH
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Position</p>
                        <p className="font-medium">{opp.position}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">League</p>
                        <p className="font-medium">{opp.league_level}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Salary</p>
                        <p className="font-medium">{opp.salary_range || 'Not disclosed'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Contract</p>
                        <p className="font-medium">{opp.contract_duration || 'Flexible'}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{opp.description}</p>
                  </div>
                  
                  <div className="ml-6 flex flex-col items-end gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase mb-1">Fit Score</p>
                      <div className={`text-3xl font-heading font-bold ${getFitScoreColor(score.fit_score)}`}>
                        {score.fit_score !== null ? Math.round(score.fit_score) : '--'}
                      </div>
                      <p className="text-xs text-muted-foreground">{score.fit_label}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      {getLevelIcon(score.level_label)}
                      <span className="text-muted-foreground">{score.level_label}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/player/opportunities')}
                      className="border-primary text-primary hover:bg-primary hover:text-black"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      VIEW
                    </Button>
                  </div>
                </div>

                {/* Detailed scores breakdown */}
                {score.fit_score !== null && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Age</p>
                        <p className="font-medium">{score.age_score !== null ? Math.round(score.age_score) : '--'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Value</p>
                        <p className="font-medium">{score.value_score !== null ? Math.round(score.value_score) : '--'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Production</p>
                        <p className="font-medium">{score.production_score !== null ? Math.round(score.production_score) : '--'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">Level</p>
                        <p className="font-medium">{score.level_score !== null ? Math.round(score.level_score) : '--'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchScores;

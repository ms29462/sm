import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TrendingUp, AlertCircle, CheckCircle, XCircle, Target, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SCORES_PER_PAGE = 5;

const InfoBox = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <div className="bg-card border border-border/50 rounded-sm mb-6">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-white/5 transition-colors">
        <span className="flex items-center gap-2">
          <span className="text-primary">ℹ</span>
          {t('match_scores.how_calculated')}
        </span>
        <span className="text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground space-y-2 border-t border-border/50 pt-3">
          <p>{t('match_scores_extra.how_text_1')}</p>
          <p>{t('match_scores_extra.how_text_2')}</p>
          <p>{t('match_scores_extra.how_text_3')}</p>
          <p>{t('match_scores_extra.how_text_4')}</p>
        </div>
      )}
    </div>
  );
};

const MatchScores = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [scores, setScores] = useState([]);
  const [page, setPage] = useState(1);
  const [opportunities, setOpportunities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMatchScores();
  }, []);

  const loadMatchScores = async () => {
    try {
      // First load opportunities to get details
      const oppsResponse = await api.getOpportunities(1, 100);
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

  const totalPages = Math.max(1, Math.ceil(scores.length / SCORES_PER_PAGE));
  const paginatedScores = scores.slice((page-1)*SCORES_PER_PAGE, page*SCORES_PER_PAGE);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">{t('match_scores_extra.analyzing')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">{t('match_scores.title')}</h1>
          <p className="text-muted-foreground">{t('match_scores_extra.subtitle')}</p>
        </div>
        <InfoBox />
        <div className="bg-card border border-border/50 p-8 rounded-sm text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-lg mb-4">{error}</p>
          <Button onClick={() => navigate('/player/profile')} className="bg-primary text-black">
            {t('match_scores_extra.update_profile')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">{t('match_scores.title')}</h1>
        <p className="text-muted-foreground">{t('match_scores_extra.subtitle')}</p>
      </div>
      <InfoBox />

      {scores.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('match_scores.no_scores')}</p>
        </div>
      ) : (
        <>
        <div className="space-y-4">
          {paginatedScores.map((score, index) => {
            const opp = opportunities[score.opportunity_id] || {};

            return (
              <div
                key={score.opportunity_id}
                data-testid={`match-score-${score.opportunity_id}`}
                className={`bg-card border p-6 rounded-sm ${getFitScoreBg(score.fit_score)}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      <h3 className="text-base font-heading font-bold uppercase">{opp.country || opp.club_country || score.club_name || "Opportunity"}</h3>
                      {score.position_match && (
                        <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-sm">
                          {t('match_scores_extra.position_match_badge')}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">{t('opportunities.position')}</p>
                        <p className="font-medium">{opp.position || score.position || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">{t('opportunities.league')}</p>
                        <p className="font-medium">{opp.league_level || score.league_level || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">{t('opportunities.salary')}</p>
                        <p className="font-medium">{opp.salary_range || t('opp_card.not_disclosed')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">{t('opportunities.duration')}</p>
                        <p className="font-medium">{opp.contract_duration || t('opp_card.flexible')}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{opp.description}</p>
                  </div>
                  
                  <div className="ml-6 flex flex-col items-end gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase mb-1">{t('match_scores_extra.fit_score_label')}</p>
                      <div className={`text-2xl md:text-3xl font-heading font-bold ${getFitScoreColor(score.fit_score)}`}>
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
                      {t('match_scores_extra.view')}
                    </Button>
                  </div>
                </div>

                {/* Detailed scores breakdown */}
                {score.fit_score !== null && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">{t('match_scores_extra.score_age')}</p>
                        <p className="font-medium">{score.age_score !== null ? Math.round(score.age_score) : '--'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">{t('match_scores_extra.score_value')}</p>
                        <p className="font-medium">{score.value_score !== null ? Math.round(score.value_score) : '--'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">{t('match_scores_extra.score_production')}</p>
                        <p className="font-medium">{score.production_score !== null ? Math.round(score.production_score) : '--'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">{t('match_scores_extra.score_level')}</p>
                        <p className="font-medium">{score.level_score !== null ? Math.round(score.level_score) : '--'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="px-4 py-2 text-sm border border-white/10 rounded-sm disabled:opacity-30 hover:border-white/30 transition-colors">
              {t('opportunities.previous')}
            </button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="px-4 py-2 text-sm border border-white/10 rounded-sm disabled:opacity-30 hover:border-white/30 transition-colors">
              {t('opportunities.next')}
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
};

export default MatchScores;

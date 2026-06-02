import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, TrendingUp, Award, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const AnalystDashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, evalsRes, profileRes] = await Promise.all([
          api.getAnalystStats(),
          api.getAnalystEvaluations(),
          api.getAnalystProfile()
        ]);
        setStats(statsRes.data);
        setRecentEvaluations(evalsRes.data.slice(0, 5));
        setProfile(profileRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRecommendationLabel = (rec) => {
    const labels = {
      'strongly_recommend': { text: 'Fortement recommandé', color: 'text-emerald-400 bg-emerald-400/10' },
      'recommend': { text: 'Recommandé', color: 'text-green-400 bg-green-400/10' },
      'monitor': { text: 'À surveiller', color: 'text-amber-400 bg-amber-400/10' },
      'further_evaluation': { text: 'Évaluation supplémentaire', color: 'text-orange-400 bg-orange-400/10' },
      'not_recommended': { text: 'Non recommandé', color: 'text-red-400 bg-red-400/10' }
    };
    return labels[rec] || { text: rec, color: 'text-gray-400 bg-gray-400/10' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">
            Bienvenue, {profile?.name || 'Analyste'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Votre espace d'analyse et de scouting professionnel
          </p>
        </div>
        <Link to="/analyst/players">
          <Button className="bg-primary text-black hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Évaluation
          </Button>
        </Link>
      </div>

      {/* Approval Warning */}
      {profile && !profile.approved && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-amber-400">Compte en attente d'approbation</p>
                <p className="text-sm text-muted-foreground">
                  Votre compte doit être approuvé par un administrateur avant de pouvoir créer des évaluations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Évaluations</p>
                <p className="text-4xl font-bold mt-2">{stats?.total_evaluations || 0}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <FileText className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Joueurs Évalués</p>
                <p className="text-4xl font-bold mt-2">{stats?.players_evaluated || 0}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Recommandés</p>
                <p className="text-4xl font-bold mt-2">
                  {(stats?.recommendations_breakdown?.strongly_recommend || 0) + 
                   (stats?.recommendations_breakdown?.recommend || 0)}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Evaluations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-heading">Évaluations Récentes</CardTitle>
          <Link to="/analyst/evaluations">
            <Button variant="ghost" size="sm" className="text-primary">
              Voir tout <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentEvaluations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune évaluation pour le moment</p>
              <Link to="/analyst/players">
                <Button variant="link" className="text-primary mt-2">
                  Commencer une évaluation
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvaluations.map((evaluation) => {
                const rec = getRecommendationLabel(evaluation.recommendation);
                return (
                  <Link
                    key={evaluation.id}
                    to={`/analyst/evaluation/${evaluation.id}`}
                    className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-zinc-700/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{evaluation.player_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {evaluation.match_description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">{evaluation.technical_score}/10</p>
                        <p className="text-xs text-muted-foreground">Technique</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${rec.color}`}>
                        {rec.text}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalystDashboardHome;

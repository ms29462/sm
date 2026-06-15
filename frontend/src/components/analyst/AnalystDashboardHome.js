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
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRecommendationLabel = (rec) => {
    const labels = {
      'strongly_recommend': { text: 'Strongly Recommend', color: 'text-emerald-400 bg-emerald-400/10' },
      'recommend': { text: 'Recommend', color: 'text-green-400 bg-green-400/10' },
      'monitor': { text: 'Monitor', color: 'text-amber-400 bg-amber-400/10' },
      'further_evaluation': { text: 'Further Evaluation', color: 'text-orange-400 bg-orange-400/10' },
      'not_recommended': { text: 'Not Recommended', color: 'text-red-400 bg-red-400/10' }
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
    <div className="space-y-6 lg:space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl lg:text-2xl md:text-3xl font-heading font-bold">
            Welcome, {profile?.name || 'Analyst'}
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-1">
            Your professional scouting and analysis workspace
          </p>
        </div>
        <Link to="/analyst/players" className="w-full sm:w-auto">
          <Button className="bg-primary text-black hover:bg-primary/90 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Evaluation
          </Button>
        </Link>
      </div>

      {/* Approval Warning */}
      {profile && !profile.approved && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="py-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-amber-400">Account Pending Approval</p>
                <p className="text-sm text-muted-foreground">
                  Your account must be approved by an administrator before you can create evaluations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground uppercase tracking-wide">Evaluations</p>
                <p className="text-3xl lg:text-4xl font-bold mt-2">{stats?.total_evaluations || 0}</p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 lg:w-7 lg:h-7 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground uppercase tracking-wide">Players Evaluated</p>
                <p className="text-3xl lg:text-4xl font-bold mt-2">{stats?.players_evaluated || 0}</p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 lg:w-7 lg:h-7 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border-purple-500/20 sm:col-span-2 lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground uppercase tracking-wide">Recommended</p>
                <p className="text-3xl lg:text-4xl font-bold mt-2">
                  {(stats?.recommendations_breakdown?.strongly_recommend || 0) + 
                   (stats?.recommendations_breakdown?.recommend || 0)}
                </p>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 lg:w-7 lg:h-7 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Evaluations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base lg:text-lg font-heading">Recent Evaluations</CardTitle>
          <Link to="/analyst/evaluations">
            <Button variant="ghost" size="sm" className="text-primary text-xs lg:text-sm">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentEvaluations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm lg:text-base">No evaluations yet</p>
              <Link to="/analyst/players">
                <Button variant="link" className="text-primary mt-2 text-sm">
                  Start an evaluation
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
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 lg:p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-zinc-700/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm lg:text-base">{evaluation.player_name}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground truncate">
                        {evaluation.match_description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-medium">{evaluation.technical_score}/10</p>
                        <p className="text-xs text-muted-foreground">Technical</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${rec.color}`}>
                        {rec.text}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
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

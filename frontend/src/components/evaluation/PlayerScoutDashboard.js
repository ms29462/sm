import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, User, Calendar, MapPin, Flag, Trophy, Target, Zap, Brain,
  TrendingUp, TrendingDown, Award, FileText, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import PlayerRadarChart from '@/components/evaluation/PlayerRadarChart';

const PlayerScoutDashboard = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.getPlayerDashboard(playerId);
        setDashboard(response.data);
      } catch (error) {
        toast.error('Erreur lors du chargement');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [playerId, navigate]);

  const getPlayerName = () => {
    if (!dashboard?.player) return 'Joueur';
    const p = dashboard.player;
    return `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || 'Joueur';
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboard) return null;

  const { player, average_scores, evolution, archetypes, top_strengths, development_areas, all_evaluations } = dashboard;
  const age = calculateAge(player?.date_of_birth);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold">{getPlayerName()}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            {player?.position && <span>{player.position}</span>}
            {age && <span>{age} ans</span>}
            {player?.nationality && (
              <span className="flex items-center gap-1">
                <Flag className="w-3 h-3" />
                {player.nationality}
              </span>
            )}
            {player?.current_club && <span>{player.current_club}</span>}
          </div>
        </div>
        <Link to={`/analyst/evaluate/${playerId}`}>
          <Button className="bg-primary text-black hover:bg-primary/90">
            Nouvelle Évaluation
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 border-emerald-500/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase">Évaluations</p>
            <p className="text-3xl font-bold mt-1">{dashboard.evaluations_count}</p>
          </CardContent>
        </Card>
        {average_scores && (
          <>
            <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border-blue-500/20">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase">Technique Moy.</p>
                <p className="text-3xl font-bold mt-1 text-blue-400">{average_scores.technical}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border-purple-500/20">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase">Mental Moy.</p>
                <p className="text-3xl font-bold mt-1 text-purple-400">{average_scores.mental}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-600/20 to-orange-800/10 border-orange-500/20">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase">Physique Moy.</p>
                <p className="text-3xl font-bold mt-1 text-orange-400">{average_scores.physical}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart - Latest */}
        {dashboard.latest_evaluation && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profil Actuel (Dernière Évaluation)</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayerRadarChart evaluation={dashboard.latest_evaluation} />
            </CardContent>
          </Card>
        )}

        {/* Archetypes & Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil du Joueur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Archetypes */}
            {archetypes?.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Archétypes
                </p>
                <div className="flex flex-wrap gap-2">
                  {archetypes.map((arch, idx) => (
                    <Badge key={idx} variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      {arch}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {top_strengths?.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Points Forts
                </p>
                <div className="space-y-1">
                  {top_strengths.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                        {idx + 1}
                      </div>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Development Areas */}
            {development_areas?.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                  Axes d'Amélioration
                </p>
                <div className="space-y-1">
                  {development_areas.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs">
                        {idx + 1}
                      </div>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Evolution Chart */}
      {evolution?.has_evolution && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Progression dans le Temps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolution.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #3f3f46',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(val) => new Date(val).toLocaleDateString('fr-FR')}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="technical" name="Technique" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="tactical" name="Tactique" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="physical" name="Physique" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="mental" name="Mental" stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Evolution Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-zinc-800">
              {Object.entries(evolution.categories).map(([key, data]) => {
                const isPositive = data.change >= 0;
                const labels = {
                  technical: 'Technique',
                  tactical: 'Tactique',
                  physical: 'Physique',
                  mental: 'Mental'
                };
                return (
                  <div key={key} className="text-center">
                    <p className="text-xs text-muted-foreground">{labels[key]}</p>
                    <p className="text-lg font-bold">
                      {data.first} → {data.last}
                    </p>
                    <p className={`text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{data.change}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Evaluations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Historique des Évaluations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {all_evaluations?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucune évaluation pour ce joueur</p>
          ) : (
            <div className="space-y-3">
              {all_evaluations?.map((evaluation) => (
                <Link
                  key={evaluation.id}
                  to={`/analyst/evaluation/${evaluation.id}`}
                  className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-zinc-700/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{evaluation.match_description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(evaluation.match_date).toLocaleDateString('fr-FR')} • {evaluation.analyst_name}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-400">{evaluation.technical_score}</p>
                      <p className="text-xs text-muted-foreground">Tech</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-400">{evaluation.tactical_score}</p>
                      <p className="text-xs text-muted-foreground">Tact</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-400">{evaluation.mental_score}</p>
                      <p className="text-xs text-muted-foreground">Ment</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerScoutDashboard;

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, User, Flag, Trophy, Target, Zap, Brain,
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
        toast.error('Failed to load dashboard');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [playerId, navigate]);

  const getPlayerName = () => {
    if (!dashboard?.player) return 'Player';
    const p = dashboard.player;
    return `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || 'Player';
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
    <div className="space-y-4 lg:space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg lg:text-2xl font-heading font-bold truncate">{getPlayerName()}</h1>
          <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-muted-foreground mt-1">
            {player?.position && <span>{player.position}</span>}
            {age && <span>{age} yrs</span>}
            {player?.nationality && (
              <span className="flex items-center gap-1">
                <Flag className="w-3 h-3" />
                {player.nationality}
              </span>
            )}
            {player?.current_club && <span className="truncate">{player.current_club}</span>}
          </div>
        </div>
        <Link to={`/analyst/evaluate/${playerId}`} className="w-full sm:w-auto">
          <Button className="bg-primary text-black hover:bg-primary/90 w-full sm:w-auto">
            New Evaluation
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/10 border-emerald-500/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase">Evaluations</p>
            <p className="text-2xl lg:text-3xl font-bold mt-1">{dashboard.evaluations_count}</p>
          </CardContent>
        </Card>
        {average_scores && (
          <>
            <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border-blue-500/20">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase">Avg Technical</p>
                <p className="text-2xl lg:text-3xl font-bold mt-1 text-blue-400">{average_scores.technical}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border-purple-500/20">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase">Avg Mental</p>
                <p className="text-2xl lg:text-3xl font-bold mt-1 text-purple-400">{average_scores.mental}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-600/20 to-orange-800/10 border-orange-500/20">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase">Avg Physical</p>
                <p className="text-2xl lg:text-3xl font-bold mt-1 text-orange-400">{average_scores.physical}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Radar Chart - Latest */}
        {dashboard.latest_evaluation && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm lg:text-base">Current Profile (Latest Evaluation)</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayerRadarChart evaluation={dashboard.latest_evaluation} />
            </CardContent>
          </Card>
        )}

        {/* Archetypes & Strengths */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm lg:text-base">Player Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Archetypes */}
            {archetypes?.length > 0 && (
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Archetypes
                </p>
                <div className="flex flex-wrap gap-1.5 lg:gap-2">
                  {archetypes.map((arch, idx) => (
                    <Badge key={idx} variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                      {arch}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {top_strengths?.length > 0 && (
              <div>
                <p className="text-xs lg:text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Top Strengths
                </p>
                <div className="space-y-1">
                  {top_strengths.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs lg:text-sm">
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
                <p className="text-xs lg:text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                  Development Areas
                </p>
                <div className="space-y-1">
                  {development_areas.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs lg:text-sm">
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm lg:text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Progression Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] lg:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolution.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#a1a1aa', fontSize: 10 }}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    tick={{ fill: '#a1a1aa', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelFormatter={(val) => new Date(val).toLocaleDateString('en-US')}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="technical" name="Technical" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="tactical" name="Tactical" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="physical" name="Physical" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="mental" name="Mental" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Evolution Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mt-4 pt-4 border-t border-zinc-800">
              {Object.entries(evolution.categories).map(([key, data]) => {
                const isPositive = data.change >= 0;
                const labels = {
                  technical: 'Technical',
                  tactical: 'Tactical',
                  physical: 'Physical',
                  mental: 'Mental'
                };
                return (
                  <div key={key} className="text-center">
                    <p className="text-xs text-muted-foreground">{labels[key]}</p>
                    <p className="text-sm lg:text-lg font-bold">
                      {data.first} → {data.last}
                    </p>
                    <p className={`text-xs lg:text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
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
        <CardHeader className="pb-2">
          <CardTitle className="text-sm lg:text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Evaluation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {all_evaluations?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">No evaluations for this player</p>
          ) : (
            <div className="space-y-2 lg:space-y-3">
              {all_evaluations?.map((evaluation) => (
                <Link
                  key={evaluation.id}
                  to={`/analyst/evaluation/${evaluation.id}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 lg:gap-4 p-3 lg:p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-zinc-700/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{evaluation.match_description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(evaluation.match_date).toLocaleDateString('en-US')} • {evaluation.analyst_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 lg:gap-4">
                    <div className="hidden md:flex items-center gap-3 lg:gap-4">
                      <div className="text-center">
                        <p className="text-base lg:text-lg font-bold text-emerald-400">{evaluation.technical_score}</p>
                        <p className="text-xs text-muted-foreground">Tech</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base lg:text-lg font-bold text-blue-400">{evaluation.tactical_score}</p>
                        <p className="text-xs text-muted-foreground">Tact</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base lg:text-lg font-bold text-purple-400">{evaluation.mental_score}</p>
                        <p className="text-xs text-muted-foreground">Ment</p>
                      </div>
                    </div>
                    {/* Mobile scores */}
                    <div className="flex md:hidden items-center gap-2 text-xs">
                      <span className="text-emerald-400">{evaluation.technical_score}</span>
                      <span className="text-blue-400">{evaluation.tactical_score}</span>
                      <span className="text-purple-400">{evaluation.mental_score}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
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

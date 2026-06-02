import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, Calendar, Clock, MapPin, Trophy, Target, Zap, Brain,
  FileText, Video, Download, RotateCw, User, Award, TrendingUp, TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import PlayerRadarChart from '@/components/evaluation/PlayerRadarChart';
import PlayerSilhouette from '@/components/evaluation/PlayerSilhouette';

const EvaluationView = () => {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        const response = await api.getEvaluation(evaluationId);
        setEvaluation(response.data);
      } catch (error) {
        toast.error('Évaluation non trouvée');
        navigate('/analyst/evaluations');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluation();
  }, [evaluationId, navigate]);

  const handleRegenerateReport = async () => {
    setRegenerating(true);
    try {
      const response = await api.regenerateReport(evaluationId);
      setEvaluation(response.data);
      toast.success('Rapport régénéré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la régénération');
    } finally {
      setRegenerating(false);
    }
  };

  const getRecommendationBadge = (rec) => {
    const badges = {
      'strongly_recommend': { label: 'Fortement Recommandé', className: 'bg-emerald-500 text-white' },
      'recommend': { label: 'Recommandé', className: 'bg-green-500 text-white' },
      'monitor': { label: 'À Surveiller', className: 'bg-amber-500 text-black' },
      'further_evaluation': { label: 'Évaluation Supplémentaire', className: 'bg-orange-500 text-white' },
      'not_recommended': { label: 'Non Recommandé', className: 'bg-red-500 text-white' }
    };
    return badges[rec] || { label: rec, className: 'bg-gray-500 text-white' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!evaluation) return null;

  const recBadge = getRecommendationBadge(evaluation.recommendation);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold">Rapport d'Évaluation</h1>
            <p className="text-muted-foreground text-sm">
              Par {evaluation.analyst_name} • {new Date(evaluation.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRegenerateReport} disabled={regenerating}>
            <RotateCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
            Régénérer IA
          </Button>
          <Link to={`/analyst/player/${evaluation.player_id}/dashboard`}>
            <Button variant="outline">
              <User className="w-4 h-4 mr-2" />
              Voir Profil Complet
            </Button>
          </Link>
        </div>
      </div>

      {/* Player Info & Match */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Informations du Match
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Match</p>
              <p className="font-medium">{evaluation.match_description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(evaluation.match_date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Minutes</p>
                <p className="font-medium">{evaluation.minutes_played}'</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Position</p>
              <p className="font-medium">{evaluation.position_played}</p>
            </div>
            <div className="pt-2">
              <Badge className={`${recBadge.className} text-sm px-3 py-1`}>
                {recBadge.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Scores Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Scores par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Technique', score: evaluation.technical_score, color: 'emerald', icon: Trophy },
                { label: 'Tactique', score: evaluation.tactical_score, color: 'blue', icon: Target },
                { label: 'Physique', score: evaluation.physical_score, color: 'orange', icon: Zap },
                { label: 'Mental', score: evaluation.mental_score, color: 'purple', icon: Brain },
                { label: 'Attaque', score: evaluation.attacking_score, color: 'red', icon: TrendingUp },
                { label: 'Défense', score: evaluation.defending_score, color: 'cyan', icon: TrendingDown }
              ].map(cat => (
                <div key={cat.label} className="text-center p-4 rounded-lg bg-zinc-800/50">
                  <cat.icon className={`w-5 h-5 mx-auto mb-2 text-${cat.color}-400`} />
                  <p className={`text-3xl font-bold text-${cat.color}-400`}>{cat.score}</p>
                  <p className="text-xs text-muted-foreground mt-1">{cat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerRadarChart evaluation={evaluation} />
          </CardContent>
        </Card>

        {/* Player Silhouette */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zones de Force</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerSilhouette evaluation={evaluation} />
          </CardContent>
        </Card>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Points Forts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {evaluation.top_strengths?.map((strength, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-emerald-100">{strength}</span>
                </div>
              ))}
              {(!evaluation.top_strengths || evaluation.top_strengths.length === 0) && (
                <p className="text-muted-foreground text-sm">Aucune force identifiée</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Development Areas */}
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              Axes d'Amélioration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {evaluation.development_areas?.map((area, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-amber-100">{area}</span>
                </div>
              ))}
              {(!evaluation.development_areas || evaluation.development_areas.length === 0) && (
                <p className="text-muted-foreground text-sm">Aucun axe identifié</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Archetypes */}
      {evaluation.archetypes?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Archétypes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {evaluation.archetypes.map((arch, idx) => (
                <Badge key={idx} variant="outline" className="bg-primary/10 text-primary border-primary/30 px-3 py-1">
                  {arch}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Rapport Détaillé
            {evaluation.ai_report_generated && (
              <Badge variant="outline" className="ml-2 text-xs">Généré par IA</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
              <TabsTrigger value="summary" className="text-xs">Résumé</TabsTrigger>
              <TabsTrigger value="tactical" className="text-xs">Tactique</TabsTrigger>
              <TabsTrigger value="physical" className="text-xs">Physique</TabsTrigger>
              <TabsTrigger value="mental" className="text-xs">Mental</TabsTrigger>
              <TabsTrigger value="recommendation" className="text-xs">Recommandation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="mt-4 space-y-4">
              {evaluation.executive_summary && (
                <div>
                  <h4 className="font-medium mb-2">Résumé Exécutif</h4>
                  <p className="text-muted-foreground whitespace-pre-line">{evaluation.executive_summary}</p>
                </div>
              )}
              {evaluation.strengths_notes && (
                <div>
                  <h4 className="font-medium mb-2">Analyse des Forces</h4>
                  <p className="text-muted-foreground whitespace-pre-line">{evaluation.strengths_notes}</p>
                </div>
              )}
              {evaluation.weaknesses_notes && (
                <div>
                  <h4 className="font-medium mb-2">Analyse des Faiblesses</h4>
                  <p className="text-muted-foreground whitespace-pre-line">{evaluation.weaknesses_notes}</p>
                </div>
              )}
              {!evaluation.executive_summary && !evaluation.strengths_notes && (
                <p className="text-muted-foreground">Aucun résumé disponible</p>
              )}
            </TabsContent>
            
            <TabsContent value="tactical" className="mt-4">
              {evaluation.tactical_analysis ? (
                <p className="text-muted-foreground whitespace-pre-line">{evaluation.tactical_analysis}</p>
              ) : (
                <p className="text-muted-foreground">Aucune analyse tactique disponible</p>
              )}
            </TabsContent>
            
            <TabsContent value="physical" className="mt-4">
              {evaluation.physical_analysis ? (
                <p className="text-muted-foreground whitespace-pre-line">{evaluation.physical_analysis}</p>
              ) : (
                <p className="text-muted-foreground">Aucune analyse physique disponible</p>
              )}
            </TabsContent>
            
            <TabsContent value="mental" className="mt-4">
              {evaluation.mental_analysis ? (
                <p className="text-muted-foreground whitespace-pre-line">{evaluation.mental_analysis}</p>
              ) : (
                <p className="text-muted-foreground">Aucune analyse mentale disponible</p>
              )}
            </TabsContent>
            
            <TabsContent value="recommendation" className="mt-4 space-y-4">
              {evaluation.development_potential && (
                <div>
                  <h4 className="font-medium mb-2">Potentiel de Développement</h4>
                  <p className="text-muted-foreground whitespace-pre-line">{evaluation.development_potential}</p>
                </div>
              )}
              {evaluation.recruitment_recommendation && (
                <div>
                  <h4 className="font-medium mb-2">Recommandation Recrutement</h4>
                  <p className="text-muted-foreground whitespace-pre-line">{evaluation.recruitment_recommendation}</p>
                </div>
              )}
              {evaluation.key_match_actions && (
                <div>
                  <h4 className="font-medium mb-2">Actions Clés du Match</h4>
                  <p className="text-muted-foreground whitespace-pre-line">{evaluation.key_match_actions}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Video References */}
      {evaluation.video_references?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              Références Vidéo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluation.video_references.map((video, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{video.title || `Vidéo ${idx + 1}`}</p>
                    <Badge variant="outline">
                      {video.video_type === 'full_match' ? 'Match Complet' : 
                       video.video_type === 'highlights' ? 'Highlights' : 'Externe'}
                    </Badge>
                  </div>
                  <a 
                    href={video.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {video.url}
                  </a>
                  {video.timestamps?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Timestamps</p>
                      {video.timestamps.map((ts, tsIdx) => (
                        <p key={tsIdx} className="text-sm">
                          <span className="text-primary font-mono">{ts.time}</span> - {ts.action}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EvaluationView;

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, Calendar, Trophy, Target, Zap, Brain,
  FileText, Video, Download, User, Award, TrendingUp, TrendingDown
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
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        const response = await api.getEvaluation(evaluationId);
        setEvaluation(response.data);
      } catch (error) {
        toast.error('Evaluation not found');
        navigate('/analyst/evaluations');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluation();
  }, [evaluationId, navigate]);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await api.exportEvaluationPDF(evaluationId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evaluation_${evaluationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const getRecommendationBadge = (rec) => {
    const badges = {
      'strongly_recommend': { label: 'Strongly Recommend', className: 'bg-emerald-500 text-white' },
      'recommend': { label: 'Recommend', className: 'bg-green-500 text-white' },
      'monitor': { label: 'Monitor', className: 'bg-amber-500 text-black' },
      'further_evaluation': { label: 'Further Evaluation', className: 'bg-orange-500 text-white' },
      'not_recommended': { label: 'Not Recommended', className: 'bg-red-500 text-white' }
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
    <div className="space-y-4 lg:space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 lg:gap-4">
        <div className="flex items-center gap-2 lg:gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-lg lg:text-2xl font-heading font-bold">Evaluation Report</h1>
            <p className="text-xs lg:text-sm text-muted-foreground">
              By {evaluation.analyst_name} • {new Date(evaluation.created_at).toLocaleDateString('en-US')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportPDF} 
            disabled={exporting}
            className="flex-1 sm:flex-none"
          >
            <Download className={`w-4 h-4 mr-1 lg:mr-2 ${exporting ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export PDF'}</span>
            <span className="sm:hidden">PDF</span>
          </Button>
          <Link to={`/analyst/player/${evaluation.player_id}/dashboard`}>
            <Button variant="outline" size="sm">
              <User className="w-4 h-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Full Profile</span>
              <span className="sm:hidden">Profile</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Player Info & Match */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Match Info */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm lg:text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Match Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 lg:space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Match</p>
              <p className="font-medium text-sm lg:text-base">{evaluation.match_description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium text-sm">{new Date(evaluation.match_date).toLocaleDateString('en-US')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Minutes</p>
                <p className="font-medium text-sm">{evaluation.minutes_played}'</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Position</p>
              <p className="font-medium text-sm">{evaluation.position_played}</p>
            </div>
            <div className="pt-2">
              <Badge className={`${recBadge.className} text-xs lg:text-sm px-2 lg:px-3 py-1`}>
                {recBadge.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Scores Overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm lg:text-base">Category Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 lg:gap-4">
              {[
                { label: 'Technical', score: evaluation.technical_score, color: 'emerald', icon: Trophy },
                { label: 'Tactical', score: evaluation.tactical_score, color: 'blue', icon: Target },
                { label: 'Physical', score: evaluation.physical_score, color: 'orange', icon: Zap },
                { label: 'Mental', score: evaluation.mental_score, color: 'purple', icon: Brain },
                { label: 'Attacking', score: evaluation.attacking_score, color: 'red', icon: TrendingUp },
                { label: 'Defending', score: evaluation.defending_score, color: 'cyan', icon: TrendingDown }
              ].map(cat => (
                <div key={cat.label} className="text-center p-2 lg:p-4 rounded-lg bg-zinc-800/50">
                  <cat.icon className={`w-4 h-4 lg:w-5 lg:h-5 mx-auto mb-1 lg:mb-2 text-${cat.color}-400`} />
                  <p className={`text-xl lg:text-3xl font-bold text-${cat.color}-400`}>{cat.score}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 lg:mt-1">{cat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm lg:text-base">Radar Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerRadarChart evaluation={evaluation} />
          </CardContent>
        </Card>

        {/* Player Silhouette */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm lg:text-base">Strength Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerSilhouette evaluation={evaluation} />
          </CardContent>
        </Card>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {/* Strengths */}
        <Card className="border-emerald-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm lg:text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Top Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {evaluation.top_strengths?.map((strength, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10">
                  <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-sm text-emerald-100">{strength}</span>
                </div>
              ))}
              {(!evaluation.top_strengths || evaluation.top_strengths.length === 0) && (
                <p className="text-muted-foreground text-sm">No significant strengths identified</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Development Areas */}
        <Card className="border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm lg:text-base flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              Development Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {evaluation.development_areas?.map((area, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10">
                  <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-sm text-amber-100">{area}</span>
                </div>
              ))}
              {(!evaluation.development_areas || evaluation.development_areas.length === 0) && (
                <p className="text-muted-foreground text-sm">No significant areas identified</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Archetypes */}
      {evaluation.archetypes?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm lg:text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Archetypes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {evaluation.archetypes.map((arch, idx) => (
                <Badge key={idx} variant="outline" className="bg-primary/10 text-primary border-primary/30 px-2 lg:px-3 py-1 text-xs lg:text-sm">
                  {arch}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Tabs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm lg:text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Detailed Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto">
              <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
              <TabsTrigger value="tactical" className="text-xs">Tactical</TabsTrigger>
              <TabsTrigger value="physical" className="text-xs">Physical</TabsTrigger>
              <TabsTrigger value="mental" className="text-xs hidden md:flex">Mental</TabsTrigger>
              <TabsTrigger value="recommendation" className="text-xs hidden md:flex">Recommendation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="mt-4 space-y-4">
              {evaluation.executive_summary && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Executive Summary</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{evaluation.executive_summary}</p>
                </div>
              )}
              {evaluation.strengths_notes && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Strengths Analysis</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{evaluation.strengths_notes}</p>
                </div>
              )}
              {evaluation.weaknesses_notes && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Weaknesses Analysis</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{evaluation.weaknesses_notes}</p>
                </div>
              )}
              {!evaluation.executive_summary && !evaluation.strengths_notes && (
                <p className="text-muted-foreground text-sm">No summary available</p>
              )}
            </TabsContent>
            
            <TabsContent value="tactical" className="mt-4">
              {evaluation.tactical && Object.keys(evaluation.tactical).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(evaluation.tactical).map(([key, data]) => (
                    data?.comment ? (
                      <div key={key} className="p-3 bg-black/20 border border-white/10 rounded-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-xs font-bold text-primary">{data.score}/10</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{data.comment}</p>
                      </div>
                    ) : null
                  ))}
                  {!Object.values(evaluation.tactical).some(d => d?.comment) && (
                    <p className="text-muted-foreground text-sm">No tactical comments available</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No tactical analysis available</p>
              )}
            </TabsContent>
            
            <TabsContent value="physical" className="mt-4">
              {evaluation.physical && Object.keys(evaluation.physical).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(evaluation.physical).map(([key, data]) => (
                    data?.comment ? (
                      <div key={key} className="p-3 bg-black/20 border border-white/10 rounded-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-xs font-bold text-primary">{data.score}/10</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{data.comment}</p>
                      </div>
                    ) : null
                  ))}
                  {!Object.values(evaluation.physical).some(d => d?.comment) && (
                    <p className="text-muted-foreground text-sm">No physical comments available</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No physical analysis available</p>
              )}
            </TabsContent>
            
            <TabsContent value="mental" className="mt-4">
              {evaluation.mental && Object.keys(evaluation.mental).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(evaluation.mental).map(([key, data]) => (
                    data?.comment ? (
                      <div key={key} className="p-3 bg-black/20 border border-white/10 rounded-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-xs font-bold text-primary">{data.score}/10</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{data.comment}</p>
                      </div>
                    ) : null
                  ))}
                  {!Object.values(evaluation.mental).some(d => d?.comment) && (
                    <p className="text-muted-foreground text-sm">No mental comments available</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No mental analysis available</p>
              )}
            </TabsContent>
            
            <TabsContent value="recommendation" className="mt-4 space-y-4">
              {evaluation.development_potential && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Development Potential</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{evaluation.development_potential}</p>
                </div>
              )}
              {evaluation.recruitment_recommendation && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Recruitment Recommendation</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{evaluation.recruitment_recommendation}</p>
                </div>
              )}
              {evaluation.key_match_actions && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Key Match Actions</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{evaluation.key_match_actions}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Video References */}
      {evaluation.video_references?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm lg:text-base flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              Video References
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 lg:space-y-4">
              {evaluation.video_references.map((video, idx) => (
                <div key={idx} className="p-3 lg:p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <p className="font-medium text-sm">{video.title || `Video ${idx + 1}`}</p>
                    <Badge variant="outline" className="w-fit text-xs">
                      {video.video_type === 'full_match' ? 'Full Match' : 
                       video.video_type === 'highlights' ? 'Highlights' : 'External'}
                    </Badge>
                  </div>
                  <a 
                    href={video.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs lg:text-sm text-primary hover:underline break-all"
                  >
                    {video.url}
                  </a>
                  {video.timestamps?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Timestamps</p>
                      {video.timestamps.map((ts, tsIdx) => (
                        <p key={tsIdx} className="text-xs lg:text-sm">
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

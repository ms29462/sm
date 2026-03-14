import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Video, Sparkles, Target, Zap, Brain, Trophy, 
  AlertCircle, CheckCircle, Clock, RefreshCw,
  TrendingUp, Star, Activity
} from 'lucide-react';

const VideoAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState('loading');
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, []);

  useEffect(() => {
    let interval;
    if (polling) {
      interval = setInterval(() => {
        checkStatus();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [polling]);

  const loadAnalysis = async () => {
    try {
      const response = await api.getVideoAnalysis();
      if (response.data.status === 'completed') {
        setAnalysis(response.data);
        setStatus('completed');
      } else if (response.data.status === 'analyzing') {
        setStatus('analyzing');
        setPolling(true);
      } else if (response.data.status === 'failed') {
        setStatus('failed');
        setAnalysis(response.data);
      } else {
        setStatus('not_analyzed');
      }
    } catch (error) {
      setStatus('not_analyzed');
    }
  };

  const checkStatus = async () => {
    try {
      const response = await api.getVideoAnalysisStatus();
      if (response.data.status === 'completed') {
        setPolling(false);
        loadAnalysis();
      } else if (response.data.status === 'failed') {
        setPolling(false);
        setStatus('failed');
        setAnalysis(response.data);
      }
    } catch (error) {
      console.error('Status check failed');
    }
  };

  const handleTriggerAnalysis = async () => {
    try {
      await api.triggerVideoAnalysis();
      toast.success('Video analysis started! This may take a few minutes.');
      setStatus('analyzing');
      setPolling(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start analysis');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getQualityBadge = (quality) => {
    const colors = {
      excellent: 'bg-green-500/10 text-green-500 border-green-500/20',
      good: 'bg-primary/10 text-primary border-primary/20',
      fair: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      poor: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[quality?.toLowerCase()] || colors.fair;
  };

  if (status === 'loading') {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">LOADING...</div>
      </div>
    );
  }

  if (status === 'not_analyzed') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold uppercase mb-2">AI VIDEO ANALYSIS</h1>
          <p className="text-muted-foreground">Get AI-powered insights from your highlight video</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-heading font-bold uppercase mb-4">Analyze Your Highlight Video</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Our AI will analyze your highlight video to assess video quality, technical skills, 
              physical attributes, and identify key moments in your footage.
            </p>
            <Button
              data-testid="trigger-analysis-btn"
              onClick={handleTriggerAnalysis}
              className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 h-12 px-8"
            >
              <Video className="w-5 h-5 mr-2" />
              ANALYZE MY VIDEO
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Make sure you have a highlight video URL set in your profile
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'analyzing') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold uppercase mb-2">AI VIDEO ANALYSIS</h1>
          <p className="text-muted-foreground">Analyzing your highlight video...</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/10 flex items-center justify-center animate-pulse">
              <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-heading font-bold uppercase mb-4">Analysis in Progress</h2>
            <p className="text-muted-foreground mb-6">
              Our AI is watching and analyzing your highlight video. This typically takes 2-5 minutes.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Downloading video...</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Brain className="w-4 h-4" />
                <span>AI analyzing footage...</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4" />
                <span>Extracting performance data...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold uppercase mb-2">AI VIDEO ANALYSIS</h1>
          <p className="text-muted-foreground">Analysis encountered an error</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-red-500/50 p-12 rounded-sm text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-heading font-bold uppercase mb-4">Analysis Failed</h2>
            <p className="text-muted-foreground mb-4">
              {analysis?.error || 'An error occurred during video analysis.'}
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Please ensure your video URL is valid and accessible (YouTube, Vimeo, or direct link).
            </p>
            <Button
              data-testid="retry-analysis-btn"
              onClick={handleTriggerAnalysis}
              className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 h-12 px-8"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              TRY AGAIN
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Completed analysis view
  const data = analysis?.analysis || {};

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase mb-2">AI VIDEO ANALYSIS</h1>
          <p className="text-muted-foreground">AI-powered assessment of your highlight video</p>
        </div>
        <Button
          data-testid="reanalyze-btn"
          variant="outline"
          onClick={handleTriggerAnalysis}
          className="border-primary text-primary hover:bg-primary hover:text-black"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          RE-ANALYZE
        </Button>
      </div>

      <div className="max-w-5xl">
        {/* Overall Score Card */}
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary">
                <span className={`text-4xl font-heading font-bold ${getScoreColor(analysis?.overall_score || 0)}`}>
                  {analysis?.overall_score || 0}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold uppercase">OVERALL RATING</h2>
                <p className="text-muted-foreground">Based on AI video analysis</p>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">Analysis Complete</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {analysis?.analyzed_at ? new Date(analysis.analyzed_at).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground uppercase mb-1">Recommended Level</p>
              <span className="text-xl font-heading font-bold text-primary uppercase">
                {data.recommended_level || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Scout Summary */}
        {data.scout_summary && (
          <div className="bg-card border border-primary/50 p-6 rounded-sm mb-6">
            <div className="flex items-start gap-4">
              <Trophy className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-heading font-bold uppercase mb-2">SCOUT SUMMARY</h3>
                <p className="text-muted-foreground">{data.scout_summary}</p>
                {data.similar_player_style && (
                  <p className="text-sm text-primary mt-2">
                    Playing style similar to: <span className="font-bold">{data.similar_player_style}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Video Quality */}
          <div className="bg-card border border-border/50 p-6 rounded-sm">
            <div className="flex items-center gap-3 mb-4">
              <Video className="w-5 h-5 text-blue-500" />
              <h3 className="font-heading font-bold uppercase">VIDEO QUALITY</h3>
              <span className={`ml-auto text-2xl font-bold ${getScoreColor(data.video_quality?.overall_score || 0)}`}>
                {data.video_quality?.overall_score || 0}
              </span>
            </div>
            <div className="space-y-3">
              {['resolution_quality', 'lighting', 'stability', 'clarity'].map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{key.replace('_', ' ')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-sm border ${getQualityBadge(data.video_quality?.[key])}`}>
                    {data.video_quality?.[key] || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
            {data.video_quality?.notes && (
              <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                {data.video_quality.notes}
              </p>
            )}
          </div>

          {/* Player Assessment */}
          <div className="bg-card border border-border/50 p-6 rounded-sm">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-heading font-bold uppercase">PLAYER ASSESSMENT</h3>
              <span className={`ml-auto text-2xl font-bold ${getScoreColor(data.player_assessment?.overall_rating || 0)}`}>
                {data.player_assessment?.overall_rating || 0}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Detected Position</span>
                <span className="text-sm font-bold text-primary">{data.player_assessment?.detected_position || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confidence</span>
                <span className={`text-xs px-2 py-0.5 rounded-sm border ${getQualityBadge(data.player_assessment?.confidence_level)}`}>
                  {data.player_assessment?.confidence_level || 'N/A'}
                </span>
              </div>
            </div>
            {data.player_assessment?.playing_style && (
              <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                <span className="font-medium">Style:</span> {data.player_assessment.playing_style}
              </p>
            )}
          </div>
        </div>

        {/* Technical Skills */}
        <div className="bg-card border border-border/50 p-6 rounded-sm mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="font-heading font-bold uppercase">TECHNICAL SKILLS</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['ball_control', 'passing', 'shooting', 'dribbling', 'first_touch', 'heading'].map((skill) => {
              const value = data.technical_skills?.[skill];
              if (value === null || value === undefined) return null;
              return (
                <div key={skill} className="bg-background p-4 rounded-sm border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground capitalize">{skill.replace('_', ' ')}</span>
                    <span className={`text-lg font-bold ${getScoreColor(value)}`}>{value}</span>
                  </div>
                  <Progress value={value} className="h-2" />
                </div>
              );
            })}
          </div>
          {data.technical_skills?.weak_foot && (
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Weak Foot:</span>
              <span className={`text-xs px-2 py-0.5 rounded-sm border ${getQualityBadge(data.technical_skills.weak_foot)}`}>
                {data.technical_skills.weak_foot}
              </span>
            </div>
          )}
          {data.technical_skills?.notes && (
            <p className="text-xs text-muted-foreground mt-4">{data.technical_skills.notes}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Physical Attributes */}
          <div className="bg-card border border-border/50 p-6 rounded-sm">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-red-500" />
              <h3 className="font-heading font-bold uppercase">PHYSICAL ATTRIBUTES</h3>
            </div>
            <div className="space-y-3">
              {['pace', 'strength', 'stamina', 'agility'].map((attr) => (
                <div key={attr} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{attr}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-sm border ${getQualityBadge(data.physical_attributes?.[attr])}`}>
                    {data.physical_attributes?.[attr] || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
            {data.physical_attributes?.notes && (
              <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                {data.physical_attributes.notes}
              </p>
            )}
          </div>

          {/* Tactical Awareness */}
          <div className="bg-card border border-border/50 p-6 rounded-sm">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-purple-500" />
              <h3 className="font-heading font-bold uppercase">TACTICAL AWARENESS</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Positioning</span>
                <span className={`text-lg font-bold ${getScoreColor(data.tactical_awareness?.positioning || 0)}`}>
                  {data.tactical_awareness?.positioning || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Decision Making</span>
                <span className={`text-lg font-bold ${getScoreColor(data.tactical_awareness?.decision_making || 0)}`}>
                  {data.tactical_awareness?.decision_making || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Work Rate</span>
                <span className={`text-xs px-2 py-0.5 rounded-sm border ${getQualityBadge(data.tactical_awareness?.work_rate)}`}>
                  {data.tactical_awareness?.work_rate || 'N/A'}
                </span>
              </div>
            </div>
            {data.tactical_awareness?.notes && (
              <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                {data.tactical_awareness.notes}
              </p>
            )}
          </div>
        </div>

        {/* Strengths & Areas for Improvement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {data.strengths?.length > 0 && (
            <div className="bg-card border border-green-500/50 p-6 rounded-sm">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="font-heading font-bold uppercase">STRENGTHS</h3>
              </div>
              <ul className="space-y-2">
                {data.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Star className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.areas_for_improvement?.length > 0 && (
            <div className="bg-card border border-yellow-500/50 p-6 rounded-sm">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-yellow-500" />
                <h3 className="font-heading font-bold uppercase">AREAS TO IMPROVE</h3>
              </div>
              <ul className="space-y-2">
                {data.areas_for_improvement.map((area, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Key Moments */}
        {data.key_moments?.length > 0 && (
          <div className="bg-card border border-border/50 p-6 rounded-sm">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-heading font-bold uppercase">KEY MOMENTS DETECTED</h3>
              <span className="text-sm text-muted-foreground ml-auto">{data.key_moments.length} moments</span>
            </div>
            <div className="space-y-3">
              {data.key_moments.map((moment, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-background rounded-sm border border-border">
                  <div className="flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-sm uppercase font-bold ${
                      moment.type === 'goal' ? 'bg-green-500/10 text-green-500' :
                      moment.type === 'assist' ? 'bg-blue-500/10 text-blue-500' :
                      moment.type === 'skill' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {moment.type}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{moment.description}</p>
                    {moment.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">{moment.timestamp}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold">{moment.quality_rating}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoAnalysis;

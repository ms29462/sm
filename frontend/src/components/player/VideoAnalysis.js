import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Video, Sparkles, Target, Zap, Brain, Trophy, 
  AlertCircle, CheckCircle, Clock, RefreshCw,
  TrendingUp, Star, Activity, Upload, FileVideo
} from 'lucide-react';

const VideoAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState('loading');
  const [polling, setPolling] = useState(false);
  const [uploadedAnalyses, setUploadedAnalyses] = useState([]);
  const [selectedUploadedAnalysis, setSelectedUploadedAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAnalysis();
    loadUploadedAnalyses();
  }, []);

  useEffect(() => {
    let interval;
    if (polling) {
      interval = setInterval(() => {
        checkStatus();
        loadUploadedAnalyses();
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

  const loadUploadedAnalyses = async () => {
    try {
      const response = await api.getUploadedAnalyses();
      setUploadedAnalyses(response.data || []);
      
      // Check if any are still analyzing
      const analyzing = response.data?.some(a => a.status === 'analyzing');
      if (analyzing && !polling) {
        setPolling(true);
      } else if (!analyzing && polling) {
        setPolling(false);
      }
    } catch (error) {
      console.error('Failed to load uploaded analyses');
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

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('video/')) {
      toast.error('Please select a video file (MP4, WebM, MOV, AVI)');
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video must be under 100MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('video_title', file.name);

      await api.uploadVideoForAnalysis(formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      toast.success('Video uploaded! Analysis started.');
      setPolling(true);
      loadUploadedAnalyses();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload video');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAnalysis = async (analysisId) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;

    try {
      await api.deleteUploadedAnalysis(analysisId);
      toast.success('Analysis deleted');
      loadUploadedAnalyses();
      if (selectedUploadedAnalysis?.analysis_id === analysisId) {
        setSelectedUploadedAnalysis(null);
      }
    } catch (error) {
      toast.error('Failed to delete analysis');
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

  // Render uploaded analyses list
  const renderUploadedAnalysesList = () => {
    if (uploadedAnalyses.length === 0) return null;

    return (
      <div className="bg-card border border-border/50 p-6 rounded-sm mb-6">
        <h3 className="font-heading font-bold uppercase mb-4 flex items-center gap-2">
          <FileVideo className="w-5 h-5 text-primary" />
          YOUR UPLOADED ANALYSES ({uploadedAnalyses.length})
        </h3>
        <div className="space-y-3">
          {uploadedAnalyses.map((ua) => (
            <div
              key={ua.analysis_id}
              className={`p-4 bg-background rounded-sm border cursor-pointer transition-colors ${
                selectedUploadedAnalysis?.analysis_id === ua.analysis_id
                  ? 'border-primary'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => ua.status === 'completed' && setSelectedUploadedAnalysis(ua)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ua.video_title || 'Untitled Video'}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ua.created_at).toLocaleDateString()} • 
                    {(ua.file_size / (1024 * 1024)).toFixed(1)}MB
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {ua.status === 'completed' && (
                    <span className={`text-lg font-bold ${getScoreColor(ua.overall_score || 0)}`}>
                      {ua.overall_score || 0}
                    </span>
                  )}
                  {ua.status === 'analyzing' && (
                    <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-sm flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Analyzing...
                    </span>
                  )}
                  {ua.status === 'failed' && (
                    <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-sm">
                      Failed
                    </span>
                  )}
                  {ua.status === 'completed' && (
                    <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-sm">
                      Complete
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAnalysis(ua.analysis_id);
                    }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Upload section component
  const renderUploadSection = () => (
    <div className="bg-card border border-dashed border-primary/50 p-8 rounded-sm text-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileUpload}
        className="hidden"
        id="video-upload"
      />
      {uploading ? (
        <div>
          <RefreshCw className="w-10 h-10 text-primary mx-auto mb-4 animate-spin" />
          <p className="font-heading font-bold uppercase mb-2">UPLOADING VIDEO...</p>
          <Progress value={uploadProgress} className="h-2 max-w-xs mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">{uploadProgress}%</p>
        </div>
      ) : (
        <label htmlFor="video-upload" className="cursor-pointer block">
          <Upload className="w-10 h-10 text-primary mx-auto mb-4" />
          <p className="font-heading font-bold uppercase mb-2">UPLOAD VIDEO</p>
          <p className="text-sm text-muted-foreground mb-4">
            Drag & drop or click to select a video file
          </p>
          <p className="text-xs text-muted-foreground">
            Supported: MP4, WebM, MOV, AVI (Max 100MB)
          </p>
        </label>
      )}
    </div>
  );

  if (status === 'not_analyzed') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold uppercase mb-2">AI VIDEO ANALYSIS</h1>
          <p className="text-muted-foreground">Get AI-powered insights from your highlight video</p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Upload Section */}
          <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-heading font-bold uppercase mb-4">Analyze Your Highlight Video</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our AI will analyze your video to assess quality, technical skills, 
                physical attributes, and identify key moments.
              </p>
            </div>
            
            {renderUploadSection()}
            
            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground mb-3">Or analyze from your profile URL:</p>
              <Button
                data-testid="trigger-analysis-btn"
                onClick={handleTriggerAnalysis}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-black"
              >
                <Video className="w-4 h-4 mr-2" />
                ANALYZE PROFILE VIDEO
              </Button>
            </div>
          </div>

          {/* Uploaded Analyses List */}
          {renderUploadedAnalysesList()}
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

        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-red-500/50 p-8 rounded-sm text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-heading font-bold uppercase mb-2">Analysis Failed</h2>
            <p className="text-muted-foreground mb-4">
              {analysis?.error || 'An error occurred during video analysis.'}
            </p>
          </div>

          {/* Upload as alternative */}
          <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
            <h3 className="font-heading font-bold uppercase mb-4 text-center">TRY UPLOADING DIRECTLY</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Upload your video file directly for more reliable analysis
            </p>
            {renderUploadSection()}
          </div>

          {/* Uploaded Analyses List */}
          {renderUploadedAnalysesList()}
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

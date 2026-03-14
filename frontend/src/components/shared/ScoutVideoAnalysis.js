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
  TrendingUp, Star, Activity, Upload, FileVideo, Trash2
} from 'lucide-react';

const ScoutVideoAnalysis = () => {
  const [uploadedAnalyses, setUploadedAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [polling, setPolling] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadUploadedAnalyses();
  }, []);

  useEffect(() => {
    let interval;
    if (polling) {
      interval = setInterval(() => {
        loadUploadedAnalyses();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [polling]);

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
        // Refresh selected analysis if it was analyzing
        if (selectedAnalysis?.status === 'analyzing') {
          const updated = response.data.find(a => a.analysis_id === selectedAnalysis.analysis_id);
          if (updated) setSelectedAnalysis(updated);
        }
      }
    } catch (error) {
      console.error('Failed to load analyses');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('video/')) {
      toast.error('Please select a video file (MP4, WebM, MOV, AVI)');
      return;
    }

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
      if (selectedAnalysis?.analysis_id === analysisId) {
        setSelectedAnalysis(null);
      }
    } catch (error) {
      toast.error('Failed to delete analysis');
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

  // Render analysis details
  const renderAnalysisDetails = (analysis) => {
    if (!analysis || analysis.status !== 'completed') return null;
    const data = analysis.analysis || {};

    return (
      <div className="space-y-6">
        {/* Overall Score */}
        <div className="bg-card border border-border/50 p-6 rounded-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary">
                <span className={`text-3xl font-heading font-bold ${getScoreColor(analysis.overall_score || 0)}`}>
                  {analysis.overall_score || 0}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold uppercase">OVERALL RATING</h3>
                <p className="text-sm text-muted-foreground">{analysis.video_title}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Recommended Level</p>
              <span className="text-lg font-heading font-bold text-primary uppercase">
                {data.recommended_level || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Scout Summary */}
        {data.scout_summary && (
          <div className="bg-card border border-primary/50 p-6 rounded-sm">
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-heading font-bold uppercase mb-2">SCOUT SUMMARY</h4>
                <p className="text-muted-foreground">{data.scout_summary}</p>
                {data.similar_player_style && (
                  <p className="text-sm text-primary mt-2">
                    Style similar to: <span className="font-bold">{data.similar_player_style}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Skills Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Technical Skills */}
          <div className="bg-card border border-border/50 p-6 rounded-sm">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h4 className="font-heading font-bold uppercase">TECHNICAL</h4>
            </div>
            <div className="space-y-3">
              {['ball_control', 'passing', 'shooting', 'dribbling'].map((skill) => {
                const value = data.technical_skills?.[skill];
                if (value === null || value === undefined) return null;
                return (
                  <div key={skill} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{skill.replace('_', ' ')}</span>
                    <span className={`font-bold ${getScoreColor(value)}`}>{value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Physical */}
          <div className="bg-card border border-border/50 p-6 rounded-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-red-500" />
              <h4 className="font-heading font-bold uppercase">PHYSICAL</h4>
            </div>
            <div className="space-y-3">
              {['pace', 'strength', 'stamina', 'agility'].map((attr) => (
                <div key={attr} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{attr}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-sm border ${getQualityBadge(data.physical_attributes?.[attr])}`}>
                    {data.physical_attributes?.[attr] || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-2 gap-4">
          {data.strengths?.length > 0 && (
            <div className="bg-card border border-green-500/50 p-6 rounded-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h4 className="font-heading font-bold uppercase">STRENGTHS</h4>
              </div>
              <ul className="space-y-2">
                {data.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Star className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.areas_for_improvement?.length > 0 && (
            <div className="bg-card border border-yellow-500/50 p-6 rounded-sm">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-yellow-500" />
                <h4 className="font-heading font-bold uppercase">TO IMPROVE</h4>
              </div>
              <ul className="space-y-2">
                {data.areas_for_improvement.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Key Moments */}
        {data.key_moments?.length > 0 && (
          <div className="bg-card border border-border/50 p-6 rounded-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h4 className="font-heading font-bold uppercase">KEY MOMENTS</h4>
            </div>
            <div className="space-y-2">
              {data.key_moments.slice(0, 5).map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-background rounded-sm">
                  <span className={`text-xs px-2 py-1 rounded-sm uppercase font-bold ${
                    m.type === 'goal' ? 'bg-green-500/10 text-green-500' :
                    m.type === 'assist' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {m.type}
                  </span>
                  <span className="text-sm flex-1">{m.description}</span>
                  <span className="text-sm font-bold">{m.quality_rating}/10</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">SCOUT VIDEO ANALYSIS</h1>
        <p className="text-muted-foreground">Upload and analyze player highlight videos with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Upload & List */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upload Section */}
          <div className="bg-card border border-dashed border-primary/50 p-6 rounded-sm">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
              id="scout-video-upload"
            />
            {uploading ? (
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                <p className="font-heading font-bold uppercase text-sm mb-2">UPLOADING...</p>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{uploadProgress}%</p>
              </div>
            ) : (
              <label htmlFor="scout-video-upload" className="cursor-pointer block text-center">
                <Upload className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-heading font-bold uppercase text-sm mb-1">UPLOAD VIDEO</p>
                <p className="text-xs text-muted-foreground">
                  MP4, WebM, MOV (Max 100MB)
                </p>
              </label>
            )}
          </div>

          {/* Analyses List */}
          <div className="bg-card border border-border/50 p-4 rounded-sm">
            <h3 className="font-heading font-bold uppercase text-sm mb-4 flex items-center gap-2">
              <FileVideo className="w-4 h-4 text-primary" />
              YOUR ANALYSES ({uploadedAnalyses.length})
            </h3>
            {uploadedAnalyses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No videos analyzed yet
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {uploadedAnalyses.map((ua) => (
                  <div
                    key={ua.analysis_id}
                    className={`p-3 rounded-sm border cursor-pointer transition-colors ${
                      selectedAnalysis?.analysis_id === ua.analysis_id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => ua.status === 'completed' && setSelectedAnalysis(ua)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate flex-1 mr-2">
                        {ua.video_title || 'Untitled'}
                      </p>
                      {ua.status === 'completed' && (
                        <span className={`text-sm font-bold ${getScoreColor(ua.overall_score || 0)}`}>
                          {ua.overall_score}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(ua.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        {ua.status === 'analyzing' && (
                          <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                        )}
                        {ua.status === 'completed' && (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        )}
                        {ua.status === 'failed' && (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAnalysis(ua.analysis_id);
                          }}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Analysis Details */}
        <div className="lg:col-span-2">
          {selectedAnalysis ? (
            renderAnalysisDetails(selectedAnalysis)
          ) : (
            <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading font-bold uppercase mb-2">SELECT AN ANALYSIS</h3>
              <p className="text-muted-foreground">
                Upload a video or select a completed analysis to view the AI assessment
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoutVideoAnalysis;

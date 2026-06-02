import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, Loader2, ChevronLeft, ChevronRight, User, Calendar,
  Trophy, Target, Zap, Brain, Video, Plus, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Metric definitions
const METRICS = {
  technical: {
    label: 'Technical',
    icon: Trophy,
    color: 'emerald',
    metrics: [
      { key: 'passing', label: 'Passing', description: 'Accuracy and variety of passes' },
      { key: 'first_touch', label: 'First Touch', description: 'Initial ball control' },
      { key: 'ball_control', label: 'Ball Control', description: 'Control under pressure' },
      { key: 'dribbling', label: 'Dribbling', description: 'Ability to beat opponents' },
      { key: 'finishing', label: 'Finishing', description: 'Accuracy in front of goal' },
      { key: 'crossing', label: 'Crossing', description: 'Quality of crosses' },
      { key: 'tackling', label: 'Tackling', description: 'Timing and effectiveness' },
      { key: 'heading', label: 'Heading', description: 'Aerial ability' },
    ]
  },
  tactical: {
    label: 'Tactical',
    icon: Target,
    color: 'blue',
    metrics: [
      { key: 'positioning', label: 'Positioning', description: 'Spatial awareness' },
      { key: 'decision_making', label: 'Decision Making', description: 'Choices in possession' },
      { key: 'game_intelligence', label: 'Game Intelligence', description: 'Reading the game' },
      { key: 'defensive_awareness', label: 'Defensive Awareness', description: 'Anticipation' },
      { key: 'movement_off_ball', label: 'Movement Off Ball', description: 'Runs and positioning' },
      { key: 'transition_play', label: 'Transition Play', description: 'Counter-attack efficiency' },
    ]
  },
  physical: {
    label: 'Physical',
    icon: Zap,
    color: 'orange',
    metrics: [
      { key: 'speed', label: 'Speed', description: 'Top speed' },
      { key: 'acceleration', label: 'Acceleration', description: 'Explosive pace' },
      { key: 'agility', label: 'Agility', description: 'Change of direction' },
      { key: 'strength', label: 'Strength', description: 'Physical power' },
      { key: 'endurance', label: 'Endurance', description: 'Stamina and fitness' },
    ]
  },
  mental: {
    label: 'Mental',
    icon: Brain,
    color: 'purple',
    metrics: [
      { key: 'leadership', label: 'Leadership', description: 'Ability to lead' },
      { key: 'communication', label: 'Communication', description: 'On-field communication' },
      { key: 'confidence', label: 'Confidence', description: 'Self-belief' },
      { key: 'discipline', label: 'Discipline', description: 'Following instructions' },
      { key: 'work_rate', label: 'Work Rate', description: 'Effort and intensity' },
      { key: 'competitive_mentality', label: 'Competitive Mentality', description: 'Will to win' },
    ]
  }
};

const ARCHETYPES = {
  goalkeeper: ['Sweeper Keeper', 'Traditional Goalkeeper', 'Shot Stopper', 'Distributor'],
  defender: ['Ball Playing Defender', 'Defensive Defender', 'Stopper', 'Cover Defender', 'Wide Center Back'],
  fullback: ['Attacking Fullback', 'Inverted Fullback', 'Defensive Fullback', 'Wing Back'],
  midfielder: ['Deep Lying Playmaker', 'Box-to-Box Midfielder', 'Ball Winning Midfielder', 'Advanced Playmaker', 'Regista', 'Mezzala', 'Carrilero'],
  attacker: ['Target Forward', 'Poacher', 'Pressing Forward', 'False 9', 'Complete Forward', 'Advanced Forward'],
  winger: ['Traditional Winger', 'Inverted Winger', 'Inside Forward', 'Wide Playmaker', 'Raumdeuter']
};

const POSITIONS = [
  'Goalkeeper', 'Center Back', 'Left Back', 'Right Back', 'Wing Back',
  'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder',
  'Left Winger', 'Right Winger', 'Striker', 'Second Striker'
];

const RECOMMENDATIONS = [
  { value: 'strongly_recommend', label: 'Strongly Recommend', color: 'bg-emerald-500' },
  { value: 'recommend', label: 'Recommend', color: 'bg-green-500' },
  { value: 'monitor', label: 'Monitor', color: 'bg-amber-500' },
  { value: 'further_evaluation', label: 'Further Evaluation Needed', color: 'bg-orange-500' },
  { value: 'not_recommended', label: 'Not Recommended', color: 'bg-red-500' }
];

const EvaluationForm = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form state
  const [matchInfo, setMatchInfo] = useState({
    match_date: new Date().toISOString().split('T')[0],
    match_description: '',
    position_played: '',
    minutes_played: 90
  });
  
  const [scores, setScores] = useState(() => {
    const initial = {};
    Object.keys(METRICS).forEach(category => {
      initial[category] = {};
      METRICS[category].metrics.forEach(m => {
        initial[category][m.key] = { score: 5, comment: '' };
      });
    });
    return initial;
  });
  
  const [archetypes, setArchetypes] = useState([]);
  const [recommendation, setRecommendation] = useState('');
  const [videoReferences, setVideoReferences] = useState([]);
  const [notes, setNotes] = useState({
    executive_summary: '',
    strengths_notes: '',
    weaknesses_notes: '',
    development_potential: ''
  });

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const response = await api.getPlayersForEvaluation();
        const found = response.data.find(p => p.user_id === playerId);
        if (found) {
          setPlayer(found);
        } else {
          toast.error('Player not found');
          navigate('/analyst/players');
        }
      } catch (error) {
        toast.error('Failed to load player');
        navigate('/analyst/players');
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [playerId, navigate]);

  const getPlayerName = () => {
    if (!player) return '';
    if (player.first_name && player.last_name) {
      return `${player.first_name} ${player.last_name}`;
    }
    return player.name || 'Player';
  };

  const updateScore = (category, metric, field, value) => {
    setScores(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [metric]: {
          ...prev[category][metric],
          [field]: value
        }
      }
    }));
  };

  const toggleArchetype = (archetype) => {
    setArchetypes(prev => 
      prev.includes(archetype)
        ? prev.filter(a => a !== archetype)
        : [...prev, archetype]
    );
  };

  const addVideoReference = () => {
    setVideoReferences(prev => [
      ...prev,
      { id: Date.now().toString(), video_type: 'highlights', url: '', title: '', timestamps: [] }
    ]);
  };

  const updateVideoReference = (id, field, value) => {
    setVideoReferences(prev => 
      prev.map(v => v.id === id ? { ...v, [field]: value } : v)
    );
  };

  const removeVideoReference = (id) => {
    setVideoReferences(prev => prev.filter(v => v.id !== id));
  };

  const addTimestamp = (videoId) => {
    setVideoReferences(prev => 
      prev.map(v => v.id === videoId 
        ? { ...v, timestamps: [...v.timestamps, { time: '', action: '' }] }
        : v
      )
    );
  };

  const handleSubmit = async () => {
    if (!matchInfo.match_description) {
      toast.error('Please describe the match');
      setCurrentStep(0);
      return;
    }
    if (!matchInfo.position_played) {
      toast.error('Please select the position played');
      setCurrentStep(0);
      return;
    }
    if (!recommendation) {
      toast.error('Please select a recommendation');
      setCurrentStep(5);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        player_id: playerId,
        match_date: matchInfo.match_date,
        match_description: matchInfo.match_description,
        position_played: matchInfo.position_played,
        minutes_played: parseInt(matchInfo.minutes_played) || 90,
        technical: scores.technical,
        tactical: scores.tactical,
        physical: scores.physical,
        mental: scores.mental,
        archetypes,
        recommendation,
        video_references: videoReferences.filter(v => v.url),
        executive_summary: notes.executive_summary || null,
        strengths_notes: notes.strengths_notes || null,
        weaknesses_notes: notes.weaknesses_notes || null,
        development_potential: notes.development_potential || null
      };

      const response = await api.createEvaluation(payload);
      toast.success('Evaluation created successfully');
      navigate(`/analyst/evaluation/${response.data.id}`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to create evaluation');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { label: 'Match', icon: Calendar },
    { label: 'Technical', icon: Trophy },
    { label: 'Tactical', icon: Target },
    { label: 'Physical', icon: Zap },
    { label: 'Mental', icon: Brain },
    { label: 'Profile', icon: User },
    { label: 'Videos', icon: Video },
    { label: 'Summary', icon: Save }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderMetricSlider = (category, metric) => {
    const data = scores[category][metric.key];
    const colors = {
      emerald: 'from-emerald-600 to-emerald-400',
      blue: 'from-blue-600 to-blue-400',
      orange: 'from-orange-600 to-orange-400',
      purple: 'from-purple-600 to-purple-400'
    };
    const color = METRICS[category].color;
    
    return (
      <div key={metric.key} className="p-3 lg:p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-medium text-sm lg:text-base">{metric.label}</p>
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </div>
          <span className={`text-xl lg:text-2xl font-bold bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent`}>
            {data.score}
          </span>
        </div>
        <Slider
          value={[data.score]}
          onValueChange={([value]) => updateScore(category, metric.key, 'score', value)}
          min={1}
          max={10}
          step={0.5}
          className="my-3"
        />
        <Input
          placeholder="Comment (optional)"
          value={data.comment}
          onChange={(e) => updateScore(category, metric.key, 'comment', e.target.value)}
          className="mt-2 bg-zinc-900/50 border-zinc-700 text-xs lg:text-sm"
        />
      </div>
    );
  };

  return (
    <div className="space-y-4 lg:space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 lg:gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/analyst/players')}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg lg:text-2xl font-heading font-bold truncate">Evaluating {getPlayerName()}</h1>
          <p className="text-xs lg:text-sm text-muted-foreground">
            {player?.position} • {player?.nationality}
          </p>
        </div>
      </div>

      {/* Steps Progress - Scrollable on mobile */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
        {steps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentStep(idx)}
            className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg whitespace-nowrap transition-colors text-xs lg:text-sm ${
              currentStep === idx 
                ? 'bg-primary text-black' 
                : idx < currentStep 
                  ? 'bg-emerald-600/20 text-emerald-400'
                  : 'bg-zinc-800 text-muted-foreground hover:bg-zinc-700'
            }`}
          >
            <step.icon className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="font-medium">{step.label}</span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-4 lg:pt-6">
          {/* Step 0: Match Info */}
          {currentStep === 0 && (
            <div className="space-y-4 lg:space-y-6">
              <h2 className="text-base lg:text-lg font-heading font-semibold">Match Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Match Date</Label>
                  <Input
                    type="date"
                    value={matchInfo.match_date}
                    onChange={(e) => setMatchInfo({ ...matchInfo, match_date: e.target.value })}
                    className="mt-1.5 bg-zinc-800/50 border-zinc-700"
                  />
                </div>
                <div>
                  <Label className="text-sm">Minutes Played</Label>
                  <Input
                    type="number"
                    value={matchInfo.minutes_played}
                    onChange={(e) => setMatchInfo({ ...matchInfo, minutes_played: e.target.value })}
                    className="mt-1.5 bg-zinc-800/50 border-zinc-700"
                    min={1}
                    max={120}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm">Position Played</Label>
                <Select
                  value={matchInfo.position_played}
                  onValueChange={(value) => setMatchInfo({ ...matchInfo, position_played: value })}
                >
                  <SelectTrigger className="mt-1.5 bg-zinc-800/50 border-zinc-700">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {POSITIONS.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Match Description</Label>
                <Input
                  value={matchInfo.match_description}
                  onChange={(e) => setMatchInfo({ ...matchInfo, match_description: e.target.value })}
                  className="mt-1.5 bg-zinc-800/50 border-zinc-700"
                  placeholder="e.g., Man City vs Liverpool - Premier League, Matchday 12"
                />
              </div>
            </div>
          )}

          {/* Steps 1-4: Metrics */}
          {currentStep >= 1 && currentStep <= 4 && (
            <div className="space-y-4">
              {(() => {
                const categoryKey = ['technical', 'tactical', 'physical', 'mental'][currentStep - 1];
                const category = METRICS[categoryKey];
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4 lg:mb-6">
                      <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-${category.color}-500/20 flex items-center justify-center`}>
                        <category.icon className={`w-4 h-4 lg:w-5 lg:h-5 text-${category.color}-400`} />
                      </div>
                      <h2 className="text-base lg:text-lg font-heading font-semibold">{category.label}</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                      {category.metrics.map(metric => renderMetricSlider(categoryKey, metric))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Step 5: Profile & Archetypes */}
          {currentStep === 5 && (
            <div className="space-y-4 lg:space-y-6">
              <h2 className="text-base lg:text-lg font-heading font-semibold">Player Profile</h2>
              
              {/* Archetypes */}
              <div>
                <Label className="text-sm lg:text-base">Archetypes</Label>
                <p className="text-xs lg:text-sm text-muted-foreground mb-3 lg:mb-4">
                  Select the archetypes that best describe the player
                </p>
                <div className="space-y-3 lg:space-y-4">
                  {Object.entries(ARCHETYPES).map(([position, types]) => (
                    <div key={position}>
                      <p className="text-xs lg:text-sm font-medium text-muted-foreground capitalize mb-2">{position}</p>
                      <div className="flex flex-wrap gap-1.5 lg:gap-2">
                        {types.map(type => (
                          <button
                            key={type}
                            onClick={() => toggleArchetype(type)}
                            className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-xs lg:text-sm transition-colors ${
                              archetypes.includes(type)
                                ? 'bg-primary text-black'
                                : 'bg-zinc-800 text-muted-foreground hover:bg-zinc-700'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <Label className="text-sm lg:text-base">Recommendation</Label>
                <RadioGroup
                  value={recommendation}
                  onValueChange={setRecommendation}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3 mt-3"
                >
                  {RECOMMENDATIONS.map(rec => (
                    <div key={rec.value} className="flex items-center space-x-3">
                      <RadioGroupItem value={rec.value} id={rec.value} />
                      <Label htmlFor={rec.value} className="flex items-center gap-2 cursor-pointer text-sm">
                        <div className={`w-3 h-3 rounded-full ${rec.color}`} />
                        {rec.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 6: Video References */}
          {currentStep === 6 && (
            <div className="space-y-4 lg:space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base lg:text-lg font-heading font-semibold">Video References</h2>
                <Button variant="outline" size="sm" onClick={addVideoReference}>
                  <Plus className="w-4 h-4 mr-1 lg:mr-2" />
                  Add
                </Button>
              </div>

              {videoReferences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-zinc-800/30 rounded-lg">
                  <Video className="w-8 h-8 lg:w-10 lg:h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No videos added</p>
                  <p className="text-xs">Click "Add" to reference videos</p>
                </div>
              ) : (
                <div className="space-y-3 lg:space-y-4">
                  {videoReferences.map((video, idx) => (
                    <Card key={video.id} className="bg-zinc-800/50 border-zinc-700">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <p className="font-medium text-sm">Video {idx + 1}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeVideoReference(video.id)}
                            className="text-muted-foreground hover:text-red-400 h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Select
                            value={video.video_type}
                            onValueChange={(value) => updateVideoReference(video.id, 'video_type', value)}
                          >
                            <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700">
                              <SelectItem value="full_match">Full Match</SelectItem>
                              <SelectItem value="highlights">Highlights</SelectItem>
                              <SelectItem value="external">External Link</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Title (optional)"
                            value={video.title}
                            onChange={(e) => updateVideoReference(video.id, 'title', e.target.value)}
                            className="bg-zinc-900/50 border-zinc-700 text-sm"
                          />
                        </div>
                        <Input
                          placeholder="Video URL"
                          value={video.url}
                          onChange={(e) => updateVideoReference(video.id, 'url', e.target.value)}
                          className="mt-3 bg-zinc-900/50 border-zinc-700 text-sm"
                        />
                        
                        {/* Timestamps */}
                        <div className="mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addTimestamp(video.id)}
                            className="text-primary text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add timestamp
                          </Button>
                          {video.timestamps?.map((ts, tsIdx) => (
                            <div key={tsIdx} className="flex gap-2 mt-2">
                              <Input
                                placeholder="12:45"
                                value={ts.time}
                                onChange={(e) => {
                                  const newTs = [...video.timestamps];
                                  newTs[tsIdx] = { ...ts, time: e.target.value };
                                  updateVideoReference(video.id, 'timestamps', newTs);
                                }}
                                className="w-20 bg-zinc-900/50 border-zinc-700 text-xs"
                              />
                              <Input
                                placeholder="Key action"
                                value={ts.action}
                                onChange={(e) => {
                                  const newTs = [...video.timestamps];
                                  newTs[tsIdx] = { ...ts, action: e.target.value };
                                  updateVideoReference(video.id, 'timestamps', newTs);
                                }}
                                className="flex-1 bg-zinc-900/50 border-zinc-700 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 7: Summary & Notes */}
          {currentStep === 7 && (
            <div className="space-y-4 lg:space-y-6">
              <h2 className="text-base lg:text-lg font-heading font-semibold">Summary & Notes</h2>
              
              <div>
                <Label className="text-sm">Executive Summary (optional)</Label>
                <Textarea
                  value={notes.executive_summary}
                  onChange={(e) => setNotes({ ...notes, executive_summary: e.target.value })}
                  className="mt-1.5 bg-zinc-800/50 border-zinc-700 min-h-[60px] lg:min-h-[80px] text-sm"
                  placeholder="Brief summary of the evaluation..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Strengths</Label>
                  <Textarea
                    value={notes.strengths_notes}
                    onChange={(e) => setNotes({ ...notes, strengths_notes: e.target.value })}
                    className="mt-1.5 bg-zinc-800/50 border-zinc-700 min-h-[80px] lg:min-h-[100px] text-sm"
                    placeholder="Player's main strengths..."
                  />
                </div>
                <div>
                  <Label className="text-sm">Areas for Improvement</Label>
                  <Textarea
                    value={notes.weaknesses_notes}
                    onChange={(e) => setNotes({ ...notes, weaknesses_notes: e.target.value })}
                    className="mt-1.5 bg-zinc-800/50 border-zinc-700 min-h-[80px] lg:min-h-[100px] text-sm"
                    placeholder="Areas that need work..."
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Development Potential</Label>
                <Textarea
                  value={notes.development_potential}
                  onChange={(e) => setNotes({ ...notes, development_potential: e.target.value })}
                  className="mt-1.5 bg-zinc-800/50 border-zinc-700 min-h-[60px] lg:min-h-[80px] text-sm"
                  placeholder="Future projection and potential..."
                />
              </div>

              {/* Summary Preview */}
              <Card className="bg-zinc-800/30 border-zinc-700">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm lg:text-base">Scores Preview</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                    {Object.entries(METRICS).map(([key, cat]) => {
                      const avg = Object.values(scores[key]).reduce((sum, m) => sum + m.score, 0) / 
                                  Object.values(scores[key]).length;
                      return (
                        <div key={key} className="text-center">
                          <p className={`text-xl lg:text-2xl font-bold text-${cat.color}-400`}>{avg.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">{cat.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex-1 sm:flex-none"
        >
          <ChevronLeft className="w-4 h-4 mr-1 lg:mr-2" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button onClick={() => setCurrentStep(currentStep + 1)} className="flex-1 sm:flex-none">
            Next
            <ChevronRight className="w-4 h-4 ml-1 lg:ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={saving}
            className="bg-primary text-black hover:bg-primary/90 flex-1 sm:flex-none"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Creating...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">Create Evaluation</span>
                <span className="sm:hidden">Create</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EvaluationForm;

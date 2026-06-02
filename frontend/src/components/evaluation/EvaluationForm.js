import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, Loader2, ChevronLeft, ChevronRight, User, Calendar,
  Trophy, Target, Zap, Brain, Video, Link as LinkIcon, Plus, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Metric definitions with French labels
const METRICS = {
  technical: {
    label: 'Technique',
    icon: Trophy,
    color: 'emerald',
    metrics: [
      { key: 'passing', label: 'Passe', description: 'Précision et variété des passes' },
      { key: 'first_touch', label: 'Contrôle', description: 'Premier touche de balle' },
      { key: 'ball_control', label: 'Maîtrise du Ballon', description: 'Contrôle sous pression' },
      { key: 'dribbling', label: 'Dribble', description: 'Capacité à éliminer les adversaires' },
      { key: 'finishing', label: 'Finition', description: 'Précision devant le but' },
      { key: 'crossing', label: 'Centres', description: 'Qualité des centres' },
      { key: 'tackling', label: 'Tacle', description: 'Timing et efficacité du tacle' },
      { key: 'heading', label: 'Jeu de Tête', description: 'Jeu aérien offensif et défensif' },
    ]
  },
  tactical: {
    label: 'Tactique',
    icon: Target,
    color: 'blue',
    metrics: [
      { key: 'positioning', label: 'Positionnement', description: 'Placement sur le terrain' },
      { key: 'decision_making', label: 'Prise de Décision', description: 'Choix dans le jeu' },
      { key: 'game_intelligence', label: 'Intelligence de Jeu', description: 'Lecture du jeu' },
      { key: 'defensive_awareness', label: 'Sens Défensif', description: 'Anticipation défensive' },
      { key: 'movement_off_ball', label: 'Déplacements Sans Ballon', description: 'Appels et courses' },
      { key: 'transition_play', label: 'Jeu en Transition', description: 'Efficacité dans les transitions' },
    ]
  },
  physical: {
    label: 'Physique',
    icon: Zap,
    color: 'orange',
    metrics: [
      { key: 'speed', label: 'Vitesse', description: 'Vitesse de pointe' },
      { key: 'acceleration', label: 'Accélération', description: 'Explosivité' },
      { key: 'agility', label: 'Agilité', description: 'Changements de direction' },
      { key: 'strength', label: 'Force', description: 'Puissance physique' },
      { key: 'endurance', label: 'Endurance', description: 'Capacité aérobie' },
    ]
  },
  mental: {
    label: 'Mental',
    icon: Brain,
    color: 'purple',
    metrics: [
      { key: 'leadership', label: 'Leadership', description: 'Capacité à guider' },
      { key: 'communication', label: 'Communication', description: 'Communication sur le terrain' },
      { key: 'confidence', label: 'Confiance', description: 'Assurance dans le jeu' },
      { key: 'discipline', label: 'Discipline', description: 'Respect des consignes' },
      { key: 'work_rate', label: 'Volume de Jeu', description: 'Intensité et efforts' },
      { key: 'competitive_mentality', label: 'Mentalité Compétitive', description: 'Désir de vaincre' },
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
  { value: 'strongly_recommend', label: 'Fortement Recommandé', color: 'bg-emerald-500' },
  { value: 'recommend', label: 'Recommandé', color: 'bg-green-500' },
  { value: 'monitor', label: 'À Surveiller', color: 'bg-amber-500' },
  { value: 'further_evaluation', label: 'Évaluation Supplémentaire', color: 'bg-orange-500' },
  { value: 'not_recommended', label: 'Non Recommandé', color: 'bg-red-500' }
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
  const [generateAiReport, setGenerateAiReport] = useState(true);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const response = await api.getPlayersForEvaluation();
        const found = response.data.find(p => p.user_id === playerId);
        if (found) {
          setPlayer(found);
        } else {
          toast.error('Joueur non trouvé');
          navigate('/analyst/players');
        }
      } catch (error) {
        toast.error('Erreur lors du chargement');
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
    return player.name || 'Joueur';
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
    // Validation
    if (!matchInfo.match_description) {
      toast.error('Veuillez décrire le match');
      setCurrentStep(0);
      return;
    }
    if (!matchInfo.position_played) {
      toast.error('Veuillez sélectionner la position jouée');
      setCurrentStep(0);
      return;
    }
    if (!recommendation) {
      toast.error('Veuillez sélectionner une recommandation');
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
        development_potential: notes.development_potential || null,
        generate_ai_report: generateAiReport
      };

      const response = await api.createEvaluation(payload);
      toast.success('Évaluation créée avec succès');
      navigate(`/analyst/evaluation/${response.data.id}`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { label: 'Match', icon: Calendar },
    { label: 'Technique', icon: Trophy },
    { label: 'Tactique', icon: Target },
    { label: 'Physique', icon: Zap },
    { label: 'Mental', icon: Brain },
    { label: 'Profil', icon: User },
    { label: 'Vidéos', icon: Video },
    { label: 'Résumé', icon: Save }
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
      <div key={metric.key} className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-medium">{metric.label}</p>
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </div>
          <span className={`text-2xl font-bold bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent`}>
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
          placeholder="Commentaire (optionnel)"
          value={data.comment}
          onChange={(e) => updateScore(category, metric.key, 'comment', e.target.value)}
          className="mt-2 bg-zinc-900/50 border-zinc-700 text-sm"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/analyst/players')}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold">Évaluation de {getPlayerName()}</h1>
          <p className="text-muted-foreground text-sm">
            {player?.position} • {player?.nationality}
          </p>
        </div>
      </div>

      {/* Steps Progress */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((step, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentStep(idx)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
              currentStep === idx 
                ? 'bg-primary text-black' 
                : idx < currentStep 
                  ? 'bg-emerald-600/20 text-emerald-400'
                  : 'bg-zinc-800 text-muted-foreground hover:bg-zinc-700'
            }`}
          >
            <step.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{step.label}</span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 0: Match Info */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-heading font-semibold">Informations du Match</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date du Match</Label>
                  <Input
                    type="date"
                    value={matchInfo.match_date}
                    onChange={(e) => setMatchInfo({ ...matchInfo, match_date: e.target.value })}
                    className="mt-1.5 bg-zinc-800/50 border-zinc-700"
                  />
                </div>
                <div>
                  <Label>Minutes Jouées</Label>
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
                <Label>Position Jouée</Label>
                <Select
                  value={matchInfo.position_played}
                  onValueChange={(value) => setMatchInfo({ ...matchInfo, position_played: value })}
                >
                  <SelectTrigger className="mt-1.5 bg-zinc-800/50 border-zinc-700">
                    <SelectValue placeholder="Sélectionner la position" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {POSITIONS.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description du Match</Label>
                <Input
                  value={matchInfo.match_description}
                  onChange={(e) => setMatchInfo({ ...matchInfo, match_description: e.target.value })}
                  className="mt-1.5 bg-zinc-800/50 border-zinc-700"
                  placeholder="Ex: PSG vs Real Madrid - Ligue des Champions, 8ème de finale"
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
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-10 h-10 rounded-lg bg-${category.color}-500/20 flex items-center justify-center`}>
                        <category.icon className={`w-5 h-5 text-${category.color}-400`} />
                      </div>
                      <h2 className="text-lg font-heading font-semibold">{category.label}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.metrics.map(metric => renderMetricSlider(categoryKey, metric))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Step 5: Profile & Archetypes */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-heading font-semibold">Profil du Joueur</h2>
              
              {/* Archetypes */}
              <div>
                <Label className="text-base">Archétypes</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Sélectionnez les archétypes qui correspondent au joueur
                </p>
                <div className="space-y-4">
                  {Object.entries(ARCHETYPES).map(([position, types]) => (
                    <div key={position}>
                      <p className="text-sm font-medium text-muted-foreground capitalize mb-2">{position}</p>
                      <div className="flex flex-wrap gap-2">
                        {types.map(type => (
                          <button
                            key={type}
                            onClick={() => toggleArchetype(type)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
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
                <Label className="text-base">Recommandation</Label>
                <RadioGroup
                  value={recommendation}
                  onValueChange={setRecommendation}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3"
                >
                  {RECOMMENDATIONS.map(rec => (
                    <div key={rec.value} className="flex items-center space-x-3">
                      <RadioGroupItem value={rec.value} id={rec.value} />
                      <Label htmlFor={rec.value} className="flex items-center gap-2 cursor-pointer">
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-heading font-semibold">Références Vidéo</h2>
                <Button variant="outline" size="sm" onClick={addVideoReference}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              {videoReferences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-zinc-800/30 rounded-lg">
                  <Video className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Aucune vidéo ajoutée</p>
                  <p className="text-sm">Cliquez sur "Ajouter" pour référencer des vidéos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {videoReferences.map((video, idx) => (
                    <Card key={video.id} className="bg-zinc-800/50 border-zinc-700">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <p className="font-medium">Vidéo {idx + 1}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeVideoReference(video.id)}
                            className="text-muted-foreground hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Select
                            value={video.video_type}
                            onValueChange={(value) => updateVideoReference(video.id, 'video_type', value)}
                          >
                            <SelectTrigger className="bg-zinc-900/50 border-zinc-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700">
                              <SelectItem value="full_match">Match Complet</SelectItem>
                              <SelectItem value="highlights">Highlights</SelectItem>
                              <SelectItem value="external">Lien Externe</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Titre (optionnel)"
                            value={video.title}
                            onChange={(e) => updateVideoReference(video.id, 'title', e.target.value)}
                            className="bg-zinc-900/50 border-zinc-700"
                          />
                        </div>
                        <Input
                          placeholder="URL de la vidéo"
                          value={video.url}
                          onChange={(e) => updateVideoReference(video.id, 'url', e.target.value)}
                          className="mt-3 bg-zinc-900/50 border-zinc-700"
                        />
                        
                        {/* Timestamps */}
                        <div className="mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addTimestamp(video.id)}
                            className="text-primary"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Ajouter un timestamp
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
                                className="w-24 bg-zinc-900/50 border-zinc-700 text-sm"
                              />
                              <Input
                                placeholder="Action clé"
                                value={ts.action}
                                onChange={(e) => {
                                  const newTs = [...video.timestamps];
                                  newTs[tsIdx] = { ...ts, action: e.target.value };
                                  updateVideoReference(video.id, 'timestamps', newTs);
                                }}
                                className="flex-1 bg-zinc-900/50 border-zinc-700 text-sm"
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
            <div className="space-y-6">
              <h2 className="text-lg font-heading font-semibold">Résumé & Notes</h2>
              
              <div>
                <Label>Résumé Exécutif (optionnel)</Label>
                <Textarea
                  value={notes.executive_summary}
                  onChange={(e) => setNotes({ ...notes, executive_summary: e.target.value })}
                  className="mt-1.5 bg-zinc-800/50 border-zinc-700 min-h-[80px]"
                  placeholder="Bref résumé de l'évaluation..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Points Forts</Label>
                  <Textarea
                    value={notes.strengths_notes}
                    onChange={(e) => setNotes({ ...notes, strengths_notes: e.target.value })}
                    className="mt-1.5 bg-zinc-800/50 border-zinc-700 min-h-[100px]"
                    placeholder="Les forces principales du joueur..."
                  />
                </div>
                <div>
                  <Label>Axes d'Amélioration</Label>
                  <Textarea
                    value={notes.weaknesses_notes}
                    onChange={(e) => setNotes({ ...notes, weaknesses_notes: e.target.value })}
                    className="mt-1.5 bg-zinc-800/50 border-zinc-700 min-h-[100px]"
                    placeholder="Les points à travailler..."
                  />
                </div>
              </div>

              <div>
                <Label>Potentiel de Développement</Label>
                <Textarea
                  value={notes.development_potential}
                  onChange={(e) => setNotes({ ...notes, development_potential: e.target.value })}
                  className="mt-1.5 bg-zinc-800/50 border-zinc-700 min-h-[80px]"
                  placeholder="Projection et potentiel futur..."
                />
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <Checkbox
                  id="ai-report"
                  checked={generateAiReport}
                  onCheckedChange={setGenerateAiReport}
                />
                <Label htmlFor="ai-report" className="cursor-pointer">
                  Générer automatiquement un rapport IA professionnel
                </Label>
              </div>

              {/* Summary Preview */}
              <Card className="bg-zinc-800/30 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-base">Aperçu des Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(METRICS).map(([key, cat]) => {
                      const avg = Object.values(scores[key]).reduce((sum, m) => sum + m.score, 0) / 
                                  Object.values(scores[key]).length;
                      return (
                        <div key={key} className="text-center">
                          <p className={`text-2xl font-bold text-${cat.color}-400`}>{avg.toFixed(1)}</p>
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
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Précédent
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button onClick={() => setCurrentStep(currentStep + 1)}>
            Suivant
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={saving}
            className="bg-primary text-black hover:bg-primary/90"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Créer l'Évaluation
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EvaluationForm;

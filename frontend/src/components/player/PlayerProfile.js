import { useState, useEffect } from 'react';
import DeleteAccountSection from "./DeleteAccountSection";
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import LeagueLevelPicker from '@/components/shared/LeagueLevelPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { User, Camera, Upload, CheckCircle, Video, Plus, Trash2, ExternalLink, Calendar, MapPin } from 'lucide-react';
import { POSITIONS, LEVELS, FEET, COUNTRIES } from '@/lib/constants';

const COMPETITION_LEVELS = [
  'Professional',
  'Semi-Professional',
  'Amateur',
  'University/College',
  'Youth Academy',
  'National Team',
  'Friendly/Exhibition'
];

const BADGE_LABELS = {
  verified_profile: "Verified Profile", match_ready: "Match Ready", scout_approved: "Scout Approved",
  professional_experience: "Professional Experience", international_player: "International Player",
  university_eligible: "University Eligible", top_prospect: "Top Prospect",
  diaspora_eligible: "Diaspora Eligible", video_verified: "Video Verified",
  ncaa_ready: "NCAA Ready", njcaa_ready: "NJCAA Ready", usports_ready: "U SPORTS Ready"
};
const BADGE_ICONS = {
  verified_profile: "✓", match_ready: "⚡", scout_approved: "👁", professional_experience: "🏆",
  international_player: "🌍", university_eligible: "🎓", top_prospect: "⭐",
  diaspora_eligible: "🌐", video_verified: "🎥",
  ncaa_ready: "🏈", njcaa_ready: "🏟️", usports_ready: "🍁"
};
const QUALITY_COLORS = {
  Bronze: "text-amber-600 border-amber-600/30 bg-amber-600/10",
  Silver: "text-gray-300 border-gray-300/30 bg-gray-300/10",
  Gold: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  Elite: "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

import AgentRepresentation from '@/components/player/AgentRepresentation';

const PlayerProfile = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verification, setVerification] = useState(null);
  const [formData, setFormData] = useState({});
  const [highlightLocked, setHighlightLocked] = useState(false);
  
  // Match Archive state
  const [matchArchive, setMatchArchive] = useState([]);
  const [showAddMatchDialog, setShowAddMatchDialog] = useState(false);
  const [addingMatch, setAddingMatch] = useState(false);
  const [newMatch, setNewMatch] = useState({
    video_link: '',
    match_date: '',
    opponent: '',
    competition_level: '',
    description: '',
    position_played: ''
  });

  // Match Calendar state
  const [matchCalendar, setMatchCalendar] = useState([]);
  const [showAddCalendarDialog, setShowAddCalendarDialog] = useState(false);
  const [addingCalendarMatch, setAddingCalendarMatch] = useState(false);
  const [newCalendarMatch, setNewCalendarMatch] = useState({
    match_date: '',
    match_time: '',
    opponent: '',
    competition: '',
    stadium: '',
    location: ''
  });

  useEffect(() => {
    api.getMyCredits().then(res => {
      const claimed = res.data.transactions?.some(t => t.type === "highlights_uploaded");
      setHighlightLocked(claimed);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadProfile();
    loadMatchArchive();
    api.getMyVerification().then(r => setVerification(r.data)).catch(() => {});
    loadMatchCalendar();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.getPlayerProfile();
      setProfile(response.data);
      setFormData({
        ...response.data,
        has_baccalaureate: response.data.has_baccalaureate ?? null,
        bac_year: response.data.bac_year ?? null,
        bac_grade: response.data.bac_grade ?? null,
        english_level: response.data.english_level ?? null,
        has_postsecondary: response.data.has_postsecondary ?? null,
        postsecondary_start_date: response.data.postsecondary_start_date ?? null,
        annual_budget: response.data.annual_budget ?? null,
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadMatchArchive = async () => {
    try {
      const response = await api.getPlayerMatchArchive();
      setMatchArchive(response.data || []);
    } catch (error) {
      console.error('Failed to load match archive');
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewMatchChange = (field, value) => {
    setNewMatch((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange(field, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updatePlayerProfile(formData);
      toast.success('Profile updated successfully!');
      loadProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMatch = async () => {
    if (!newMatch.video_link || !newMatch.match_date || !newMatch.opponent || !newMatch.competition_level) {
      toast.error('Please fill in all required fields');
      return;
    }

    setAddingMatch(true);
    try {
      await api.addMatchToArchive(newMatch);
      toast.success('Match added to archive!');
      setShowAddMatchDialog(false);
      setNewMatch({
        video_link: '',
        match_date: '',
        opponent: '',
        competition_level: '',
        description: '',
        position_played: ''
      });
      loadMatchArchive();
    } catch (error) {
      toast.error('Failed to add match');
    } finally {
      setAddingMatch(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;

    try {
      await api.deleteMatchFromArchive(matchId);
      toast.success('Match deleted');
      loadMatchArchive();
    } catch (error) {
      toast.error('Failed to delete match');
    }
  };

  // Match Calendar functions
  const loadMatchCalendar = async () => {
    try {
      const response = await api.getPlayerMatchCalendar();
      setMatchCalendar(response.data || []);
    } catch (error) {
      console.error('Failed to load match calendar');
    }
  };

  const handleNewCalendarMatchChange = (field, value) => {
    setNewCalendarMatch((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddCalendarMatch = async () => {
    if (!newCalendarMatch.match_date || !newCalendarMatch.opponent) {
      toast.error('Please fill in match date and opponent');
      return;
    }

    setAddingCalendarMatch(true);
    try {
      await api.addMatchToCalendar(newCalendarMatch);
      toast.success('Match added to calendar!');
      setShowAddCalendarDialog(false);
      setNewCalendarMatch({
        match_date: '',
        match_time: '',
        opponent: '',
        competition: '',
        stadium: '',
        location: ''
      });
      loadMatchCalendar();
    } catch (error) {
      toast.error('Failed to add match');
    } finally {
      setAddingCalendarMatch(false);
    }
  };

  const handleDeleteCalendarMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;

    try {
      await api.deleteMatchFromCalendar(matchId);
      toast.success('Match deleted');
      loadMatchCalendar();
    } catch (error) {
      toast.error('Failed to delete match');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">{t('player_profile.title')}</h1>
        <p className="text-muted-foreground">{t('player_profile.subtitle')}</p>
      </div>

      <div className="max-w-4xl">
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
              {formData.profile_picture ? (
                <img
                  src={formData.profile_picture}
                  alt="Profile"
                  className="w-24 h-24 rounded-sm object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-24 h-24 rounded-sm bg-muted flex items-center justify-center border-2 border-border">
                  <User className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <label
                htmlFor="profile-picture"
                className="absolute -bottom-2 -right-2 bg-primary text-black p-2 rounded-sm cursor-pointer hover:bg-primary/90"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="profile-picture"
                  data-testid="profile-picture-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload('profile_picture', e)}
                />
              </label>
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold">{profile?.name}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span
                  data-testid="approval-status"
                  className={`inline-block px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm ${
                    profile?.approved
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                      : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                  }`}
                >
                  {profile?.approved ? t('player_profile.approved') : t('player_profile.pending_approval')}
                </span>
                {profile?.verified && (
                  <span
                    data-testid="verified-badge"
                    className="inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm bg-blue-500/10 text-blue-500 border border-blue-500/20"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t('player_profile.verified')}
                  </span>
                )}
              </div>
            </div>
          </div>


          {/* Badges & Score */}
          {(verification?.badges?.length > 0 || verification?.quality_score > 0) && (
            <div className="bg-black/20 border border-white/10 rounded-sm p-4 mb-6">
              {verification?.quality_score > 0 && (
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">{t('player_profile.profile_score')}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{width: `${verification.quality_score}%`}} />
                  </div>
                  <span className="text-xs font-bold text-primary">{verification.quality_score}/100</span>
                </div>
              )}
              {verification?.badges?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {verification.badges.map(badge => (
                    <span key={badge} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm bg-white/5 border border-white/10 text-white">
                      <span>{BADGE_ICONS[badge]}</span>
                      <span>{BADGE_LABELS[badge]}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Agent Representation */}
          <div className="bg-black/20 border border-white/10 rounded-sm p-6 mb-6">
            <AgentRepresentation />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.full_name')}
              </Label>
              <Input
                id="name"
                data-testid="name-input"
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
              />
            </div>

            <div>
              <Label htmlFor="position" className="text-sm font-medium uppercase tracking-wide">
                {t('opportunities.position')}
              </Label>
              <Select value={formData.position || ''} onValueChange={(value) => handleChange('position', value)}>
                <SelectTrigger
                  id="position"
                  data-testid="position-select"
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                >
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="age" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.age')}
              </Label>
              <Input
                id="age"
                data-testid="age-input"
                type="number"
                value={formData.age || ''}
                onChange={(e) => handleChange('age', parseInt(e.target.value))}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
              />
            </div>

            <div>
              <Label htmlFor="nationality" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.primary_nationality')}
              </Label>
              <Select value={formData.nationality || ''} onValueChange={(value) => handleChange('nationality', value)}>
                <SelectTrigger
                  id="nationality"
                  data-testid="nationality-select"
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                >
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="nationality_2" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.second_nationality')}
                <span className="text-muted-foreground text-xs ml-2">{t('player_profile.second_nationality_opt')}</span>
              </Label>
              <Select value={formData.nationality_2 || ''} onValueChange={(value) => handleChange('nationality_2', value)}>
                <SelectTrigger
                  id="nationality_2"
                  data-testid="nationality-2-select"
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                >
                  <SelectValue placeholder="Select second nationality" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="none">None</SelectItem>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('player_profile.second_nationality_note')}
              </p>
            </div>

            <div>
              <Label htmlFor="residence_country" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.residence_country')}
              </Label>
              <select
                id="residence_country"
                value={formData.residence_country || ''}
                onChange={(e) => handleChange('residence_country', e.target.value)}
                className="mt-2 w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-12 px-3 text-sm text-white outline-none cursor-pointer"
              >
                <option value="">Select country of residence...</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>


            <div>
              <Label htmlFor="height" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.height')}
              </Label>
              <Input
                id="height"
                data-testid="height-input"
                type="number"
                value={formData.height || ''}
                onChange={(e) => handleChange('height', parseInt(e.target.value))}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
              />
            </div>

            <div>
              <Label htmlFor="weight" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.weight')}
              </Label>
              <Input
                id="weight"
                data-testid="weight-input"
                type="number"
                value={formData.weight || ''}
                onChange={(e) => handleChange('weight', parseInt(e.target.value))}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
              />
            </div>

            <div>
              <Label htmlFor="preferred_foot" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.preferred_foot')}
              </Label>
              <Select value={formData.preferred_foot || ''} onValueChange={(value) => handleChange('preferred_foot', value)}>
                <SelectTrigger
                  id="preferred_foot"
                  data-testid="preferred-foot-select"
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                >
                  <SelectValue placeholder="Select foot" />
                </SelectTrigger>
                <SelectContent>
                  {FEET.map((foot) => (
                    <SelectItem key={foot} value={foot}>
                      {foot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="current_club" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.current_club')}
              </Label>
              <Input
                id="current_club"
                data-testid="current-club-input"
                type="text"
                value={formData.current_club || ''}
                onChange={(e) => handleChange('current_club', e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
              />
            </div>
<div>
  <Label htmlFor="contract_end_date" className="text-sm font-medium uppercase tracking-wide">
    {t('player_profile.contract_until')}
  </Label>
  <Input
    id="contract_end_date"
    type="date" style={{colorScheme: "dark"}}
    value={formData.contract_end_date || ''}
    onChange={(e) => handleChange('contract_end_date', e.target.value)}
    style={{colorScheme: "dark"}}
    className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
  />
</div>
<div>
  <Label htmlFor="market_value" className="text-sm font-medium uppercase tracking-wide">
    {t('player_profile.market_value')}
  </Label>
  <Input
    id="market_value"
    type="text"
    value={formData.market_value || ''}
    onChange={(e) => handleChange('market_value', e.target.value)}
    placeholder="e.g. €500,000"
    className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
  />
</div>
<div>
  <Label htmlFor="visibility" className="text-sm font-medium uppercase tracking-wide">
    {t('player_profile.profile_visibility')}
  </Label>
  <select
    id="visibility"
    value={formData.visibility || 'public'}
    onChange={(e) => handleChange('visibility', e.target.value)}
    className="mt-2 w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-12 px-3 text-sm text-white appearance-none cursor-pointer"
  >
    <option value="public">{t('player_profile.visibility_public')}</option>
    <option value="clubs_only">{t('player_profile.visibility_clubs')}</option>
    <option value="agents_only">{t('player_profile.visibility_agents')}</option>
    <option value="private">{t('player_profile.visibility_private')}</option>
  </select>
  <p className="text-xs text-muted-foreground mt-1">{t('player_profile.visibility_note')}</p>
</div>

            <div>
              <Label htmlFor="playing_level" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.playing_level')}
              </Label>
              <div className="mt-2">
                <LeagueLevelPicker
                  value={formData.playing_level || ""}
                  onChange={(val) => handleChange("playing_level", val)}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">{t('player_profile.looking_for')}</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">{t('player_profile.looking_for_note')}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { val: "Professional Opportunities", label: t('register.looking_for_professional') },
                  { val: "Semi-Professional Opportunities", label: t('register.looking_for_semi') },
                  { val: "Amateur Opportunities", label: t('register.looking_for_amateur') },
                  { val: "University Opportunities", label: t('register.looking_for_university') },
                  { val: "All", label: t('register.looking_for_all') },
                ].map(opt => {
                  const active = (formData.looking_for || []).includes(opt.val);
                  return (
                    <button key={opt.val} type="button"
                      onClick={() => {
                        const current = formData.looking_for || [];
                        handleChange('looking_for', active ? current.filter(v => v !== opt.val) : [...current, opt.val]);
                      }}
                      className={`px-3 py-2 text-xs rounded-sm border-2 transition-all font-medium ${active ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="games" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.games')}
              </Label>
              <Input
                id="games"
                data-testid="games-input"
                type="number"
                value={formData.games || ''}
                onChange={(e) => handleChange('games', parseInt(e.target.value))}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
              />
            </div>

            <div>
              <Label htmlFor="goals" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.goals')}
              </Label>
              <Input
                id="goals"
                data-testid="goals-input"
                type="number"
                value={formData.goals || ''}
                onChange={(e) => handleChange('goals', parseInt(e.target.value))}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
              />
            </div>

            <div>
              <Label htmlFor="assists" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.assists')}
              </Label>
              <Input
                id="assists"
                data-testid="assists-input"
                type="number"
                value={formData.assists || ''}
                onChange={(e) => handleChange('assists', parseInt(e.target.value))}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="highlight_video" className="text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                {t('player_profile.highlight_video')}
              </Label>
              <Input
                id="highlight_video"
                data-testid="highlight-video-input"
                type="url"
                value={formData.highlight_video || ''}
                onChange={(e) => handleChange('highlight_video', e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                placeholder="https://youtube.com/..."
              />
            </div>
              <p className="text-xs text-yellow-400 mt-1">⚠️ {t('player_profile.highlight_public_note')}</p>

            <div className="md:col-span-2 border-t border-border/30 pt-4">
              <p className="text-sm font-bold uppercase tracking-wide text-primary mb-3">{t('player_profile.season_stats')} <span className="text-xs font-normal normal-case text-muted-foreground">{t('player_profile.season_stats_note')}</span></p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide">{t('player_profile.season_label')}</Label>
                  <Input type="text" placeholder="e.g. 2024/25"
                    value={formData.season_label || ""}
                    onChange={e => handleChange("season_label", e.target.value)}
                    className="mt-1 bg-black/20 border-white/10 focus:border-primary rounded-sm h-10" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide">{t('player_profile.season_games')}</Label>
                  <Input type="number" value={formData.season_games || ""}
                    onChange={e => { const v = e.target.value; handleChange("season_games", v === "" ? null : parseInt(v)); }}
                    className="mt-1 bg-black/20 border-white/10 focus:border-primary rounded-sm h-10" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide">{t('player_profile.season_goals')}</Label>
                  <Input type="number" value={formData.season_goals || ""}
                    onChange={e => { const v = e.target.value; handleChange("season_goals", v === "" ? null : parseInt(v)); }}
                    className="mt-1 bg-black/20 border-white/10 focus:border-primary rounded-sm h-10" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide">{t('player_profile.season_assists')}</Label>
                  <Input type="number" value={formData.season_assists || ""}
                    onChange={e => { const v = e.target.value; handleChange("season_assists", v === "" ? null : parseInt(v)); }}
                    className="mt-1 bg-black/20 border-white/10 focus:border-primary rounded-sm h-10" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide">{t('player_profile.season_minutes')}</Label>
                  <Input type="number" value={formData.season_minutes_played || ""}
                    onChange={e => { const v = e.target.value; handleChange("season_minutes_played", v === "" ? null : parseInt(v)); }}
                    className="mt-1 bg-black/20 border-white/10 focus:border-primary rounded-sm h-10" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide">{t('player_profile.season_clean_sheets')}</Label>
                  <Input type="number" value={formData.season_clean_sheets || ""}
                    onChange={e => { const v = e.target.value; handleChange("season_clean_sheets", v === "" ? null : parseInt(v)); }}
                    className="mt-1 bg-black/20 border-white/10 focus:border-primary rounded-sm h-10" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide">{t('player_profile.season_yellow')}</Label>
                  <Input type="number" value={formData.season_yellow_cards || ""}
                    onChange={e => { const v = e.target.value; handleChange("season_yellow_cards", v === "" ? null : parseInt(v)); }}
                    className="mt-1 bg-black/20 border-white/10 focus:border-primary rounded-sm h-10" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide">{t('player_profile.season_red')}</Label>
                  <Input type="number" value={formData.season_red_cards || ""}
                    onChange={e => { const v = e.target.value; handleChange("season_red_cards", v === "" ? null : parseInt(v)); }}
                    className="mt-1 bg-black/20 border-white/10 focus:border-primary rounded-sm h-10" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="cv" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.cv_resume')}
              </Label>
              <div className="mt-2 flex items-center space-x-4">
                <Input
                  id="cv"
                  data-testid="cv-input"
                  type="text"
                  value={formData.cv || ''}
                  onChange={(e) => handleChange('cv', e.target.value)}
                  className="flex-1 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                  placeholder={t('player_profile.cv_placeholder')}
                />
                <label className="bg-muted hover:bg-muted/80 px-4 h-12 rounded-sm flex items-center cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  {t('player_profile.cv_upload_btn')}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => handleImageUpload('cv', e)}
                  />
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="transfermarkt_url" className="text-sm font-medium uppercase tracking-wide">
                {t('player_profile.transfermarkt')}
              </Label>
              <Input
                id="transfermarkt_url"
                data-testid="transfermarkt-url-input"
                type="url"
                value={formData.transfermarkt_url || ''}
                onChange={(e) => handleChange('transfermarkt_url', e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                placeholder="https://www.transfermarkt.us/player/profil/spieler/12345"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('player_profile.transfermarkt_note')}
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              data-testid="save-profile-btn"
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12 px-8"
            >
              {saving ? t('player_profile.saving_btn') : t('player_profile.save_btn')}
            </Button>
          </div>
        </div>

        {/* Match Archive Section */}
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Video className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-heading font-bold uppercase">{t('player_profile.match_archive')}</h2>
                <p className="text-sm text-muted-foreground">{t('player_profile.match_archive_desc')}</p>
              </div>
            </div>
            <Dialog open={showAddMatchDialog} onOpenChange={setShowAddMatchDialog}>
              <DialogTrigger asChild>
                <Button
                  data-testid="add-match-btn"
                  className="bg-primary text-black font-bold uppercase text-xs sm:text-sm tracking-normal hover:bg-primary/90 rounded-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('player_profile.add_match_btn')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-heading uppercase">{t('player_profile.add_archive_dialog_title')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-sm font-medium uppercase tracking-wide">{t('player_profile.video_link')}</Label>
                    <Input
                      data-testid="match-video-link"
                      type="url"
                      value={newMatch.video_link}
                      onChange={(e) => handleNewMatchChange('video_link', e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="mt-1 bg-black/20 border-white/10 h-10"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium uppercase tracking-wide">{t('player_profile.match_date')}</Label>
                      <Input
                        data-testid="match-date"
                        type="date" style={{colorScheme: "dark"}}
                        value={newMatch.match_date}
                        onChange={(e) => handleNewMatchChange('match_date', e.target.value)}
                        className="mt-1 bg-black/20 border-white/10 h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium uppercase tracking-wide">{t('player_profile.opponent')}</Label>
                      <Input
                        data-testid="match-opponent"
                        type="text"
                        value={newMatch.opponent}
                        onChange={(e) => handleNewMatchChange('opponent', e.target.value)}
                        placeholder="e.g., FC Barcelona"
                        className="mt-1 bg-black/20 border-white/10 h-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium uppercase tracking-wide">{t('player_profile.comp_level')}</Label>
                      <Select
                        value={newMatch.competition_level}
                        onValueChange={(value) => handleNewMatchChange('competition_level', value)}
                      >
                        <SelectTrigger data-testid="match-level" className="mt-1 bg-black/20 border-white/10 h-10">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPETITION_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium uppercase tracking-wide">{t('player_profile.position_played')}</Label>
                      <Select
                        value={newMatch.position_played}
                        onValueChange={(value) => handleNewMatchChange('position_played', value)}
                      >
                        <SelectTrigger data-testid="match-position" className="mt-1 bg-black/20 border-white/10 h-10">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITIONS.map((pos) => (
                            <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium uppercase tracking-wide">{t('player_profile.desc_notes')}</Label>
                    <Textarea
                      data-testid="match-description"
                      value={newMatch.description}
                      onChange={(e) => handleNewMatchChange('description', e.target.value)}
                      placeholder="e.g., League match - scored 2 goals, full 90 minutes played"
                      className="mt-1 bg-black/20 border-white/10 min-h-[80px]"
                    />
                  </div>
                  <Button
                    data-testid="submit-match-btn"
                    onClick={handleAddMatch}
                    disabled={addingMatch}
                    className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 h-12"
                  >
                    {addingMatch ? t('player_profile.adding_btn') : t('player_profile.add_to_archive_btn')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {matchArchive.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-sm">
              <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t('player_profile.no_archive')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('player_profile.no_archive_note')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchArchive.map((match) => (
                <div
                  key={match.id}
                  data-testid={`match-item-${match.id}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-background rounded-sm border border-border gap-3"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-heading font-bold">vs {match.opponent}</h4>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                        {match.competition_level}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{match.match_date}</span>
                      {match.position_played && <span>{t('player_profile.played_as', { pos: match.position_played })}</span>}
                    </div>
                    {match.description && (
                      <p className="text-sm text-muted-foreground mt-1">{match.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(match.video_link, '_blank')}
                      className="border-primary text-primary hover:bg-primary hover:text-black"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      {t('player_profile.watch_btn')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMatch(match.id)}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Match Calendar Section */}
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 text-blue-500" />
              <div>
                <h2 className="text-xl font-heading font-bold uppercase">{t('player_profile.upcoming_matches')}</h2>
                <p className="text-sm text-muted-foreground">{t('player_profile.upcoming_matches_desc')}</p>
              </div>
            </div>
            <Dialog open={showAddCalendarDialog} onOpenChange={setShowAddCalendarDialog}>
              <DialogTrigger asChild>
                <Button
                  data-testid="add-calendar-match-btn"
                  className="bg-blue-500 text-white font-bold uppercase text-xs sm:text-sm tracking-normal hover:bg-blue-600 rounded-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('player_profile.add_match_btn')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-heading uppercase">{t('player_profile.add_calendar_dialog_title')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium uppercase tracking-wide">{t('player_profile.match_date')}</Label>
                      <Input
                        data-testid="calendar-match-date"
                        type="date" style={{colorScheme: "dark"}}
                        value={newCalendarMatch.match_date}
                        onChange={(e) => handleNewCalendarMatchChange('match_date', e.target.value)}
                        className="mt-1 bg-black/20 border-white/10 h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium uppercase tracking-wide">{t('player_profile.kickoff')}</Label>
                      <Input
                        data-testid="calendar-match-time"
                        type="time"
                        value={newCalendarMatch.match_time}
                        onChange={(e) => handleNewCalendarMatchChange('match_time', e.target.value)}
                        className="mt-1 bg-black/20 border-white/10 h-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium uppercase tracking-wide">{t('player_profile.opponent')}</Label>
                    <Input
                      data-testid="calendar-opponent"
                      type="text"
                      value={newCalendarMatch.opponent}
                      onChange={(e) => handleNewCalendarMatchChange('opponent', e.target.value)}
                      placeholder="e.g., Manchester United"
                      className="mt-1 bg-black/20 border-white/10 h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium uppercase tracking-wide">{t('player_profile.comp_league')}</Label>
                    <Input
                      data-testid="calendar-competition"
                      type="text"
                      value={newCalendarMatch.competition}
                      onChange={(e) => handleNewCalendarMatchChange('competition', e.target.value)}
                      placeholder="e.g., Premier League, Cup Match, Friendly"
                      className="mt-1 bg-black/20 border-white/10 h-10"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium uppercase tracking-wide">{t('player_profile.stadium')}</Label>
                      <Input
                        data-testid="calendar-stadium"
                        type="text"
                        value={newCalendarMatch.stadium}
                        onChange={(e) => handleNewCalendarMatchChange('stadium', e.target.value)}
                        placeholder="e.g., Old Trafford"
                        className="mt-1 bg-black/20 border-white/10 h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium uppercase tracking-wide">{t('player_profile.location')}</Label>
                      <Input
                        data-testid="calendar-location"
                        type="text"
                        value={newCalendarMatch.location}
                        onChange={(e) => handleNewCalendarMatchChange('location', e.target.value)}
                        placeholder="e.g., Manchester, UK"
                        className="mt-1 bg-black/20 border-white/10 h-10"
                      />
                    </div>
                  </div>
                  <Button
                    data-testid="submit-calendar-match-btn"
                    onClick={handleAddCalendarMatch}
                    disabled={addingCalendarMatch}
                    className="w-full bg-blue-500 text-white font-bold uppercase tracking-wide hover:bg-blue-600 h-12"
                  >
                    {addingCalendarMatch ? t('player_profile.adding_calendar_btn') : t('player_profile.add_to_calendar_btn')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {matchCalendar.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-sm">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t('player_profile.no_upcoming')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('player_profile.no_upcoming_note')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchCalendar.map((match) => (
                <div
                  key={match.id}
                  data-testid={`calendar-item-${match.id}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-background rounded-sm border border-border gap-3"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-heading font-bold">vs {match.opponent}</h4>
                      {match.competition && (
                        <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-sm">
                          {match.competition}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{match.match_date}</span>
                      {match.match_time && <span>{t('player_profile.at_time', { time: match.match_time })}</span>}
                    </div>
                    {(match.stadium || match.location) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{[match.stadium, match.location].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCalendarMatch(match.id)}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DeleteAccountSection />
    </div>
  );
};

export default PlayerProfile;



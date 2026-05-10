import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
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

const PlayerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  
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
    loadProfile();
    loadMatchArchive();
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">MY PROFILE</h1>
        <p className="text-muted-foreground">Manage your player profile and information</p>
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
                  {profile?.approved ? 'APPROVED' : 'PENDING APPROVAL'}
                </span>
                {profile?.verified && (
                  <span
                    data-testid="verified-badge"
                    className="inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm bg-blue-500/10 text-blue-500 border border-blue-500/20"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    VERIFIED
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="text-sm font-medium uppercase tracking-wide">
                Full Name
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
                Position
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
                Age
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
                Primary Nationality
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
                Second Nationality
                <span className="text-muted-foreground text-xs ml-2">(Optional)</span>
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
                Add a second nationality to be scouted by multiple federations
              </p>
            </div>

            <div>
              <Label htmlFor="height" className="text-sm font-medium uppercase tracking-wide">
                Height (cm)
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
                Weight (kg)
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
                Preferred Foot
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
                Current Club
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
  <Label htmlFor="contract_until" className="text-sm font-medium uppercase tracking-wide">
    Contract Until
  </Label>
  <Input
    id="contract_until"
    type="text"
    value={formData.contract_until || ''}
    onChange={(e) => handleChange('contract_until', e.target.value)}
    placeholder="e.g. June 2026"
    className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
  />
</div>
<div>
  <Label htmlFor="market_value" className="text-sm font-medium uppercase tracking-wide">
    Market Value
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
    Profile Visibility
  </Label>
  <select
    id="visibility"
    value={formData.visibility || 'public'}
    onChange={(e) => handleChange('visibility', e.target.value)}
    className="mt-2 w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-12 px-3 text-sm text-white appearance-none cursor-pointer"
  >
    <option value="public">Public — visible to everyone</option>
    <option value="clubs_only">Clubs only</option>
    <option value="agents_only">Agents only</option>
    <option value="private">Private — only me</option>
  </select>
  <p className="text-xs text-muted-foreground mt-1">Control who can see your profile</p>
</div>

            {/* Academic & Eligibility Section */}
            <div className="col-span-2 border-t border-border pt-6 mt-2">
              <h3 className="text-lg font-heading font-bold uppercase mb-4 text-primary">Academic & Eligibility</h3>
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Baccalauréat / A-Level</Label>
              <select
                value={formData.has_baccalaureate === true ? "yes" : formData.has_baccalaureate === false ? "no" : ""}
                onChange={(e) => handleChange("has_baccalaureate", e.target.value === "yes" ? true : e.target.value === "no" ? false : null)}
                className="mt-2 w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-12 px-3 text-sm text-white appearance-none cursor-pointer"
              >
                <option value="">Select...</option>
                <option value="yes">Yes - obtained or in progress</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Bac Year</Label>
              <Input
                type="number"
                value={formData.bac_year || ""}
                onChange={(e) => handleChange("bac_year", parseInt(e.target.value))}
                placeholder="e.g. 2023"
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Bac Grade / Average</Label>
              <Input
                type="text"
                value={formData.bac_grade || ""}
                onChange={(e) => handleChange("bac_grade", e.target.value)}
                placeholder="e.g. 14/20 or B+"
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">English Level (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.english_level || ""}
                onChange={(e) => handleChange("english_level", parseInt(e.target.value))}
                placeholder="1 = basic, 10 = fluent"
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Post-Secondary Studies</Label>
              <select
                value={formData.has_postsecondary === true ? "yes" : formData.has_postsecondary === false ? "no" : ""}
                onChange={(e) => handleChange("has_postsecondary", e.target.value === "yes" ? true : e.target.value === "no" ? false : null)}
                className="mt-2 w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-12 px-3 text-sm text-white appearance-none cursor-pointer"
              >
                <option value="">Select...</option>
                <option value="yes">Yes (Cégep, University, BTS, etc.)</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Post-Secondary Start Date</Label>
              <Input
                type="month"
                value={formData.postsecondary_start_date || ""}
                onChange={(e) => handleChange("postsecondary_start_date", e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
              />
            </div>

            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Annual Budget (USD)</Label>
              <Input
                type="text"
                value={formData.annual_budget || ""}
                onChange={(e) => handleChange("annual_budget", e.target.value)}
                placeholder="e.g. $5,000 - $15,000"
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
              />
              <p className="text-xs text-muted-foreground mt-1">Amount you can contribute annually to tuition and personal expenses</p>
            </div>

            <div>
              <Label htmlFor="playing_level" className="text-sm font-medium uppercase tracking-wide">
                Playing Level
              </Label>
              <Select value={formData.playing_level || ''} onValueChange={(value) => handleChange('playing_level', value)}>
                <SelectTrigger
                  id="playing_level"
                  data-testid="playing-level-select"
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                >
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="games" className="text-sm font-medium uppercase tracking-wide">
                Games Played
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
                Goals
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
                Assists
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
              <Label htmlFor="highlight_video" className="text-sm font-medium uppercase tracking-wide">
                Highlight Video (YouTube/Vimeo URL)
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

            <div className="md:col-span-2">
              <Label htmlFor="cv" className="text-sm font-medium uppercase tracking-wide">
                CV / Resume (Base64 or URL)
              </Label>
              <div className="mt-2 flex items-center space-x-4">
                <Input
                  id="cv"
                  data-testid="cv-input"
                  type="text"
                  value={formData.cv || ''}
                  onChange={(e) => handleChange('cv', e.target.value)}
                  className="flex-1 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                  placeholder="Upload or paste URL"
                />
                <label className="bg-muted hover:bg-muted/80 px-4 h-12 rounded-sm flex items-center cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
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
                Transfermarkt Profile Link
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
                Add your Transfermarkt profile to get AI-powered match scores for opportunities
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
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </Button>
          </div>
        </div>

        {/* Match Archive Section */}
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Video className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-heading font-bold uppercase">MATCH ARCHIVE</h2>
                <p className="text-sm text-muted-foreground">Add full game videos for clubs and scouts to review</p>
              </div>
            </div>
            <Dialog open={showAddMatchDialog} onOpenChange={setShowAddMatchDialog}>
              <DialogTrigger asChild>
                <Button
                  data-testid="add-match-btn"
                  className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  ADD MATCH
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-heading uppercase">Add Match Video</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-sm font-medium uppercase tracking-wide">Video Link *</Label>
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
                      <Label className="text-sm font-medium uppercase tracking-wide">Match Date *</Label>
                      <Input
                        data-testid="match-date"
                        type="date"
                        value={newMatch.match_date}
                        onChange={(e) => handleNewMatchChange('match_date', e.target.value)}
                        className="mt-1 bg-black/20 border-white/10 h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium uppercase tracking-wide">Opponent *</Label>
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
                      <Label className="text-sm font-medium uppercase tracking-wide">Competition Level *</Label>
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
                      <Label className="text-sm font-medium uppercase tracking-wide">Position Played</Label>
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
                    <Label className="text-sm font-medium uppercase tracking-wide">Description / Notes</Label>
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
                    {addingMatch ? 'ADDING...' : 'ADD TO ARCHIVE'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {matchArchive.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-sm">
              <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No matches in your archive yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add full game videos to showcase your skills to scouts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchArchive.map((match) => (
                <div
                  key={match.id}
                  data-testid={`match-item-${match.id}`}
                  className="flex items-center justify-between p-4 bg-background rounded-sm border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-heading font-bold">vs {match.opponent}</h4>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                        {match.competition_level}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{match.match_date}</span>
                      {match.position_played && <span>Played as {match.position_played}</span>}
                    </div>
                    {match.description && (
                      <p className="text-sm text-muted-foreground mt-1">{match.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(match.video_link, '_blank')}
                      className="border-primary text-primary hover:bg-primary hover:text-black"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      WATCH
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
                <h2 className="text-xl font-heading font-bold uppercase">UPCOMING MATCHES</h2>
                <p className="text-sm text-muted-foreground">Share your schedule with clubs and scouts for live scouting</p>
              </div>
            </div>
            <Dialog open={showAddCalendarDialog} onOpenChange={setShowAddCalendarDialog}>
              <DialogTrigger asChild>
                <Button
                  data-testid="add-calendar-match-btn"
                  className="bg-blue-500 text-white font-bold uppercase tracking-wide hover:bg-blue-600 rounded-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  ADD MATCH
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-heading uppercase">Add Upcoming Match</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium uppercase tracking-wide">Match Date *</Label>
                      <Input
                        data-testid="calendar-match-date"
                        type="date"
                        value={newCalendarMatch.match_date}
                        onChange={(e) => handleNewCalendarMatchChange('match_date', e.target.value)}
                        className="mt-1 bg-black/20 border-white/10 h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium uppercase tracking-wide">Kick-off Time</Label>
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
                    <Label className="text-sm font-medium uppercase tracking-wide">Opponent *</Label>
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
                    <Label className="text-sm font-medium uppercase tracking-wide">Competition / League</Label>
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
                      <Label className="text-sm font-medium uppercase tracking-wide">Stadium</Label>
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
                      <Label className="text-sm font-medium uppercase tracking-wide">Location / City</Label>
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
                    {addingCalendarMatch ? 'ADDING...' : 'ADD TO CALENDAR'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {matchCalendar.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-sm">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No upcoming matches scheduled</p>
              <p className="text-sm text-muted-foreground mt-1">Add your upcoming games so scouts can plan live visits</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchCalendar.map((match) => (
                <div
                  key={match.id}
                  data-testid={`calendar-item-${match.id}`}
                  className="flex items-center justify-between p-4 bg-background rounded-sm border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-heading font-bold">vs {match.opponent}</h4>
                      {match.competition && (
                        <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-sm">
                          {match.competition}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{match.match_date}</span>
                      {match.match_time && <span>at {match.match_time}</span>}
                    </div>
                    {(match.stadium || match.location) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{[match.stadium, match.location].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
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
    </div>
  );
};

export default PlayerProfile;



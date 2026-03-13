import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User, Camera, Upload, CheckCircle } from 'lucide-react';
import { POSITIONS, LEVELS, FEET, COUNTRIES } from '@/lib/constants';

const PlayerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.getPlayerProfile();
      setProfile(response.data);
      setFormData(response.data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
                Nationality
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
      </div>
    </div>
  );
};

export default PlayerProfile;
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building, Camera } from 'lucide-react';

const LEAGUES = [
  'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1',
  'Eredivisie', 'Primeira Liga', 'Pro League', 'Challenger Pro League',
  'Championship', 'League One', 'League Two',
  'MLS', 'USL Championship', 'USL League One', 'CPL', 'Liga MX',
  'Brasileirao', 'Primera Division', 'Colombian Primera',
  'Saudi Pro League', 'J1 League',
  'South African PSL', 'Egyptian Premier', 'Botola Pro',
  'National League', 'Semi-Professional', 'Amateur', 'Other',
];

const PLAYING_LEVELS = ['Amateur', 'Semi-Professional', 'Professional'];

const selectClass = "mt-2 w-full bg-black/20 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12 px-3 text-sm text-white appearance-none cursor-pointer";

const ClubProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.getClubProfile();
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

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('logo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateClubProfile(formData);
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
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">CLUB PROFILE</h1>
        <p className="text-muted-foreground">Manage your club profile and information</p>
      </div>

      <div className="max-w-4xl">
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">

          {/* Logo & identity */}
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
              {formData.logo ? (
                <img
                  src={formData.logo}
                  alt="Club Logo"
                  className="w-24 h-24 rounded-sm object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-24 h-24 rounded-sm bg-muted flex items-center justify-center border-2 border-border">
                  <Building className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <label
                htmlFor="logo"
                className="absolute -bottom-2 -right-2 bg-primary text-black p-2 rounded-sm cursor-pointer hover:bg-primary/90"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="logo"
                  data-testid="logo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold">{profile?.name}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <span
                data-testid="approval-status"
                className={`inline-block mt-2 px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm ${
                  profile?.approved
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                }`}
              >
                {profile?.approved ? 'APPROVED' : 'PENDING APPROVAL'}
              </span>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Club Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium uppercase tracking-wide">
                Club Name
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

            {/* Country */}
            <div>
              <Label htmlFor="country" className="text-sm font-medium uppercase tracking-wide">
                Country
              </Label>
              <Input
                id="country"
                data-testid="country-input"
                type="text"
                value={formData.country || ''}
                onChange={(e) => handleChange('country', e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
              />
            </div>

            {/* League dropdown */}
            <div>
              <Label htmlFor="league" className="text-sm font-medium uppercase tracking-wide">
                League
              </Label>
              <select
                id="league"
                data-testid="league-input"
                value={formData.league || ''}
                onChange={(e) => handleChange('league', e.target.value)}
                className={selectClass}
              >
                <option value="">Select a league...</option>
                <optgroup label="Europe — Top 5">
                  {['Premier League','La Liga','Bundesliga','Serie A','Ligue 1'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </optgroup>
                <optgroup label="Europe — Secondary">
                  {['Eredivisie','Primeira Liga','Pro League','Challenger Pro League','Championship','League One','League Two'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </optgroup>
                <optgroup label="North America">
                  {['MLS','USL Championship','USL League One','CPL','Liga MX'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </optgroup>
                <optgroup label="South America">
                  {['Brasileirao','Primera Division','Colombian Primera'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </optgroup>
                <optgroup label="Asia & Middle East">
                  {['Saudi Pro League','J1 League'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </optgroup>
                <optgroup label="Africa">
                  {['South African PSL','Egyptian Premier','Botola Pro'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </optgroup>
                <optgroup label="Other">
                  {['National League','Semi-Professional','Amateur','Other'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Playing Level dropdown */}
            <div>
              <Label htmlFor="playing_level" className="text-sm font-medium uppercase tracking-wide">
                Playing Level
              </Label>
              <select
                id="playing_level"
                data-testid="playing-level-input"
                value={formData.playing_level || ''}
                onChange={(e) => handleChange('playing_level', e.target.value)}
                className={selectClass}
              >
                <option value="">Select a level...</option>
                {PLAYING_LEVELS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Used by the player matching algorithm to find suitable candidates
              </p>
            </div>

          </div>

          {/* Matching info banner */}
          {formData.league && formData.playing_level && (
            <div className="mt-6 bg-primary/10 border border-primary/20 rounded-sm p-4">
              <p className="text-sm text-primary font-medium uppercase tracking-wide mb-1">
                Matching Algorithm Active
              </p>
              <p className="text-xs text-muted-foreground">
                Your club is set to <strong className="text-white">{formData.league}</strong> at <strong className="text-white">{formData.playing_level}</strong> level.
                The algorithm will automatically rank players based on their suitability for your league and level.
              </p>
            </div>
          )}

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

export default ClubProfile;
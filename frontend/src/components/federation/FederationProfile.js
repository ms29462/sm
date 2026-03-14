import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Flag, Upload } from 'lucide-react';
import { NATIONALITIES } from '@/lib/constants';

const FederationProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    logo: '',
    description: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.getFederationProfile();
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        country: response.data.country || '',
        logo: response.data.logo || '',
        description: response.data.description || ''
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await api.updateFederationProfile(formData);
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
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">FEDERATION PROFILE</h1>
        <p className="text-muted-foreground">Manage your federation information</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <Flag className="w-8 h-8 text-primary" />
            <h2 className="text-xl font-heading font-bold uppercase">Federation Details</h2>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-sm font-medium uppercase tracking-wide">
                Federation Name *
              </Label>
              <Input
                id="name"
                data-testid="federation-name-input"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
                placeholder="e.g., Cameroon Football Federation"
                required
              />
            </div>

            <div>
              <Label htmlFor="country" className="text-sm font-medium uppercase tracking-wide">
                Country *
              </Label>
              <Select value={formData.country} onValueChange={(value) => handleChange('country', value)}>
                <SelectTrigger
                  id="country"
                  data-testid="country-select"
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"
                >
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {NATIONALITIES.map((nat) => (
                    <SelectItem key={nat} value={nat}>
                      {nat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Players with this nationality will be recommended to you
              </p>
            </div>

            <div>
              <Label htmlFor="logo" className="text-sm font-medium uppercase tracking-wide">
                Federation Logo
              </Label>
              <div className="mt-2 flex items-center space-x-4">
                {formData.logo && (
                  <img
                    src={formData.logo}
                    alt="Federation logo"
                    className="w-20 h-20 rounded-sm object-cover border border-border"
                  />
                )}
                <label className="bg-muted hover:bg-muted/80 px-4 h-12 rounded-sm flex items-center cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium uppercase tracking-wide">
                Description
              </Label>
              <Textarea
                id="description"
                data-testid="description-input"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm min-h-[100px]"
                placeholder="Brief description of your federation..."
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          data-testid="save-profile-btn"
          disabled={saving}
          className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12"
        >
          {saving ? 'SAVING...' : 'SAVE PROFILE'}
        </Button>
      </form>
    </div>
  );
};

export default FederationProfile;

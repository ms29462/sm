import { useState, useEffect } from 'react';
import DeleteOrgAccountSection from "@/components/shared/DeleteOrgAccountSection";
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User, Save, CheckCircle, Briefcase } from 'lucide-react';

const COUNTRIES = [
  'England', 'Spain', 'Germany', 'France', 'Italy', 'Portugal', 'Netherlands', 'Belgium',
  'Brazil', 'Argentina', 'USA', 'Canada', 'Mexico', 'Japan', 'South Korea', 'Australia',
  'Nigeria', 'Cameroon', 'Ghana', 'Senegal', 'Egypt', 'South Africa', 'Morocco'
];

const SPECIALIZATIONS = [
  'Youth Players',
  'Professional Players',
  'International Transfers',
  'Contract Negotiations',
  'Endorsement Deals',
  'Career Management'
];

const AgentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    agency_name: '',
    license_number: '',
    fifa_registered: false,
    country: '',
    phone: '',
    profile_picture: '',
    bio: '',
    specializations: [],
    years_experience: '',
    players_represented: '',
    successful_transfers: '',
    website: '',
    linkedin: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.getAgentProfile();
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        agency_name: response.data.agency_name || '',
        license_number: response.data.license_number || '',
        fifa_registered: response.data.fifa_registered || false,
        country: response.data.country || '',
        phone: response.data.phone || '',
        profile_picture: response.data.profile_picture || '',
        bio: response.data.bio || '',
        specializations: response.data.specializations || [],
        years_experience: response.data.years_experience || '',
        players_represented: response.data.players_represented || '',
        successful_transfers: response.data.successful_transfers || '',
        website: response.data.website || '',
        linkedin: response.data.linkedin || ''
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updateData = {
        ...formData,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        players_represented: formData.players_represented ? parseInt(formData.players_represented) : null,
        successful_transfers: formData.successful_transfers ? parseInt(formData.successful_transfers) : null
      };
      await api.updateAgentProfile(updateData);
      toast.success('Profile updated successfully');
      loadProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialization = (spec) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="agent-profile">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <User className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold uppercase">AGENT PROFILE</h1>
        </div>
        <p className="text-muted-foreground">Manage your professional profile and credentials</p>
      </div>

      {/* Verification Badge */}
      {profile?.verified && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-sm p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="font-medium text-green-500">Verified Agent</p>
            <p className="text-sm text-muted-foreground">Your credentials have been verified by our team.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Basic Info */}
        <div className="bg-card border border-border/50 p-6 rounded-sm space-y-4">
          <h2 className="font-heading font-bold uppercase flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            AGENCY INFORMATION
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <Label>Agency Name</Label>
              <Input
                value={formData.agency_name}
                onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                placeholder="Elite Sports Management"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>License Number</Label>
              <Input
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="FIFA-2024-XXXX"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <Label>Country</Label>
              <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                <SelectTrigger className="mt-1 bg-black/20 border-white/10">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fifa_registered"
              checked={formData.fifa_registered}
              onChange={(e) => setFormData({ ...formData, fifa_registered: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="fifa_registered">FIFA Registered Agent</Label>
          </div>
        </div>

        {/* Contact & Online */}
        <div className="bg-card border border-border/50 p-6 rounded-sm space-y-4">
          <h2 className="font-heading font-bold uppercase">CONTACT & ONLINE PRESENCE</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+44 123 456 7890"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <Label>Profile Picture URL</Label>
              <Input
                value={formData.profile_picture}
                onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                placeholder="https://..."
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Website</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/..."
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="bg-card border border-border/50 p-6 rounded-sm space-y-4">
          <h2 className="font-heading font-bold uppercase">EXPERIENCE & TRACK RECORD</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Years of Experience</Label>
              <Input
                type="number"
                value={formData.years_experience}
                onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                placeholder="10"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <Label>Players Represented</Label>
              <Input
                type="number"
                value={formData.players_represented}
                onChange={(e) => setFormData({ ...formData, players_represented: e.target.value })}
                placeholder="25"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <Label>Successful Transfers</Label>
              <Input
                type="number"
                value={formData.successful_transfers}
                onChange={(e) => setFormData({ ...formData, successful_transfers: e.target.value })}
                placeholder="50"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
          </div>

          <div>
            <Label>Bio / Description</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell players about your experience and how you can help them..."
              className="mt-1 bg-black/20 border-white/10 min-h-[100px]"
            />
          </div>
        </div>

        {/* Specializations */}
        <div className="bg-card border border-border/50 p-6 rounded-sm space-y-4">
          <h2 className="font-heading font-bold uppercase">SPECIALIZATIONS</h2>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map(spec => (
              <button
                key={spec}
                type="button"
                onClick={() => toggleSpecialization(spec)}
                className={`px-3 py-2 rounded-sm text-sm border transition-colors ${
                  formData.specializations.includes(spec)
                    ? 'bg-primary text-black border-primary'
                    : 'bg-black/20 border-white/10 hover:border-primary/50'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={saving} className="w-full bg-primary text-black font-bold h-12">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'SAVING...' : 'SAVE PROFILE'}
        </Button>
      </form>
    </div>
  );
};

export default AgentProfile;

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User, Save, CheckCircle, Activity, Plus, X } from 'lucide-react';

const COUNTRIES = [
  'England', 'Spain', 'Germany', 'France', 'Italy', 'Portugal', 'Netherlands', 'Belgium',
  'Brazil', 'Argentina', 'USA', 'Canada', 'Mexico', 'Japan', 'South Korea', 'Australia',
  'Nigeria', 'Cameroon', 'Ghana', 'Senegal', 'Egypt', 'South Africa', 'Morocco'
];

const SPECIALIST_TYPES = [
  'Physical Trainer',
  'Physiotherapist',
  'Nutritionist',
  'Sports Psychologist',
  'Strength & Conditioning Coach',
  'Recovery Specialist',
  'Performance Analyst',
  'Rehabilitation Specialist'
];

const CERTIFICATIONS = [
  'FIFA Diploma',
  'UEFA Pro License',
  'NSCA-CSCS',
  'NASM-CPT',
  'Licensed Physiotherapist',
  'Registered Dietitian',
  'Sports Psychology Certification',
  'First Aid/CPR',
  'Other'
];

const AVAILABILITY_OPTIONS = ['Full-time', 'Part-time', 'Freelance', 'Contract'];

const SpecialistProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newService, setNewService] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    specialist_type: '',
    profile_picture: '',
    bio: '',
    country: '',
    city: '',
    phone: '',
    certifications: [],
    years_experience: '',
    current_club: '',
    hourly_rate: '',
    availability: '',
    services_offered: [],
    languages: [],
    website: '',
    linkedin: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 400;
          let w = img.width, h = img.height;
          if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }
          else { if (h > MAX) { w = w * MAX / h; h = MAX; } }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          setFormData(prev => ({ ...prev, profile_picture: canvas.toDataURL('image/jpeg', 0.7) }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await api.getSpecialistProfile();
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        specialist_type: response.data.specialist_type || '',
        profile_picture: response.data.profile_picture || '',
        bio: response.data.bio || '',
        country: response.data.country || '',
        city: response.data.city || '',
        phone: response.data.phone || '',
        certifications: Array.isArray(response.data.certifications) ? response.data.certifications : (response.data.certifications ? [response.data.certifications] : []),
        years_experience: response.data.years_experience || '',
        current_club: response.data.current_club || '',
        hourly_rate: response.data.hourly_rate || '',
        availability: response.data.availability || '',
        services_offered: response.data.services_offered || [],
        languages: response.data.languages || [],
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
        years_experience: formData.years_experience && formData.years_experience !== '' ? parseInt(formData.years_experience) : null,
        certifications: Array.isArray(formData.certifications) ? formData.certifications : (formData.certifications ? [formData.certifications] : [])
      };
      console.log('Sending:', JSON.stringify(updateData));
      await api.updateSpecialistProfile(updateData);
      toast.success('Profile updated successfully');
      loadProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleCertification = (cert) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }));
  };

  const addService = () => {
    if (newService.trim() && !formData.services_offered.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        services_offered: [...prev.services_offered, newService.trim()]
      }));
      setNewService('');
    }
  };

  const removeService = (service) => {
    setFormData(prev => ({
      ...prev,
      services_offered: prev.services_offered.filter(s => s !== service)
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== lang)
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
    <div className="p-8" data-testid="specialist-profile">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <User className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold uppercase">SPECIALIST PROFILE</h1>
        </div>
        <p className="text-muted-foreground">Manage your professional profile and services</p>
      </div>

      {/* Verification Badge */}
      {profile?.verified && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-sm p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="font-medium text-green-500">Verified Specialist</p>
            <p className="text-sm text-muted-foreground">Your credentials have been verified by our team.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Basic Info */}
        <div className="bg-card border border-border/50 p-6 rounded-sm space-y-4">
          <h2 className="font-heading font-bold uppercase flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            PROFESSIONAL INFORMATION
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dr. Sarah Johnson"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <Label>Specialist Type *</Label>
              <Select value={formData.specialist_type} onValueChange={(v) => setFormData({ ...formData, specialist_type: v })}>
                <SelectTrigger className="mt-1 bg-black/20 border-white/10">
                  <SelectValue placeholder="Select your specialization" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIST_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="London"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label>Current Club (if any)</Label>
              <Input
                value={formData.current_club}
                onChange={(e) => setFormData({ ...formData, current_club: e.target.value })}
                placeholder="Manchester United"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
          </div>

          <div>
            <Label>Bio / Description</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell players about your experience and expertise..."
              className="mt-1 bg-black/20 border-white/10 min-h-[100px]"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-card border border-border/50 p-6 rounded-sm space-y-4">
          <h2 className="font-heading font-bold uppercase">CONTACT & ONLINE</h2>

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
              <div className="mt-1 flex items-center gap-3">
                {formData.profile_picture && (
                  <img src={formData.profile_picture} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-white/10" />
                )}
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-black/20 border border-white/10 rounded-sm hover:border-primary transition-colors text-sm">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {formData.profile_picture ? "Change Photo" : "Upload Photo"}
                </label>
              </div>
              <Input
                value={formData.profile_picture}
                onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                placeholder="Or paste image URL..."
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

        {/* Availability & Rates */}
        <div className="bg-card border border-border/50 p-6 rounded-sm space-y-4">
          <h2 className="font-heading font-bold uppercase">AVAILABILITY & RATES</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Availability</Label>
              <Select value={formData.availability} onValueChange={(v) => setFormData({ ...formData, availability: v })}>
                <SelectTrigger className="mt-1 bg-black/20 border-white/10">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hourly Rate</Label>
              <Input
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                placeholder="$100-150/hour"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-card border border-border/50 p-6 rounded-sm space-y-4">
          <h2 className="font-heading font-bold uppercase">CERTIFICATIONS</h2>
          <div className="flex flex-wrap gap-2">
            {CERTIFICATIONS.map(cert => (
              <button
                key={cert}
                type="button"
                onClick={() => toggleCertification(cert)}
                className={`px-3 py-2 rounded-sm text-sm border transition-colors ${
                  formData.certifications.includes(cert)
                    ? 'bg-primary text-black border-primary'
                    : 'bg-black/20 border-white/10 hover:border-primary/50'
                }`}
              >
                {cert}
              </button>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="bg-card border border-border/50 p-6 rounded-sm space-y-4">
          <h2 className="font-heading font-bold uppercase">SERVICES OFFERED</h2>
          <div className="flex gap-2">
            <Input
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              placeholder="Add a service (e.g., ACL Rehab Program)"
              className="bg-black/20 border-white/10"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
            />
            <Button type="button" onClick={addService} className="bg-primary text-black">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.services_offered.map(service => (
              <span key={service} className="px-3 py-1 bg-primary/10 text-primary rounded-sm text-sm flex items-center gap-2">
                {service}
                <button type="button" onClick={() => removeService(service)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="bg-card border border-border/50 p-6 rounded-sm space-y-4">
          <h2 className="font-heading font-bold uppercase">LANGUAGES</h2>
          <div className="flex gap-2">
            <Input
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              placeholder="Add a language (e.g., English)"
              className="bg-black/20 border-white/10"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
            />
            <Button type="button" onClick={addLanguage} className="bg-primary text-black">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.languages.map(lang => (
              <span key={lang} className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-sm text-sm flex items-center gap-2">
                {lang}
                <button type="button" onClick={() => removeLanguage(lang)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
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

export default SpecialistProfile;

import { useState, useEffect } from 'react';
import DeleteOrgAccountSection from "@/components/shared/DeleteOrgAccountSection";
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const LICENSE_TYPES = ['FIFA', 'FFF', 'FA', 'UEFA', 'Other'];

  const [formData, setFormData] = useState({
    name: '',
    agency_name: '',
    license_number: '',
    license_type: '',
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

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profile_picture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await api.getAgentProfile();
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        agency_name: response.data.agency_name || '',
        license_number: response.data.license_number || '',
        license_type: response.data.license_type || '',
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
      toast.error(t('agent.toast_profile_load_error'));
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
      toast.success(t('agent.toast_profile_updated'));
      loadProfile();
    } catch (error) {
      toast.error(t('agent.toast_profile_error'));
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
        <div className="text-primary text-xl font-heading">{t('agent.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="agent-profile">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <User className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold uppercase">{t('agent.profile_title')}</h1>
        </div>
        <p className="text-muted-foreground">{t('agent.profile_subtitle')}</p>
      </div>

      {/* Verification Badge */}
      {profile?.verified && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-sm p-4 mb-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="font-medium text-green-500">{t('agent.profile_verified')}</p>
            <p className="text-sm text-muted-foreground">{t('agent.profile_verified_desc')}</p>
          </div>
        </div>
      )}

      {/* License Badge Status */}
      {profile?.license_verified && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-sm p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="font-medium text-green-400">{t('agent.profile_licensed')}{profile.license_type ? ` — ${profile.license_type}` : ''}</p>
            <p className="text-sm text-muted-foreground">{t('agent.profile_license_verified_desc')}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Basic Info */}
        <div className="bg-card border border-border/50 p-6 rounded-sm space-y-4">
          <h2 className="font-heading font-bold uppercase flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            {t('agent.agency_info')}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('agent.label_full_name')} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <Label>{t('agent.label_agency_name')}</Label>
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
              <Label>{t('agent.label_license_number')}</Label>
              <Input
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="FIFA-2024-XXXX"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <Label>{t('agent.label_license_type')}</Label>
              <Select value={formData.license_type} onValueChange={(v) => setFormData({ ...formData, license_type: v })}>
                <SelectTrigger className="mt-1 bg-black/20 border-white/10">
                  <SelectValue placeholder={t('agent.label_select_type')} />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map(lt => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('agent.label_country')}</Label>
              <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                <SelectTrigger className="mt-1 bg-black/20 border-white/10">
                  <SelectValue placeholder={t('agent.label_select_country')} />
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
            <Label htmlFor="fifa_registered">{t('agent.label_fifa_registered')}</Label>
          </div>
        </div>

        {/* Contact & Online */}
        <div className="bg-card border border-border/50 p-6 rounded-sm space-y-4">
          <h2 className="font-heading font-bold uppercase">{t('agent.contact_online')}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('agent.label_phone')}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+44 123 456 7890"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <Label>{t('agent.label_profile_picture')}</Label>
              <div className="mt-1 flex items-center gap-3">
                {formData.profile_picture && (
                  <img src={formData.profile_picture} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-white/10" />
                )}
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-black/20 border border-white/10 rounded-sm hover:border-primary transition-colors text-sm">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {formData.profile_picture ? t('agent.btn_change_photo') : t('agent.btn_upload_photo')}
                </label>
              </div>
              <Input
                value={formData.profile_picture}
                onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                placeholder={t('agent.label_paste_url')}
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('agent.label_website')}</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <Label>{t('agent.label_linkedin')}</Label>
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
          <h2 className="font-heading font-bold uppercase">{t('agent.experience_section')}</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>{t('agent.label_years_exp')}</Label>
              <Input
                type="number"
                value={formData.years_experience}
                onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                placeholder="10"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <Label>{t('agent.label_players_rep')}</Label>
              <Input
                type="number"
                value={formData.players_represented}
                onChange={(e) => setFormData({ ...formData, players_represented: e.target.value })}
                placeholder="25"
                className="mt-1 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <Label>{t('agent.label_transfers')}</Label>
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
            <Label>{t('agent.label_bio')}</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder={t('agent.bio_placeholder')}
              className="mt-1 bg-black/20 border-white/10 min-h-[100px]"
            />
          </div>
        </div>

        {/* Specializations */}
        <div className="bg-card border border-border/50 p-6 rounded-sm space-y-4">
          <h2 className="font-heading font-bold uppercase">{t('agent.specializations')}</h2>
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
          {saving ? t('agent.btn_saving_profile') : t('agent.btn_save_profile')}
        </Button>
      </form>
    <DeleteOrgAccountSection />
    </div>
  );
};

export default AgentProfile;

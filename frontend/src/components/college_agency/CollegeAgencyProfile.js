import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Belgium","Bolivia","Brazil","Cameroon","Canada","Chile","China","Colombia","Congo","Costa Rica","Croatia","Czech Republic","Denmark","DR Congo","Ecuador","Egypt","England","Ethiopia","Finland","France","Germany","Ghana","Greece","Guinea","Honduras","Hungary","India","Indonesia","Iran","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kenya","Mali","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Panama","Paraguay","Peru","Poland","Portugal","Romania","Russia","Saudi Arabia","Scotland","Senegal","Serbia","South Africa","South Korea","Spain","Sweden","Switzerland","Tunisia","Turkey","Uganda","Ukraine","United Kingdom","United States","Uruguay","Venezuela","Wales","Zambia","Zimbabwe"];

const CollegeAgencyProfile = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const response = await api.getCollegeAgencyProfile();
      setProfile(response.data);
      setFormData(response.data);
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleChange('logo', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateCollegeAgencyProfile(formData);
      toast.success('Profile updated successfully!');
      loadProfile();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="text-primary text-xl font-heading">{t("college_agency_profile.loading")}</div></div>;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">{t("college_agency_profile.title")}</h1>
        <p className="text-muted-foreground">{t("college_agency_profile.subtitle")}</p>
      </div>

      <div className="max-w-4xl">
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
              {formData.logo ? (
                <img src={formData.logo} alt="Agency Logo" className="w-24 h-24 rounded-sm object-cover border-2 border-primary" />
              ) : (
                <div className="w-24 h-24 rounded-sm bg-muted flex items-center justify-center border-2 border-border">
                  <Building className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <label htmlFor="logo" className="absolute -bottom-2 -right-2 bg-primary text-black p-2 rounded-sm cursor-pointer hover:bg-primary/90">
                <Camera className="w-4 h-4" />
                <input id="logo" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold">{profile?.name}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <span className={`inline-block mt-2 px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm ${
                profile?.approved ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
              }`}>
                {profile?.approved ? t("college_agency_profile.approved") : t("college_agency_profile.pending")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">{t("college_agency_profile.agency_name")}</Label>
              <Input value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
            </div>
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">{t("college_agency_profile.country")}</Label>
              <select value={formData.country || ''} onChange={(e) => handleChange('country', e.target.value)}
                className="mt-2 w-full bg-black/20 border border-white/10 rounded-sm h-12 px-3 text-sm text-white outline-none cursor-pointer">
                <option value="">{t("college_agency_profile.select_country")}</option>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">{t("college_agency_profile.city")}</Label>
              <Input value={formData.city || ''} onChange={(e) => handleChange('city', e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
            </div>
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">{t("college_agency_profile.website")}</Label>
              <Input value={formData.website || ''} onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://..." className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
            </div>
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">{t("college_agency_profile.instagram")}</Label>
              <Input value={formData.instagram || ''} onChange={(e) => handleChange('instagram', e.target.value)}
                placeholder="@handle" className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
            </div>
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">{t("college_agency_profile.linkedin")}</Label>
              <Input value={formData.linkedin || ''} onChange={(e) => handleChange('linkedin', e.target.value)}
                placeholder="linkedin.com/company/..." className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
            </div>
            <div className="col-span-full">
              <Label className="text-sm font-medium uppercase tracking-wide">{t("college_agency_profile.description")}</Label>
              <textarea value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)}
                rows={4} placeholder={t("college_agency_profile.description_placeholder")}
                className="mt-2 w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm px-3 py-3 text-sm text-white outline-none resize-none" />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} disabled={saving}
              className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12 px-8">
              {saving ? t("college_agency_profile.saving") : t("college_agency_profile.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeAgencyProfile;

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { GraduationCap, Upload, CheckCircle, Globe, MapPin } from "lucide-react";
import { NATIONALITIES } from "@/lib/constants";

const AcademyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "", country: "", city: "", logo: "", description: "", website: "",
    instagram: "", facebook: "", linkedin: "",
    rep_first_name: "", rep_last_name: "", rep_role: "", rep_email: "", rep_phone: "",
  });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await api.getAcademyProfile();
      setProfile(res.data);
      setFormData({
        name: res.data.name || "",
        country: res.data.country || "",
        city: res.data.city || "",
        logo: res.data.logo || "",
        description: res.data.description || "",
        website: res.data.website || "",
        instagram: res.data.instagram || "",
        facebook: res.data.facebook || "",
        linkedin: res.data.linkedin || "",
        rep_first_name: res.data.rep_first_name || "",
        rep_last_name: res.data.rep_last_name || "",
        rep_role: res.data.rep_role || "",
        rep_email: res.data.rep_email || "",
        rep_phone: res.data.rep_phone || "",
      });
    } catch { toast.error(t('academy_profile.load_error')); }
    finally { setLoading(false); }
  };

  const handle = (field, value) => setFormData(p => ({ ...p, [field]: value }));

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => handle("logo", reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateAcademyProfile(formData);
      toast.success(t('academy_profile.save_success'));
      loadProfile();
    } catch { toast.error(t('academy_profile.save_error')); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="text-primary text-xl font-heading">{t('academy_profile.loading')}</div></div>;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase">{t('academy_profile.title')}</h1>
          {profile?.verified && (
            <span className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-sm text-xs uppercase">
              <CheckCircle className="w-3 h-3" /> {t('academy_profile.verified')}
            </span>
          )}
        </div>
        <p className="text-muted-foreground">{t('academy_profile.subtitle')}</p>
        {!profile?.approved && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-sm">
            <p className="text-yellow-500 text-sm">{t('academy_profile.pending_approval')}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="bg-card border border-border/50 p-8 rounded-sm">
          <div className="flex items-center space-x-4 mb-6">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h2 className="text-xl font-heading font-bold uppercase">{t('academy_profile.section_details')}</h2>
          </div>
          <div className="space-y-5">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">{t('academy_profile.academy_name')}</Label>
              <Input value={formData.name} onChange={e => handle("name", e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide">{t('academy_profile.country')}</Label>
                <select value={formData.country} onChange={e => handle("country", e.target.value)}
                  className="w-full mt-2 bg-black/20 border border-white/10 rounded-sm h-12 px-3 text-sm text-white outline-none appearance-none cursor-pointer focus:border-primary">
                  <option value="">{t('academy_profile.select_country')}</option>
                  {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide">{t('academy_profile.city')}</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground mt-1" />
                  <Input value={formData.city} onChange={e => handle("city", e.target.value)}
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12 pl-9" placeholder={t('academy_profile.city')} />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">{t('academy_profile.logo')}</Label>
              <div className="mt-2 flex items-center gap-4">
                {formData.logo && <img src={formData.logo} alt="Logo" className="w-16 h-16 rounded-sm object-cover border border-border" />}
                <label className="bg-muted hover:bg-muted/80 px-4 h-12 rounded-sm flex items-center cursor-pointer text-sm">
                  <Upload className="w-4 h-4 mr-2" /> {t('academy_profile.upload_logo')}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">{t('academy_profile.description')}</Label>
              <Textarea value={formData.description} onChange={e => handle("description", e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm min-h-[100px]"
                placeholder={t('academy_profile.description_placeholder')} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 p-8 rounded-sm">
          <h2 className="text-xl font-heading font-bold uppercase mb-5">{t('academy_profile.section_online')}</h2>
          <div className="space-y-4">
            {[
              { key: "website", labelKey: "website", placeholder: "https://www.youracademy.com" },
              { key: "instagram", labelKey: "instagram", placeholder: "https://instagram.com/youracademy" },
              { key: "facebook", labelKey: "facebook", placeholder: "https://facebook.com/youracademy" },
              { key: "linkedin", labelKey: "linkedin", placeholder: "https://linkedin.com/company/youracademy" },
            ].map(({ key, labelKey, placeholder }) => (
              <div key={key} className="relative">
                <Label className="text-xs font-bold uppercase tracking-wide">{t(`academy_profile.${labelKey}`)}</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground mt-1" />
                  <Input value={formData[key]} onChange={e => handle(key, e.target.value)}
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12 pl-9" placeholder={placeholder} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border/50 p-8 rounded-sm">
          <h2 className="text-xl font-heading font-bold uppercase mb-5">{t('academy_profile.section_rep')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide">{t('academy_profile.first_name')}</Label>
                <Input value={formData.rep_first_name} onChange={e => handle("rep_first_name", e.target.value)}
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide">{t('academy_profile.last_name')}</Label>
                <Input value={formData.rep_last_name} onChange={e => handle("rep_last_name", e.target.value)}
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">{t('academy_profile.role_title')}</Label>
              <Input value={formData.rep_role} onChange={e => handle("rep_role", e.target.value)}
                className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder={t('academy_profile.role_placeholder')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide">{t('academy_profile.email')}</Label>
                <Input value={formData.rep_email} onChange={e => handle("rep_email", e.target.value)}
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide">{t('academy_profile.phone')}</Label>
                <Input value={formData.rep_phone} onChange={e => handle("rep_phone", e.target.value)}
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={saving}
          className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12">
          {saving ? t('academy_profile.saving') : t('academy_profile.save')}
        </Button>
      </form>
    </div>
  );
};

export default AcademyProfile;

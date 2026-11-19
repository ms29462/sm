import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { trackRegistration } from "@/lib/analytics";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Belgium","Bolivia","Brazil","Cameroon","Canada","Chile","China","Colombia","Congo","Costa Rica","Croatia","Czech Republic","Denmark","DR Congo","Ecuador","Egypt","England","Ethiopia","Finland","France","Germany","Ghana","Greece","Guinea","Honduras","Hungary","India","Indonesia","Iran","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kenya","Mali","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Panama","Paraguay","Peru","Poland","Portugal","Romania","Russia","Saudi Arabia","Scotland","Senegal","Serbia","South Africa","South Korea","Spain","Sweden","Switzerland","Tunisia","Turkey","Uganda","Ukraine","United Kingdom","United States","Uruguay","Venezuela","Wales","Zambia","Zimbabwe"];

const inputClass = "w-full bg-black/20 border border-white/15 focus:border-primary rounded-sm px-4 h-12 text-sm text-white outline-none transition-colors";
const labelClass = "text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2";

const AcademyRegister = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    academy_name: "", country: "", city: "",
    rep_first_name: "", rep_last_name: "", rep_role: "", rep_email: "", rep_phone: "",
    description: "", website: "", instagram: "", facebook: "", linkedin: "",
    password: "", confirm_password: "",
    terms_accepted: false, authorized: false,
  });

  const STEPS = [
    { id: 1, title: t('academy_register.step1') },
    { id: 2, title: t('academy_register.step2') },
    { id: 3, title: t('academy_register.step3') },
    { id: 4, title: t('academy_register.step4') },
    { id: 5, title: t('academy_register.step5') },
  ];

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!form.academy_name || !form.country) { toast.error(t('academy_register.error_required')); return false; }
        return true;
      case 2:
        if (!form.rep_first_name || !form.rep_last_name || !form.rep_email || !form.rep_phone || !form.password || !form.confirm_password) {
          toast.error(t('academy_register.error_rep')); return false;
        }
        if (form.password !== form.confirm_password) { toast.error(t('academy_register.error_passwords_match')); return false; }
        if (form.password.length < 8) { toast.error(t('academy_register.error_password_length')); return false; }
        return true;
      case 3:
        if (!form.description) { toast.error(t('academy_register.error_description')); return false; }
        return true;
      case 4:
        if (!form.website && !form.instagram && !form.facebook && !form.linkedin) {
          toast.error(t('academy_register.error_verification')); return false;
        }
        return true;
      case 5:
        if (!form.terms_accepted || !form.authorized) { toast.error(t('academy_register.error_terms')); return false; }
        return true;
      default: return true;
    }
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSaving(true);
    try {
      await api.register({
        role: "academy",
        name: form.academy_name,
        email: form.rep_email,
        password: form.password,
        country: form.country,
        city: form.city,
        description: form.description,
        website: form.website,
        instagram: form.instagram,
        facebook: form.facebook,
        linkedin: form.linkedin,
        rep_first_name: form.rep_first_name,
        rep_last_name: form.rep_last_name,
        rep_role: form.rep_role,
        rep_email: form.rep_email,
        rep_phone: form.rep_phone,
      });
      trackRegistration('academy');
      navigate("/academy-pending");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="border-b border-border/50 pb-4 mb-6 flex items-center justify-between">
          <Link to="/">
            <img src="/logo.png" alt="SoccerMatch" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/" className="text-xs text-muted-foreground hover:text-white">{t('academy_register.home')}</Link>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">{t('academy_register.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('academy_register.subtitle')}</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold border transition-colors ${
                step > s.id ? "bg-primary border-primary text-black" :
                step === s.id ? "border-primary text-primary" :
                "border-white/20 text-muted-foreground"
              }`}>
                {step > s.id ? <Check className="w-3 h-3" /> : s.id}
              </div>
              <span className={`text-xs hidden sm:block ${step === s.id ? "text-white" : "text-muted-foreground"}`}>{s.title}</span>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border/50 rounded-sm p-8">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-heading font-bold uppercase text-lg mb-4">{t('academy_register.step1_title')}</h2>
              <div>
                <label className={labelClass}>{t('academy_register.academy_name')}</label>
                <input className={inputClass} value={form.academy_name} onChange={e => set("academy_name", e.target.value)} placeholder="e.g., Elite Soccer Academy" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t('academy_register.country')}</label>
                  <select className={inputClass} value={form.country} onChange={e => set("country", e.target.value)}>
                    <option value="">{t('academy_register.select_country')}</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t('academy_register.city')}</label>
                  <input className={inputClass} value={form.city} onChange={e => set("city", e.target.value)} placeholder="e.g., Montréal" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-heading font-bold uppercase text-lg mb-4">{t('academy_register.step2_title')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t('academy_register.first_name')}</label>
                  <input className={inputClass} value={form.rep_first_name} onChange={e => set("rep_first_name", e.target.value)} placeholder="First name" />
                </div>
                <div>
                  <label className={labelClass}>{t('academy_register.last_name')}</label>
                  <input className={inputClass} value={form.rep_last_name} onChange={e => set("rep_last_name", e.target.value)} placeholder="Last name" />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('academy_register.role_title')}</label>
                <input className={inputClass} value={form.rep_role} onChange={e => set("rep_role", e.target.value)} placeholder="e.g., Director, Head Coach" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t('academy_register.email')}</label>
                  <input className={inputClass} type="email" value={form.rep_email} onChange={e => set("rep_email", e.target.value)} placeholder="your@email.com" />
                </div>
                <div>
                  <label className={labelClass}>{t('academy_register.phone')}</label>
                  <input className={inputClass} value={form.rep_phone} onChange={e => set("rep_phone", e.target.value)} placeholder="+1 514 000 0000" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t('academy_register.password')}</label>
                  <input className={inputClass} type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min 8 characters" />
                </div>
                <div>
                  <label className={labelClass}>{t('academy_register.confirm_password')}</label>
                  <input className={inputClass} type="password" value={form.confirm_password} onChange={e => set("confirm_password", e.target.value)} placeholder="Repeat password" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-heading font-bold uppercase text-lg mb-4">{t('academy_register.step3_title')}</h2>
              <div>
                <label className={labelClass}>{t('academy_register.description')}</label>
                <textarea
                  className={`${inputClass} h-auto min-h-[120px] py-3`}
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder={t('academy_register.description_placeholder')}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-heading font-bold uppercase text-lg mb-4">{t('academy_register.step4_title')}</h2>
              <p className="text-muted-foreground text-sm">{t('academy_register.step4_desc')}</p>
              {[
                { key: "website", label: "Website", placeholder: "https://www.youracademy.com" },
                { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/youracademy" },
                { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/youracademy" },
                { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/youracademy" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={labelClass}>{label}</label>
                  <input className={inputClass} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} />
                </div>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="font-heading font-bold uppercase text-lg mb-4">{t('academy_register.step5_title')}</h2>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 accent-primary" checked={form.terms_accepted} onChange={e => set("terms_accepted", e.target.checked)} />
                <span className="text-sm text-muted-foreground">
                  {t('academy_register.terms_text')}{" "}
                  <Link to="/cgu" target="_blank" className="text-primary hover:underline">{t('academy_register.terms_link')}</Link>{" "}
                  {t('academy_register.terms_and')}{" "}
                  <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline">{t('academy_register.privacy_link')}</Link>.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 accent-primary" checked={form.authorized} onChange={e => set("authorized", e.target.checked)} />
                <span className="text-sm text-muted-foreground">
                  {t('academy_register.authorized_text')}
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
            {step > 1 ? (
              <button onClick={back} className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-sm text-sm text-muted-foreground hover:text-white hover:border-white/40 transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t('academy_register.back')}
              </button>
            ) : (
              <Link to="/" className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-sm text-sm text-muted-foreground hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t('academy_register.home')}
              </Link>
            )}
            {step < STEPS.length ? (
              <button onClick={next} className="flex items-center gap-2 px-6 py-2 bg-primary text-black font-bold rounded-sm text-sm hover:bg-primary/90 transition-colors">
                {t('academy_register.next')} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-primary text-black font-bold rounded-sm text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? t('academy_register.submitting') : t('academy_register.submit')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademyRegister;

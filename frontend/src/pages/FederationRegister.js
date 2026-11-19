import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { trackRegistration } from "@/lib/analytics";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

const STEP_KEYS = ["federation", "representative", "activities", "nationalities", "profile", "verification", "terms"];

const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Belgium","Bolivia","Brazil","Cameroon","Canada","Chile","China","Colombia","Congo","Costa Rica","Croatia","Czech Republic","Denmark","DR Congo","Ecuador","Egypt","England","Ethiopia","Finland","France","Germany","Ghana","Greece","Guinea","Honduras","Hungary","India","Indonesia","Iran","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kenya","Mali","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Panama","Paraguay","Peru","Poland","Portugal","Romania","Russia","Saudi Arabia","Scotland","Senegal","Serbia","South Africa","South Korea","Spain","Sweden","Switzerland","Tunisia","Turkey","Uganda","Ukraine","United Kingdom","United States","Uruguay","Venezuela","Wales","Zambia","Zimbabwe","Central African Republic","Gabon","Rwanda","Tanzania","Ethiopia","Mozambique","Madagascar","Benin","Togo","Burkina Faso","Niger","Chad","Sudan","Libya","Mauritania","Cape Verde","Guinea-Bissau","Sierra Leone","Liberia","Gambia"];
const FED_TYPES = ["National Federation","Regional Federation","Provincial / State Federation","Other"];
const REP_ROLES = ["Technical Director","National Team Coach","Sporting Director","Scout","Federation Administrator","President","Other"];
const OBJECTIVES = ["Talent Identification","National Team Recruitment","Diaspora Tracking","Player Monitoring","Scouting","Multiple Purposes"];
const AGE_CATEGORIES = ["Senior","U23","U20","U19","U17","U15"];

const inputClass = "w-full bg-black/20 border border-white/15 focus:border-primary rounded-sm px-4 h-12 text-sm text-white outline-none transition-colors";
const labelClass = "text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2";

const FederationRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();
  const [form, setForm] = useState({
    federation_name: "", country: "", federation_type: "",
    rep_first_name: "", rep_last_name: "", rep_role: "", rep_email: "", rep_phone: "",
    primary_objective: "", age_categories: [],
    eligible_nationalities: [],
    logo: "", description: "", website: "", instagram: "", facebook: "", linkedin: "",
    password: "", confirm_password: "",
    terms_accepted: false, authorized: false,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toggleArr = (key, val) => setForm(f => ({
    ...f, [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val]
  }));

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!form.federation_name || !form.country || !form.federation_type) {
          toast.error(t('federation_register.error_required')); return false;
        }
        return true;
      case 2:
        if (!form.rep_first_name || !form.rep_last_name || !form.rep_role || !form.rep_email || !form.rep_phone || !form.password || !form.confirm_password) {
          toast.error(t('federation_register.error_rep')); return false;
        }
        if (form.password !== form.confirm_password) { toast.error(t('federation_register.error_passwords_match')); return false; }
        if (form.password.length < 8) { toast.error(t('federation_register.error_password_length')); return false; }
        return true;
      case 3:
        if (!form.primary_objective || form.age_categories.length === 0) {
          toast.error(t('federation_register.error_activities')); return false;
        }
        return true;
      case 4:
        if (form.eligible_nationalities.length === 0) {
          toast.error(t('federation_register.error_nationalities')); return false;
        }
        return true;
      case 5:
        if (!form.description) { toast.error(t('federation_register.error_description')); return false; }
        return true;
      case 6:
        if (!form.website && !form.instagram && !form.facebook && !form.linkedin) {
          toast.error(t('federation_register.error_verification')); return false;
        }
        return true;
      case 7:
        if (!form.terms_accepted || !form.authorized) { toast.error(t('federation_register.error_terms')); return false; }
        return true;
      default: return true;
    }
  };

  const next = () => {
    if (validateStep()) {
      if (step === 7) setShowModal(true);
      else setStep(s => s + 1);
    }
  };

  const handleSubmit = async () => {
    setShowModal(false);
    setSaving(true);
    try {
      await api.register({
        name: form.federation_name,
        email: form.rep_email,
        password: form.password,
        role: "federation",
        country: form.country,
        federation_type: form.federation_type,
        rep_first_name: form.rep_first_name,
        rep_last_name: form.rep_last_name,
        rep_role: form.rep_role,
        rep_email: form.rep_email,
        rep_phone: form.rep_phone,
        primary_objective: form.primary_objective,
        age_categories: form.age_categories,
        eligible_nationalities: form.eligible_nationalities,
        logo: form.logo,
        description: form.description,
        website: form.website,
        instagram: form.instagram,
        facebook: form.facebook,
        linkedin: form.linkedin,
      });
      trackRegistration('federation');
      navigate("/federation-pending");
    } catch (e) {
      toast.error(e.response?.data?.detail || t('federation_register.reg_failed'));
    }
    setSaving(false);
  };

  const progress = ((step - 1) / 7) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border/50 p-4 flex items-center justify-between">
        <img src="/logo.png" alt="Soccer Match" className="h-8 w-auto" />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link to="/" className="text-xs text-muted-foreground hover:text-white">{t('federation_register.back_home')}</Link>
        </div>
      </div>

      <div className="px-4 pt-5 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium">{t('federation_register.step_of', { step })}</p>
          <p className="text-xs text-primary font-bold">{Math.round(progress)}%</p>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{width: `${progress}%`}} />
        </div>
        <div className="flex justify-between">
          {STEP_KEYS.map((key, idx) => {
            const id = idx + 1;
            return (
              <div key={id} className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  id < step ? "bg-primary border-primary text-black" :
                  id === step ? "border-primary text-primary bg-primary/10" :
                  "border-white/20 text-muted-foreground"
                }`}>
                  {id < step ? <Check className="w-3.5 h-3.5" /> : id}
                </div>
                <p className="text-[9px] text-muted-foreground hidden sm:block">{t(`federation_register.step_${key}`)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-4 pb-8 mt-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-heading font-bold uppercase mb-1">{t(`federation_register.step_${STEP_KEYS[step-1]}`)}</h2>
          <div className="h-0.5 w-12 bg-primary mb-5" />

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t('federation_register.federation_name_label')}</label>
                <input value={form.federation_name} onChange={e => set("federation_name", e.target.value)} placeholder={t('federation_register.federation_name_placeholder')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.country_label')}</label>
                <select value={form.country} onChange={e => set("country", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">{t('federation_register.select_country')}</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.federation_type_label')}</label>
                <div className="space-y-2">
                  {FED_TYPES.map(t => (
                    <button key={t} onClick={() => set("federation_type", t)} type="button"
                      className={`w-full text-left px-4 py-3 text-sm rounded-sm border-2 transition-all ${form.federation_type === t ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-sm">
                <p className="text-xs text-blue-400">{t('federation_register.contact_private_note')}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t('federation_register.first_name_label')}</label>
                  <input value={form.rep_first_name} onChange={e => set("rep_first_name", e.target.value)} placeholder="John" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('federation_register.last_name_label')}</label>
                  <input value={form.rep_last_name} onChange={e => set("rep_last_name", e.target.value)} placeholder="Smith" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.position_label')}</label>
                <select value={form.rep_role} onChange={e => set("rep_role", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">{t('federation_register.select_position')}</option>
                  {REP_ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.email_label')}</label>
                <input type="email" value={form.rep_email} onChange={e => set("rep_email", e.target.value)} placeholder={t('federation_register.email_placeholder')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.phone_label')}</label>
                <input type="tel" value={form.rep_phone} onChange={e => set("rep_phone", e.target.value)} placeholder={t('federation_register.phone_placeholder')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.password_label')}</label>
                <input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder={t('federation_register.password_placeholder')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.confirm_password_label')}</label>
                <input type="password" value={form.confirm_password} onChange={e => set("confirm_password", e.target.value)} placeholder={t('federation_register.confirm_password_placeholder')} className={inputClass} />
                {form.confirm_password && form.password !== form.confirm_password && (
                  <p className="text-xs text-red-400 mt-1">{t('federation_register.passwords_no_match')}</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className={labelClass}>{t('federation_register.primary_objective_label')}</label>
                <div className="space-y-2">
                  {OBJECTIVES.map(o => (
                    <button key={o} onClick={() => set("primary_objective", o)} type="button"
                      className={`w-full text-left px-4 py-3 text-sm rounded-sm border-2 transition-all ${form.primary_objective === o ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.age_categories_label')}</label>
                <div className="flex flex-wrap gap-2">
                  {AGE_CATEGORIES.map(a => (
                    <button key={a} onClick={() => toggleArr("age_categories", a)} type="button"
                      className={`px-4 py-2.5 text-sm rounded-sm border-2 font-medium transition-all ${form.age_categories.includes(a) ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-sm">
                <p className="text-xs text-primary">{t('federation_register.nationalities_note')}</p>
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.selected_count', { count: form.eligible_nationalities.length })}</label>
                <div className="max-h-80 overflow-y-auto space-y-1 border border-white/10 rounded-sm p-2">
                  {COUNTRIES.map(c => (
                    <button key={c} onClick={() => toggleArr("eligible_nationalities", c)} type="button"
                      className={`w-full text-left px-3 py-2 text-sm rounded-sm transition-all ${form.eligible_nationalities.includes(c) ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:bg-white/5"}`}>
                      {form.eligible_nationalities.includes(c) ? "✓ " : ""}{c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t('federation_register.logo_label')} <span className="text-muted-foreground font-normal normal-case">{t('federation_register.logo_optional')}</span></label>
                <input value={form.logo} onChange={e => set("logo", e.target.value)} placeholder="https://..." className={inputClass} />
                {form.logo && <img src={form.logo} alt="Logo" className="mt-2 w-16 h-16 object-contain border border-white/10 rounded-sm" />}
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.description_label')}</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder={t('federation_register.description_placeholder')}
                  rows={4} className={inputClass + " h-auto py-3"} />
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.website_label')} <span className="text-muted-foreground font-normal normal-case">{t('federation_register.website_optional')}</span></label>
                <input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://federation.org" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.instagram_label')} <span className="text-muted-foreground font-normal normal-case">{t('federation_register.instagram_optional')}</span></label>
                <input value={form.instagram} onChange={e => set("instagram", e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.facebook_label')} <span className="text-muted-foreground font-normal normal-case">{t('federation_register.facebook_optional')}</span></label>
                <input value={form.facebook} onChange={e => set("facebook", e.target.value)} placeholder="https://facebook.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.linkedin_label')} <span className="text-muted-foreground font-normal normal-case">{t('federation_register.linkedin_optional')}</span></label>
                <input value={form.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="https://linkedin.com/..." className={inputClass} />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-sm">
                <p className="text-sm font-bold text-yellow-400 mb-1">{t('federation_register.why_verification')}</p>
                <p className="text-xs text-muted-foreground">{t('federation_register.verification_note')}</p>
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.official_website')}</label>
                <input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://federation.org" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.official_instagram')}</label>
                <input value={form.instagram} onChange={e => set("instagram", e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('federation_register.official_facebook')}</label>
                <input value={form.facebook} onChange={e => set("facebook", e.target.value)} placeholder="https://facebook.com/..." className={inputClass} />
              </div>
              <p className="text-xs text-muted-foreground">{t('federation_register.at_least_one')}</p>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5">
              <div className="p-4 bg-card border border-border/50 rounded-sm">
                <h3 className="font-bold text-sm uppercase tracking-wide mb-3">{t('federation_register.summary_title')}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{t('federation_register.summary_federation')} <span className="text-white">{form.federation_name}</span></p>
                  <p>{t('federation_register.summary_country')} <span className="text-white">{form.country}</span></p>
                  <p>{t('federation_register.summary_type')} <span className="text-white">{form.federation_type}</span></p>
                  <p>{t('federation_register.summary_objective')} <span className="text-white">{form.primary_objective}</span></p>
                  <p>{t('federation_register.summary_rep')} <span className="text-white">{form.rep_first_name} {form.rep_last_name} — {form.rep_role}</span></p>
                  <p>{t('federation_register.summary_nationalities')} <span className="text-white">{t('federation_register.summary_nationalities_count', { count: form.eligible_nationalities.length })}</span></p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.terms_accepted} onChange={e => set("terms_accepted", e.target.checked)} className="accent-primary w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {t('federation_register.terms_text')} <Link to="/cgu" className="text-primary hover:underline">{t('federation_register.terms_link')}</Link> {t('federation_register.terms_and')} <Link to="/privacy" className="text-primary hover:underline">{t('federation_register.privacy_link')}</Link>.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.authorized} onChange={e => set("authorized", e.target.checked)} className="accent-primary w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {t('federation_register.authorized_text')}
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s-1)} type="button"
                className="flex items-center gap-2 px-4 py-3 border border-white/10 rounded-sm text-sm text-muted-foreground hover:text-white hover:border-white/30 transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t('federation_register.back')}
              </button>
            )}
            <button onClick={next} disabled={saving} type="button"
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? t('federation_register.submitting') : step === 7 ? t('federation_register.submit') : t('federation_register.continue')}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm p-6 max-w-md w-full">
            <h3 className="font-heading font-bold uppercase text-lg mb-4 text-primary">{t('federation_register.modal_title')}</h3>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{t('federation_register.modal_body1')}</p>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{t('federation_register.modal_body2')}</p>
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• {t('federation_register.modal_li1')}</li>
              <li>• {t('federation_register.modal_li2')}</li>
              <li>• {t('federation_register.modal_li3')}</li>
              <li>• {t('federation_register.modal_li4')}</li>
            </ul>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-sm mb-5">
              <p className="text-xs text-yellow-400 font-bold">{t('federation_register.modal_status')}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 text-muted-foreground hover:text-white rounded-sm py-3 text-sm transition-colors">{t('federation_register.go_back')}</button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? t('federation_register.submitting') : t('federation_register.finish')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FederationRegister;
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

const STEP_KEYS = ["step1", "step2", "step3"];

const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Belgium","Bolivia","Brazil","Cameroon","Canada","Chile","China","Colombia","Congo","Costa Rica","Croatia","Czech Republic","Denmark","DR Congo","Ecuador","Egypt","England","Ethiopia","Finland","France","Germany","Ghana","Greece","Guinea","Honduras","Hungary","India","Indonesia","Iran","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kenya","Mali","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Panama","Paraguay","Peru","Poland","Portugal","Romania","Russia","Saudi Arabia","Scotland","Senegal","Serbia","South Africa","South Korea","Spain","Sweden","Switzerland","Tunisia","Turkey","Uganda","Ukraine","United Kingdom","United States","Uruguay","Venezuela","Wales","Zambia","Zimbabwe","Gambia","Burkina Faso","Niger","Chad","Sudan","Libya","Mauritania","Cape Verde","Guinea-Bissau","Sierra Leone","Liberia"];

const inputClass = "w-full bg-black/20 border border-white/15 focus:border-primary rounded-sm px-4 h-12 text-sm text-white outline-none transition-colors";
const labelClass = "text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2";

const CollegeAgencyRegister = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    agency_name: "", country: "", city: "",
    description: "", website: "", instagram: "", linkedin: "",
    rep_first_name: "", rep_last_name: "", rep_email: "", rep_phone: "", rep_role: "",
    password: "", confirm_password: "",
    terms_accepted: false, authorized: false,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!form.agency_name || !form.country) { toast.error(t("college_agency_register.error_agency")); return false; }
        return true;
      case 2:
        if (!form.rep_first_name || !form.rep_last_name || !form.rep_email || !form.rep_phone || !form.password || !form.confirm_password) {
          toast.error(t("college_agency_register.error_rep")); return false;
        }
        if (form.password !== form.confirm_password) { toast.error(t("college_agency_register.error_passwords_match")); return false; }
        if (form.password.length < 8) { toast.error(t("college_agency_register.error_password_length")); return false; }
        return true;
      case 3:
        if (!form.terms_accepted || !form.authorized) { toast.error(t("college_agency_register.error_terms")); return false; }
        return true;
      default: return true;
    }
  };

  const next = () => {
    if (validateStep()) {
      if (step === 3) setShowModal(true);
      else setStep(s => s + 1);
    }
  };

  const handleSubmit = async () => {
    setShowModal(false);
    setSaving(true);
    try {
      await api.register({
        name: form.agency_name,
        email: form.rep_email,
        password: form.password,
        role: "college_agency",
        country: form.country,
        city: form.city,
        description: form.description,
        website: form.website,
        instagram: form.instagram,
        linkedin: form.linkedin,
        rep_first_name: form.rep_first_name,
        rep_last_name: form.rep_last_name,
        rep_role: form.rep_role || "Representative",
        rep_email: form.rep_email,
        rep_phone: form.rep_phone,
      });
      navigate("/college-agency-pending");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Registration failed");
    }
    setSaving(false);
  };

  const progress = ((step - 1) / 3) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border/50 p-4 flex items-center justify-between">
        <img src="/logo.png" alt="Soccer Match" className="h-8 w-auto" />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link to="/" className="text-xs text-muted-foreground hover:text-white">{t("college_agency_register.back_home")}</Link>
        </div>
      </div>

      <div className="px-4 pt-5 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium">{t("college_agency_register.step_of", { step })}</p>
          <p className="text-xs text-primary font-bold">{Math.round(progress)}%</p>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{width: `${progress}%`}} />
        </div>
        <div className="flex justify-between">
          {STEP_KEYS.map((key, idx) => {
            const id = idx + 1;
            return (
              <div key={key} className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  id < step ? "bg-primary border-primary text-black" :
                  id === step ? "border-primary text-primary bg-primary/10" :
                  "border-white/20 text-muted-foreground"
                }`}>
                  {id < step ? <Check className="w-3.5 h-3.5" /> : id}
                </div>
                <p className="text-[9px] text-muted-foreground hidden sm:block">{t(`college_agency_register.${key}`)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-4 pb-8 mt-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-heading font-bold uppercase mb-1">{t(`college_agency_register.${STEP_KEYS[step-1]}`)}</h2>
          <div className="h-0.5 w-12 bg-primary mb-5" />

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t("college_agency_register.agency_name")}</label>
                <input value={form.agency_name} onChange={e => set("agency_name", e.target.value)} placeholder="e.g. Elite College Recruitment Agency" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_agency_register.country")}</label>
                <select value={form.country} onChange={e => set("country", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">{t("college_agency_register.select_country")}</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("college_agency_register.city")}</label>
                <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="e.g. New York" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_agency_register.description")}</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder={t("college_agency_register.description_placeholder")} rows={3}
                  className="w-full bg-black/20 border border-white/15 focus:border-primary rounded-sm px-4 py-3 text-sm text-white outline-none transition-colors resize-none" />
              </div>
              <div>
                <label className={labelClass}>{t("college_agency_register.website")}</label>
                <input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_agency_register.instagram")}</label>
                <input value={form.instagram} onChange={e => set("instagram", e.target.value)} placeholder="@handle" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_agency_register.linkedin")}</label>
                <input value={form.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="linkedin.com/company/..." className={inputClass} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t("college_agency_register.first_name")}</label>
                  <input value={form.rep_first_name} onChange={e => set("rep_first_name", e.target.value)} placeholder="John" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("college_agency_register.last_name")}</label>
                  <input value={form.rep_last_name} onChange={e => set("rep_last_name", e.target.value)} placeholder="Smith" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("college_agency_register.role_at_agency")}</label>
                <input value={form.rep_role} onChange={e => set("rep_role", e.target.value)} placeholder={t("college_agency_register.role_placeholder")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_agency_register.email")}</label>
                <input type="email" value={form.rep_email} onChange={e => set("rep_email", e.target.value)} placeholder={t("college_agency_register.email_placeholder")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_agency_register.phone")}</label>
                <input value={form.rep_phone} onChange={e => set("rep_phone", e.target.value)} placeholder={t("college_agency_register.phone_placeholder")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_agency_register.password")}</label>
                <input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder={t("college_agency_register.password_placeholder")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_agency_register.confirm_password")}</label>
                <input type="password" value={form.confirm_password} onChange={e => set("confirm_password", e.target.value)} placeholder={t("college_agency_register.repeat_password")} className={inputClass} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("college_agency_register.college_only_note")}
                </p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.terms_accepted} onChange={e => set("terms_accepted", e.target.checked)} className="accent-primary w-4 h-4 mt-1 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {t("college_agency_register.terms_text")} <a href="/cgu" target="_blank" className="text-primary underline">{t("college_agency_register.terms_link")}</a> {t("college_agency_register.terms_college_only")}
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.authorized} onChange={e => set("authorized", e.target.checked)} className="accent-primary w-4 h-4 mt-1 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{t("college_agency_register.authorized_text")}</span>
              </label>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-4 py-3 border border-white/10 rounded-sm text-sm text-muted-foreground hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t("college_agency_register.back")}
              </button>
            )}
            <button onClick={next} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? t("college_agency_register.submitting") : step === 3 ? t("college_agency_register.submit") : t("college_agency_register.next_btn")}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm p-6 max-w-md w-full">
            <h3 className="font-heading font-bold uppercase text-lg mb-3">{t("college_agency_register.modal_title")}</h3>
            <p className="text-sm text-muted-foreground mb-5">{t("college_agency_register.modal_body")}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-white/10 rounded-sm text-sm text-muted-foreground hover:text-white transition-colors">{t("college_agency_register.modal_cancel")}</button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? t("college_agency_register.submitting") : t("college_agency_register.modal_submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeAgencyRegister;

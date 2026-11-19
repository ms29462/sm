import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { trackRegistration } from "@/lib/analytics";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

const STEP_KEYS = ["step1", "step2", "step3", "step4", "step5", "step6", "step7"];

const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Belgium","Bolivia","Brazil","Cameroon","Canada","Chile","China","Colombia","Congo","Costa Rica","Croatia","Czech Republic","Denmark","DR Congo","Ecuador","Egypt","England","Ethiopia","Finland","France","Germany","Ghana","Greece","Guinea","Honduras","Hungary","India","Indonesia","Iran","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kenya","Mali","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Panama","Paraguay","Peru","Poland","Portugal","Romania","Russia","Saudi Arabia","Scotland","Senegal","Serbia","South Africa","South Korea","Spain","Sweden","Switzerland","Tunisia","Turkey","Uganda","Ukraine","United Kingdom","United States","Uruguay","Venezuela","Wales","Zambia","Zimbabwe"];
const LEVELS = ["NCAA Division I","NCAA Division II","NCAA Division III","NAIA","NJCAA","U SPORTS","CCAA","RSEQ","Other"];
const REP_ROLES = ["Head Coach","Assistant Coach","Recruiting Coordinator","Athletic Director","Technical Director","Other"];
const RECRUITMENT_PRIORITIES = ["Domestic Players","International Players","Transfer Students","Freshmen","Graduate Students"];

const inputClass = "w-full bg-black/20 border border-white/15 focus:border-primary rounded-sm px-4 h-12 text-sm text-white outline-none transition-colors";
const labelClass = "text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2";

const CollegeRegister = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    institution_name: "", country: "", institution_type: "", competition_level: "",
    athletic_program: "", team_gender: "", scholarship: "",
    rep_first_name: "", rep_last_name: "", rep_role: "", rep_email: "", rep_phone: "",
    description: "", website: "", instagram: "", facebook: "", twitter: "", linkedin: "",
    recruitment_priorities: [],
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
        if (!form.institution_name || !form.country || !form.institution_type || !form.competition_level) {
          toast.error(t("college_register.error_required")); return false;
        }
        return true;
      case 2:
        if (!form.athletic_program || !form.team_gender || !form.scholarship) {
          toast.error(t("college_register.error_athletic")); return false;
        }
        return true;
      case 3:
        if (!form.rep_first_name || !form.rep_last_name || !form.rep_role || !form.rep_email || !form.rep_phone || !form.password || !form.confirm_password) {
          toast.error(t("college_register.error_rep")); return false;
        }
        if (form.password !== form.confirm_password) { toast.error(t("college_register.error_passwords_match")); return false; }
        if (form.password.length < 8) { toast.error(t("college_register.error_password_length")); return false; }
        return true;
      case 4:
        if (!form.description) { toast.error(t("college_register.error_description")); return false; }
        return true;
      case 6:
        if (!form.website && !form.instagram && !form.facebook && !form.twitter && !form.linkedin) {
          toast.error(t("college_register.error_verification")); return false;
        }
        return true;
      case 7:
        if (!form.terms_accepted || !form.authorized) { toast.error(t("college_register.error_terms")); return false; }
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
        name: form.institution_name,
        email: form.rep_email,
        password: form.password,
        role: "college",
        country: form.country,
        institution_type: form.institution_type,
        competition_level: form.competition_level,
        athletic_program: form.athletic_program,
        team_gender: form.team_gender,
        scholarship: form.scholarship,
        rep_first_name: form.rep_first_name,
        rep_last_name: form.rep_last_name,
        rep_role: form.rep_role,
        rep_email: form.rep_email,
        rep_phone: form.rep_phone,
        description: form.description,
        website: form.website,
        instagram: form.instagram,
        facebook: form.facebook,
        twitter: form.twitter,
        linkedin: form.linkedin,
        recruitment_priorities: form.recruitment_priorities,
      });
      trackRegistration('college');
      navigate("/college-pending");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Registration failed");
    }
    setSaving(false);
  };

  const progress = ((step - 1) / 7) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border/50 p-4 flex items-center justify-between">
        <img src="/logo.png" alt="Soccer Match" className="h-8 w-auto" />
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link to="/" className="text-xs text-muted-foreground hover:text-white">{t("college_register.back_home")}</Link>
        </div>
      </div>

      <div className="px-4 pt-5 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium">{t("college_register.step_of", { step })}</p>
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
                <p className="text-[9px] text-muted-foreground hidden sm:block">{t(`college_register.${key}`)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-4 pb-8 mt-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-heading font-bold uppercase mb-1">{t(`college_register.${STEP_KEYS[step-1]}`)}</h2>
          <div className="h-0.5 w-12 bg-primary mb-5" />

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t("college_register.institution_name")}</label>
                <input value={form.institution_name} onChange={e => set("institution_name", e.target.value)}
                  placeholder="e.g. University of Toronto" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_register.country")}</label>
                <select value={form.country} onChange={e => set("country", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">{t("college_register.select_country")}</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("college_register.institution_type")}</label>
                <div className="flex gap-3">
                  {["College", "University"].map(type => (
                    <button key={type} onClick={() => set("institution_type", type)} type="button"
                      className={`flex-1 py-3 text-sm rounded-sm border-2 font-medium transition-all ${form.institution_type === type ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("college_register.competition_level")}</label>
                <select value={form.competition_level} onChange={e => set("competition_level", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">{t("college_register.select_level")}</option>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t("college_register.athletic_program")}</label>
                <div className="space-y-2">
                  {["Men's Soccer", "Women's Soccer"].map(p => (
                    <button key={p} onClick={() => set("athletic_program", p)} type="button"
                      className={`w-full text-left px-4 py-3 text-sm rounded-sm border-2 transition-all ${form.athletic_program === p ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("college_register.team_gender")}</label>
                <div className="flex gap-3">
                  {["Men's", "Women's", "Both"].map(g => (
                    <button key={g} onClick={() => set("team_gender", g)} type="button"
                      className={`flex-1 py-2.5 text-sm rounded-sm border-2 font-medium transition-all ${form.team_gender === g ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("college_register.scholarship")}</label>
                <div className="space-y-2">
                  {["Full Scholarships Available", "Partial Scholarships Available", "No Scholarships"].map(s => (
                    <button key={s} onClick={() => set("scholarship", s)} type="button"
                      className={`w-full text-left px-4 py-3 text-sm rounded-sm border-2 transition-all ${form.scholarship === s ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-sm">
                <p className="text-xs text-blue-400">{t("college_register.institutional_email_note")}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t("college_register.first_name")}</label>
                  <input value={form.rep_first_name} onChange={e => set("rep_first_name", e.target.value)} placeholder="John" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("college_register.last_name")}</label>
                  <input value={form.rep_last_name} onChange={e => set("rep_last_name", e.target.value)} placeholder="Smith" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("college_register.position")}</label>
                <select value={form.rep_role} onChange={e => set("rep_role", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">{t("college_register.select_position")}</option>
                  {REP_ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("college_register.email")}</label>
                <input type="email" value={form.rep_email} onChange={e => set("rep_email", e.target.value)} placeholder={t("college_register.email_placeholder")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_register.phone")}</label>
                <input type="tel" value={form.rep_phone} onChange={e => set("rep_phone", e.target.value)} placeholder={t("college_register.phone_placeholder")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_register.password")}</label>
                <input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder={t("college_register.password_placeholder")} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_register.confirm_password")}</label>
                <input type="password" value={form.confirm_password} onChange={e => set("confirm_password", e.target.value)} placeholder={t("college_register.repeat_password")} className={inputClass} />
                {form.confirm_password && form.password !== form.confirm_password && (
                  <p className="text-xs text-red-400 mt-1">{t("college_register.passwords_no_match")}</p>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t("college_register.program_description")}</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="e.g. NCAA Division I men's soccer program focused on recruiting ambitious student-athletes..."
                  rows={4} className={inputClass + " h-auto py-3"} />
              </div>
              <div>
                <label className={labelClass}>Website <span className="text-muted-foreground font-normal normal-case">{t("college_register.optional")}</span></label>
                <input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://athletics.university.edu" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Instagram <span className="text-muted-foreground font-normal normal-case">{t("college_register.optional")}</span></label>
                <input value={form.instagram} onChange={e => set("instagram", e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Facebook <span className="text-muted-foreground font-normal normal-case">{t("college_register.optional")}</span></label>
                <input value={form.facebook} onChange={e => set("facebook", e.target.value)} placeholder="https://facebook.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>X / Twitter <span className="text-muted-foreground font-normal normal-case">{t("college_register.optional")}</span></label>
                <input value={form.twitter} onChange={e => set("twitter", e.target.value)} placeholder="https://x.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>LinkedIn <span className="text-muted-foreground font-normal normal-case">{t("college_register.optional")}</span></label>
                <input value={form.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="https://linkedin.com/..." className={inputClass} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-sm">
                <p className="text-xs text-primary">{t("college_register.recruitment_hint")}</p>
              </div>
              <div className="space-y-2">
                {RECRUITMENT_PRIORITIES.map(p => (
                  <button key={p} onClick={() => toggleArr("recruitment_priorities", p)} type="button"
                    className={`w-full text-left px-4 py-3 text-sm rounded-sm border-2 transition-all ${form.recruitment_priorities.includes(p) ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-sm">
                <p className="text-sm font-bold text-yellow-400 mb-1">{t("college_register.why_verification")}</p>
                <p className="text-xs text-muted-foreground">{t("college_register.verification_desc")}</p>
              </div>
              <div>
                <label className={labelClass}>{t("college_register.official_website")}</label>
                <input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://athletics.university.edu" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_register.official_instagram")}</label>
                <input value={form.instagram} onChange={e => set("instagram", e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_register.official_facebook")}</label>
                <input value={form.facebook} onChange={e => set("facebook", e.target.value)} placeholder="https://facebook.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("college_register.official_twitter")}</label>
                <input value={form.twitter} onChange={e => set("twitter", e.target.value)} placeholder="https://x.com/..." className={inputClass} />
              </div>
              <p className="text-xs text-muted-foreground">{t("college_register.at_least_one")}</p>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5">
              <div className="p-4 bg-card border border-border/50 rounded-sm">
                <h3 className="font-bold text-sm uppercase tracking-wide mb-3">{t("college_register.summary_title")}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{t("college_register.institution_label")} <span className="text-white">{form.institution_name}</span></p>
                  <p>{t("college_register.type_label")} <span className="text-white">{form.institution_type}</span></p>
                  <p>{t("college_register.level_label")} <span className="text-white">{form.competition_level}</span></p>
                  <p>{t("college_register.program_label")} <span className="text-white">{form.athletic_program}</span></p>
                  <p>{t("college_register.rep_label")} <span className="text-white">{form.rep_first_name} {form.rep_last_name} — {form.rep_role}</span></p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.terms_accepted} onChange={e => set("terms_accepted", e.target.checked)} className="accent-primary w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {t("college_register.terms_text")} <Link to="/cgu" className="text-primary hover:underline">{t("college_register.terms_link")}</Link> {t("college_register.terms_and")} <Link to="/privacy" className="text-primary hover:underline">{t("college_register.privacy_link")}</Link>.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.authorized} onChange={e => set("authorized", e.target.checked)} className="accent-primary w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {t("college_register.authorized_text")}
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s-1)} type="button"
                className="flex items-center gap-2 px-4 py-3 border border-white/10 rounded-sm text-sm text-muted-foreground hover:text-white hover:border-white/30 transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t("college_register.back")}
              </button>
            )}
            <button onClick={next} disabled={saving} type="button"
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? t("college_register.submitting") : step === 7 ? t("college_register.submit") : t("college_register.continue")}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm p-6 max-w-md w-full">
            <h3 className="font-heading font-bold uppercase text-lg mb-4 text-primary">{t("college_register.modal_title")}</h3>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{t("college_register.modal_body1")}</p>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{t("college_register.modal_body2")}</p>
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• {t("college_register.modal_li1")}</li>
              <li>• {t("college_register.modal_li2")}</li>
              <li>• {t("college_register.modal_li3")}</li>
              <li>• {t("college_register.modal_li4")}</li>
            </ul>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-sm mb-5">
              <p className="text-xs text-yellow-400 font-bold">{t("college_register.modal_status")}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 text-muted-foreground hover:text-white rounded-sm py-3 text-sm transition-colors">{t("college_register.modal_go_back")}</button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? t("college_register.submitting") : t("college_register.modal_finish")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeRegister;
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { trackRegistration } from "@/lib/analytics";
import { ChevronRight, ChevronLeft, Check, Eye, EyeOff } from "lucide-react";
import { useTranslation } from 'react-i18next';

const STEP_IDS = [1, 2, 3, 4, 5, 6];

const POSITIONS = ["GK","CB","LB","RB","DM","CM","AM","Winger","Striker"];
const COUNTRIES = ["Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];
const LEVELS = ["Amateur","Semi-Professional","Professional","NCAA Division I","NCAA Division II","NCAA Division III","NAIA","NJCAA","U SPORTS","CPL","USL Championship","MLS","Pro League","Challenger Pro League","Ligue 1","Ligue 2","National","National 2","Premier League","La Liga","Bundesliga","Serie A","Other"];

const inputClass = "w-full bg-black/20 border border-white/15 focus:border-primary rounded-sm px-4 h-12 text-sm text-white outline-none transition-colors";
const labelClass = "text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2";

const isMinor = (dob) => {
  if (!dob) return false;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age < 18;
};

const PlayerRegister = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const STEPS = STEP_IDS.map((id, i) => ({
    id,
    title: t(`register.step${id}_title`),
  }));
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);
  const [showRatioModal, setShowRatioModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setForm(f => ({...f, referral_code: ref}));
  }, []);

  const [form, setForm] = useState({
    // Step 1 - Personal
    first_name: "", last_name: "", date_of_birth: "", parental_consent: false,
    residence_country: "", gender: "",
    nationality: "", nationality_2: "",
    // Step 2 - Football
    position: "", secondary_position: "",
    looking_for: [], preferred_level: "",
    // Step 3 - Physical
    height: "", weight: "", preferred_foot: "",
    // Step 4 - Media
    highlight_video: "", full_match_videos: [""],
    // Step 5 - Contact
    phone: "", email: "", password: "", confirm_password: "",
    // Step 6 - Terms
    terms_accepted: false,
    referral_code: "", integrity_certified: false,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toggleArr = (key, val) => setForm(f => ({
    ...f, [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val]
  }));

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!form.first_name || !form.last_name || !form.date_of_birth || !form.residence_country || !form.gender || !form.nationality) {
          toast.error(t('register.error_required')); return false;
        }
        if (isMinor(form.date_of_birth) && !form.parental_consent) {
          toast.error(t('register.error_minor_consent')); return false;
        }
        return true;
      case 2:
        if (!form.position || !form.preferred_level) {
          toast.error(t('register.error_position')); return false;
        }
        return true;
      case 3:
        if (!form.height || !form.weight || !form.preferred_foot) {
          toast.error(t('register.error_physical')); return false;
        }
        return true;
      case 4:
        if (!form.highlight_video) {
          return false;
        }
        const ytPattern = /(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[a-zA-Z0-9_-]+/;
        const vimeoPattern = /vimeo\.com\/[0-9]+/;
        if (!ytPattern.test(form.highlight_video) && !vimeoPattern.test(form.highlight_video)) {
          toast.error(t('register.error_video'));
          return false;
        }
        return true;
      case 5:
        if (!form.phone || !form.email || !form.password || !form.confirm_password) {
          toast.error(t('register.error_contact')); return false;
        }
        if (form.password !== form.confirm_password) {
          toast.error(t('register.error_passwords')); return false;
        }
        if (form.password.length < 8) {
          toast.error(t('register.error_password_length')); return false;
        }
        return true;
      case 6:
        if (!form.terms_accepted || !form.integrity_certified) {
          toast.error(t('register.error_terms')); return false;
        }
        return true;
      default: return true;
    }
  };

  const next = () => {
    if (step === 4 && !form.highlight_video) {
      setShowRatioModal(true);
      return;
    }
    if (validateStep()) {
      if (step === 6) setShowIntegrityModal(true);
      else setStep(s => s + 1);
    }
  };

  const handleSubmit = async () => {
    setShowIntegrityModal(false);
    setSaving(true);
    try {
      const name = `${form.first_name} ${form.last_name}`;
      const full_match_videos = form.full_match_videos.filter(v => v.trim());

      const response = await api.register({
        name,
        email: form.email,
        password: form.password,
        role: "player",
        parental_consent: form.parental_consent,
        // Profile data
        date_of_birth: form.date_of_birth,
        residence_country: form.residence_country,
        gender: form.gender,
        nationality: form.nationality,
        nationality_2: form.nationality_2,
        position: form.position,
        secondary_position: form.secondary_position,
        looking_for: form.looking_for,
        playing_level: form.preferred_level,
        height: form.height ? parseInt(form.height) : null,
        weight: form.weight ? parseInt(form.weight) : null,
        preferred_foot: form.preferred_foot,
        highlight_video: form.highlight_video,
        full_game_videos: full_match_videos,
        phone: form.phone,
      });

      const { token, role, user_id, name: playerName } = response.data;
      login(token, role, user_id, form.email, response.data.refresh_token, playerName);
      trackRegistration('player');
      toast.success(t('register.success'));
      navigate("/player/dashboard");
    } catch (e) {
      const msg = e.response?.data?.detail || "Registration failed";
      toast.error(msg);
    }
    setSaving(false);
  };

  const progress = ((step - 1) / 6) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 p-4 flex items-center justify-between">
        <img src="/logo.png" alt="Soccer Match" className="h-8 w-auto" />
        <Link to="/login" className="text-xs text-muted-foreground hover:text-white">{t('register.already_account')}</Link>
      </div>

      {/* Progress */}
      <div className="px-4 pt-5 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium">{t('register.step_of', { step })}</p>
          <p className="text-xs text-primary font-bold">{Math.round(progress)}%</p>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{width: `${progress}%`}} />
        </div>
        <div className="flex justify-between">
          {STEPS.map(s => (
            <div key={s.id} className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                s.id < step ? 'bg-primary border-primary text-black' :
                s.id === step ? 'border-primary text-primary bg-primary/10' :
                'border-white/20 text-muted-foreground'
              }`}>
                {s.id < step ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
              <p className="text-[9px] text-muted-foreground hidden sm:block">{s.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-4 pb-8 mt-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-heading font-bold uppercase mb-1">{STEPS[step-1].title}</h2>
          <div className="h-0.5 w-12 bg-primary mb-5" />

          {/* Step 1 - Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t('register.first_name')} *</label>
                  <input value={form.first_name} onChange={e => set("first_name", e.target.value)}
                    placeholder="John" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('register.last_name')} *</label>
                  <input value={form.last_name} onChange={e => set("last_name", e.target.value)}
                    placeholder="Smith" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('register.date_of_birth')} *</label>
                <input type="date" style={{colorScheme: "dark"}} value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)}
                  style={{colorScheme:"dark"}} className={inputClass} />
              </div>
              {isMinor(form.date_of_birth) && (
                <div className="col-span-1 sm:col-span-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-sm space-y-3">
                  <p className="text-sm text-yellow-200">
                    {t('register.minor_warning')}
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.parental_consent}
                      onChange={e => set("parental_consent", e.target.checked)}
                      className="mt-1 accent-primary" />
                    <span className="text-sm text-muted-foreground">
                      {t('register.parental_consent_label')}
                    </span>
                  </label>
                </div>
              )}
              <div>
                <label className={labelClass}>{t('register.country_of_residence')} *</label>
                <select value={form.residence_country} onChange={e => set("residence_country", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">{t('register.select_country')}</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('register.gender')} *</label>
                <div className="flex gap-3">
                  {[
                    { val: "Male", label: t('register.male') },
                    { val: "Female", label: t('register.female') },
                    { val: "Other", label: t('register.other_gender') },
                  ].map(g => (
                    <button key={g.val} onClick={() => set("gender", g.val)} type="button"
                      className={`flex-1 py-2.5 text-sm rounded-sm border-2 transition-all font-medium ${form.gender === g.val ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('register.first_citizenship')} *</label>
                <select value={form.nationality} onChange={e => set("nationality", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">{t('register.select_nationality')}</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('register.second_citizenship')} <span className="text-muted-foreground font-normal normal-case">({t('register.optional')})</span></label>
                <select value={form.nationality_2} onChange={e => set("nationality_2", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">{t('register.select')}</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2 - Football Profile */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className={labelClass}>{t('register.main_position')} *</label>
                <div className="grid grid-cols-3 gap-2">
                  {POSITIONS.map(p => (
                    <button key={p} onClick={() => set("position", p)} type="button"
                      className={`py-2.5 text-sm rounded-sm border-2 transition-all font-medium ${form.position === p ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('register.secondary_position')} <span className="text-muted-foreground font-normal normal-case">({t('register.optional')})</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {POSITIONS.filter(p => p !== form.position).map(p => (
                    <button key={p} onClick={() => set("secondary_position", form.secondary_position === p ? "" : p)} type="button"
                      className={`py-2 text-sm rounded-sm border transition-all ${form.secondary_position === p ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('register.looking_for')}</label>
                <div className="space-y-2">
                  {[
                    { val: "Professional Opportunities", label: t('register.looking_for_professional') },
                    { val: "Semi-Professional Opportunities", label: t('register.looking_for_semi') },
                    { val: "Amateur Opportunities", label: t('register.looking_for_amateur') },
                    { val: "University Opportunities", label: t('register.looking_for_university') },
                    { val: "All", label: t('register.looking_for_all') },
                  ].map(o => (
                    <button key={o.val} onClick={() => toggleArr("looking_for", o.val)} type="button"
                      className={`w-full text-left px-4 py-3 text-sm rounded-sm border-2 transition-all ${form.looking_for.includes(o.val) ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('register.preferred_level')} *</label>
                <select value={form.preferred_level} onChange={e => set("preferred_level", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">{t('register.select_level')}</option>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 3 - Physical */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t('register.height_cm')} *</label>
                  <input type="number" value={form.height} onChange={e => set("height", e.target.value)}
                    placeholder="e.g. 180" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('register.weight_kg')} *</label>
                  <input type="number" value={form.weight} onChange={e => set("weight", e.target.value)}
                    placeholder="e.g. 75" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('register.strong_foot')} *</label>
                <div className="flex gap-3">
                  {[
                    { val: "Right", label: t('register.right') },
                    { val: "Left", label: t('register.left') },
                    { val: "Both", label: t('register.both') },
                  ].map(f => (
                    <button key={f.val} onClick={() => set("preferred_foot", f.val)} type="button"
                      className={`flex-1 py-3 text-sm rounded-sm border-2 transition-all font-medium ${form.preferred_foot === f.val ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4 - Media */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className={labelClass}>{t('register.highlight_video')} *</label>
                <p className="text-xs text-muted-foreground mb-2">{t('register.highlight_video_note')}</p>
                <input value={form.highlight_video} onChange={e => set("highlight_video", e.target.value)}
                  placeholder="https://youtube.com/watch?v=..." className={inputClass} />
                <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-sm">
                  <p className="text-xs text-primary">💡 {t('register.highlight_tip')}</p>
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('register.full_match_videos')} <span className="text-muted-foreground font-normal normal-case">({t('register.optional')})</span></label>
                <p className="text-xs text-muted-foreground mb-2">{t('register.full_match_note')}</p>
                {form.full_match_videos.map((v, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={v} onChange={e => {
                      const videos = [...form.full_match_videos];
                      videos[i] = e.target.value;
                      set("full_match_videos", videos);
                    }} placeholder={`Full match ${i+1}...`} className={inputClass} />
                    {form.full_match_videos.length > 1 && (
                      <button onClick={() => set("full_match_videos", form.full_match_videos.filter((_, idx) => idx !== i))}
                        className="px-3 text-red-400 border border-red-500/20 rounded-sm hover:bg-red-500/10">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => set("full_match_videos", [...form.full_match_videos, ""])}
                  className="text-xs text-primary border border-primary/20 rounded-sm px-3 py-1.5 hover:bg-primary/10 transition-colors">
                  {t('register.add_another_match')}
                </button>
              </div>
            </div>
          )}

          {/* Step 5 - Contact */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-sm mb-2">
                <p className="text-xs text-blue-400">🔒 {t('register.contact_private')}</p>
              </div>
              <div>
                <label className={labelClass}>{t('register.phone_number')} *</label>
                <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="+1 234 567 8900" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('register.email_address')} *</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="you@example.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('register.password')} *</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)}
                    placeholder={t('register.password_placeholder')} className={inputClass + " pr-12"} />
                  <button onClick={() => setShowPassword(!showPassword)} type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('register.confirm_password')} *</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} value={form.confirm_password} onChange={e => set("confirm_password", e.target.value)}
                    placeholder={t('register.repeat_password')} className={inputClass + " pr-12"} />
                  <button onClick={() => setShowConfirm(!showConfirm)} type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirm_password && form.password !== form.confirm_password && (
                  <p className="text-xs text-red-400 mt-1">{t('register.passwords_no_match')}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 6 - Terms */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="p-4 bg-card border border-border/50 rounded-sm">
                <h3 className="font-bold text-sm uppercase tracking-wide mb-3">{t('register.profile_summary')}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{t('register.name_label')}: <span className="text-white">{form.first_name} {form.last_name}</span></p>
                  <p>{t('register.position_label')}: <span className="text-white">{form.position}</span></p>
                  <p>{t('register.level_label')}: <span className="text-white">{form.preferred_level}</span></p>
                  <p>{t('register.nationality_label')}: <span className="text-white">{form.nationality}</span></p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.terms_accepted} onChange={e => set("terms_accepted", e.target.checked)}
                    className="accent-primary w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {t('register.terms_prefix')}{" "}
                    <Link to="/cgu" className="text-primary hover:underline">{t('register.terms_link')}</Link>{" "}
                    {t('register.terms_and')}{" "}
                    <Link to="/privacy" className="text-primary hover:underline">{t('register.privacy_link')}</Link>.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.integrity_certified} onChange={e => set("integrity_certified", e.target.checked)}
                    className="accent-primary w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {t('register.integrity_text')}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s-1)} type="button"
                className="flex items-center gap-2 px-4 py-3 border border-white/10 rounded-sm text-sm text-muted-foreground hover:text-white hover:border-white/30 transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t('register.back')}
              </button>
            )}
            <button onClick={next} disabled={saving} type="button"
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? t('register.submitting') : step === 6 ? t('register.submit') : t('register.continue')}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Ratio Football Modal */}
      {showRatioModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm p-6 max-w-md w-full">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-sm mb-5">
              <p className="text-sm text-red-400 font-medium">{t('register.ratio_mandatory')}</p>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <img src="/ratio-football-logo.png" alt="Ratio Football" className="h-10 w-auto object-contain" />
              <h3 className="font-heading font-bold uppercase text-lg">{t('register.ratio_no_highlights')}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {t('register.ratio_partner_desc')}
            </p>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              {t('register.ratio_quality')}
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="https://ratiofootball.fr"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowRatioModal(false)}
                className="w-full bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors text-center"
              >
                {t('register.ratio_discover')}
              </a>
              <button
                onClick={() => setShowRatioModal(false)}
                className="w-full border border-white/20 text-muted-foreground hover:text-white rounded-sm py-3 text-sm transition-colors"
              >
                {t('register.ratio_go_back')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integrity Modal */}
      {showIntegrityModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm p-6 max-w-md w-full">
            <h3 className="font-heading font-bold uppercase text-lg mb-4 text-primary">{t('register.integrity_title')}</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {t('register.integrity_desc1')}
            </p>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {t('register.integrity_desc2')}
            </p>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {t('register.integrity_desc3')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowIntegrityModal(false)}
                className="flex-1 border border-white/10 text-muted-foreground hover:text-white rounded-sm py-3 text-sm transition-colors">
                {t('register.go_back')}
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? t('register.creating') : t('register.i_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerRegister;
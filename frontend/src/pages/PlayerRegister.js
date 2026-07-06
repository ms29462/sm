import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check, Eye, EyeOff } from "lucide-react";

const STEPS = [
  { id: 1, title: "Personal Info" },
  { id: 2, title: "Football Profile" },
  { id: 3, title: "Physical Profile" },
  { id: 4, title: "Media" },
  { id: 5, title: "Contact" },
  { id: 6, title: "Terms" },
];

const POSITIONS = ["GK","CB","LB","RB","DM","CM","AM","Winger","Striker"];
const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Belgium","Bolivia","Brazil","Cameroon","Canada","Chile","China","Colombia","Congo","Costa Rica","Croatia","Czech Republic","Denmark","DR Congo","Ecuador","Egypt","England","Ethiopia","Finland","France","Germany","Ghana","Greece","Guinea","Honduras","Hungary","India","Indonesia","Iran","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kenya","Mali","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Panama","Paraguay","Peru","Poland","Portugal","Romania","Russia","Saudi Arabia","Scotland","Senegal","Serbia","South Africa","South Korea","Spain","Sweden","Switzerland","Tunisia","Turkey","Uganda","Ukraine","United Kingdom","United States","Uruguay","Venezuela","Wales","Zambia","Zimbabwe"];
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
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);

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
          toast.error("Please fill in all required fields"); return false;
        }
        if (isMinor(form.date_of_birth) && !form.parental_consent) {
          toast.error("Parental or legal guardian consent is required for players under 18"); return false;
        }
        return true;
      case 2:
        if (!form.position || !form.preferred_level) {
          toast.error("Please select your position and preferred level"); return false;
        }
        return true;
      case 3:
        if (!form.height || !form.weight || !form.preferred_foot) {
          toast.error("Please fill in all physical information"); return false;
        }
        return true;
      case 4:
        if (form.highlight_video) {
          const ytPattern = /(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[a-zA-Z0-9_-]+/;
          const vimeoPattern = /vimeo\.com\/[0-9]+/;
          if (!ytPattern.test(form.highlight_video) && !vimeoPattern.test(form.highlight_video)) {
            toast.error("Please enter a valid YouTube or Vimeo link for your highlight video");
            return false;
          }
        }
        if (!form.highlight_video) {
          toast.error("A highlight video is required"); return false;
        }
        return true;
      case 5:
        if (!form.phone || !form.email || !form.password || !form.confirm_password) {
          toast.error("Please fill in all contact fields"); return false;
        }
        if (form.password !== form.confirm_password) {
          toast.error("Passwords do not match"); return false;
        }
        if (form.password.length < 8) {
          toast.error("Password must be at least 8 characters"); return false;
        }
        return true;
      case 6:
        if (!form.terms_accepted || !form.integrity_certified) {
          toast.error("Please accept both checkboxes to continue"); return false;
        }
        return true;
      default: return true;
    }
  };

  const next = () => {
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
      toast.success("Welcome to Soccer Match! 🎉");
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
        <Link to="/login" className="text-xs text-muted-foreground hover:text-white">Already have an account?</Link>
      </div>

      {/* Progress */}
      <div className="px-4 pt-5 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium">Step {step} of 6</p>
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
                  <label className={labelClass}>First Name *</label>
                  <input value={form.first_name} onChange={e => set("first_name", e.target.value)}
                    placeholder="John" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Last Name *</label>
                  <input value={form.last_name} onChange={e => set("last_name", e.target.value)}
                    placeholder="Smith" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Date of Birth *</label>
                <input type="date" style={{colorScheme: "dark"}} value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)}
                  style={{colorScheme:"dark"}} className={inputClass} />
              </div>
              {isMinor(form.date_of_birth) && (
                <div className="col-span-1 sm:col-span-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-sm space-y-3">
                  <p className="text-sm text-yellow-200">
                    Players under the age of 18 must have the consent of a parent or legal guardian before creating an account and using Soccer Match.
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.parental_consent}
                      onChange={e => set("parental_consent", e.target.checked)}
                      className="mt-1 accent-primary" />
                    <span className="text-sm text-muted-foreground">
                      I confirm that I have obtained the consent of a parent or legal guardian to create this account and use Soccer Match.
                    </span>
                  </label>
                </div>
              )}
              <div>
                <label className={labelClass}>Country of Residence *</label>
                <select value={form.residence_country} onChange={e => set("residence_country", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">Select country...</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Gender *</label>
                <div className="flex gap-3">
                  {["Male", "Female", "Other"].map(g => (
                    <button key={g} onClick={() => set("gender", g)} type="button"
                      className={`flex-1 py-2.5 text-sm rounded-sm border-2 transition-all font-medium ${form.gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>First Citizenship *</label>
                <select value={form.nationality} onChange={e => set("nationality", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">Select nationality...</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Second Citizenship <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                <select value={form.nationality_2} onChange={e => set("nationality_2", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">Select...</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2 - Football Profile */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Main Position *</label>
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
                <label className={labelClass}>Secondary Position <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
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
                <label className={labelClass}>Looking For</label>
                <div className="space-y-2">
                  {["Professional Opportunities","Semi-Professional Opportunities","University Opportunities","All"].map(o => (
                    <button key={o} onClick={() => toggleArr("looking_for", o)} type="button"
                      className={`w-full text-left px-4 py-3 text-sm rounded-sm border-2 transition-all ${form.looking_for.includes(o) ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Preferred Level *</label>
                <select value={form.preferred_level} onChange={e => set("preferred_level", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">Select level...</option>
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
                  <label className={labelClass}>Height (cm) *</label>
                  <input type="number" value={form.height} onChange={e => set("height", e.target.value)}
                    placeholder="e.g. 180" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Weight (kg) *</label>
                  <input type="number" value={form.weight} onChange={e => set("weight", e.target.value)}
                    placeholder="e.g. 75" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Strong Foot *</label>
                <div className="flex gap-3">
                  {["Right","Left","Both"].map(f => (
                    <button key={f} onClick={() => set("preferred_foot", f)} type="button"
                      className={`flex-1 py-3 text-sm rounded-sm border-2 transition-all font-medium ${form.preferred_foot === f ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {f}
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
                <label className={labelClass}>Highlight Video *</label>
                <p className="text-xs text-muted-foreground mb-2">YouTube or Vimeo link — required to appear in searches</p>
                <input value={form.highlight_video} onChange={e => set("highlight_video", e.target.value)}
                  placeholder="https://youtube.com/watch?v=..." className={inputClass} />
                <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-sm">
                  <p className="text-xs text-primary">💡 Players with a highlight video receive 3x more profile views from organizations.</p>
                </div>
              </div>
              <div>
                <label className={labelClass}>Full Match Videos <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                <p className="text-xs text-muted-foreground mb-2">Add links to full match recordings</p>
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
                  + Add another match
                </button>
              </div>
            </div>
          )}

          {/* Step 5 - Contact */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-sm mb-2">
                <p className="text-xs text-blue-400">🔒 Your contact information is private and will never be shared with organizations.</p>
              </div>
              <div>
                <label className={labelClass}>Phone Number *</label>
                <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="+1 234 567 8900" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email Address *</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="you@example.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Password *</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)}
                    placeholder="Min. 8 characters" className={inputClass + " pr-12"} />
                  <button onClick={() => setShowPassword(!showPassword)} type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Confirm Password *</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} value={form.confirm_password} onChange={e => set("confirm_password", e.target.value)}
                    placeholder="Repeat password" className={inputClass + " pr-12"} />
                  <button onClick={() => setShowConfirm(!showConfirm)} type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirm_password && form.password !== form.confirm_password && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
          )}

          {/* Step 6 - Terms */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="p-4 bg-card border border-border/50 rounded-sm">
                <h3 className="font-bold text-sm uppercase tracking-wide mb-3">Profile Summary</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Name: <span className="text-white">{form.first_name} {form.last_name}</span></p>
                  <p>Position: <span className="text-white">{form.position}</span></p>
                  <p>Level: <span className="text-white">{form.preferred_level}</span></p>
                  <p>Nationality: <span className="text-white">{form.nationality}</span></p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.terms_accepted} onChange={e => set("terms_accepted", e.target.checked)}
                    className="accent-primary w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    I have read and accept the{" "}
                    <Link to="/cgu" className="text-primary hover:underline">Terms of Use</Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.integrity_certified} onChange={e => set("integrity_certified", e.target.checked)}
                    className="accent-primary w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    I certify that all information provided is accurate, truthful, and relates to my football career and personal identity.
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
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button onClick={next} disabled={saving} type="button"
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? "Creating account..." : step === 6 ? "Create Account" : "Continue"}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Integrity Modal */}
      {showIntegrityModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm p-6 max-w-md w-full">
            <h3 className="font-heading font-bold uppercase text-lg mb-4 text-primary">Profile Integrity Notice</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Soccer Match is committed to maintaining a trusted and professional football ecosystem.
            </p>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Before completing your registration, please confirm that all information provided in your profile is accurate and truthful.
              Player profiles, videos, career information, and supporting details may be reviewed periodically by our team.
            </p>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Providing false, misleading, or fraudulent information may result in profile restrictions, suspension, or permanent removal from Soccer Match.
              By continuing, you confirm that the information submitted is genuine and belongs to you.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowIntegrityModal(false)}
                className="flex-1 border border-white/10 text-muted-foreground hover:text-white rounded-sm py-3 text-sm transition-colors">
                Go Back
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? "Creating..." : "I Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerRegister;
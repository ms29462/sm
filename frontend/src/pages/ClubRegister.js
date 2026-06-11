import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

const STEPS = [
  { id: 1, title: "Club Info" },
  { id: 2, title: "Club Profile" },
  { id: 3, title: "Representative" },
  { id: 4, title: "Verification" },
  { id: 5, title: "Terms" },
];

const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Belgium","Bolivia","Brazil","Cameroon","Canada","Chile","China","Colombia","Congo","Costa Rica","Croatia","Czech Republic","Denmark","DR Congo","Ecuador","Egypt","England","Ethiopia","Finland","France","Germany","Ghana","Greece","Guinea","Honduras","Hungary","India","Indonesia","Iran","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kenya","Mali","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Panama","Paraguay","Peru","Poland","Portugal","Romania","Russia","Saudi Arabia","Scotland","Senegal","Serbia","South Africa","South Korea","Spain","Sweden","Switzerland","Tunisia","Turkey","Uganda","Ukraine","United Kingdom","United States","Uruguay","Venezuela","Wales","Zambia","Zimbabwe"];

const LEAGUES = ["Premier League","La Liga","Bundesliga","Serie A","Ligue 1","Eredivisie","Primeira Liga","Pro League","Challenger Pro League","Championship","League One","League Two","MLS","USL Championship","USL League One","CPL","Liga MX","Brasileirao","Primera Division","Colombian Primera","Saudi Pro League","J1 League","South African PSL","Egyptian Premier","Botola Pro","Ligue 1 Quebec","PLSQ","RSEQ","National League","Regional League","Amateur League","Other"];

const ROLES = ["Sporting Director","Technical Director","Head Coach","Assistant Coach","Scout","President","General Manager","Other"];

const inputClass = "w-full bg-black/20 border border-white/15 focus:border-primary rounded-sm px-4 h-12 text-sm text-white outline-none transition-colors";
const labelClass = "text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2";

const ClubRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    // Step 1
    club_name: "", country: "", league: "", division: "", category: "",
    // Step 2
    logo: "", description: "", website: "", instagram: "", facebook: "", linkedin: "",
    // Step 3
    rep_first_name: "", rep_last_name: "", rep_role: "", rep_email: "", rep_phone: "",
    // Step 4 (verification handled via step 2 social links)
    // Step 5
    terms_accepted: false, authorized: false, password: '', confirm_password: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!form.club_name || !form.country || !form.league || !form.category) {
          toast.error("Please fill in all required fields"); return false;
        }
        return true;
      case 2:
        if (!form.description) {
          toast.error("Please add a club description"); return false;
        }
        return true;
      case 3:
        if (!form.rep_first_name || !form.rep_last_name || !form.rep_role || !form.rep_email || !form.rep_phone || !form.password || !form.confirm_password) {
          toast.error("Please fill in all representative information"); return false;
        }
        if (form.password !== form.confirm_password) {
          toast.error("Passwords do not match"); return false;
        }
        if (form.password.length < 8) {
          toast.error("Password must be at least 8 characters"); return false;
        }
        return true;
      case 4:
        if (!form.website && !form.instagram && !form.facebook && !form.linkedin) {
          toast.error("Please provide at least one verification link"); return false;
        }
        return true;
      case 5:
        if (!form.terms_accepted || !form.authorized) {
          toast.error("Please accept both checkboxes"); return false;
        }
        return true;
      default: return true;
    }
  };

  const next = () => {
    if (validateStep()) {
      if (step === 5) setShowModal(true);
      else setStep(s => s + 1);
    }
  };

  const handleSubmit = async () => {
    setShowModal(false);
    setSaving(true);
    try {
      const response = await api.register({
        name: form.club_name,
        email: form.rep_email,
        password: form.password,
        role: "club",
        // Club data
        club_name: form.club_name,
        country: form.country,
        league: form.league,
        division: form.division,
        playing_level: form.category,
        description: form.description,
        logo: form.logo,
        website: form.website,
        instagram: form.instagram,
        facebook: form.facebook,
        linkedin: form.linkedin,
        // Representative
        rep_first_name: form.rep_first_name,
        rep_last_name: form.rep_last_name,
        rep_role: form.rep_role,
        rep_email: form.rep_email,
        rep_phone: form.rep_phone,
      });
      navigate("/club-pending");
    } catch (e) {
      const msg = e.response?.data?.detail || "Registration failed";
      toast.error(msg);
    }
    setSaving(false);
  };

  const progress = ((step - 1) / 5) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 p-4 flex items-center justify-between">
        <img src="/logo.png" alt="Soccer Match" className="h-8 w-auto" />
        <Link to="/" className="text-xs text-muted-foreground hover:text-white">Back to home</Link>
      </div>

      {/* Progress */}
      <div className="px-4 pt-5 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium">Step {step} of 5</p>
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

          {/* Step 1 - Club Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Club Name *</label>
                <input value={form.club_name} onChange={e => set("club_name", e.target.value)}
                  placeholder="e.g. FC Barcelona" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Country *</label>
                <select value={form.country} onChange={e => set("country", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">Select country...</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>League / Competition *</label>
                <select value={form.league} onChange={e => set("league", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">Select league...</option>
                  {LEAGUES.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Division <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                <input value={form.division} onChange={e => set("division", e.target.value)}
                  placeholder="e.g. Division 1, Group A..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Club Category *</label>
                <div className="space-y-2">
                  {["Amateur", "Semi-Professional", "Professional"].map(c => (
                    <button key={c} onClick={() => set("category", c)} type="button"
                      className={`w-full text-left px-4 py-3 text-sm rounded-sm border-2 transition-all ${form.category === c ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 - Club Profile */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Club Logo URL <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                <input value={form.logo} onChange={e => set("logo", e.target.value)}
                  placeholder="https://..." className={inputClass} />
                {form.logo && <img src={form.logo} alt="Logo preview" className="mt-2 w-16 h-16 object-contain border border-white/10 rounded-sm" />}
              </div>
              <div>
                <label className={labelClass}>Club Description *</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="e.g. Professional football club competing in the Belgian Challenger Pro League..."
                  rows={4} className={inputClass + " h-auto py-3"} />
              </div>
              <div>
                <label className={labelClass}>Website <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                <input value={form.website} onChange={e => set("website", e.target.value)}
                  placeholder="https://www.yourclub.com" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className={labelClass}>Instagram <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                  <input value={form.instagram} onChange={e => set("instagram", e.target.value)}
                    placeholder="https://instagram.com/yourclub" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Facebook <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                  <input value={form.facebook} onChange={e => set("facebook", e.target.value)}
                    placeholder="https://facebook.com/yourclub" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>LinkedIn <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                  <input value={form.linkedin} onChange={e => set("linkedin", e.target.value)}
                    placeholder="https://linkedin.com/company/yourclub" className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 - Representative */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-sm">
                <p className="text-xs text-blue-400">🔒 Representative contact information is private and only accessible to Soccer Match administrators.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>First Name *</label>
                  <input value={form.rep_first_name} onChange={e => set("rep_first_name", e.target.value)}
                    placeholder="John" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Last Name *</label>
                  <input value={form.rep_last_name} onChange={e => set("rep_last_name", e.target.value)}
                    placeholder="Smith" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Position / Role *</label>
                <select value={form.rep_role} onChange={e => set("rep_role", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">Select role...</option>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Email Address *</label>
                <input type="email" value={form.rep_email} onChange={e => set("rep_email", e.target.value)}
                  placeholder="you@club.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone Number *</label>
                <input type="tel" value={form.rep_phone} onChange={e => set("rep_phone", e.target.value)}
                  placeholder="+1 234 567 8900" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Password *</label>
                <input type="password" value={form.password} onChange={e => set("password", e.target.value)}
                  placeholder="Min. 8 characters" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Confirm Password *</label>
                <input type="password" value={form.confirm_password} onChange={e => set("confirm_password", e.target.value)}
                  placeholder="Repeat password" className={inputClass} />
                {form.confirm_password && form.password !== form.confirm_password && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4 - Verification */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-sm">
                <p className="text-sm font-bold text-yellow-400 mb-1">Why verification?</p>
                <p className="text-xs text-muted-foreground">To protect players on our platform, we verify that every organization is legitimate. Please provide at least one official link.</p>
              </div>
              <div>
                <label className={labelClass}>Official Website</label>
                <input value={form.website} onChange={e => set("website", e.target.value)}
                  placeholder="https://www.yourclub.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Official Instagram</label>
                <input value={form.instagram} onChange={e => set("instagram", e.target.value)}
                  placeholder="https://instagram.com/yourclub" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Official Facebook</label>
                <input value={form.facebook} onChange={e => set("facebook", e.target.value)}
                  placeholder="https://facebook.com/yourclub" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Official LinkedIn</label>
                <input value={form.linkedin} onChange={e => set("linkedin", e.target.value)}
                  placeholder="https://linkedin.com/company/yourclub" className={inputClass} />
              </div>
              <p className="text-xs text-muted-foreground">* At least one link is required</p>
            </div>
          )}

          {/* Step 5 - Terms */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="p-4 bg-card border border-border/50 rounded-sm">
                <h3 className="font-bold text-sm uppercase tracking-wide mb-3">Club Summary</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Club: <span className="text-white">{form.club_name}</span></p>
                  <p>Country: <span className="text-white">{form.country}</span></p>
                  <p>League: <span className="text-white">{form.league}</span></p>
                  <p>Category: <span className="text-white">{form.category}</span></p>
                  <p>Representative: <span className="text-white">{form.rep_first_name} {form.rep_last_name} — {form.rep_role}</span></p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.terms_accepted} onChange={e => set("terms_accepted", e.target.checked)}
                    className="accent-primary w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    I have read and accept the <Link to="/cgu" className="text-primary hover:underline">Terms of Use</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.authorized} onChange={e => set("authorized", e.target.checked)}
                    className="accent-primary w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    I certify that I am authorized to represent this club and that all information provided is accurate.
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
              {saving ? "Submitting..." : step === 5 ? "Submit Application" : "Continue"}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm p-6 max-w-md w-full">
            <h3 className="font-heading font-bold uppercase text-lg mb-4 text-primary">Club Application Submitted</h3>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Thank you for registering your club on Soccer Match.
            </p>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Your application has been successfully submitted and is currently under review. A member of the Soccer Match team will contact you within 48 hours to:
            </p>
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Verify your club</li>
              <li>• Understand your recruitment needs</li>
              <li>• Present the platform</li>
              <li>• Determine the most appropriate subscription plan</li>
            </ul>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-sm mb-5">
              <p className="text-xs text-yellow-400 font-bold">Current Status: Pending Review</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-white/10 text-muted-foreground hover:text-white rounded-sm py-3 text-sm transition-colors">
                Go Back
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? "Submitting..." : "Finish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubRegister;
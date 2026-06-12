import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

const STEPS = [
  { id: 1, title: "Institution" },
  { id: 2, title: "Athletic Program" },
  { id: 3, title: "Representative" },
  { id: 4, title: "Program Profile" },
  { id: 5, title: "Recruitment" },
  { id: 6, title: "Verification" },
  { id: 7, title: "Terms" },
];

const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Belgium","Bolivia","Brazil","Cameroon","Canada","Chile","China","Colombia","Congo","Costa Rica","Croatia","Czech Republic","Denmark","DR Congo","Ecuador","Egypt","England","Ethiopia","Finland","France","Germany","Ghana","Greece","Guinea","Honduras","Hungary","India","Indonesia","Iran","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kenya","Mali","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Panama","Paraguay","Peru","Poland","Portugal","Romania","Russia","Saudi Arabia","Scotland","Senegal","Serbia","South Africa","South Korea","Spain","Sweden","Switzerland","Tunisia","Turkey","Uganda","Ukraine","United Kingdom","United States","Uruguay","Venezuela","Wales","Zambia","Zimbabwe"];
const LEVELS = ["NCAA Division I","NCAA Division II","NCAA Division III","NAIA","NJCAA","U SPORTS","CCAA","RSEQ","Other"];
const REP_ROLES = ["Head Coach","Assistant Coach","Recruiting Coordinator","Athletic Director","Technical Director","Other"];
const RECRUITMENT_PRIORITIES = ["Domestic Players","International Players","Transfer Students","Freshmen","Graduate Students"];

const inputClass = "w-full bg-black/20 border border-white/15 focus:border-primary rounded-sm px-4 h-12 text-sm text-white outline-none transition-colors";
const labelClass = "text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2";

const CollegeRegister = () => {
  const navigate = useNavigate();
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
          toast.error("Please fill in all required fields"); return false;
        }
        return true;
      case 2:
        if (!form.athletic_program || !form.team_gender || !form.scholarship) {
          toast.error("Please fill in all athletic program details"); return false;
        }
        return true;
      case 3:
        if (!form.rep_first_name || !form.rep_last_name || !form.rep_role || !form.rep_email || !form.rep_phone || !form.password || !form.confirm_password) {
          toast.error("Please fill in all representative information"); return false;
        }
        if (form.password !== form.confirm_password) { toast.error("Passwords do not match"); return false; }
        if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return false; }
        return true;
      case 4:
        if (!form.description) { toast.error("Please add a program description"); return false; }
        return true;
      case 6:
        if (!form.website && !form.instagram && !form.facebook && !form.twitter && !form.linkedin) {
          toast.error("Please provide at least one verification link"); return false;
        }
        return true;
      case 7:
        if (!form.terms_accepted || !form.authorized) { toast.error("Please accept both checkboxes"); return false; }
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
        <Link to="/" className="text-xs text-muted-foreground hover:text-white">Back to home</Link>
      </div>

      <div className="px-4 pt-5 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium">Step {step} of 7</p>
          <p className="text-xs text-primary font-bold">{Math.round(progress)}%</p>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{width: `${progress}%`}} />
        </div>
        <div className="flex justify-between">
          {STEPS.map(s => (
            <div key={s.id} className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                s.id < step ? "bg-primary border-primary text-black" :
                s.id === step ? "border-primary text-primary bg-primary/10" :
                "border-white/20 text-muted-foreground"
              }`}>
                {s.id < step ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
              <p className="text-[9px] text-muted-foreground hidden sm:block">{s.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pb-8 mt-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-heading font-bold uppercase mb-1">{STEPS[step-1].title}</h2>
          <div className="h-0.5 w-12 bg-primary mb-5" />

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Institution Name *</label>
                <input value={form.institution_name} onChange={e => set("institution_name", e.target.value)}
                  placeholder="e.g. University of Toronto" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Country *</label>
                <select value={form.country} onChange={e => set("country", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">Select country...</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Institution Type *</label>
                <div className="flex gap-3">
                  {["College", "University"].map(t => (
                    <button key={t} onClick={() => set("institution_type", t)} type="button"
                      className={`flex-1 py-3 text-sm rounded-sm border-2 font-medium transition-all ${form.institution_type === t ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Competition Level *</label>
                <select value={form.competition_level} onChange={e => set("competition_level", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">Select level...</option>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Athletic Program *</label>
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
                <label className={labelClass}>Team Gender *</label>
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
                <label className={labelClass}>Scholarship Availability *</label>
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
                <p className="text-xs text-blue-400">Please use an institutional email address whenever possible. Contact information is private and only accessible to Soccer Match administrators.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>First Name *</label>
                  <input value={form.rep_first_name} onChange={e => set("rep_first_name", e.target.value)} placeholder="John" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Last Name *</label>
                  <input value={form.rep_last_name} onChange={e => set("rep_last_name", e.target.value)} placeholder="Smith" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Position *</label>
                <select value={form.rep_role} onChange={e => set("rep_role", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">Select position...</option>
                  {REP_ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Email Address *</label>
                <input type="email" value={form.rep_email} onChange={e => set("rep_email", e.target.value)} placeholder="you@university.edu" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone Number *</label>
                <input type="tel" value={form.rep_phone} onChange={e => set("rep_phone", e.target.value)} placeholder="+1 234 567 8900" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Password *</label>
                <input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min. 8 characters" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Confirm Password *</label>
                <input type="password" value={form.confirm_password} onChange={e => set("confirm_password", e.target.value)} placeholder="Repeat password" className={inputClass} />
                {form.confirm_password && form.password !== form.confirm_password && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Program Description *</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="e.g. NCAA Division I men's soccer program focused on recruiting ambitious student-athletes..."
                  rows={4} className={inputClass + " h-auto py-3"} />
              </div>
              <div>
                <label className={labelClass}>Website <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                <input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://athletics.university.edu" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Instagram <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                <input value={form.instagram} onChange={e => set("instagram", e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Facebook <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                <input value={form.facebook} onChange={e => set("facebook", e.target.value)} placeholder="https://facebook.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>X / Twitter <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                <input value={form.twitter} onChange={e => set("twitter", e.target.value)} placeholder="https://x.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>LinkedIn <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                <input value={form.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="https://linkedin.com/..." className={inputClass} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-sm">
                <p className="text-xs text-primary">Select all that apply. This helps us match your program with the right student-athletes.</p>
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
                <p className="text-sm font-bold text-yellow-400 mb-1">Why verification?</p>
                <p className="text-xs text-muted-foreground">To protect student-athletes, we verify every institution. Please provide at least one official link.</p>
              </div>
              <div>
                <label className={labelClass}>Official Website</label>
                <input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://athletics.university.edu" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Official Instagram</label>
                <input value={form.instagram} onChange={e => set("instagram", e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Official Facebook</label>
                <input value={form.facebook} onChange={e => set("facebook", e.target.value)} placeholder="https://facebook.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Official X / Twitter</label>
                <input value={form.twitter} onChange={e => set("twitter", e.target.value)} placeholder="https://x.com/..." className={inputClass} />
              </div>
              <p className="text-xs text-muted-foreground">* At least one link is required</p>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5">
              <div className="p-4 bg-card border border-border/50 rounded-sm">
                <h3 className="font-bold text-sm uppercase tracking-wide mb-3">Application Summary</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Institution: <span className="text-white">{form.institution_name}</span></p>
                  <p>Type: <span className="text-white">{form.institution_type}</span></p>
                  <p>Level: <span className="text-white">{form.competition_level}</span></p>
                  <p>Program: <span className="text-white">{form.athletic_program}</span></p>
                  <p>Representative: <span className="text-white">{form.rep_first_name} {form.rep_last_name} — {form.rep_role}</span></p>
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.terms_accepted} onChange={e => set("terms_accepted", e.target.checked)} className="accent-primary w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    I have read and accept the <Link to="/cgu" className="text-primary hover:underline">Terms of Use</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.authorized} onChange={e => set("authorized", e.target.checked)} className="accent-primary w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    I certify that I am authorized to represent this institution and that all information provided is accurate.
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s-1)} type="button"
                className="flex items-center gap-2 px-4 py-3 border border-white/10 rounded-sm text-sm text-muted-foreground hover:text-white hover:border-white/30 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button onClick={next} disabled={saving} type="button"
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? "Submitting..." : step === 7 ? "Submit Application" : "Continue"}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm p-6 max-w-md w-full">
            <h3 className="font-heading font-bold uppercase text-lg mb-4 text-primary">Institution Application Submitted</h3>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">Thank you for registering your institution on Soccer Match. Your application has been submitted and is under review.</p>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">A member of our team will contact you within 48 hours to:</p>
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Verify your institution</li>
              <li>• Understand your recruitment needs</li>
              <li>• Present the platform</li>
              <li>• Determine the most appropriate subscription plan</li>
            </ul>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-sm mb-5">
              <p className="text-xs text-yellow-400 font-bold">Current Status: Pending Review</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/10 text-muted-foreground hover:text-white rounded-sm py-3 text-sm transition-colors">Go Back</button>
              <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? "Submitting..." : "Finish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeRegister;
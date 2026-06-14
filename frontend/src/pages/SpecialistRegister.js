import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

const STEPS = [
  { id: 1, title: "Personal Info" },
  { id: 2, title: "Specialist Info" },
  { id: 3, title: "Background" },
  { id: 4, title: "Digital Presence" },
  { id: 5, title: "Contact" },
  { id: 6, title: "Verification" },
  { id: 7, title: "Terms" },
];

const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Belgium","Bolivia","Brazil","Cameroon","Canada","Chile","China","Colombia","Congo","Costa Rica","Croatia","Czech Republic","Denmark","DR Congo","Ecuador","Egypt","England","Ethiopia","Finland","France","Germany","Ghana","Greece","Guinea","Honduras","Hungary","India","Indonesia","Iran","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kenya","Mali","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Panama","Paraguay","Peru","Poland","Portugal","Romania","Russia","Saudi Arabia","Scotland","Senegal","Serbia","South Africa","South Korea","Spain","Sweden","Switzerland","Tunisia","Turkey","Uganda","Ukraine","United Kingdom","United States","Uruguay","Venezuela","Wales","Zambia","Zimbabwe"];
const SPECIALIST_TYPES = ["Physical Trainer","Physiotherapist","Nutritionist","Sports Psychologist","Strength & Conditioning Coach","Recovery Specialist","Performance Analyst","Rehabilitation Specialist"];
const EXPERIENCE_OPTIONS = ["Less than 1 year","1-3 years","4-7 years","8+ years"];
const ORG_TYPES = ["Football Club","Federation","Academy","University","Private Practice","Independent"];

const inputClass = "w-full bg-black/20 border border-white/15 focus:border-primary rounded-sm px-4 h-12 text-sm text-white outline-none transition-colors";
const labelClass = "text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2";

const SpecialistRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    first_name: "", last_name: "", country: "",
    specialist_type: "", experience: "", bio: "",
    current_organization: "", org_type: "", certifications: "",
    website: "", instagram: "", linkedin: "", facebook: "",
    email: "", phone: "", password: "", confirm_password: "",
    terms_accepted: false, certified: false,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!form.first_name || !form.last_name || !form.country) {
          toast.error("Please fill in all required fields"); return false;
        }
        return true;
      case 2:
        if (!form.specialist_type || !form.experience || !form.bio) {
          toast.error("Please fill in all specialist information"); return false;
        }
        return true;
      case 5:
        if (!form.email || !form.phone || !form.password || !form.confirm_password) {
          toast.error("Please fill in all contact information"); return false;
        }
        if (form.password !== form.confirm_password) { toast.error("Passwords do not match"); return false; }
        if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return false; }
        return true;
      case 6:
        if (!form.website && !form.linkedin && !form.certifications) {
          toast.error("Please provide at least one verification element"); return false;
        }
        return true;
      case 7:
        if (!form.terms_accepted || !form.certified) { toast.error("Please accept both checkboxes"); return false; }
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
        name: `${form.first_name} ${form.last_name}`,
        email: form.email,
        password: form.password,
        role: "specialist",
        country: form.country,
        first_name: form.first_name,
        last_name: form.last_name,
        specialist_type: form.specialist_type,
        experience: form.experience,
        bio: form.bio,
        current_organization: form.current_organization,
        org_type: form.org_type,
        certifications: form.certifications,
        website: form.website,
        instagram: form.instagram,
        linkedin: form.linkedin,
        facebook: form.facebook,
        phone: form.phone,
      });
      navigate("/specialist-pending");
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>First Name *</label>
                  <input value={form.first_name} onChange={e => set("first_name", e.target.value)} placeholder="John" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Last Name *</label>
                  <input value={form.last_name} onChange={e => set("last_name", e.target.value)} placeholder="Smith" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Country *</label>
                <select value={form.country} onChange={e => set("country", e.target.value)} className={inputClass + " cursor-pointer"}>
                  <option value="">Select country...</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Specialist Type *</label>
                <div className="space-y-2">
                  {SPECIALIST_TYPES.map(t => (
                    <button key={t} onClick={() => set("specialist_type", t)} type="button"
                      className={`w-full text-left px-4 py-3 text-sm rounded-sm border-2 transition-all ${form.specialist_type === t ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Years of Experience *</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERIENCE_OPTIONS.map(e => (
                    <button key={e} onClick={() => set("experience", e)} type="button"
                      className={`py-3 text-sm rounded-sm border-2 transition-all ${form.experience === e ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Professional Bio *</label>
                <textarea value={form.bio} onChange={e => set("bio", e.target.value)}
                  placeholder="e.g. Experienced Strength & Conditioning Coach specialized in football performance..."
                  rows={4} className={inputClass + " h-auto py-3"} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Current Organization <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                <input value={form.current_organization} onChange={e => set("current_organization", e.target.value)} placeholder="e.g. AS Monaco, FIFA, Private Practice..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Organization Type <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                <div className="flex flex-wrap gap-2">
                  {ORG_TYPES.map(t => (
                    <button key={t} onClick={() => set("org_type", form.org_type === t ? "" : t)} type="button"
                      className={`px-3 py-2 text-xs rounded-sm border-2 transition-all ${form.org_type === t ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Certifications <span className="text-muted-foreground font-normal normal-case">(optional)</span></label>
                <textarea value={form.certifications} onChange={e => set("certifications", e.target.value)}
                  placeholder="e.g. UEFA Pro License, NSCA-CSCS, Master's in Sports Science..."
                  rows={3} className={inputClass + " h-auto py-3"} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-sm">
                <p className="text-xs text-primary">Optional but recommended. A strong digital presence increases your visibility on the platform.</p>
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://yourwebsite.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>LinkedIn</label>
                <input value={form.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Instagram</label>
                <input value={form.instagram} onChange={e => set("instagram", e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Facebook</label>
                <input value={form.facebook} onChange={e => set("facebook", e.target.value)} placeholder="https://facebook.com/..." className={inputClass} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-sm">
                <p className="text-xs text-blue-400">Contact information is private and only accessible to Soccer Match administrators.</p>
              </div>
              <div>
                <label className={labelClass}>Email Address *</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone Number *</label>
                <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 234 567 8900" className={inputClass} />
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

          {step === 6 && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-sm">
                <p className="text-sm font-bold text-yellow-400 mb-1">Why verification?</p>
                <p className="text-xs text-muted-foreground">Please provide at least one of the following to help us verify your professional background.</p>
              </div>
              <div>
                <label className={labelClass}>Website or Portfolio</label>
                <input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://yourwebsite.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>LinkedIn Profile</label>
                <input value={form.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Certifications / References</label>
                <textarea value={form.certifications} onChange={e => set("certifications", e.target.value)}
                  placeholder="List your certifications or professional references..."
                  rows={3} className={inputClass + " h-auto py-3"} />
              </div>
              <p className="text-xs text-muted-foreground">* At least one is required</p>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-5">
              <div className="p-4 bg-card border border-border/50 rounded-sm">
                <h3 className="font-bold text-sm uppercase tracking-wide mb-3">Application Summary</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Name: <span className="text-white">{form.first_name} {form.last_name}</span></p>
                  <p>Country: <span className="text-white">{form.country}</span></p>
                  <p>Specialist Type: <span className="text-white">{form.specialist_type}</span></p>
                  <p>Experience: <span className="text-white">{form.experience}</span></p>
                  {form.current_organization && <p>Organization: <span className="text-white">{form.current_organization}</span></p>}
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
                  <input type="checkbox" checked={form.certified} onChange={e => set("certified", e.target.checked)} className="accent-primary w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    I certify that the information provided is accurate and that I am qualified to provide the services listed on my profile.
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
            <h3 className="font-heading font-bold uppercase text-lg mb-4 text-primary">Specialist Application Submitted</h3>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">Thank you for registering on Soccer Match. Your application has been submitted and is under review.</p>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">A member of our team will contact you within 48 hours to:</p>
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Verify your profile</li>
              <li>• Review your qualifications and experience</li>
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

export default SpecialistRegister;
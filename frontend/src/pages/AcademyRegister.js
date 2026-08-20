import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

const STEPS = [
  { id: 1, title: "Academy" },
  { id: 2, title: "Representative" },
  { id: 3, title: "Profile" },
  { id: 4, title: "Verification" },
  { id: 5, title: "Terms" },
];

const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Belgium","Bolivia","Brazil","Cameroon","Canada","Chile","China","Colombia","Congo","Costa Rica","Croatia","Czech Republic","Denmark","DR Congo","Ecuador","Egypt","England","Ethiopia","Finland","France","Germany","Ghana","Greece","Guinea","Honduras","Hungary","India","Indonesia","Iran","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kenya","Mali","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Panama","Paraguay","Peru","Poland","Portugal","Romania","Russia","Saudi Arabia","Scotland","Senegal","Serbia","South Africa","South Korea","Spain","Sweden","Switzerland","Tunisia","Turkey","Uganda","Ukraine","United Kingdom","United States","Uruguay","Venezuela","Wales","Zambia","Zimbabwe"];

const inputClass = "w-full bg-black/20 border border-white/15 focus:border-primary rounded-sm px-4 h-12 text-sm text-white outline-none transition-colors";
const labelClass = "text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2";

const AcademyRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    academy_name: "", country: "", city: "",
    rep_first_name: "", rep_last_name: "", rep_role: "", rep_email: "", rep_phone: "",
    description: "", website: "", instagram: "", facebook: "", linkedin: "",
    password: "", confirm_password: "",
    terms_accepted: false, authorized: false,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!form.academy_name || !form.country) { toast.error("Please fill in all required fields"); return false; }
        return true;
      case 2:
        if (!form.rep_first_name || !form.rep_last_name || !form.rep_email || !form.rep_phone || !form.password || !form.confirm_password) {
          toast.error("Please fill in all representative fields"); return false;
        }
        if (form.password !== form.confirm_password) { toast.error("Passwords do not match"); return false; }
        if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return false; }
        return true;
      case 3:
        if (!form.description) { toast.error("Please add an academy description"); return false; }
        return true;
      case 4:
        if (!form.website && !form.instagram && !form.facebook && !form.linkedin) {
          toast.error("Please provide at least one verification link"); return false;
        }
        return true;
      case 5:
        if (!form.terms_accepted || !form.authorized) { toast.error("Please accept both checkboxes"); return false; }
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
        <div className="mb-8 text-center">
          <Link to="/">
            <img src="/logo.png" alt="SoccerMatch" className="h-10 mx-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Academy Registration</h1>
          <p className="text-muted-foreground mt-1">Join SoccerMatch as an academy</p>
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
              <h2 className="font-heading font-bold uppercase text-lg mb-4">Academy Information</h2>
              <div>
                <label className={labelClass}>Academy Name *</label>
                <input className={inputClass} value={form.academy_name} onChange={e => set("academy_name", e.target.value)} placeholder="e.g., Elite Soccer Academy" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Country *</label>
                  <select className={inputClass} value={form.country} onChange={e => set("country", e.target.value)}>
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input className={inputClass} value={form.city} onChange={e => set("city", e.target.value)} placeholder="e.g., Montréal" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-heading font-bold uppercase text-lg mb-4">Representative Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>First Name *</label>
                  <input className={inputClass} value={form.rep_first_name} onChange={e => set("rep_first_name", e.target.value)} placeholder="First name" />
                </div>
                <div>
                  <label className={labelClass}>Last Name *</label>
                  <input className={inputClass} value={form.rep_last_name} onChange={e => set("rep_last_name", e.target.value)} placeholder="Last name" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Role / Title</label>
                <input className={inputClass} value={form.rep_role} onChange={e => set("rep_role", e.target.value)} placeholder="e.g., Director, Head Coach" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Email *</label>
                  <input className={inputClass} type="email" value={form.rep_email} onChange={e => set("rep_email", e.target.value)} placeholder="your@email.com" />
                </div>
                <div>
                  <label className={labelClass}>Phone *</label>
                  <input className={inputClass} value={form.rep_phone} onChange={e => set("rep_phone", e.target.value)} placeholder="+1 514 000 0000" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Password *</label>
                  <input className={inputClass} type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min 8 characters" />
                </div>
                <div>
                  <label className={labelClass}>Confirm Password *</label>
                  <input className={inputClass} type="password" value={form.confirm_password} onChange={e => set("confirm_password", e.target.value)} placeholder="Repeat password" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-heading font-bold uppercase text-lg mb-4">Academy Profile</h2>
              <div>
                <label className={labelClass}>Description *</label>
                <textarea
                  className={`${inputClass} h-auto min-h-[120px] py-3`}
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Describe your academy — history, philosophy, achievements..."
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-heading font-bold uppercase text-lg mb-4">Verification Links</h2>
              <p className="text-muted-foreground text-sm">Provide at least one link so we can verify your academy.</p>
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
              <h2 className="font-heading font-bold uppercase text-lg mb-4">Terms & Authorization</h2>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 accent-primary" checked={form.terms_accepted} onChange={e => set("terms_accepted", e.target.checked)} />
                <span className="text-sm text-muted-foreground">
                  I have read and agree to the <Link to="/cgu" target="_blank" className="text-primary hover:underline">Terms of Service</Link> and{" "}
                  <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 accent-primary" checked={form.authorized} onChange={e => set("authorized", e.target.checked)} />
                <span className="text-sm text-muted-foreground">
                  I confirm I am authorized to register this academy on SoccerMatch.
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
            {step > 1 ? (
              <button onClick={back} className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-sm text-sm text-muted-foreground hover:text-white hover:border-white/40 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <Link to="/" className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-sm text-sm text-muted-foreground hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" /> Home
              </Link>
            )}
            {step < STEPS.length ? (
              <button onClick={next} className="flex items-center gap-2 px-6 py-2 bg-primary text-black font-bold rounded-sm text-sm hover:bg-primary/90 transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-primary text-black font-bold rounded-sm text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademyRegister;

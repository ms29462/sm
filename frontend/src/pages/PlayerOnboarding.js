import { useState } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

const STEPS = [
  { id: 1, title: "Identity", desc: "Basic personal info" },
  { id: 2, title: "Football", desc: "Position & playing style" },
  { id: 3, title: "Physical", desc: "Height & weight" },
  { id: 4, title: "Situation", desc: "Current club & level" },
  { id: 5, title: "Availability", desc: "What you're looking for" },
  { id: 6, title: "Agent", desc: "Representation status" },
  { id: 7, title: "Media", desc: "Highlight video" },
  { id: 8, title: "Photo", desc: "Profile picture" },
];

const POSITIONS = ["GK","CB","LB","RB","DM","CM","AM","Winger","Striker"];
const LEVELS = ["Ligue 1","Ligue 2","National","National 2","CFA","NCAA Division I","NCAA Division II","NAIA","NJCAA","USL Championship","USL League One","CPL","MLS","Challenger Pro League","Pro League","Premier League","La Liga","Bundesliga","Serie A","Ligue 1 Belgique","Semi-Professional","Amateur","Other"];
const COUNTRIES = ["France","England","Spain","Germany","Italy","Portugal","Belgium","Netherlands","Brazil","Argentina","USA","Canada","Morocco","Senegal","Nigeria","Ghana","Cameroon","Ivory Coast","Algeria","Tunisia","Egypt","South Africa","Japan","South Korea","Australia","Mexico","Colombia","Chile","Uruguay","Turkey","Sweden","Norway","Denmark","Switzerland","Poland","Ukraine","Serbia","Croatia","Scotland","Ireland","Gambia","Guinea","Mali","Burkina Faso","Other"];

const inputClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm px-3 h-12 text-sm text-white outline-none";
const selectClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm px-3 h-12 text-sm text-white outline-none cursor-pointer";
const labelClass = "text-xs font-bold uppercase tracking-wide text-muted-foreground block mb-2";

const PlayerOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date_of_birth: "", nationality: "", nationality_2: "",
    position: "", secondary_positions: [], preferred_foot: "", jersey_number: "",
    height: "", weight: "",
    current_club: "", current_country: "", playing_level: "",
    contract_status: "", looking_for: [], open_to: [],
    representation_status: "", agent_name: "", agency_name: "",
    highlight_video: "",
    profile_picture: "",
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toggleArr = (key, val) => setForm(f => ({
    ...f, [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val]
  }));

  const handleSave = async (final = false) => {
    setSaving(true);
    try {
      await api.updatePlayerProfile(form);
      if (final) {
        toast.success("Profile complete! Welcome to Soccer Match 🎉");
        navigate("/player/dashboard");
      }
    } catch (e) {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const next = async () => {
    await handleSave(false);
    if (step < 8) setStep(s => s + 1);
    else handleSave(true);
  };

  const skip = () => {
    if (step < 8) setStep(s => s + 1);
    else navigate("/player/dashboard");
  };

  const progress = ((step - 1) / 8) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <img src="/logo.png" alt="Soccer Match" className="h-8 w-auto" />
        <button onClick={() => navigate("/player/dashboard")} className="text-xs text-muted-foreground hover:text-white">
          Skip for now
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Step {step} of 8</p>
            <p className="text-xs text-primary font-bold">{Math.round(progress)}% complete</p>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{width: `${progress}%`}} />
          </div>
          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            {STEPS.map(s => (
              <div key={s.id} className={`flex flex-col items-center ${s.id <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                  s.id < step ? 'bg-primary border-primary text-black' :
                  s.id === step ? 'border-primary text-primary' :
                  'border-white/20 text-muted-foreground'
                }`}>
                  {s.id < step ? <Check className="w-3 h-3" /> : s.id}
                </div>
                <p className="text-[9px] mt-1 hidden sm:block">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 pb-8">
        <div className="max-w-lg mx-auto mt-6">
          <h2 className="text-2xl font-heading font-bold uppercase mb-1">{STEPS[step-1].title}</h2>
          <p className="text-sm text-muted-foreground mb-6">{STEPS[step-1].desc}</p>

          {/* Step 1 - Identity */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Date of Birth *</label>
                <input type="date" style={{colorScheme: "dark"}} value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)}
                  style={{colorScheme:"dark"}} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nationality *</label>
                <select value={form.nationality} onChange={e => set("nationality", e.target.value)} className={selectClass}>
                  <option value="">Select nationality...</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Second Nationality (optional)</label>
                <select value={form.nationality_2} onChange={e => set("nationality_2", e.target.value)} className={selectClass}>
                  <option value="">Select...</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2 - Football */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Primary Position *</label>
                <div className="grid grid-cols-3 gap-2">
                  {POSITIONS.map(p => (
                    <button key={p} onClick={() => set("position", p)}
                      className={`py-2 text-sm rounded-sm border transition-colors ${form.position === p ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Preferred Foot *</label>
                <div className="flex gap-3">
                  {["Right", "Left", "Both"].map(f => (
                    <button key={f} onClick={() => set("preferred_foot", f)}
                      className={`flex-1 py-2 text-sm rounded-sm border transition-colors ${form.preferred_foot === f ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Jersey Number (optional)</label>
                <input type="number" min="1" max="99" value={form.jersey_number} onChange={e => set("jersey_number", e.target.value)}
                  placeholder="e.g. 10" className={inputClass} />
              </div>
            </div>
          )}

          {/* Step 3 - Physical */}
          {step === 3 && (
            <div className="space-y-4">
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
          )}

          {/* Step 4 - Situation */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Current Club *</label>
                <input value={form.current_club} onChange={e => set("current_club", e.target.value)}
                  placeholder="e.g. AS Monaco" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Current Country *</label>
                <select value={form.current_country} onChange={e => set("current_country", e.target.value)} className={selectClass}>
                  <option value="">Select country...</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Competition Level *</label>
                <select value={form.playing_level} onChange={e => set("playing_level", e.target.value)} className={selectClass}>
                  <option value="">Select level...</option>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 5 - Availability */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Contract Status *</label>
                <div className="space-y-2">
                  {["Under Contract", "Free Agent"].map(s => (
                    <button key={s} onClick={() => set("contract_status", s)}
                      className={`w-full py-3 text-sm text-left px-4 rounded-sm border transition-colors ${form.contract_status === s ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Looking For *</label>
                <div className="space-y-2">
                  {["Professional Opportunities", "University Opportunities", "Both"].map(s => (
                    <button key={s} onClick={() => toggleArr("looking_for", s)}
                      className={`w-full py-3 text-sm text-left px-4 rounded-sm border transition-colors ${form.looking_for.includes(s) ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Open To</label>
                <div className="flex flex-wrap gap-2">
                  {["Trials", "Direct Contracts", "Scholarship Opportunities"].map(s => (
                    <button key={s} onClick={() => toggleArr("open_to", s)}
                      className={`py-2 px-3 text-xs rounded-sm border transition-colors ${form.open_to.includes(s) ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 6 - Agent */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Agent Status *</label>
                <div className="space-y-2">
                  {["Represented by an Agent", "Not Represented", "Previously Represented"].map(s => (
                    <button key={s} onClick={() => set("representation_status", s)}
                      className={`w-full py-3 text-sm text-left px-4 rounded-sm border transition-colors ${form.representation_status === s ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {form.representation_status === "Represented by an Agent" && (
                <>
                  <div>
                    <label className={labelClass}>Agent Name</label>
                    <input value={form.agent_name} onChange={e => set("agent_name", e.target.value)}
                      placeholder="e.g. John Smith" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Agency Name</label>
                    <input value={form.agency_name} onChange={e => set("agency_name", e.target.value)}
                      placeholder="e.g. Elite Sports Agency" className={inputClass} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 7 - Media */}
          {step === 7 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Highlight Video *</label>
                <p className="text-xs text-muted-foreground mb-2">YouTube or Vimeo link</p>
                <input value={form.highlight_video} onChange={e => set("highlight_video", e.target.value)}
                  placeholder="https://youtube.com/watch?v=..." className={inputClass} />
              </div>
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-sm">
                <p className="text-xs text-primary">💡 A highlight video is required to appear in player searches. This is the most important element of your profile.</p>
              </div>
            </div>
          )}

          {/* Step 8 - Photo */}
          {step === 8 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Profile Photo URL *</label>
                <p className="text-xs text-muted-foreground mb-2">Paste a direct link to your photo</p>
                <input value={form.profile_picture} onChange={e => set("profile_picture", e.target.value)}
                  placeholder="https://..." className={inputClass} />
              </div>
              {form.profile_picture && (
                <div className="flex justify-center">
                  <img src={form.profile_picture} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
                </div>
              )}
              <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-sm">
                <p className="text-xs text-yellow-400">💡 A profile photo is required to appear in player searches. Use a professional headshot or action photo.</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s-1)}
                className="flex items-center gap-2 px-4 py-3 border border-white/10 rounded-sm text-sm text-muted-foreground hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button onClick={skip} className="px-4 py-3 text-sm text-muted-foreground hover:text-white transition-colors">
              Skip
            </button>
            <button onClick={next} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : step === 8 ? "Complete Profile" : "Next"}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerOnboarding;
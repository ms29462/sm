import { useState } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

const STEP_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

const POSITIONS = ["GK","CB","LB","RB","DM","CM","AM","Winger","Striker"];
const LEVELS = ["Ligue 1","Ligue 2","National","National 2","CFA","NCAA Division I","NCAA Division II","NAIA","NJCAA","USL Championship","USL League One","CPL","MLS","Challenger Pro League","Pro League","Premier League","La Liga","Bundesliga","Serie A","Ligue 1 Belgique","Semi-Professional","Amateur","Other"];
const COUNTRIES = ["France","England","Spain","Germany","Italy","Portugal","Belgium","Netherlands","Brazil","Argentina","USA","Canada","Morocco","Senegal","Nigeria","Ghana","Cameroon","Ivory Coast","Algeria","Tunisia","Egypt","South Africa","Japan","South Korea","Australia","Mexico","Colombia","Chile","Uruguay","Turkey","Sweden","Norway","Denmark","Switzerland","Poland","Ukraine","Serbia","Croatia","Scotland","Ireland","Gambia","Guinea","Mali","Burkina Faso","Other"];

const inputClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm px-3 h-12 text-sm text-white outline-none";
const selectClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm px-3 h-12 text-sm text-white outline-none cursor-pointer";
const labelClass = "text-xs font-bold uppercase tracking-wide text-muted-foreground block mb-2";

const PlayerOnboarding = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
        toast.success(t('onboarding.success'));
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
          {t('onboarding.skip_for_now')}
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">{t('onboarding.step_of_8', { step })}</p>
            <p className="text-xs text-primary font-bold">{t('onboarding.complete_pct', { pct: Math.round(progress) })}</p>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{width: `${progress}%`}} />
          </div>
          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            {STEP_IDS.map(id => (
              <div key={id} className={`flex flex-col items-center ${id <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                  id < step ? 'bg-primary border-primary text-black' :
                  id === step ? 'border-primary text-primary' :
                  'border-white/20 text-muted-foreground'
                }`}>
                  {id < step ? <Check className="w-3 h-3" /> : id}
                </div>
                <p className="text-[9px] mt-1 hidden sm:block">{t(`onboarding.step${id}_title`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 pb-8">
        <div className="max-w-lg mx-auto mt-6">
          <h2 className="text-2xl font-heading font-bold uppercase mb-1">{t(`onboarding.step${step}_title`)}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t(`onboarding.step${step}_desc`)}</p>

          {/* Step 1 - Identity */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t('onboarding.dob')} *</label>
                <input type="date" style={{colorScheme:"dark"}} value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.nationality')} *</label>
                <select value={form.nationality} onChange={e => set("nationality", e.target.value)} className={selectClass}>
                  <option value="">{t('register.select_nationality')}</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.second_nationality')}</label>
                <select value={form.nationality_2} onChange={e => set("nationality_2", e.target.value)} className={selectClass}>
                  <option value="">{t('register.select_nationality')}</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2 - Football */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t('onboarding.primary_position')} *</label>
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
                <label className={labelClass}>{t('onboarding.preferred_foot')} *</label>
                <div className="flex gap-3">
                  {[
                    { val: "Right", label: t('register.strong_foot_right') },
                    { val: "Left", label: t('register.strong_foot_left') },
                    { val: "Both", label: t('register.strong_foot_both') },
                  ].map(f => (
                    <button key={f.val} onClick={() => set("preferred_foot", f.val)}
                      className={`flex-1 py-2 text-sm rounded-sm border transition-colors ${form.preferred_foot === f.val ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.jersey_number')}</label>
                <input type="number" min="1" max="99" value={form.jersey_number} onChange={e => set("jersey_number", e.target.value)}
                  placeholder="e.g. 10" className={inputClass} />
              </div>
            </div>
          )}

          {/* Step 3 - Physical */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t('onboarding.height')} *</label>
                <input type="number" value={form.height} onChange={e => set("height", e.target.value)}
                  placeholder="e.g. 180" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.weight')} *</label>
                <input type="number" value={form.weight} onChange={e => set("weight", e.target.value)}
                  placeholder="e.g. 75" className={inputClass} />
              </div>
            </div>
          )}

          {/* Step 4 - Situation */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t('onboarding.current_club')} *</label>
                <input value={form.current_club} onChange={e => set("current_club", e.target.value)}
                  placeholder="e.g. AS Monaco" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.current_country')} *</label>
                <select value={form.current_country} onChange={e => set("current_country", e.target.value)} className={selectClass}>
                  <option value="">{t('register.select_nationality')}</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.competition_level')} *</label>
                <select value={form.playing_level} onChange={e => set("playing_level", e.target.value)} className={selectClass}>
                  <option value="">{t('register.select_level')}</option>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 5 - Availability */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t('onboarding.contract_status')} *</label>
                <div className="space-y-2">
                  {[
                    { val: "Under Contract", label: t('onboarding.under_contract') },
                    { val: "Free Agent", label: t('onboarding.free_agent') },
                  ].map(s => (
                    <button key={s.val} onClick={() => set("contract_status", s.val)}
                      className={`w-full py-3 text-sm text-left px-4 rounded-sm border transition-colors ${form.contract_status === s.val ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.looking_for')} *</label>
                <div className="space-y-2">
                  {[
                    { val: "Professional Opportunities", label: t('register.looking_for_professional') },
                    { val: "Semi-Professional Opportunities", label: t('register.looking_for_semi') },
                    { val: "Amateur Opportunities", label: t('register.looking_for_amateur') },
                    { val: "University Opportunities", label: t('register.looking_for_university') },
                    { val: "All", label: t('register.looking_for_all') },
                  ].map(s => (
                    <button key={s.val} onClick={() => toggleArr("looking_for", s.val)}
                      className={`w-full py-3 text-sm text-left px-4 rounded-sm border transition-colors ${form.looking_for.includes(s.val) ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('onboarding.open_to')}</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { val: "Trials", label: t('onboarding.trials') },
                    { val: "Direct Contracts", label: t('onboarding.direct_contracts') },
                    { val: "Scholarship Opportunities", label: t('onboarding.scholarship') },
                  ].map(s => (
                    <button key={s.val} onClick={() => toggleArr("open_to", s.val)}
                      className={`py-2 px-3 text-xs rounded-sm border transition-colors ${form.open_to.includes(s.val) ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {s.label}
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
                <label className={labelClass}>{t('onboarding.agent_status')} *</label>
                <div className="space-y-2">
                  {[
                    { val: "Represented by an Agent", label: t('onboarding.represented_by_agent') },
                    { val: "Not Represented", label: t('onboarding.not_represented_onboarding') },
                    { val: "Previously Represented", label: t('onboarding.previously_represented_onboarding') },
                  ].map(s => (
                    <button key={s.val} onClick={() => set("representation_status", s.val)}
                      className={`w-full py-3 text-sm text-left px-4 rounded-sm border transition-colors ${form.representation_status === s.val ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground hover:border-white/30'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {form.representation_status === "Represented by an Agent" && (
                <>
                  <div>
                    <label className={labelClass}>{t('onboarding.agent_name')}</label>
                    <input value={form.agent_name} onChange={e => set("agent_name", e.target.value)}
                      placeholder="e.g. John Smith" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t('onboarding.agency_name')}</label>
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
                <label className={labelClass}>{t('onboarding.highlight_video')} *</label>
                <p className="text-xs text-muted-foreground mb-2">{t('onboarding.highlight_note')}</p>
                <input value={form.highlight_video} onChange={e => set("highlight_video", e.target.value)}
                  placeholder="https://youtube.com/watch?v=..." className={inputClass} />
              </div>
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-sm">
                <p className="text-xs text-primary">💡 {t('onboarding.highlight_tip')}</p>
              </div>
            </div>
          )}

          {/* Step 8 - Photo */}
          {step === 8 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>{t('onboarding.profile_photo')} *</label>
                <p className="text-xs text-muted-foreground mb-2">{t('onboarding.photo_note')}</p>
                <input value={form.profile_picture} onChange={e => set("profile_picture", e.target.value)}
                  placeholder="https://..." className={inputClass} />
              </div>
              {form.profile_picture && (
                <div className="flex justify-center">
                  <img src={form.profile_picture} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
                </div>
              )}
              <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-sm">
                <p className="text-xs text-yellow-400">💡 {t('onboarding.photo_tip')}</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s-1)}
                className="flex items-center gap-2 px-4 py-3 border border-white/10 rounded-sm text-sm text-muted-foreground hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t('onboarding.back')}
              </button>
            )}
            <button onClick={skip} className="px-4 py-3 text-sm text-muted-foreground hover:text-white transition-colors">
              {t('onboarding.skip')}
            </button>
            <button onClick={next} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? t('onboarding.saving') : step === 8 ? t('onboarding.complete_profile') : t('onboarding.next')}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerOnboarding;
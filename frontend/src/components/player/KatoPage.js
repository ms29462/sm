import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DIVISIONS = [
  { id: "NCAA Division I", label: "NCAA D1", description: "Top tier — highest standards", cost: "$30k-$70k/yr" },
  { id: "NCAA Division II", label: "NCAA D2", description: "Strong balance of athletics & academics", cost: "$15k-$40k/yr" },
  { id: "NAIA", label: "NAIA", description: "More flexible — good scholarships", cost: "$10k-$30k/yr" },
  { id: "NJCAA", label: "NJCAA", description: "2-year pathway to NCAA/NAIA", cost: "$5k-$20k/yr" },
];

const inputClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-12 px-3 text-sm text-white outline-none";
const selectClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-12 px-3 text-sm text-white appearance-none cursor-pointer outline-none";
const labelClass = "text-xs font-medium uppercase tracking-wide text-muted-foreground block mb-1";

const SectionTitle = ({ children }) => (
  <div className="col-span-1 md:col-span-2 border-t border-border pt-4 mt-2 mb-1">
    <p className="text-xs font-bold uppercase tracking-widest text-primary">{children}</p>
  </div>
);

const ScoreBar = ({ score, label }) => {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold" style={{ color }}>{Math.round(score)}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const CURRENT_YEAR = 2025;

const runAnalysis = (form, division) => {
  const insights = [];
  let academic = 0, english = 0, athletic = 0, eligibility = 0, budget = 0, amateur = 100;

  const bacYear = parseInt(form.bac_year);
  const clockExpiry = !isNaN(bacYear) ? bacYear + 5 : null;
  const clockRemaining = clockExpiry ? clockExpiry - CURRENT_YEAR : null;
  const gpa = parseFloat(form.gpa);
  const semestersEnrolled = parseInt(form.semesters_enrolled) || 0;
  const seasonsUsed = parseInt(form.seasons_used) || 0;
  const age = parseInt(form.age);

  // ── AMATEUR STATUS ──
  if (form.signed_pro === "yes") {
    amateur = 0;
    insights.push({ s: "bad", t: "Signing a professional contract likely eliminates NCAA amateur status — a waiver may be required" });
  } else if (form.received_payment === "yes") {
    amateur = 20;
    insights.push({ s: "bad", t: "Receiving payment for playing jeopardizes NCAA amateur status — consult an eligibility advisor" });
  } else {
    insights.push({ s: "good", t: "Amateur status appears intact — no professional contract or payment reported" });
  }

  // ── 5-YEAR CLOCK ──
  if (!isNaN(bacYear)) {
    if (division === "NCAA Division I" || division === "NCAA Division II") {
      if (clockRemaining !== null) {
        if (clockRemaining <= 0) {
          eligibility = 0;
          insights.push({ s: "bad", t: `5-year eligibility clock expired in ${clockExpiry} — you are no longer eligible for NCAA` });
        } else if (clockRemaining === 1) {
          eligibility = 40;
          insights.push({ s: "warning", t: `Only 1 year remaining on your 5-year clock (expires ${clockExpiry}) — act now` });
        } else {
          eligibility = 100;
          insights.push({ s: "good", t: `${clockRemaining} years remaining on your 5-year NCAA clock (expires ${clockExpiry})` });
        }
      }
    } else if (division === "NAIA") {
      // NAIA: 4 seasons, semesters-based
      const seasonsLeft = 4 - seasonsUsed;
      if (seasonsLeft <= 0) { eligibility = 0; insights.push({ s: "bad", t: "No NAIA seasons of eligibility remaining" }); }
      else { eligibility = 100; insights.push({ s: "good", t: `${seasonsLeft} of 4 NAIA seasons remaining` }); }
    } else if (division === "NJCAA") {
      // NJCAA: 2 seasons, limited if post-bac studies
      if (form.has_postsecondary === "yes" && semestersEnrolled >= 4) {
        eligibility = 10;
        insights.push({ s: "bad", t: "Significant university enrollment may severely limit NJCAA eligibility — waiver required" });
      } else {
        const seasonsLeft = 2 - seasonsUsed;
        eligibility = seasonsLeft > 0 ? 100 : 0;
        insights.push({ s: seasonsLeft > 0 ? "good" : "bad", t: seasonsLeft > 0 ? `${seasonsLeft} of 2 NJCAA seasons remaining` : "No NJCAA seasons remaining" });
      }
    }
  } else {
    eligibility = 30;
    insights.push({ s: "warning", t: "Bac year not provided — cannot calculate eligibility clock" });
  }

  // ── SEMESTERS ENROLLED ──
  if (division === "NCAA Division II") {
    const semLeft = 10 - semestersEnrolled;
    if (semLeft <= 0) { insights.push({ s: "bad", t: "NCAA D2 allows max 10 semesters of full-time enrollment — limit reached" }); eligibility = Math.min(eligibility, 10); }
    else { insights.push({ s: "good", t: `${semLeft} of 10 D2 enrollment semesters remaining` }); }
  }

  // ── ACADEMIC ──
  if (form.has_bac === "yes") {
    academic += 30;
    insights.push({ s: "good", t: "Baccalauréat / secondary diploma obtained — academically eligible" });
  } else if (form.has_bac === "no") {
    insights.push({ s: "bad", t: "A secondary diploma (Bac) is required for all US college programs" });
  } else {
    academic += 10;
  }

  // GPA
  if (!isNaN(gpa)) {
    const minGpa = division === "NCAA Division I" ? 2.3 : division === "NCAA Division II" ? 2.2 : division === "NAIA" ? 2.0 : 0;
    if (gpa >= minGpa) {
      academic += 40;
      insights.push({ s: "good", t: `GPA ${gpa}/4.0 meets the ${division} minimum (${minGpa})` });
    } else {
      academic += 10;
      insights.push({ s: "bad", t: `GPA ${gpa}/4.0 is below the ${division} minimum requirement (${minGpa})` });
    }
  } else {
    academic += 15;
    insights.push({ s: "warning", t: "GPA not provided — add it for a complete academic evaluation" });
  }

  // SAT/ACT
  const sat = parseInt(form.sat_score);
  if (division === "NCAA Division I" || division === "NCAA Division II") {
    if (!isNaN(sat)) {
      if (sat >= 970) { academic += 20; insights.push({ s: "good", t: `SAT ${sat} meets the NCAA eligibility standard (970+)` }); }
      else { insights.push({ s: "warning", t: `SAT ${sat} is below the NCAA standard (970) — ACT or exemption may apply` }); }
    } else if (form.sat_score === "") {
      insights.push({ s: "warning", t: "SAT/ACT score not provided — may be required for NCAA programs" });
    }
  }

  // ── ENGLISH ──
  const eng = parseInt(form.english_level);
  if (!isNaN(eng)) {
    const minEng = division === "NCAA Division I" ? 7 : division === "NCAA Division II" ? 6 : division === "NAIA" ? 5 : 4;
    english = Math.min(100, (eng / minEng) * 100);
    if (eng >= minEng) insights.push({ s: "good", t: `English level ${eng}/10 meets the ${division} requirement` });
    else insights.push({ s: "bad", t: `English level ${eng}/10 is below the ${division} minimum (${minEng}/10)` });
  } else { english = 30; insights.push({ s: "warning", t: "English level not specified" }); }

  // ── ATHLETIC ──
  const goodLevels = {
    "NCAA Division I": ["Professional", "Semi-Professional"],
    "NCAA Division II": ["Professional", "Semi-Professional", "University/College"],
    "NAIA": ["Professional", "Semi-Professional", "University/College", "Youth Academy"],
    "NJCAA": ["Professional", "Semi-Professional", "University/College", "Youth Academy", "Amateur"],
  };
  if (form.playing_level && goodLevels[division]?.includes(form.playing_level)) {
    athletic = 100;
    insights.push({ s: "good", t: `Playing level (${form.playing_level}) is competitive for ${division}` });
  } else if (form.playing_level) {
    athletic = 35;
    insights.push({ s: "warning", t: `Playing level (${form.playing_level}) may be below typical ${division} recruits` });
  } else { athletic = 20; }

  // ── BUDGET ──
  if (form.annual_budget) {
    const nums = form.annual_budget.match(/\d[\d,]*/g);
    if (nums) {
      const amount = parseInt(nums[0].replace(/,/g, ""));
      const minBudget = division === "NCAA Division I" ? 10000 : division === "NCAA Division II" ? 5000 : division === "NAIA" ? 3000 : 1000;
      if (amount >= minBudget) { budget = 100; insights.push({ s: "good", t: `Budget sufficient for ${division} programs` }); }
      else { budget = 40; insights.push({ s: "warning", t: `Budget may be tight — scholarships essential for ${division}` }); }
    }
  } else { budget = 40; }

  // ── COUNTRY-SPECIFIC ──
  if (form.country === "Canada" && division !== "NJCAA") {
    insights.push({ s: "good", t: "Canadian students: DES diploma accepted, Eligibility Center registration required" });
  } else if (form.country === "France") {
    insights.push({ s: "good", t: "French students: Baccalauréat accepted — transcripts must be translated and evaluated" });
    if (division === "NCAA Division I" || division === "NCAA Division II") {
      insights.push({ s: "warning", t: "French students: SAT/ACT may be required — verify with specific programs" });
    }
  }

  const amateurWeight = amateur === 0 ? 0 : 1;
  const eligibilityWeight = eligibility === 0 ? 0 : 1;

  const rawScore = Math.round(
    Math.min(100, academic) * 0.25 +
    english * 0.15 +
    athletic * 0.25 +
    eligibility * 0.20 +
    budget * 0.10 +
    amateur * 0.05
  );

  const overall = amateur === 0 ? Math.min(rawScore, 15) : eligibility === 0 ? Math.min(rawScore, 20) : rawScore;

  const verdict = overall >= 80 ? { text: "Strong candidate — apply with confidence!", color: "#22c55e" }
    : overall >= 60 ? { text: "Promising profile — work on highlighted areas before applying.", color: "#eab308" }
    : overall >= 40 ? { text: "Needs development — focus on key gaps first.", color: "#f97316" }
    : { text: "Not eligible or significant barriers — review the red flags below.", color: "#ef4444" };

  return { overall, verdict, scores: { academic: Math.min(100, academic), english, athletic, eligibility, budget }, insights, division };
};

const KatoPage = () => {
  const [division, setDivision] = useState("");
  const [form, setForm] = useState({
    country: "", age: "", playing_level: "",
    has_bac: "", bac_year: "", gpa: "", sat_score: "",
    english_level: "", has_postsecondary: "",
    semesters_enrolled: "", seasons_used: "",
    signed_pro: "", received_payment: "",
    annual_budget: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const analyze = () => {
    if (!division) { alert("Please select a target division"); return; }
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(runAnalysis(form, division));
      setLoading(false);
    }, 2000);
  };

  const PLAYING_LEVELS = ["Professional", "Semi-Professional", "University/College", "Youth Academy", "Amateur", "National Team"];

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-heading font-bold uppercase tracking-tight mb-2">KATO</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">Your personal college soccer eligibility advisor. Fill in your details and let Kato analyze your compatibility.</p>
      </div>

      {/* Division */}
      <div className="mb-6">
        <label className={labelClass}>Target Division *</label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {DIVISIONS.map(d => (
            <div key={d.id} onClick={() => { setDivision(d.id); setResult(null); }}
              className={`p-4 rounded-sm border cursor-pointer transition-all ${division === d.id ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/40"}`}>
              <p className="font-heading font-bold text-sm uppercase">{d.label}</p>
              <p className="text-xs text-muted-foreground">{d.description}</p>
              <p className="text-xs text-primary mt-1 font-mono">{d.cost}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border border-border/50 rounded-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <SectionTitle>Personal Info</SectionTitle>
          <div>
            <label className={labelClass}>Country of Origin</label>
            <select value={form.country} onChange={e => handleChange("country", e.target.value)} className={selectClass}>
              <option value="">Select...</option>
              <option value="France">France</option>
              <option value="Canada">Canada</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Age</label>
            <input type="number" value={form.age} onChange={e => handleChange("age", e.target.value)} placeholder="e.g. 19" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Playing Level</label>
            <select value={form.playing_level} onChange={e => handleChange("playing_level", e.target.value)} className={selectClass}>
              <option value="">Select...</option>
              {PLAYING_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <SectionTitle>Academic Background</SectionTitle>
          <div>
            <label className={labelClass}>Baccalauréat / Secondary Diploma</label>
            <select value={form.has_bac} onChange={e => handleChange("has_bac", e.target.value)} className={selectClass}>
              <option value="">Select...</option>
              <option value="yes">Yes — obtained</option>
              <option value="in_progress">In progress</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Year Bac Obtained</label>
            <input type="number" value={form.bac_year} onChange={e => handleChange("bac_year", e.target.value)} placeholder="e.g. 2022" className={inputClass} />
            <p className="text-xs text-muted-foreground mt-1">Used to calculate your 5-year NCAA clock</p>
          </div>
          <div>
            <label className={labelClass}>GPA (US scale 0-4.0)</label>
            <input type="number" step="0.1" min="0" max="4" value={form.gpa} onChange={e => handleChange("gpa", e.target.value)} placeholder="e.g. 3.2" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>SAT Score (optional)</label>
            <input type="number" value={form.sat_score} onChange={e => handleChange("sat_score", e.target.value)} placeholder="e.g. 1050" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>English Level (1-10)</label>
            <input type="number" min="1" max="10" value={form.english_level} onChange={e => handleChange("english_level", e.target.value)} placeholder="1=basic, 10=fluent" className={inputClass} />
          </div>

          <SectionTitle>University Enrollment History</SectionTitle>
          <div>
            <label className={labelClass}>Post-Secondary Studies?</label>
            <select value={form.has_postsecondary} onChange={e => handleChange("has_postsecondary", e.target.value)} className={selectClass}>
              <option value="">Select...</option>
              <option value="yes">Yes (Cégep, University, BTS...)</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Semesters Enrolled (full-time)</label>
            <input type="number" min="0" value={form.semesters_enrolled} onChange={e => handleChange("semesters_enrolled", e.target.value)} placeholder="e.g. 2" className={inputClass} />
            <p className="text-xs text-muted-foreground mt-1">Affects D2 (max 10) and NJCAA eligibility</p>
          </div>
          <div>
            <label className={labelClass}>Collegiate Soccer Seasons Used</label>
            <input type="number" min="0" max="4" value={form.seasons_used} onChange={e => handleChange("seasons_used", e.target.value)} placeholder="e.g. 1" className={inputClass} />
            <p className="text-xs text-muted-foreground mt-1">Seasons already played in college programs</p>
          </div>

          <SectionTitle>Amateur Status</SectionTitle>
          <div>
            <label className={labelClass}>Ever signed a pro contract?</label>
            <select value={form.signed_pro} onChange={e => handleChange("signed_pro", e.target.value)} className={selectClass}>
              <option value="">Select...</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Ever received payment for playing?</label>
            <select value={form.received_payment} onChange={e => handleChange("received_payment", e.target.value)} className={selectClass}>
              <option value="">Select...</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <SectionTitle>Financial</SectionTitle>
          <div className="md:col-span-2">
            <label className={labelClass}>Annual Budget (personal contribution)</label>
            <input type="text" value={form.annual_budget} onChange={e => handleChange("annual_budget", e.target.value)} placeholder="e.g. $5,000 or $15,000" className={inputClass} />
            <p className="text-xs text-muted-foreground mt-1">Amount you can contribute beyond any scholarship received</p>
          </div>
        </div>
      </div>

      {/* Kato Button */}
      <div className="flex justify-center mb-10">
        <button onClick={analyze} disabled={loading || !division} className="relative group disabled:opacity-40 disabled:cursor-not-allowed">
          <div className={`w-28 h-28 rounded-full border-4 border-primary flex items-center justify-center transition-all
            ${loading ? "animate-spin border-t-transparent" : "hover:bg-primary/10 hover:scale-105"}`}>
            <img src="/kato-logo.png" alt="Kato" className="w-20 h-20 object-contain" />
          </div>
          <p className="text-center text-xs uppercase tracking-widest text-primary mt-3 font-bold">
            {loading ? "Analyzing..." : "Run Kato"}
          </p>
        </button>
      </div>

      {/* Results Modal */}
      {result && (
        <Dialog open={!!result} onOpenChange={() => setResult(null)}>
          <DialogContent className="bg-card border border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading uppercase text-center">Kato Analysis — {result.division}</DialogTitle>
            </DialogHeader>

            {/* Overall Score */}
            <div className="text-center py-4 border-b border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Compatibility Score</p>
              <div className="text-7xl font-heading font-bold mb-2" style={{ color: result.verdict.color }}>
                {result.overall}%
              </div>
              <p className="font-medium text-sm" style={{ color: result.verdict.color }}>{result.verdict.text}</p>
            </div>

            {/* Score Breakdown */}
            <div className="py-4 border-b border-border">
              <h3 className="font-heading font-bold uppercase mb-4 text-xs tracking-wide text-muted-foreground">Score Breakdown</h3>
              <ScoreBar score={result.scores.academic} label="Academic Eligibility" />
              <ScoreBar score={result.scores.english} label="English Proficiency" />
              <ScoreBar score={result.scores.athletic} label="Athletic Level" />
              <ScoreBar score={result.scores.eligibility} label="Eligibility Window" />
              <ScoreBar score={result.scores.budget} label="Financial Readiness" />
            </div>

            {/* Insights */}
            <div className="py-4">
              <h3 className="font-heading font-bold uppercase mb-3 text-xs tracking-wide text-muted-foreground">Kato Insights</h3>
              <div className="space-y-2">
                {result.insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 leading-none">
                      {ins.s === "good" ? "✅" : ins.s === "warning" ? "⚠️" : "❌"}
                    </span>
                    <span className={ins.s === "good" ? "text-green-400" : ins.s === "warning" ? "text-yellow-400" : "text-red-400"}>
                      {ins.t}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic text-center pb-2">
              ⚠️ Kato provides guidance only — always verify with an NCAA/NAIA Eligibility Center advisor.
            </p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default KatoPage;
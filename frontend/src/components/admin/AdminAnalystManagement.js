import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ANALYST_TYPES = ["Video Analyst","Performance Analyst","Scout","Technical Analyst","Data Analyst","Opposition Analyst"];
const EXPERIENCE_OPTIONS = ["Less than 1 year","1-3 years","4-7 years","8+ years"];
const DISCOVERY_STATUSES = ["Not Contacted","Contacted","Call Scheduled","Call Completed","Approved","Rejected","Additional Information Required"];

const Field = ({ label, value }) => (
  <div className="bg-black/20 rounded-sm p-3">
    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
    <p className="text-sm font-medium">{value || "—"}</p>
  </div>
);

const AdminAnalystManagement = () => {
  const [analysts, setAnalysts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState("all");
  const [notes, setNotes] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", country: "",
    analyst_type: "", experience: "", bio: "",
    certifications: "", current_organization: "",
    website: "", linkedin: "",
  });

  const filtered = analysts.filter(a => {
    if (tab === "all") return true;
    if (tab === "certified") return a.certified_analyst;
    if (tab === "pending") return !a.approved;
    return a.approved && !a.certified_analyst;
  });

  useEffect(() => { loadAnalysts(); }, []);

  const loadAnalysts = async () => {
    try {
      const res = await api.getAllAnalysts();
      setAnalysts(res.data);
    } catch (e) {
      toast.error("Failed to load analysts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.analyst_type) {
      toast.error("Please fill in all required fields"); return;
    }
    try {
      const res = await api.inviteAnalyst({
        name: form.name,
        email: form.email,
        password: form.password,
        country: form.country,
        analyst_type: form.analyst_type,
        experience: form.experience,
        bio: form.bio,
        certifications: form.certifications,
        current_organization: form.current_organization,
        website: form.website,
        linkedin: form.linkedin,
      });
      const activationLink = res.data.activation_link;
      toast.success("Analyst invited! Activation link generated.");
      if (activationLink) {
        navigator.clipboard.writeText(activationLink).catch(() => {});
        toast.info("Activation link copied to clipboard!", {duration: 5000});
      }
      setShowCreate(false);
      setForm({ name: "", email: "", password: "", country: "", analyst_type: "", experience: "", bio: "", certifications: "", current_organization: "", website: "", linkedin: "" });
      loadAnalysts();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to create analyst");
    }
  };

  const handleUpdate = async (analystId, updates) => {
    try {
      await api.updateAnalyst(analystId, updates);
      toast.success("Updated!");
      loadAnalysts();
      setSelected(prev => prev ? { ...prev, ...updates } : null);
    } catch (e) {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (analystId) => {
    if (!window.confirm("Delete this analyst permanently?")) return;
    try {
      await api.deleteAnalyst(analystId);
      toast.success("Analyst deleted!");
      setSelected(null);
      loadAnalysts();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleCertify = async (analyst) => {
    await handleUpdate(analyst.user_id, {
      certified_analyst: true,
      approved: true,
      badges: [...(analyst.badges || []), "soccer_match_certified_analyst"]
    });
  };

  const inputClass = "w-full bg-black/20 border border-white/10 rounded-sm px-3 h-10 text-sm text-white outline-none focus:border-primary";

  if (loading) return <div className="p-8 text-primary font-heading">LOADING...</div>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase mb-1">Analyst Management</h1>
          <p className="text-muted-foreground">Create and manage Soccer Match analysts</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-primary text-black font-bold uppercase rounded-sm px-4 h-10 text-sm hover:bg-primary/90 transition-colors">
          + New Analyst
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {["all","certified","approved","pending"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold uppercase rounded-sm border transition-colors ${tab === t ? "bg-primary text-black border-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
            {t} ({t === "all" ? analysts.length : t === "certified" ? analysts.filter(a => a.certified_analyst).length : t === "pending" ? analysts.filter(a => !a.approved).length : analysts.filter(a => a.approved && !a.certified_analyst).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="bg-card border border-border/50 rounded-sm p-8 text-center text-muted-foreground text-sm">No analysts</div>
          )}
          {filtered.map(analyst => (
            <div key={analyst.user_id} onClick={() => { setSelected(analyst); setNotes(analyst.internal_notes || ""); }}
              className={`bg-card border rounded-sm p-4 cursor-pointer transition-colors ${selected?.user_id === analyst.user_id ? "border-primary" : "border-border/50 hover:border-white/30"}`}>
              <div className="flex items-start justify-between mb-1">
                <p className="font-bold text-sm">{analyst.name}</p>
                {analyst.certified_analyst && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm border border-purple-500/30 bg-purple-500/10 text-purple-400">Certified</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{analyst.analyst_type || "—"}</p>
              <p className="text-xs text-muted-foreground">{analyst.country} • {analyst.created_at?.slice(0,10)}</p>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {showCreate ? (
            <div className="bg-card border border-border/50 rounded-sm p-6 space-y-4">
              <h2 className="text-lg font-heading font-bold uppercase">Create New Analyst</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Full Name *</p>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="John Smith" className={inputClass} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Country</p>
                  <input value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))} placeholder="France" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email *</p>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="analyst@soccermatch.ca" className={inputClass} />
                </div>
  
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Analyst Type *</p>
                <div className="flex flex-wrap gap-2">
                  {ANALYST_TYPES.map(t => (
                    <button key={t} onClick={() => setForm(f => ({...f, analyst_type: t}))} type="button"
                      className={`px-3 py-1.5 text-xs rounded-sm border transition-all ${form.analyst_type === t ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Experience</p>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_OPTIONS.map(e => (
                    <button key={e} onClick={() => setForm(f => ({...f, experience: e}))} type="button"
                      className={`px-3 py-1.5 text-xs rounded-sm border transition-all ${form.experience === e ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Organization</p>
                <input value={form.current_organization} onChange={e => setForm(f => ({...f, current_organization: e.target.value}))} placeholder="e.g. AS Monaco" className={inputClass} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Certifications</p>
                <input value={form.certifications} onChange={e => setForm(f => ({...f, certifications: e.target.value}))} placeholder="e.g. UEFA Analyst Certificate, FIFA Diploma..." className={inputClass} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Bio</p>
                <textarea value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} rows={3}
                  placeholder="Professional bio..." className={inputClass + " h-auto py-2"} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 border border-white/10 text-muted-foreground rounded-sm py-2.5 text-sm hover:text-white transition-colors">Cancel</button>
                <button onClick={handleCreate} className="flex-1 bg-primary text-black font-bold rounded-sm py-2.5 text-sm hover:bg-primary/90 transition-colors">Create Analyst</button>
              </div>
            </div>
          ) : !selected ? (
            <div className="bg-card border border-border/50 rounded-sm p-12 text-center text-muted-foreground">Select an analyst to view details</div>
          ) : (
            <div className="bg-card border border-border/50 rounded-sm p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-heading font-bold uppercase">{selected.name}</h2>
                  <p className="text-sm text-muted-foreground">{selected.analyst_type} — {selected.country}</p>
                </div>
                {selected.certified_analyst && (
                  <span className="text-xs font-bold px-3 py-1 rounded-sm border border-purple-500/30 bg-purple-500/10 text-purple-400">
                    ✓ SM Certified Analyst
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Field label="Email" value={selected.email} />
                <Field label="Country" value={selected.country} />
                <Field label="Type" value={selected.analyst_type} />
                <Field label="Experience" value={selected.experience} />
                <Field label="Organization" value={selected.current_organization} />
                <Field label="Joined" value={selected.created_at?.slice(0,10)} />
              </div>

              {selected.bio && (
                <div className="bg-black/20 rounded-sm p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Bio</p>
                  <p className="text-sm">{selected.bio}</p>
                </div>
              )}

              {selected.certifications && (
                <div className="bg-black/20 rounded-sm p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Certifications</p>
                  <p className="text-sm">{Array.isArray(selected.certifications) ? selected.certifications.join(", ") : selected.certifications}</p>
                </div>
              )}

              {/* Certification Status */}
              <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-sm">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Soccer Match Certification</p>
                <div className="flex items-center gap-3">
                  <div className={`flex-1 p-3 rounded-sm border text-center ${selected.certified_analyst ? "border-purple-500/30 bg-purple-500/10" : "border-white/10"}`}>
                    <p className="text-xs font-bold">{selected.certified_analyst ? "✓ Certified Analyst" : "Not Certified"}</p>
                  </div>
                  {!selected.certified_analyst && (
                    <button onClick={() => handleCertify(selected)}
                      className="px-4 py-3 bg-purple-500 text-white font-bold rounded-sm text-xs hover:bg-purple-400 transition-colors">
                      Grant Certification
                    </button>
                  )}
                  {selected.certified_analyst && (
                    <button onClick={() => handleUpdate(selected.user_id, { certified_analyst: false, badges: (selected.badges || []).filter(b => b !== "soccer_match_certified_analyst") })}
                      className="px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-sm text-xs hover:bg-red-500/30 transition-colors">
                      Revoke
                    </button>
                  )}
                </div>
              </div>

              {/* Activation Link */}
              {selected.status === "invited" && selected.activation_token && (
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-sm">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Activation Link</p>
                  <p className="text-xs text-muted-foreground break-all mb-2">
                    http://localhost:3000/analyst/activate/{selected.activation_token}
                  </p>
                  <button onClick={() => navigator.clipboard.writeText(`http://localhost:3000/analyst/activate/${selected.activation_token}`).then(() => toast.success("Copied!"))}
                    className="text-xs border border-blue-500/30 text-blue-400 rounded-sm px-3 py-1.5 hover:bg-blue-500/10 transition-colors">
                    Copy Link
                  </button>
                </div>
              )}

              {/* Internal Notes */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Internal Notes</p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-sm text-white outline-none focus:border-primary resize-none" />
                <button onClick={() => handleUpdate(selected.user_id, { internal_notes: notes })}
                  className="mt-1 text-xs border border-white/10 rounded-sm px-3 py-1.5 hover:bg-white/10 transition-colors">
                  Save Notes
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {!selected.approved && (
                  <button onClick={() => handleUpdate(selected.user_id, { approved: true })}
                    className="flex-1 bg-green-500 text-black font-bold rounded-sm py-2.5 text-sm hover:bg-green-400 transition-colors">
                    ✓ Approve
                  </button>
                )}
                <button onClick={() => handleDelete(selected.user_id)}
                  className="px-4 bg-red-900/30 text-red-400 border border-red-500/30 font-bold rounded-sm py-2.5 text-sm hover:bg-red-900/50 transition-colors">
                  🗑 Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalystManagement;
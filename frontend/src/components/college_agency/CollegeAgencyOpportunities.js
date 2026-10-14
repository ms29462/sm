import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Briefcase, Plus, Trash2, Pencil, ChevronRight, Users, CalendarDays, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { POSITIONS } from "@/lib/constants";

const COLLEGE_LEVELS = [
  "NCAA Division I", "NCAA Division II", "NCAA Division III",
  "NAIA", "NJCAA", "CCAA", "USports", "College / University",
];

const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Belgium","Bolivia","Brazil","Cameroon","Canada","Chile","China","Colombia","Costa Rica","Croatia","Czech Republic","Denmark","Ecuador","Egypt","England","Finland","France","Germany","Ghana","Greece","Honduras","Hungary","Ireland","Israel","Italy","Jamaica","Japan","Kenya","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway","Portugal","Romania","Russia","Saudi Arabia","Scotland","Senegal","Serbia","South Africa","South Korea","Spain","Sweden","Switzerland","Tunisia","Turkey","Ukraine","United Kingdom","United States","Uruguay","Venezuela","Wales","Zambia","Zimbabwe"];

const STATUS_BADGE = {
  published: "text-green-400 bg-green-500/10 border-green-500/20",
  open: "text-green-400 bg-green-500/10 border-green-500/20",
  pending_review: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  changes_requested: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
  closed: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  filled: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};
const STATUS_LABEL = { published: "Published", open: "Open", pending_review: "Under Review", changes_requested: "Changes Requested", rejected: "Rejected", closed: "Closed", filled: "Filled" };
const TABS = [{ id: "all", label: "All" }, { id: "published", label: "Published" }, { id: "pending_review", label: "Under Review" }, { id: "changes_requested", label: "Changes Req." }, { id: "closed", label: "Closed" }, { id: "filled", label: "Filled" }, { id: "rejected", label: "Rejected" }];

const CollegeAgencyOpportunities = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDialog, setShowDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    position: "", league_level: "", salary_range: "", contract_duration: "",
    description: "", deadline: "", max_applicants: "", age_min: "", age_max: "",
    requirements: [], visibility: "public", country: ""
  });

  useEffect(() => { loadOpportunities(); }, []);

  const loadOpportunities = async () => {
    try {
      const r = await api.getClubOpportunities();
      setOpportunities(r.data);
    } catch { setOpportunities([]); } finally { setLoading(false); }
  };

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleCreate = async () => {
    const newErrors = {};
    if (!formData.visibility) newErrors.visibility = "Please select opportunity visibility";
    if (!formData.position) newErrors.position = "Please select a position";
    if (!formData.league_level) newErrors.league_level = "Please select a league level";
    if (!formData.description) newErrors.description = "Please add a description";
    if (!formData.deadline) newErrors.deadline = "Please set an application deadline";
    if (!formData.max_applicants) newErrors.max_applicants = "Please set max applicants";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); toast.error("Please fix the highlighted fields"); return; }
    setErrors({});
    try {
      await api.createOpportunity({ ...formData, age_min: formData.age_min ? parseInt(formData.age_min) : null, age_max: formData.age_max ? parseInt(formData.age_max) : null, max_applicants: formData.max_applicants ? parseInt(formData.max_applicants) : null });
      toast.success("Opportunity created!");
      setShowDialog(false); setErrors({});
      setFormData({ position: "", league_level: "", salary_range: "", contract_duration: "", description: "", deadline: "", max_applicants: "", age_min: "", age_max: "", requirements: [], visibility: "public", country: "" });
      setShowReviewPopup(true);
      loadOpportunities();
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(Array.isArray(detail) ? `Missing: ${detail.map(e => e.loc?.[e.loc.length-1]).join(", ")}` : detail || "Failed to create opportunity");
    }
  };

  const handleStatusChange = async (id, status) => {
    try { await api.updateOpportunityStatus(id, status); toast.success(`Marked as ${status}`); await loadOpportunities(); setSelected(prev => prev?.id === id ? { ...prev, status } : prev); }
    catch { toast.error("Failed to update status"); }
  };

  const openEdit = (opp) => { setEditingOpp(opp); setEditForm({ positions: opp.position ? opp.position.split(", ") : [], country: opp.country || "", league_level: opp.league_level || "", salary_range: opp.salary_range || "", contract_duration: opp.contract_duration || "", description: opp.description || "", age_min: opp.age_min || "", age_max: opp.age_max || "", deadline: opp.deadline || "", max_applicants: opp.max_applicants || "" }); };

  const handleEditSave = async () => {
    try { await api.updateOpportunity(editingOpp.id, editForm); toast.success("Updated!"); setEditingOpp(null); await loadOpportunities(); }
    catch { toast.error("Failed to update"); }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    try { await api.deleteOpportunity(deleteId); toast.success("Deleted"); if (selected?.id === deleteId) { setSelected(null); setShowMobileDetail(false); } loadOpportunities(); }
    catch { toast.error("Failed to delete"); } finally { setDeleteId(null); }
  };

  const filteredOpps = activeTab === "all" ? opportunities : opportunities.filter(o => { const s = o.status || "open"; if (activeTab === "published") return s === "published" || s === "open"; return s === activeTab; });
  const spotsLeft = (opp) => opp.max_applicants ? Math.max(opp.max_applicants - (opp.applicants_count ?? 0), 0) : null;

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="text-primary text-xl font-heading">LOADING...</div></div>;

  return (
    <div className="flex flex-col h-full">
      {showReviewPopup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-sm p-6 max-w-md w-full">
            <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">⏳</span></div>
            <h3 className="font-heading font-bold uppercase text-lg mb-3 text-center">Opportunity Submitted</h3>
            <p className="text-sm text-muted-foreground text-center mb-3 leading-relaxed">Your opportunity has been submitted and is currently under review.</p>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-sm mb-5"><p className="text-xs text-yellow-400 font-bold text-center">You will receive a response within 24 hours.</p></div>
            <button onClick={() => setShowReviewPopup(false)} className="w-full bg-primary text-black font-bold rounded-sm py-3 text-sm hover:bg-primary/90 transition-colors">Got it</button>
          </div>
        </div>
      )}

      {editingOpp && (
        <Dialog open={!!editingOpp} onOpenChange={(open) => !open && setEditingOpp(null)}>
          <DialogContent className="bg-card border border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading uppercase">Edit Opportunity</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-sm font-medium uppercase tracking-wide">League Level</Label>
                <select value={editForm.league_level} onChange={(e) => setEditForm(f => ({...f, league_level: e.target.value}))}
                  className="mt-2 w-full bg-black/20 border border-white/10 rounded-sm h-12 px-3 text-sm text-white outline-none cursor-pointer">
                  <option value="">Select level...</option>
                  {COLLEGE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="text-sm font-medium uppercase tracking-wide">Salary / Scholarship</Label><Input value={editForm.salary_range} onChange={(e) => setEditForm(f => ({...f, salary_range: e.target.value}))} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g. Full scholarship" /></div>
                <div><Label className="text-sm font-medium uppercase tracking-wide">Contract Duration</Label><Input value={editForm.contract_duration} onChange={(e) => setEditForm(f => ({...f, contract_duration: e.target.value}))} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g. 4 years" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="text-sm font-medium uppercase tracking-wide">Deadline</Label><Input type="date" style={{colorScheme:"dark"}} value={editForm.deadline} onChange={(e) => setEditForm(f => ({...f, deadline: e.target.value}))} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" /></div>
                <div><Label className="text-sm font-medium uppercase tracking-wide">Max Applicants</Label><Input type="number" value={editForm.max_applicants} onChange={(e) => setEditForm(f => ({...f, max_applicants: e.target.value}))} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" /></div>
              </div>
              <div><Label className="text-sm font-medium uppercase tracking-wide">Description</Label><Textarea value={editForm.description} onChange={(e) => setEditForm(f => ({...f, description: e.target.value}))} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm min-h-[120px]" /></div>
              <Button onClick={handleEditSave} className="w-full bg-primary text-black font-bold uppercase rounded-sm h-12">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border border-border/50">
          <AlertDialogHeader><AlertDialogTitle className="font-heading uppercase">Delete Opportunity</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground">Are you sure you want to delete this opportunity?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm uppercase text-xs tracking-wide">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-white hover:bg-destructive/90 rounded-sm uppercase text-xs tracking-wide">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-heading font-bold uppercase">POST COLLEGE OPPORTUNITY</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Position *</Label>
              {errors.position && <p className="text-xs text-red-400 mt-1">⚠ {errors.position}</p>}
              <Select value={formData.position} onValueChange={(v) => handleChange("position", v)}>
                <SelectTrigger className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12"><SelectValue placeholder="Select position" /></SelectTrigger>
                <SelectContent>{POSITIONS.map((pos) => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">League Level *</Label>
              {errors.league_level && <p className="text-xs text-red-400 mt-1">⚠ {errors.league_level}</p>}
              <select value={formData.league_level} onChange={(e) => handleChange("league_level", e.target.value)}
                className="mt-2 w-full bg-black/20 border border-white/10 rounded-sm h-12 px-3 text-sm text-white outline-none cursor-pointer">
                <option value="">Select college level...</option>
                {COLLEGE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-sm font-medium uppercase tracking-wide">Salary / Scholarship</Label><Input value={formData.salary_range} onChange={(e) => handleChange("salary_range", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g. Full scholarship" /></div>
              <div>
                <Label className="text-sm font-medium uppercase tracking-wide">Country</Label>
                <select value={formData.country} onChange={(e) => handleChange("country", e.target.value)} className="mt-2 w-full bg-black/20 border border-white/10 rounded-sm h-12 px-3 text-sm text-white outline-none cursor-pointer">
                  <option value="">Select country...</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><Label className="text-sm font-medium uppercase tracking-wide">Duration</Label><Input value={formData.contract_duration} onChange={(e) => handleChange("contract_duration", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g. 4 years" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="text-sm font-medium uppercase tracking-wide">Age Min</Label><Input type="number" value={formData.age_min} onChange={(e) => handleChange("age_min", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g. 17" /></div>
              <div><Label className="text-sm font-medium uppercase tracking-wide">Age Max</Label><Input type="number" value={formData.age_max} onChange={(e) => handleChange("age_max", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g. 22" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium uppercase tracking-wide">Deadline *</Label>
                {errors.deadline && <p className="text-xs text-red-400 mt-1">⚠ {errors.deadline}</p>}
                <Input type="date" style={{colorScheme:"dark"}} value={formData.deadline} onChange={(e) => handleChange("deadline", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
              </div>
              <div>
                <Label className="text-sm font-medium uppercase tracking-wide">Max Applicants *</Label>
                {errors.max_applicants && <p className="text-xs text-red-400 mt-1">⚠ {errors.max_applicants}</p>}
                <Input type="number" value={formData.max_applicants} onChange={(e) => handleChange("max_applicants", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g. 20" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium uppercase tracking-wide">Visibility *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 mb-4">
                {[{id:"public", label:"Public", desc:"Agency name visible to players"},{id:"anonymous", label:"Anonymous", desc:"Identity hidden from players"}].map(opt => (
                  <button key={opt.id} type="button" onClick={() => handleChange("visibility", opt.id)}
                    className={`px-3 py-3 text-sm rounded-sm border-2 transition-all text-left ${formData.visibility === opt.id ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/30"}`}>
                    <p className="font-bold">{opt.label}</p><p className="text-xs opacity-70">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <Label className="text-sm font-medium uppercase tracking-wide">Description *</Label>
              {errors.description && <p className="text-xs text-red-400 mt-1">⚠ {errors.description}</p>}
              <Textarea value={formData.description} onChange={(e) => handleChange("description", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm min-h-[120px]" placeholder="Describe the college opportunity..." />
            </div>
            <Button onClick={handleCreate} className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12">POST OPPORTUNITY</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 overflow-hidden h-full">
        <div className={`flex flex-col border-r border-border/50 w-full md:w-80 lg:w-96 flex-shrink-0 ${showMobileDetail ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-border/50 flex items-center justify-between gap-3 flex-shrink-0">
            <div><h1 className="font-heading font-bold uppercase text-lg leading-tight">Opportunities</h1><p className="text-xs text-muted-foreground">{opportunities.length} posted</p></div>
            <Button onClick={() => setShowDialog(true)} className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-9 px-4 text-xs flex-shrink-0"><Plus className="w-3.5 h-3.5 mr-1.5" /> Post</Button>
          </div>
          <div className="flex gap-1 p-2 border-b border-border/50 overflow-x-auto flex-shrink-0 no-scrollbar">
            {TABS.map(tab => {
              const count = tab.id === "all" ? opportunities.length : opportunities.filter(o => { const s = o.status || "open"; if (tab.id === "published") return s === "published" || s === "open"; return s === tab.id; }).length;
              if (count === 0 && tab.id !== "all") return null;
              return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-shrink-0 px-2.5 py-1 rounded-sm text-xs font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-primary text-black" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}>{tab.label} <span className={`ml-1.5 text-[10px] ${activeTab === tab.id ? "text-black/60" : "text-muted-foreground"}`}>{count}</span></button>;
            })}
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredOpps.length === 0 ? (
              <div className="p-8 text-center"><Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No opportunities here</p></div>
            ) : filteredOpps.map(opp => {
              const status = opp.status || "open";
              const spots = spotsLeft(opp);
              const isSelected = selected?.id === opp.id;
              return (
                <button key={opp.id} onClick={() => { setSelected(opp); setShowMobileDetail(true); }}
                  className={`w-full text-left p-4 border-b border-border/30 hover:bg-white/5 transition-colors flex items-start gap-3 ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1"><span className="font-bold text-sm truncate">{opp.position}</span><span className={`text-[10px] px-1.5 py-0.5 rounded-sm border flex-shrink-0 ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status] || status}</span></div>
                    <p className="text-xs text-muted-foreground truncate">{opp.league_level}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      {opp.deadline && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(opp.deadline).toLocaleDateString("en-US", {month:"short", day:"numeric"})}</span>}
                      {spots !== null && <span className={`flex items-center gap-1 ${spots === 0 ? "text-red-400" : "text-green-400"}`}><Users className="w-3 h-3" />{spots}/{opp.max_applicants}</span>}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isSelected ? "text-primary" : "text-muted-foreground/40"}`} />
                </button>
              );
            })}
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto ${showMobileDetail ? "flex flex-col" : "hidden md:flex md:flex-col"}`}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-8"><div className="text-center"><Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" /><p className="font-heading uppercase text-sm">Select an opportunity</p></div></div>
          ) : (
            <div className="p-6 max-w-2xl w-full mx-auto space-y-6">
              <button onClick={() => setShowMobileDetail(false)} className="md:hidden flex items-center gap-2 text-muted-foreground hover:text-primary text-sm mb-2 transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-heading font-bold uppercase">{selected.position}</h2>
                  <p className="text-muted-foreground text-sm mt-1">{selected.league_level}{selected.country ? ` · ${selected.country}` : ""}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-sm border ${STATUS_BADGE[selected.status || "open"]}`}>{STATUS_LABEL[selected.status || "open"]}</span>
                    {selected.visibility === "anonymous" && <span className="text-xs px-2 py-1 rounded-sm border border-white/10 text-muted-foreground">Anonymous</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selected.status !== "published" && <Button onClick={() => openEdit(selected)} variant="outline" size="sm" className="rounded-sm border-white/20 text-white hover:bg-white/10 text-xs"><Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit</Button>}
                  <Button onClick={() => setDeleteId(selected.id)} variant="outline" size="sm" className="rounded-sm border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"><Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete</Button>
                </div>
              </div>
              {selected.status === "pending_review" && <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-sm"><p className="text-sm text-yellow-400 font-medium">⏳ Under review — you'll hear back within 24 hours.</p></div>}
              {selected.status === "published" && <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-sm"><p className="text-sm text-green-400">✓ Published and visible to players.</p></div>}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Deadline", value: selected.deadline ? new Date(selected.deadline).toLocaleDateString("en-US", {year:"numeric", month:"short", day:"numeric"}) : "—" },
                  { label: "Spots Left", value: spotsLeft(selected) !== null ? `${spotsLeft(selected)} / ${selected.max_applicants}` : "—" },
                  { label: "Scholarship", value: selected.salary_range || "—" },
                  { label: "Duration", value: selected.contract_duration || "—" },
                  { label: "Age Range", value: (selected.age_min && selected.age_max) ? `${selected.age_min} – ${selected.age_max} yrs` : "—" },
                ].filter(s => s.value !== "—").map(({ label, value }) => (
                  <div key={label} className="bg-card border border-border/50 rounded-sm p-3"><p className="text-xs text-muted-foreground uppercase mb-1">{label}</p><p className="font-medium text-sm">{value}</p></div>
                ))}
              </div>
              <div className="bg-card border border-border/50 rounded-sm p-4"><h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Description</h3><p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.description}</p></div>
              <div className="bg-card border border-border/50 rounded-sm p-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Change Status</h3>
                <div className="flex flex-wrap gap-2">
                  {["open","closed","filled"].map(s => (
                    <button key={s} onClick={() => handleStatusChange(selected.id, s)} className={`px-3 py-1.5 text-xs rounded-sm border transition-colors font-medium ${(selected.status || "open") === s ? `${STATUS_BADGE[s]} font-bold` : "border-white/10 text-muted-foreground hover:border-white/30"}`}>{STATUS_LABEL[s]}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollegeAgencyOpportunities;

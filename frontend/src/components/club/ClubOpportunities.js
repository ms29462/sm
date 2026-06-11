import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Briefcase, Plus, Trash2, Pencil } from "lucide-react";
import { POSITIONS } from "@/lib/constants";

const LEAGUES = [
  "Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1",
  "Eredivisie", "Primeira Liga", "Pro League", "Challenger Pro League",
  "Championship", "League One", "League Two",
  "MLS", "USL Championship", "USL League One", "CPL", "Liga MX",
  "Brasileirao", "Primera Division", "Colombian Primera",
  "Saudi Pro League", "J1 League",
  "South African PSL", "Egyptian Premier", "Botola Pro",
  "NCAA Division I", "NCAA Division II", "NAIA", "NJCAA",
  "National League", "Semi-Professional", "Amateur"
];

const STATUS_COLORS = {
  open: "bg-green-500/10 text-green-500 border-green-500/20",
  closed: "bg-red-500/10 text-red-500 border-red-500/20",
  filled: "bg-blue-500/10 text-blue-500 border-blue-500/20"
};

const ClubOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [editingOpp, setEditingOpp] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [formData, setFormData] = useState({
    position: "", league_level: "", salary_range: "",
    contract_duration: "", description: "",
    deadline: "", max_applicants: "", age_min: "", age_max: "", requirements: [], visibility: "anonymous"
  });

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      const response = await api.getClubOpportunities();
      setOpportunities(response.data);
    } catch (error) {
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    const newErrors = {};
    if (!formData.visibility) newErrors.visibility = "Please select opportunity visibility";
    if (!formData.position && (!formData.positions || formData.positions.length === 0)) newErrors.position = "Please select a position";
    if (!formData.league_level) newErrors.league_level = "Please select a league level";
    if (!formData.description) newErrors.description = "Please add a description";
    if (!formData.deadline) newErrors.deadline = "Please set an application deadline";
    if (!formData.max_applicants) newErrors.max_applicants = "Please set max applicants";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    try {
      const submitData = {
        ...formData,
        age_min: formData.age_min ? parseInt(formData.age_min) : null,
        age_max: formData.age_max ? parseInt(formData.age_max) : null,
        max_applicants: formData.max_applicants ? parseInt(formData.max_applicants) : null,
      };
      await api.createOpportunity(submitData);
      toast.success("Opportunity created!");
      setShowDialog(false); setErrors({});
      setFormData({
        position: "", league_level: "", salary_range: "",
        contract_duration: "", description: "",
        deadline: "", max_applicants: "", age_min: "", age_max: ""
      });
      loadOpportunities();
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        const missing = detail.map(e => e.loc?.[e.loc.length-1]).join(", ");
        toast.error(`Missing required fields: ${missing}`);
      } else {
        toast.error(detail || "Failed to create opportunity");
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.updateOpportunityStatus(id, status);
      toast.success(`Opportunity marked as ${status}`);
      loadOpportunities();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const openEdit = (opp) => {
    setEditingOpp(opp);
    setEditForm({
      positions: opp.position ? opp.position.split(", ") : [],
      country: opp.country || "",
      league_level: opp.league_level || "",
      custom_league: "",
      salary_range: opp.salary_range || "",
      contract_duration: opp.contract_duration || "",
      description: opp.description || "",
      age_min: opp.age_min || "",
      age_max: opp.age_max || "",
      deadline: opp.deadline || "",
      max_applicants: opp.max_applicants || "",
    });
  };

  const handleEditSave = async () => {
    try {
      const data = {
        ...editForm,
        position: editForm.positions?.length ? editForm.positions.join(", ") : "",
        league_level: editForm.league_level === "Other" ? editForm.custom_league : editForm.league_level,
      };
      await api.updateOpportunity(editingOpp.id, data);
      toast.success("Opportunity updated!");
      setEditingOpp(null);
      loadOpportunities();
    } catch (e) {
      toast.error("Failed to update opportunity");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    try {
      await api.deleteOpportunity(deleteId);
      toast.success("Opportunity deleted");
      loadOpportunities();
    } catch (error) {
      toast.error("Failed to delete opportunity");
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-primary text-xl font-heading">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {editingOpp && (
        <Dialog open={!!editingOpp} onOpenChange={(open) => !open && setEditingOpp(null)}>
          <DialogContent className="bg-card border border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading uppercase">Edit Opportunity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium uppercase tracking-wide">League Level</Label>
                  <Input value={editForm.league_level} onChange={(e) => setEditForm(f => ({...f, league_level: e.target.value}))}
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g. USL Championship" />
                </div>
                <div>
                  <Label className="text-sm font-medium uppercase tracking-wide">Salary Range</Label>
                  <Input value={editForm.salary_range} onChange={(e) => setEditForm(f => ({...f, salary_range: e.target.value}))}
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g. $50k-$100k" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium uppercase tracking-wide">Contract Duration</Label>
                  <Input value={editForm.contract_duration} onChange={(e) => setEditForm(f => ({...f, contract_duration: e.target.value}))}
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g. 2 years" />
                </div>
                <div>
                  <Label className="text-sm font-medium uppercase tracking-wide">Deadline *</Label>
                {errors.deadline && <p className="text-xs text-red-400 mt-1">⚠ {errors.deadline}</p>}
                  <Input type="date" value={editForm.deadline} onChange={(e) => setEditForm(f => ({...f, deadline: e.target.value}))}
                    style={{colorScheme: "dark"}} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium uppercase tracking-wide">Age Min</Label>
                  <Input type="number" value={editForm.age_min} onChange={(e) => setEditForm(f => ({...f, age_min: e.target.value}))}
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g. 18" />
                </div>
                <div>
                  <Label className="text-sm font-medium uppercase tracking-wide">Age Max</Label>
                  <Input type="number" value={editForm.age_max} onChange={(e) => setEditForm(f => ({...f, age_max: e.target.value}))}
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g. 30" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium uppercase tracking-wide">Description</Label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm(f => ({...f, description: e.target.value}))}
                  className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm min-h-[120px]" />
              </div>
              <Button onClick={handleEditSave} className="w-full bg-primary text-black font-bold uppercase rounded-sm h-12">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase">Delete Opportunity</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this opportunity? All applications will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm uppercase text-xs tracking-wide">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-sm uppercase text-xs tracking-wide"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase mb-2">OPPORTUNITIES</h1>
          <p className="text-muted-foreground">Manage your posted opportunities</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button
              data-testid="create-opportunity-btn"
              className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12 px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              POST OPPORTUNITY
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading font-bold uppercase">POST NEW OPPORTUNITY</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-sm font-medium uppercase tracking-wide">Position *</Label>
                {errors.position && <p className="text-xs text-red-400 mt-1">⚠ {errors.position}</p>}
                <Select value={formData.position} onValueChange={(v) => handleChange("position", v)}>
                  <SelectTrigger data-testid="position-select" className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((pos) => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium uppercase tracking-wide">League Level *</Label>
                {errors.league_level && <p className="text-xs text-red-400 mt-1">⚠ {errors.league_level}</p>}
                <select value={formData.league_level} onChange={(e) => handleChange("league_level", e.target.value)} className="mt-2 w-full bg-black/20 border border-white/10 rounded-sm h-12 px-3 text-sm text-white outline-none cursor-pointer">
                  <option value="">Select league level</option>
                  {LEAGUES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium uppercase tracking-wide">Salary Range</Label>
                  <Input data-testid="salary-range-input" value={formData.salary_range} onChange={(e) => handleChange("salary_range", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g., $50k - $100k" />
                </div>
                <div>
                  <Label className="text-sm font-medium uppercase tracking-wide">Contract Duration</Label>
                  <Input data-testid="contract-duration-input" value={formData.contract_duration} onChange={(e) => handleChange("contract_duration", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g., 2 years" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium uppercase tracking-wide">Age Min</Label>
                  <Input type="number" value={formData.age_min} onChange={(e) => handleChange("age_min", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g., 18" />
                </div>
                <div>
                  <Label className="text-sm font-medium uppercase tracking-wide">Age Max</Label>
                  <Input type="number" value={formData.age_max} onChange={(e) => handleChange("age_max", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g., 28" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium uppercase tracking-wide">Deadline *</Label>
                {errors.deadline && <p className="text-xs text-red-400 mt-1">⚠ {errors.deadline}</p>}
                  <Input type="date" value={formData.deadline} onChange={(e) => handleChange("deadline", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" />
                </div>
                <div>
                  <Label className="text-sm font-medium uppercase tracking-wide">Max Applicants *</Label>
                {errors.max_applicants && <p className="text-xs text-red-400 mt-1">⚠ {errors.max_applicants}</p>}
                  <Input type="number" value={formData.max_applicants} onChange={(e) => handleChange("max_applicants", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm h-12" placeholder="e.g., 50" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium uppercase tracking-wide">Opportunity Visibility *</Label>
                <div className="space-y-2 mb-4">
                  {[
                    {id: "anonymous", label: "Anonymous Opportunity", desc: "Your organization identity is hidden from players"},
                    {id: "public", label: "Public Opportunity", desc: "Your organization name and info are visible to players"},
                  ].map(opt => (
                    <label key={opt.id} onClick={() => handleChange("visibility", opt.id)}
                      className={`flex items-start gap-3 p-3 rounded-sm border-2 cursor-pointer transition-colors ${
                        formData.visibility === opt.id ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/30"
                      }`}>
                      <input type="radio" checked={formData.visibility === opt.id} onChange={() => handleChange("visibility", opt.id)}
                        className="accent-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <Label className="text-sm font-medium uppercase tracking-wide">Mandatory Requirements</Label>
                <p className="text-xs text-muted-foreground mb-2">Players must have these to apply</p>
                <div className="space-y-2">
                  {[
                    {id: "highlight_video", label: "Highlight Video"},
                    {id: "full_match", label: "Full Match Video"},
                    {id: "profile_picture", label: "Profile Photo"},
                    {id: "cv", label: "CV / Resume"},
                  ].map(req => (
                    <label key={req.id} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox"
                        checked={formData.requirements?.includes(req.id) || false}
                        onChange={e => {
                          const curr = formData.requirements || [];
                          handleChange("requirements", e.target.checked ? [...curr, req.id] : curr.filter(r => r !== req.id));
                        }}
                        className="accent-primary w-4 h-4" />
                      <span className="text-sm">{req.label}</span>
                    </label>
                  ))}
                </div>
                <Label className="text-sm font-medium uppercase tracking-wide">Description *</Label>
                {errors.description && <p className="text-xs text-red-400 mt-1">⚠ {errors.description}</p>}
                <Textarea data-testid="description-input" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} className="mt-2 bg-black/20 border-white/10 focus:border-primary rounded-sm min-h-[120px]" placeholder="Describe the opportunity..." />
              </div>
              <Button data-testid="submit-opportunity-btn" onClick={handleCreate} className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12">
                POST OPPORTUNITY
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {opportunities.length === 0 ? (
        <div data-testid="no-opportunities" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No opportunities posted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div key={opp.id} data-testid={`opportunity-card-${opp.id}`} className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-heading font-bold uppercase">{opp.position}</h3>
                    <span className="bg-white/10 text-white border border-white/20 uppercase text-[10px] tracking-wider px-2 py-1">{opp.league_level}</span>
                    <span className={`px-2 py-1 text-[10px] uppercase tracking-wider border rounded-sm ${STATUS_COLORS[opp.status || "open"]}`}>
                      {opp.status || "open"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{opp.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {opp.salary_range && <div><span className="text-muted-foreground">Salary: </span><span className="font-medium font-mono">{opp.salary_range}</span></div>}
                    {opp.contract_duration && <div><span className="text-muted-foreground">Duration: </span><span className="font-medium">{opp.contract_duration}</span></div>}
                    {opp.deadline && <div><span className="text-muted-foreground">Deadline: </span><span className="font-medium">{new Date(opp.deadline).toLocaleDateString()}</span></div>}
                    {opp.age_min && opp.age_max && <div><span className="text-muted-foreground">Age: </span><span className="font-medium">{opp.age_min} - {opp.age_max}</span></div>}
                    {opp.max_applicants && <div><span className="text-muted-foreground">Max applicants: </span><span className="font-medium">{opp.max_applicants}</span></div>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(opp)} className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button data-testid={`delete-btn-${opp.id}`} variant="ghost" size="icon" onClick={() => setDeleteId(opp.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubOpportunities;


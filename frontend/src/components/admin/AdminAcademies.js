import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { GraduationCap, Check, X, Trash2, CheckCircle, Globe, MapPin } from "lucide-react";

const AdminAcademies = () => {
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { loadAcademies(); }, []);

  const loadAcademies = async () => {
    try {
      const res = await api.getAllAcademies();
      setAcademies(res.data);
    } catch { toast.error("Failed to load academies"); }
    finally { setLoading(false); }
  };

  const handleApprove = async (userId, approved) => {
    try {
      await api.approveAcademy(userId, approved);
      toast.success(approved ? "Academy approved!" : "Academy disapproved");
      loadAcademies();
    } catch { toast.error("Failed to update status"); }
  };

  const handleVerify = async (userId, verified) => {
    try {
      if (verified) await api.verifyAcademy(userId);
      else await api.unverifyAcademy(userId);
      toast.success(verified ? "Academy verified!" : "Verification removed");
      loadAcademies();
    } catch { toast.error("Failed to update verification"); }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    try {
      await api.deleteUser(deleteId);
      toast.success("Academy deleted");
      loadAcademies();
    } catch { toast.error("Failed to delete"); }
    finally { setDeleteId(null); }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="text-primary text-xl font-heading">LOADING...</div></div>;

  return (
    <div className="p-4 md:p-8">
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase">Delete Academy</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure? This will also delete all players registered under this academy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm uppercase text-xs tracking-wide">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-white hover:bg-destructive/90 rounded-sm uppercase text-xs tracking-wide">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">MANAGE ACADEMIES</h1>
        <p className="text-muted-foreground">Approve and verify soccer academies</p>
      </div>

      {academies.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No academies registered yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {academies.map(academy => (
            <div key={academy.user_id} className="bg-card border border-border/50 p-6 rounded-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-start space-x-4">
                  {academy.logo ? (
                    <img src={academy.logo} alt={academy.name} className="w-16 h-16 rounded-sm object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-bold uppercase text-lg">{academy.name}</h3>
                      {academy.verified && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-sm text-xs uppercase">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{academy.email}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {academy.country && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-sm">{academy.country}</span>}
                      {academy.city && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{academy.city}</span>}
                      {academy.website && (
                        <a href={academy.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Globe className="w-3 h-3" />Website
                        </a>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-sm ${academy.approved ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                        {academy.approved ? "APPROVED" : "PENDING"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {!academy.approved ? (
                    <Button onClick={() => handleApprove(academy.user_id, true)} className="bg-green-500 hover:bg-green-600 text-white rounded-sm">
                      <Check className="w-4 h-4 mr-1" /> APPROVE
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => handleApprove(academy.user_id, false)} className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-sm">
                      <X className="w-4 h-4 mr-1" /> REVOKE
                    </Button>
                  )}
                  {academy.approved && !academy.verified && (
                    <Button onClick={() => handleVerify(academy.user_id, true)} className="bg-blue-500 hover:bg-blue-600 text-white rounded-sm">
                      <CheckCircle className="w-4 h-4 mr-1" /> VERIFY
                    </Button>
                  )}
                  {academy.verified && (
                    <Button variant="outline" onClick={() => handleVerify(academy.user_id, false)} className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white rounded-sm">
                      <X className="w-4 h-4 mr-1" /> UNVERIFY
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setDeleteId(academy.user_id)} className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-sm">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Platform Access</p>
                <p className="text-xs text-muted-foreground">
                  Status: <span className="font-bold text-white">{academy.approved ? "Active" : "Pending Review"}</span>
                </p>
              </div>

              {academy.description && (
                <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">{academy.description}</p>
              )}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-border/30 pt-3">
                {academy.rep_first_name && <p className="text-muted-foreground">Rep: <span className="text-white">{academy.rep_first_name} {academy.rep_last_name}{academy.rep_role ? ` — ${academy.rep_role}` : ''}</span></p>}
                {academy.rep_email && <p className="text-muted-foreground">Rep Email: <span className="text-white">{academy.rep_email}</span></p>}
                {academy.rep_phone && <p className="text-muted-foreground">Rep Phone: <span className="text-white">{academy.rep_phone}</span></p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAcademies;

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Building, Check, X, Trash2, Globe, MapPin } from "lucide-react";

const AdminCollegeAgencies = () => {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { loadAgencies(); }, []);

  const loadAgencies = async () => {
    try {
      const r = await api.getAllCollegeAgencies();
      setAgencies(r.data);
    } catch { toast.error("Failed to load college agencies"); }
    finally { setLoading(false); }
  };

  const handleApprove = async (userId, approved) => {
    try {
      await api.approveCollegeAgency(userId, approved);
      toast.success(approved ? "College agency approved!" : "Approval revoked");
      loadAgencies();
    } catch { toast.error("Failed to update status"); }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    try { await api.deleteUser(deleteId); toast.success("Agency deleted"); loadAgencies(); }
    catch { toast.error("Failed to delete"); } finally { setDeleteId(null); }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="text-primary text-xl font-heading">LOADING...</div></div>;

  return (
    <div className="p-4 md:p-8">
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase">Delete College Agency</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm uppercase text-xs tracking-wide">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-white hover:bg-destructive/90 rounded-sm uppercase text-xs tracking-wide">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">COLLEGE AGENCIES</h1>
        <p className="text-muted-foreground">Approve and manage college recruitment agencies</p>
      </div>

      {agencies.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No college agencies registered yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agencies.map((agency) => (
            <div key={agency.user_id} className="bg-card border border-border/50 p-6 rounded-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-start space-x-4">
                  {agency.logo ? (
                    <img src={agency.logo} alt={agency.name} className="w-16 h-16 rounded-sm object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center">
                      <Building className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-heading font-bold uppercase text-lg mb-1">{agency.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{agency.email}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {agency.country && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-sm">{agency.country}</span>}
                      {agency.city && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{agency.city}</span>}
                      {agency.website && <a href={agency.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline"><Globe className="w-3 h-3" />Website</a>}
                      <span className={`text-xs px-2 py-0.5 rounded-sm ${agency.approved ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>{agency.approved ? "APPROVED" : "PENDING"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {!agency.approved ? (
                    <Button onClick={() => handleApprove(agency.user_id, true)} className="bg-green-500 hover:bg-green-600 text-white rounded-sm">
                      <Check className="w-4 h-4 mr-1" /> APPROVE
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => handleApprove(agency.user_id, false)} className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-sm">
                      <X className="w-4 h-4 mr-1" /> REVOKE
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setDeleteId(agency.user_id)} className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {(agency.rep_first_name || agency.rep_email) && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-border/30 pt-3">
                  {agency.rep_first_name && <p className="text-muted-foreground">Rep: <span className="text-white">{agency.rep_first_name} {agency.rep_last_name}</span></p>}
                  {agency.rep_email && <p className="text-muted-foreground">Rep Email: <span className="text-white">{agency.rep_email}</span></p>}
                  {agency.rep_phone && <p className="text-muted-foreground">Rep Phone: <span className="text-white">{agency.rep_phone}</span></p>}
                </div>
              )}
              {agency.description && <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">{agency.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCollegeAgencies;

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Flag, Check, X, Trash2, CheckCircle, Globe, MapPin, Calendar } from "lucide-react";

const AdminFederations = () => {
  const [federations, setFederations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadFederations();
  }, []);

  const loadFederations = async () => {
    try {
      const response = await api.getAllFederations();
      setFederations(response.data);
    } catch (error) {
      toast.error("Failed to load federations");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, approved) => {
    try {
      await api.approveFederation(userId, approved);
      toast.success(approved ? "Federation approved!" : "Federation disapproved");
      loadFederations();
    } catch (error) {
      toast.error("Failed to update federation status");
    }
  };

  const handleVerify = async (userId, verified) => {
    try {
      if (verified) {
        await api.verifyFederation(userId);
        toast.success("Federation verified!");
      } else {
        await api.unverifyFederation(userId);
        toast.success("Federation verification removed");
      }
      loadFederations();
    } catch (error) {
      toast.error("Failed to update verification status");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    try {
      await api.deleteUser(deleteId);
      toast.success("Federation deleted");
      loadFederations();
    } catch (error) {
      toast.error("Failed to delete federation");
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
    <div className="p-4 md:p-8">
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase">Delete Federation</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this federation? This action cannot be undone.
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

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">MANAGE FEDERATIONS</h1>
        <p className="text-muted-foreground">Approve and verify football federations</p>
      </div>

      {federations.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No federations registered yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {federations.map((federation) => (
            <div
              key={federation.user_id}
              data-testid={`federation-card-${federation.user_id}`}
              className="bg-card border border-border/50 p-6 rounded-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-start space-x-4">
                  {federation.logo ? (
                    <img src={federation.logo} alt={federation.name} className="w-16 h-16 rounded-sm object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center">
                      <Flag className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-bold uppercase text-lg">{federation.name}</h3>
                      {federation.verified && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-sm text-xs uppercase">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{federation.email}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {federation.country && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                          {federation.country}
                        </span>
                      )}
                      {federation.city && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />{federation.city}
                        </span>
                      )}
                      {federation.founded_year && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />Est. {federation.founded_year}
                        </span>
                      )}
                      {federation.website && (
                        <a href={federation.website} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Globe className="w-3 h-3" />Website
                        </a>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-sm ${federation.approved ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                        {federation.approved ? "APPROVED" : "PENDING"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {!federation.approved ? (
                    <Button
                      data-testid={`approve-federation-${federation.user_id}`}
                      onClick={() => handleApprove(federation.user_id, true)}
                      className="bg-green-500 hover:bg-green-600 text-white rounded-sm"
                    >
                      <Check className="w-4 h-4 mr-1" /> APPROVE
                    </Button>
                  ) : (
                    <Button
                      data-testid={`disapprove-federation-${federation.user_id}`}
                      variant="outline"
                      onClick={() => handleApprove(federation.user_id, false)}
                      className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-sm"
                    >
                      <X className="w-4 h-4 mr-1" /> REVOKE
                    </Button>
                  )}
                  {federation.approved && !federation.verified && (
                    <Button
                      onClick={() => handleVerify(federation.user_id, true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> VERIFY
                    </Button>
                  )}
                  {federation.verified && (
                    <Button
                      variant="outline"
                      onClick={() => handleVerify(federation.user_id, false)}
                      className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white rounded-sm"
                    >
                      <X className="w-4 h-4 mr-1" /> UNVERIFY
                    </Button>
                  )}
                  <Button
                    data-testid={`delete-federation-${federation.user_id}`}
                    variant="outline"
                    onClick={() => setDeleteId(federation.user_id)}
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {federation.description && (
                <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">
                  {federation.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFederations;

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GraduationCap, Check, X, Trash2 } from 'lucide-react';

const AdminColleges = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadColleges();
  }, []);

  const loadColleges = async () => {
    try {
      const response = await api.getAllColleges();
      setColleges(response.data);
    } catch (error) {
      toast.error('Failed to load colleges');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, currentStatus) => {
    try {
      await api.approveCollege(userId, { approved: !currentStatus });
      toast.success(currentStatus ? 'College unapproved' : 'College approved');
      loadColleges();
    } catch (error) {
      toast.error('Failed to update college');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await api.deleteUser(userId);
      toast.success('College deleted');
      loadColleges();
    } catch (error) {
      toast.error('Failed to delete college');
    }
  };

  if (loading) return <div className="p-8 text-center text-primary font-heading">LOADING...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase">Colleges & Universities</h1>
        <p className="text-muted-foreground mt-1">{colleges.length} registered institutions</p>
      </div>

      <div className="space-y-4">
        {colleges.map(college => (
          <div key={college.user_id} className="bg-card border border-border/50 p-6 rounded-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {college.logo ? (
                  <img src={college.logo} alt={college.name} className="w-12 h-12 rounded-sm object-cover border border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-sm bg-muted flex items-center justify-center border border-border">
                    <GraduationCap className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-heading font-bold uppercase">{college.name}</h3>
                  <p className="text-sm text-muted-foreground">{college.country} {college.city && `· ${college.city}`}</p>
                  <p className="text-xs text-muted-foreground">{college.email}</p>
                  {college.division && <p className="text-xs text-muted-foreground">Division: {college.division}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-sm border uppercase font-bold ${
                  college.approved
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                }`}>
                  {college.approved ? "Approved" : "Pending"}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApprove(college.user_id, college.approved)}
                  className={college.approved
                    ? "border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-sm"
                    : "border-green-500/50 text-green-400 hover:bg-green-500/10 rounded-sm"
                  }
                >
                  {college.approved ? <><X className="w-3 h-3 mr-1" /> Unapprove</> : <><Check className="w-3 h-3 mr-1" /> Approve</>}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(college.user_id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Subscription Access Control */}
            <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-sm">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Subscription Access</p>
              <p className="text-xs text-muted-foreground mb-2">
                Status: <span className="font-bold text-white">{college.college_sub_status || "pending_review"}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline"
                  onClick={async () => {
                    await api.adminUpdateCollegeSubscription(college.user_id, { college_sub_status: "approved_awaiting_payment" });
                    setColleges(colleges.map(c => c.user_id === college.user_id ? { ...c, college_sub_status: "approved_awaiting_payment" } : c));
                    toast.success("Payment allowed");
                  }}
                  className="border-blue-500 text-blue-500 hover:bg-blue-500/10 text-xs">
                  Allow Payment
                </Button>
                <Button size="sm" variant="outline"
                  onClick={async () => {
                    await api.adminUpdateCollegeSubscription(college.user_id, { college_sub_status: "active" });
                    setColleges(colleges.map(c => c.user_id === college.user_id ? { ...c, college_sub_status: "active" } : c));
                    toast.success("Subscription activated");
                  }}
                  className="border-green-500 text-green-500 hover:bg-green-500/10 text-xs">
                  Manually Activate
                </Button>
                <Button size="sm" variant="outline"
                  onClick={async () => {
                    await api.adminUpdateCollegeSubscription(college.user_id, { college_sub_status: "cancelled" });
                    setColleges(colleges.map(c => c.user_id === college.user_id ? { ...c, college_sub_status: "cancelled" } : c));
                    toast.success("Access suspended");
                  }}
                  className="border-red-500 text-red-500 hover:bg-red-500/10 text-xs">
                  Suspend Access
                </Button>
              </div>
            </div>
          </div>
        ))}

        {colleges.length === 0 && (
          <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No college accounts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminColleges;
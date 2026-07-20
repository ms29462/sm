import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Activity, CheckCircle, XCircle, Shield, User, MapPin, Award } from 'lucide-react';

const AdminSpecialists = () => {
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpecialists();
  }, []);

  const loadSpecialists = async () => {
    try {
      const response = await api.getAllSpecialists();
      setSpecialists(response.data || []);
    } catch (error) {
      toast.error('Failed to load specialists');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await api.deleteUser(userId);
      setSpecialists(prev => prev.filter(s => s.user_id !== userId));
      toast.success("Specialist deleted");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleApprove = async (userId, approved) => {
    try {
      await api.approveSpecialist(userId, approved);
      setSpecialists(specialists.map(s => s.user_id === userId ? { ...s, approved } : s));
      toast.success(approved ? 'Specialist approved' : 'Specialist unapproved');
    } catch (error) {
      toast.error('Failed to update specialist');
    }
  };

  const handleVerify = async (userId, verified) => {
    try {
      await api.verifySpecialist(userId, verified);
      setSpecialists(specialists.map(s => s.user_id === userId ? { ...s, verified } : s));
      toast.success(verified ? 'Specialist verified' : 'Verification removed');
    } catch (error) {
      toast.error('Failed to update specialist');
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
    <div className="p-4 md:p-8" data-testid="admin-specialists">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-8 h-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase">MANAGE SPECIALISTS</h1>
        </div>
        <p className="text-muted-foreground">Approve and verify specialists (physiotherapists, nutritionists, trainers, etc.)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border/50 p-4 rounded-sm">
          <p className="text-2xl font-heading font-bold">{specialists.length}</p>
          <p className="text-sm text-muted-foreground">Total Specialists</p>
        </div>
        <div className="bg-card border border-border/50 p-4 rounded-sm">
          <p className="text-2xl font-heading font-bold text-green-500">{specialists.filter(s => s.approved).length}</p>
          <p className="text-sm text-muted-foreground">Approved</p>
        </div>
        <div className="bg-card border border-border/50 p-4 rounded-sm">
          <p className="text-2xl font-heading font-bold text-yellow-500">{specialists.filter(s => !s.approved).length}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="bg-card border border-border/50 p-4 rounded-sm">
          <p className="text-2xl font-heading font-bold text-blue-500">{specialists.filter(s => s.verified).length}</p>
          <p className="text-sm text-muted-foreground">Verified</p>
        </div>
      </div>

      {specialists.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-sm text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No specialists registered yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {specialists.map(specialist => (
            <div
              key={specialist.user_id}
              className="bg-card border border-border/50 p-6 rounded-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-start gap-4">
                  {specialist.profile_picture ? (
                    <img src={specialist.profile_picture} alt={specialist.name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-bold uppercase text-lg">{specialist.name}</h3>
                      {specialist.verified && (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-xs rounded-sm flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    {specialist.specialist_type && (
                      <p className="text-primary">{specialist.specialist_type}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{specialist.email}</p>
                    {(specialist.country || specialist.city) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> 
                        {[specialist.city, specialist.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {specialist.current_club && (
                      <p className="text-sm text-muted-foreground">Working with: {specialist.current_club}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {(Array.isArray(specialist.certifications) ? specialist.certifications : (specialist.certifications ? specialist.certifications.split(', ') : [])).map(cert => (
                        <span key={cert} className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-sm flex items-center gap-1">
                          <Award className="w-3 h-3" /> {cert}
                        </span>
                      ))}
                    </div>
                    {specialist.services_offered?.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {specialist.services_offered.map(service => (
                          <span key={service} className="px-2 py-1 bg-white/5 text-xs rounded-sm">{service}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {specialist.approved ? (
                    <Button
                      onClick={() => handleApprove(specialist.user_id, false)}
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500/10"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Unapprove
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleApprove(specialist.user_id, true)}
                      className="bg-green-500 text-white hover:bg-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  )}
                  {specialist.approved && (
                    specialist.verified ? (
                      <Button
                        onClick={() => handleVerify(specialist.user_id, false)}
                        variant="outline"
                        className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Unverify
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleVerify(specialist.user_id, true)}
                        variant="outline"
                        className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                    )
                  )}
                </div>
              </div>
              <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-sm">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Subscription Access</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Status: <span className="font-bold text-white">{specialist.specialist_sub_status || "pending_review"}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline"
                    onClick={async () => {
                      await api.adminUpdateSpecialistSubscription(specialist.user_id, { specialist_sub_status: "approved_awaiting_payment" });
                      setSpecialists(specialists.map(s => s.user_id === specialist.user_id ? { ...s, specialist_sub_status: "approved_awaiting_payment" } : s));
                      toast.success("Payment allowed");
                    }}
                    className="border-blue-500 text-blue-500 hover:bg-blue-500/10 text-xs">
                    Allow Payment
                  </Button>
                  <Button size="sm" variant="outline"
                    onClick={async () => {
                      await api.adminUpdateSpecialistSubscription(specialist.user_id, { specialist_sub_status: "active" });
                      setSpecialists(specialists.map(s => s.user_id === specialist.user_id ? { ...s, specialist_sub_status: "active" } : s));
                      toast.success("Subscription activated");
                    }}
                    className="border-green-500 text-green-500 hover:bg-green-500/10 text-xs">
                    Manually Activate
                  </Button>
                  <Button size="sm" variant="outline"
                    onClick={async () => {
                      await api.adminUpdateSpecialistSubscription(specialist.user_id, { specialist_sub_status: "cancelled" });
                      setSpecialists(specialists.map(s => s.user_id === specialist.user_id ? { ...s, specialist_sub_status: "cancelled" } : s));
                      toast.success("Access suspended");
                    }}
                    className="border-red-500 text-red-500 hover:bg-red-500/10 text-xs">
                    Suspend Access
                  </Button>
                  <Button size="sm" variant="outline"
                    onClick={() => handleDelete(specialist.user_id, specialist.name)}
                    className="border-red-500 text-red-500 hover:bg-red-500/10 text-xs">
                    Delete
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

export default AdminSpecialists;

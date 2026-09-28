import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  GraduationCap, Check, X, Trash2, ChevronDown, ChevronUp,
  Globe, Instagram, Linkedin, Facebook, MapPin, User, Mail, Phone, Calendar
} from 'lucide-react';

const Field = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-0.5">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
};

const AdminColleges = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => { loadColleges(); }, []);

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
    if (!window.confirm('Delete this college account? This cannot be undone.')) return;
    try {
      await api.deleteUser(userId);
      toast.success('College deleted');
      loadColleges();
    } catch (error) {
      toast.error('Failed to delete college');
    }
  };

  const toggleExpanded = (userId) =>
    setExpanded(prev => ({ ...prev, [userId]: !prev[userId] }));

  if (loading) return <div className="p-8 text-center text-primary font-heading">LOADING...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase">Colleges & Universities</h1>
        <p className="text-muted-foreground mt-1">{colleges.length} registered institutions</p>
      </div>

      <div className="space-y-4">
        {colleges.map(college => (
          <div key={college.user_id} className="bg-card border border-border/50 rounded-sm hover:border-primary/50 transition-colors">

            {/* Header row */}
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-start gap-4 flex-1">
                  {college.logo ? (
                    <img src={college.logo} alt={college.name} className="w-16 h-16 rounded-sm object-cover border-2 border-primary shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center border-2 border-border shrink-0">
                      <GraduationCap className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-heading font-bold uppercase">{college.name}</h3>
                      <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-sm font-bold ${
                        college.approved
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}>
                        {college.approved ? 'Approved' : 'Pending'}
                      </span>
                      {college.verified && (
                        <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-sm font-bold bg-blue-500/10 text-blue-400 border-blue-500/20">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{college.email}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {college.country && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {[college.city, college.state, college.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {college.division && (
                        <span className="text-muted-foreground">{college.division}</span>
                      )}
                      {college.conference && (
                        <span className="text-muted-foreground">{college.conference}</span>
                      )}
                      {college.created_at && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(college.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleExpanded(college.user_id)}
                    className="border-border rounded-sm text-xs gap-1"
                  >
                    {expanded[college.user_id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {expanded[college.user_id] ? 'Less' : 'Details'}
                  </Button>
                  <Button
                    size="icon"
                    onClick={() => handleApprove(college.user_id, college.approved)}
                    className={college.approved ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-primary hover:bg-primary/90'}
                  >
                    {college.approved ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(college.user_id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Expanded detail panel */}
            {expanded[college.user_id] && (
              <div className="border-t border-border/50 px-6 pb-6 pt-5 space-y-6">

                {/* Program info */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Program Information</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Field label="Division" value={college.division} />
                    <Field label="Conference" value={college.conference} />
                    <Field label="State / Province" value={college.state} />
                    <Field label="Country" value={college.country} />
                  </div>
                  {college.description && (
                    <div className="mt-4">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Description</span>
                      <p className="text-sm text-muted-foreground leading-relaxed">{college.description}</p>
                    </div>
                  )}
                </div>

                {/* Links */}
                {(college.website || college.instagram || college.facebook || college.linkedin) && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Links</p>
                    <div className="flex flex-wrap gap-3">
                      {college.website && (
                        <a href={college.website} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                          <Globe className="w-4 h-4" /> Website
                        </a>
                      )}
                      {college.instagram && (
                        <a href={college.instagram} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-pink-400 hover:text-pink-300 transition-colors">
                          <Instagram className="w-4 h-4" /> Instagram
                        </a>
                      )}
                      {college.facebook && (
                        <a href={college.facebook} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-400 transition-colors">
                          <Facebook className="w-4 h-4" /> Facebook
                        </a>
                      )}
                      {college.linkedin && (
                        <a href={college.linkedin} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300 transition-colors">
                          <Linkedin className="w-4 h-4" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Representative */}
                {(college.rep_first_name || college.rep_last_name || college.rep_email || college.rep_phone) && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Representative</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Field label="Name"
                        value={[college.rep_first_name, college.rep_last_name].filter(Boolean).join(' ')} />
                      <Field label="Role / Title" value={college.rep_role} />
                      <div>
                        {college.rep_email && (
                          <>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-0.5">Email</span>
                            <a href={`mailto:${college.rep_email}`} className="text-sm text-primary hover:underline">
                              {college.rep_email}
                            </a>
                          </>
                        )}
                      </div>
                      <Field label="Phone" value={college.rep_phone} />
                    </div>
                  </div>
                )}

                {/* Subscription control */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Subscription Access</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Status: <span className="font-bold text-white">{college.college_sub_status || 'pending_review'}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline"
                      onClick={async () => {
                        await api.adminUpdateCollegeSubscription(college.user_id, { college_sub_status: 'approved_awaiting_payment' });
                        setColleges(colleges.map(c => c.user_id === college.user_id ? { ...c, college_sub_status: 'approved_awaiting_payment' } : c));
                        toast.success('Payment allowed');
                      }}
                      className="border-blue-500 text-blue-500 hover:bg-blue-500/10 text-xs">
                      Allow Payment
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={async () => {
                        await api.adminUpdateCollegeSubscription(college.user_id, { college_sub_status: 'active' });
                        setColleges(colleges.map(c => c.user_id === college.user_id ? { ...c, college_sub_status: 'active' } : c));
                        toast.success('Subscription activated');
                      }}
                      className="border-green-500 text-green-500 hover:bg-green-500/10 text-xs">
                      Manually Activate
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={async () => {
                        await api.adminUpdateCollegeSubscription(college.user_id, { college_sub_status: 'cancelled' });
                        setColleges(colleges.map(c => c.user_id === college.user_id ? { ...c, college_sub_status: 'cancelled' } : c));
                        toast.success('Access suspended');
                      }}
                      className="border-red-500 text-red-500 hover:bg-red-500/10 text-xs">
                      Suspend Access
                    </Button>
                  </div>
                </div>

              </div>
            )}
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

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Briefcase, CheckCircle, XCircle, Shield, User, MapPin, Award } from 'lucide-react';

const AdminAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await api.getAllAgents();
      setAgents(response.data || []);
    } catch (error) {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, approved) => {
    try {
      await api.approveAgent(userId, approved);
      setAgents(agents.map(a => a.user_id === userId ? { ...a, approved } : a));
      toast.success(approved ? 'Agent approved' : 'Agent unapproved');
    } catch (error) {
      toast.error('Failed to update agent');
    }
  };

  const handleVerify = async (userId, verified) => {
    try {
      await api.verifyAgent(userId, verified);
      setAgents(agents.map(a => a.user_id === userId ? { ...a, verified } : a));
      toast.success(verified ? 'Agent verified' : 'Verification removed');
    } catch (error) {
      toast.error('Failed to update agent');
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
    <div className="p-4 md:p-8" data-testid="admin-agents">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Briefcase className="w-8 h-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase">MANAGE AGENTS</h1>
        </div>
        <p className="text-muted-foreground">Approve and verify football agents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border/50 p-4 rounded-sm">
          <p className="text-2xl font-heading font-bold">{agents.length}</p>
          <p className="text-sm text-muted-foreground">Total Agents</p>
        </div>
        <div className="bg-card border border-border/50 p-4 rounded-sm">
          <p className="text-2xl font-heading font-bold text-green-500">{agents.filter(a => a.approved).length}</p>
          <p className="text-sm text-muted-foreground">Approved</p>
        </div>
        <div className="bg-card border border-border/50 p-4 rounded-sm">
          <p className="text-2xl font-heading font-bold text-yellow-500">{agents.filter(a => !a.approved).length}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="bg-card border border-border/50 p-4 rounded-sm">
          <p className="text-2xl font-heading font-bold text-blue-500">{agents.filter(a => a.verified).length}</p>
          <p className="text-sm text-muted-foreground">Verified</p>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-sm text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No agents registered yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agents.map(agent => (
            <div
              key={agent.user_id}
              className="bg-card border border-border/50 p-6 rounded-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-start gap-4">
                  {agent.profile_picture ? (
                    <img src={agent.profile_picture} alt={agent.name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-bold uppercase text-lg">{agent.name}</h3>
                      {agent.verified && (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-xs rounded-sm flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {agent.fifa_registered && (
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs rounded-sm flex items-center gap-1">
                          <Award className="w-3 h-3" /> FIFA
                        </span>
                      )}
                    </div>
                    {agent.agency_name && <p className="text-primary">{agent.agency_name}</p>}
                    <p className="text-sm text-muted-foreground">{agent.email}</p>
                    {agent.country && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {agent.country}
                      </p>
                    )}
                    {agent.license_number && (
                      <p className="text-sm text-muted-foreground">License: {agent.license_number}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {agent.specializations?.map(spec => (
                        <span key={spec} className="px-2 py-1 bg-white/5 text-xs rounded-sm">{spec}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {agent.approved ? (
                    <Button
                      onClick={() => handleApprove(agent.user_id, false)}
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500/10"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Unapprove
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleApprove(agent.user_id, true)}
                      className="bg-green-500 text-white hover:bg-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  )}
                  {agent.approved && (
                    agent.verified ? (
                      <Button
                        onClick={() => handleVerify(agent.user_id, false)}
                        variant="outline"
                        className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Unverify
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleVerify(agent.user_id, true)}
                        variant="outline"
                        className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                    )
                  )}
                </div>

                {/* Subscription Access Control */}
                <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-sm">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Subscription Access</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Status: <span className="font-bold text-white">{agent.agent_sub_status || "pending_review"}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline"
                      onClick={async () => {
                        await api.adminUpdateAgentSubscription(agent.user_id, { agent_sub_status: "approved_awaiting_payment" });
                        setAgents(agents.map(a => a.user_id === agent.user_id ? { ...a, agent_sub_status: "approved_awaiting_payment" } : a));
                        toast.success("Payment allowed");
                      }}
                      className="border-blue-500 text-blue-500 hover:bg-blue-500/10 text-xs">
                      Allow Payment
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={async () => {
                        await api.adminUpdateAgentSubscription(agent.user_id, { agent_sub_status: "active" });
                        setAgents(agents.map(a => a.user_id === agent.user_id ? { ...a, agent_sub_status: "active" } : a));
                        toast.success("Subscription activated");
                      }}
                      className="border-green-500 text-green-500 hover:bg-green-500/10 text-xs">
                      Manually Activate
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={async () => {
                        await api.adminUpdateAgentSubscription(agent.user_id, { agent_sub_status: "cancelled" });
                        setAgents(agents.map(a => a.user_id === agent.user_id ? { ...a, agent_sub_status: "cancelled" } : a));
                        toast.success("Access suspended");
                      }}
                      className="border-red-500 text-red-500 hover:bg-red-500/10 text-xs">
                      Suspend Access
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAgents;

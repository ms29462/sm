import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Flag, Check, X, Trash2 } from 'lucide-react';

const AdminFederations = () => {
  const [federations, setFederations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFederations();
  }, []);

  const loadFederations = async () => {
    try {
      const response = await api.getAllFederations();
      setFederations(response.data);
    } catch (error) {
      toast.error('Failed to load federations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, approved) => {
    try {
      await api.approveFederation(userId, approved);
      toast.success(approved ? 'Federation approved!' : 'Federation disapproved');
      loadFederations();
    } catch (error) {
      toast.error('Failed to update federation status');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this federation?')) return;

    try {
      await api.deleteUser(userId);
      toast.success('Federation deleted');
      loadFederations();
    } catch (error) {
      toast.error('Failed to delete federation');
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
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">MANAGE FEDERATIONS</h1>
        <p className="text-muted-foreground">Approve and manage football federations</p>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {federation.logo ? (
                    <img
                      src={federation.logo}
                      alt={federation.name}
                      className="w-16 h-16 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center">
                      <Flag className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-heading font-bold uppercase text-lg">{federation.name}</h3>
                    <p className="text-sm text-muted-foreground">{federation.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {federation.country && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                          {federation.country}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-sm ${
                          federation.approved
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-yellow-500/10 text-yellow-500'
                        }`}
                      >
                        {federation.approved ? 'APPROVED' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!federation.approved ? (
                    <Button
                      data-testid={`approve-federation-${federation.user_id}`}
                      onClick={() => handleApprove(federation.user_id, true)}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      APPROVE
                    </Button>
                  ) : (
                    <Button
                      data-testid={`disapprove-federation-${federation.user_id}`}
                      variant="outline"
                      onClick={() => handleApprove(federation.user_id, false)}
                      className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                    >
                      <X className="w-4 h-4 mr-1" />
                      REVOKE
                    </Button>
                  )}
                  <Button
                    data-testid={`delete-federation-${federation.user_id}`}
                    variant="outline"
                    onClick={() => handleDelete(federation.user_id)}
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
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

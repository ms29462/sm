import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Building, Check, X, Trash2 } from 'lucide-react';

const AdminClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      const response = await api.getAllClubs();
      setClubs(response.data);
    } catch (error) {
      toast.error('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, currentStatus) => {
    try {
      await api.approveClub(userId, !currentStatus);
      toast.success(currentStatus ? 'Club unapproved' : 'Club approved');
      loadClubs();
    } catch (error) {
      toast.error('Failed to update approval status');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this club?')) return;

    try {
      await api.deleteUser(userId);
      toast.success('Club deleted');
      loadClubs();
    } catch (error) {
      toast.error('Failed to delete club');
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
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">CLUB MANAGEMENT</h1>
        <p className="text-muted-foreground">Approve and manage club accounts</p>
      </div>

      {clubs.length === 0 ? (
        <div data-testid="no-clubs" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No clubs registered yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clubs.map((club) => (
            <div
              key={club.user_id}
              data-testid={`club-card-${club.user_id}`}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {club.logo ? (
                    <img
                      src={club.logo}
                      alt={club.name}
                      className="w-16 h-16 rounded-sm object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center border-2 border-border">
                      <Building className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-heading font-bold uppercase">{club.name}</h3>
                      <span
                        data-testid={`status-${club.user_id}`}
                        className={`px-2 py-1 text-[10px] uppercase tracking-wider border rounded-sm ${
                          club.approved
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}
                      >
                        {club.approved ? 'APPROVED' : 'PENDING'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{club.email}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {club.country && (
                        <div>
                          <span className="text-muted-foreground block mb-1">Country</span>
                          <span className="font-medium">{club.country}</span>
                        </div>
                      )}
                      {club.league && (
                        <div>
                          <span className="text-muted-foreground block mb-1">League</span>
                          <span className="font-medium">{club.league}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground block mb-1">Registered</span>
                        <span className="font-medium">{new Date(club.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    data-testid={`approve-btn-${club.user_id}`}
                    size="icon"
                    onClick={() => handleApprove(club.user_id, club.approved)}
                    className={club.approved ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-primary hover:bg-primary/90'}
                  >
                    {club.approved ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button
                    data-testid={`delete-btn-${club.user_id}`}
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(club.user_id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
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

export default AdminClubs;


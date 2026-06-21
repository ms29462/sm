import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Users, Check, X, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-dialog';

const AdminPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const response = await api.getAllPlayers();
      setPlayers(response.data);
    } catch (error) {
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, currentStatus) => {
    try {
      await api.approvePlayer(userId, !currentStatus);
      toast.success(currentStatus ? 'Player unapproved' : 'Player approved');
      loadPlayers();
    } catch (error) {
      toast.error('Failed to update approval status');
    }
  };

  const handleVerify = async (userId, currentStatus) => {
    try {
      await api.verifyPlayer(userId, !currentStatus);
      toast.success(currentStatus ? 'Player unverified' : 'Player verified');
      loadPlayers();
    } catch (error) {
      toast.error('Failed to update verification status');
    }
  };

  const handleTogglePremium = async (userId, currentPremium) => {
    try {
      if (currentPremium) {
        await api.cancelSubscription({ user_id: userId });
        toast.success('Premium removed');
      } else {
        await api.assignSubscription({ user_id: userId, plan_id: 'player_premium', billing: 'yearly' });
        toast.success('Premium activated');
      }
      loadPlayers();
    } catch (error) {
      toast.error('Failed to update premium status');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;

    try {
      await api.deleteUser(userId);
      toast.success('Player deleted');
      loadPlayers();
    } catch (error) {
      toast.error('Failed to delete player');
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
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">PLAYER MANAGEMENT</h1>
        <p className="text-muted-foreground">Approve and manage player accounts</p>
      </div>

      {players.length === 0 ? (
        <div data-testid="no-players" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No players registered yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {players.map((player) => (
            <div
              key={player.user_id}
              data-testid={`player-card-${player.user_id}`}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-start space-x-4 flex-1">
                  {player.profile_picture ? (
                    <img
                      src={player.profile_picture}
                      alt={player.name}
                      className="w-16 h-16 rounded-sm object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-sm bg-muted flex items-center justify-center border-2 border-border">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-heading font-bold uppercase">{player.name}</h3>
                      <span
                        data-testid={`status-${player.user_id}`}
                        className={`px-2 py-1 text-[10px] uppercase tracking-wider border rounded-sm ${
                          player.approved
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}
                      >
                        {player.approved ? 'APPROVED' : 'PENDING'}
                      </span>
                      {player.verified && (
                        <span
                          data-testid={`verified-badge-${player.user_id}`}
                          className="inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-wider border rounded-sm bg-blue-500/10 text-blue-500 border-blue-500/20"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          VERIFIED
                        </span>
                      )}
                      {player.is_premium && (
                        <span className="inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-wider border rounded-sm bg-primary/10 text-primary border-primary/20">
                          ⭐ PREMIUM
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{player.email}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {player.position && (
                        <div>
                          <span className="text-muted-foreground block mb-1">Position</span>
                          <span className="font-medium">{player.position}</span>
                        </div>
                      )}
                      {player.age && (
                        <div>
                          <span className="text-muted-foreground block mb-1">Age</span>
                          <span className="font-medium">{player.age} years</span>
                        </div>
                      )}
                      {player.nationality && (
                        <div>
                          <span className="text-muted-foreground block mb-1">Nationality</span>
                          <span className="font-medium">{player.nationality}</span>
                        </div>
                      )}
                      {player.playing_level && (
                        <div>
                          <span className="text-muted-foreground block mb-1">Level</span>
                          <span className="font-medium">{player.playing_level}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    data-testid={`approve-btn-${player.user_id}`}
                    size="icon"
                    onClick={() => handleApprove(player.user_id, player.approved)}
                    className={player.approved ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-primary hover:bg-primary/90'}
                    title={player.approved ? 'Unapprove' : 'Approve'}
                  >
                    {player.approved ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button
                    data-testid={`verify-btn-${player.user_id}`}
                    size="icon"
                    onClick={() => handleVerify(player.user_id, player.verified)}
                    className={player.verified ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-500 hover:bg-blue-600'}
                    title={player.verified ? 'Unverify' : 'Verify'}
                  >
                    {player.verified ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTogglePremium(player.user_id, player.is_premium)}
                    className={player.is_premium
                      ? "border-red-500 text-red-400 hover:bg-red-500/10 text-xs"
                      : "border-primary text-primary hover:bg-primary/10 text-xs"
                    }
                  >
                    {player.is_premium ? "Remove Premium" : "Grant Premium"}
                  </Button>
                  <Button
                    data-testid={`delete-btn-${player.user_id}`}
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(player.user_id)}
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

export default AdminPlayers;


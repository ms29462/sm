import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Video, Trash2, Eye, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminVideoManagement = () => {
  const navigate = useNavigate();
  const [videoSessions, setVideoSessions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [videoRes, playersRes, clubsRes] = await Promise.all([
        api.getAdminVideoSessions(),
        api.getAllPlayers(),
        api.getAllClubs()
      ]);
      setVideoSessions(videoRes.data);
      setPlayers(playersRes.data.filter(p => p.approved));
      setClubs(clubsRes.data.filter(c => c.approved));
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVideoSession = async () => {
    if (!selectedPlayer || !selectedClub) {
      toast.error('Please select both player and club');
      return;
    }

    setCreating(true);
    try {
      const response = await api.createVideoSession(selectedPlayer, selectedClub);
      toast.success('Video session created!');
      setShowCreateDialog(false);
      setSelectedPlayer('');
      setSelectedClub('');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create video session');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteVideoSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this video session?')) return;

    try {
      await api.deleteVideoSession(sessionId);
      toast.success('Video session deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete video session');
    }
  };

  const handleJoinAsObserver = (sessionId) => {
    navigate(`/video/${sessionId}`);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">VIDEO MANAGEMENT</h1>
          <p className="text-muted-foreground">Create and monitor video sessions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              data-testid="create-video-btn"
              className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12 px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              CREATE VIDEO SESSION
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading font-bold uppercase">CREATE VIDEO SESSION</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="player" className="text-sm font-medium uppercase tracking-wide">
                  Select Player
                </Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger
                    id="player"
                    data-testid="player-select"
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                  >
                    <SelectValue placeholder="Choose player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player) => (
                      <SelectItem key={player.user_id} value={player.user_id}>
                        {player.name} ({player.position || 'N/A'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="club" className="text-sm font-medium uppercase tracking-wide">
                  Select Club
                </Label>
                <Select value={selectedClub} onValueChange={setSelectedClub}>
                  <SelectTrigger
                    id="club"
                    data-testid="club-select"
                    className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
                  >
                    <SelectValue placeholder="Choose club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map((club) => (
                      <SelectItem key={club.user_id} value={club.user_id}>
                        {club.name} ({club.country || 'N/A'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                data-testid="submit-video-btn"
                onClick={handleCreateVideoSession}
                disabled={creating}
                className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12"
              >
                {creating ? 'CREATING...' : 'CREATE VIDEO SESSION'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {videoSessions.length === 0 ? (
        <div data-testid="no-video-sessions" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No video sessions created yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {videoSessions.map((session) => (
            <div
              key={session.id}
              data-testid={`video-session-${session.id}`}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-xl font-heading font-bold uppercase mb-2">
                    {session.player_name} â†” {session.club_name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {session.participant_count} participant(s)
                    </span>
                    <span>Created: {new Date(session.created_at).toLocaleDateString()}</span>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 text-xs uppercase tracking-wider rounded-sm ${
                      session.is_active
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}
                  >
                    {session.is_active ? 'ACTIVE' : 'ENDED'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {session.is_active && (
                    <Button
                      data-testid={`join-btn-${session.id}`}
                      size="icon"
                      onClick={() => handleJoinAsObserver(session.id)}
                      className="bg-primary text-black hover:bg-primary/90"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    data-testid={`delete-btn-${session.id}`}
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteVideoSession(session.id)}
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

export default AdminVideoManagement;



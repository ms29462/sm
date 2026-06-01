import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MessageCircle, Trash2, Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminChatManagement = () => {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState([]);
  const [players, setPlayers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedClub, setSelectedClub] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteRoomId, setDeleteRoomId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [chatRes, playersRes, clubsRes] = await Promise.all([
        api.getAdminChatRooms(),
        api.getAllPlayers(),
        api.getAllClubs()
      ]);
      setChatRooms(chatRes.data);
      setPlayers(playersRes.data.filter(p => p.approved));
      setClubs(clubsRes.data.filter(c => c.approved));
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChatRoom = async () => {
    if (!selectedPlayer || !selectedClub) {
      toast.error("Please select both player and club");
      return;
    }
    setCreating(true);
    try {
      await api.createChatRoom(selectedPlayer, selectedClub);
      toast.success("Chat room created!");
      setShowCreateDialog(false);
      setSelectedPlayer("");
      setSelectedClub("");
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create chat room");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteRoomId) return;
    try {
      await api.deleteChatRoom(deleteRoomId);
      toast.success("Chat room deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete chat room");
    } finally {
      setDeleteRoomId(null);
    }
  };

  const handleViewMessages = (roomId) => {
    navigate(`/admin/chat/${roomId}`);
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRoomId} onOpenChange={(open) => !open && setDeleteRoomId(null)}>
        <AlertDialogContent className="bg-card border border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase">Delete Chat Room</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this chat room? All messages will be permanently lost and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm uppercase text-xs tracking-wide">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-sm uppercase text-xs tracking-wide"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase mb-2">CHAT MANAGEMENT</h1>
          <p className="text-muted-foreground">Create and monitor chat rooms</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              data-testid="create-chat-btn"
              className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12 px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              CREATE CHAT ROOM
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading font-bold uppercase">CREATE CHAT ROOM</DialogTitle>
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
                        {player.name} ({player.position || "N/A"})
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
                        {club.name} ({club.country || "N/A"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                data-testid="submit-chat-btn"
                onClick={handleCreateChatRoom}
                disabled={creating}
                className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12"
              >
                {creating ? "CREATING..." : "CREATE CHAT ROOM"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {chatRooms.length === 0 ? (
        <div data-testid="no-chat-rooms" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No chat rooms created yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chatRooms.map((room) => (
            <div
              key={room.id}
              data-testid={`chat-room-${room.id}`}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-xl font-heading font-bold uppercase mb-2">
                    {room.player_name} - {room.club_name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Created: {new Date(room.created_at).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded-sm text-xs uppercase ${room.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      {room.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    data-testid={`view-btn-${room.id}`}
                    size="icon"
                    onClick={() => handleViewMessages(room.id)}
                    className="bg-primary text-black hover:bg-primary/90"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    data-testid={`delete-btn-${room.id}`}
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteRoomId(room.id)}
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

export default AdminChatManagement;

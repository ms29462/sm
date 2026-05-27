import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CalendarCheck, MapPin, Clock, CheckCircle, XCircle, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const STATUS_STYLES = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  accepted: "bg-green-500/10 text-green-400 border-green-500/20",
  declined: "bg-red-500/10 text-red-400 border-red-500/20",
};

const TrialInvitations = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [playerDetails, setPlayerDetails] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const res = await api.getMyTrialInvitations();
      const invites = res.data || [];
      setInvitations(invites);
      // Load player details for org view
      if (user?.role !== "player") {
        const playerIds = [...new Set(invites.map(i => i.player_id))];
        const details = {};
        for (const pid of playerIds) {
          try {
            const p = await api.getPlayerDetail(pid);
            details[pid] = p.data;
          } catch (e) {}
        }
        setPlayerDetails(details);
      }
    } catch (e) {
      toast.error("Failed to load invitations");
    }
    setLoading(false);
  };

  const handleRespond = async (id, status) => {
    try {
      await api.respondToTrial(id, { status });
      setInvitations(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      toast.success(status === "accepted" ? "Trial accepted!" : "Trial declined");
    } catch (e) {
      toast.error("Failed to respond");
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-primary font-heading">LOADING...</div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold uppercase">Trial Invitations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user?.role === "player" ? "Manage your trial invitations from organizations" : "Track trial invitations you have sent"}
        </p>
      </div>

      {invitations.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <CalendarCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No trial invitations yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map(invite => (
            <div key={invite.id} className="bg-card border border-border/50 p-6 rounded-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-primary" />
                    <h3 className="font-heading font-bold uppercase">
                      {user?.role === "player" ? invite.org_name : (playerDetails[invite.player_id]?.name || "Player")}
                    </h3>
                    {user?.role !== "player" && playerDetails[invite.player_id] && (
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{playerDetails[invite.player_id]?.position}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarCheck className="w-3 h-3" />
                      <span>{new Date(invite.trial_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{invite.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(invite.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase border ${STATUS_STYLES[invite.status] || STATUS_STYLES.pending}`}>
                  {invite.status}
                </span>
              </div>

              {invite.message && (
                <p className="text-sm text-muted-foreground bg-background/50 rounded-sm p-3 mb-4 border border-border/30">
                  "{invite.message}"
                </p>
              )}

              {/* Org view - player summary */}
              {user?.role !== "player" && playerDetails[invite.player_id] && (
                <div className="mb-4">
                  <button onClick={() => setSelectedPlayer(selectedPlayer?.user_id === invite.player_id ? null : playerDetails[invite.player_id])}
                    className="text-xs border border-white/10 hover:border-primary text-muted-foreground hover:text-primary rounded-sm px-3 py-1.5 transition-colors">
                    {selectedPlayer?.user_id === invite.player_id ? "Hide Profile" : "View Player Profile"}
                  </button>
                  {selectedPlayer?.user_id === invite.player_id && (
                    <div className="mt-3 bg-background border border-border/50 rounded-sm p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {selectedPlayer.profile_picture ? (
                          <img src={selectedPlayer.profile_picture} alt={selectedPlayer.name} className="w-12 h-12 rounded-sm object-cover border border-primary" />
                        ) : (
                          <div className="w-12 h-12 rounded-sm bg-muted flex items-center justify-center border border-border">
                            <span className="text-muted-foreground text-xs">No photo</span>
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{selectedPlayer.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedPlayer.position} · {selectedPlayer.nationality} · {selectedPlayer.age} yrs</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Level:</span> <span className="font-medium">{selectedPlayer.playing_level}</span></div>
                        <div><span className="text-muted-foreground">Club:</span> <span className="font-medium">{selectedPlayer.current_club || "Free Agent"}</span></div>
                        <div><span className="text-muted-foreground">Goals:</span> <span className="font-medium">{selectedPlayer.goals || 0}</span></div>
                        <div><span className="text-muted-foreground">Assists:</span> <span className="font-medium">{selectedPlayer.assists || 0}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Player actions */}
              {user?.role === "player" && invite.status === "pending" && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleRespond(invite.id, "accepted")}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold rounded-sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Accept
                  </Button>
                  <Button
                    onClick={() => handleRespond(invite.id, "declined")}
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-sm font-bold"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Decline
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrialInvitations;
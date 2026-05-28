import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Users, Plus, Copy, MessageSquare, Trash2, X, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ScoutingGroups = ({ scoutingBase }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [groupForm, setGroupForm] = useState({ name: "", description: "", visibility: "private" });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const res = await api.getScoutingGroups();
      setGroups(res.data || []);
    } catch (e) {}
    setLoading(false);
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) return toast.error("Group name is required");
    try {
      await api.createScoutingGroup(groupForm);
      toast.success("Group created!");
      setShowCreateGroup(false);
      setGroupForm({ name: "", description: "", visibility: "private" });
      loadGroups();
    } catch (e) {
      toast.error("Failed to create group");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await api.deleteScoutingGroup(groupId);
      toast.success("Group deleted");
      setGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (e) {
      toast.error("Failed to delete group");
    }
  };

  const copyInviteLink = (token) => {
    const link = `${window.location.origin}/scout/join/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  const openGroupChat = async (group) => {
    setShowGroupChat(group);
    try {
      const res = await api.getGroupMessages(group.id);
      setGroupMessages(res.data || []);
    } catch (e) {}
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !showGroupChat) return;
    try {
      const res = await api.sendGroupMessage(showGroupChat.id, { content: newMessage });
      setGroupMessages(prev => [...prev, res.data]);
      setNewMessage("");
    } catch (e) {
      toast.error("Failed to send message");
    }
  };

  const inputClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm h-10 px-3 text-sm text-white outline-none";
  const textareaClass = "w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm p-3 text-sm text-white outline-none resize-none";

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading groups...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
        <Button onClick={() => setShowCreateGroup(true)} className="bg-primary text-black font-bold rounded-sm">
          <Plus className="w-4 h-4 mr-2" /> New Group
        </Button>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No groups yet. Create one to collaborate with your team.</p>
        </div>
      ) : (
        groups.map(group => (
          <div key={group.id} className="bg-card border border-border/50 p-6 rounded-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-heading font-bold uppercase">{group.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-sm border uppercase flex items-center gap-1 ${
                    group.visibility === "private"
                      ? "border-yellow-500/20 text-yellow-500 bg-yellow-500/10"
                      : "border-green-500/20 text-green-500 bg-green-500/10"
                  }`}>
                    {group.visibility === "private" ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                    {group.visibility === "private" ? "Private" : "Org-wide"}
                  </span>
                </div>
                {group.description && <p className="text-sm text-muted-foreground mb-2">{group.description}</p>}
                <p className="text-xs text-muted-foreground">{group.members?.length || 1} member(s) · {group.players_tracked?.length || 0} players tracked</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => copyInviteLink(group.invite_token)}
                  className="text-xs border border-white/10 hover:border-primary text-muted-foreground hover:text-primary rounded-sm px-3 py-1.5 transition-colors flex items-center gap-1">
                  <Copy className="w-3 h-3" /> Invite
                </button>
                <button onClick={() => openGroupChat(group)}
                  className="text-xs border border-primary text-primary hover:bg-primary hover:text-black rounded-sm px-3 py-1.5 transition-colors flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Chat
                </button>
                <button onClick={() => handleDeleteGroup(group.id)}
                  className="text-muted-foreground hover:text-red-500 transition-colors p-1.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Create Group Modal */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="bg-card border border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase">Create Scouting Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Group Name *</label>
              <input value={groupForm.name} onChange={e => setGroupForm(f => ({...f, name: e.target.value}))}
                placeholder="e.g. U23 Scouting Team" className={inputClass + " mt-1"} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Description</label>
              <textarea value={groupForm.description} onChange={e => setGroupForm(f => ({...f, description: e.target.value}))}
                placeholder="Optional description..." rows={3} className={textareaClass + " mt-1"} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Visibility</label>
              <select value={groupForm.visibility} onChange={e => setGroupForm(f => ({...f, visibility: e.target.value}))}
                className={inputClass + " mt-1 appearance-none cursor-pointer"}>
                <option value="private">Private (invite only)</option>
                <option value="org_wide">Organization-wide</option>
              </select>
            </div>
            <Button onClick={handleCreateGroup} className="w-full bg-primary text-black font-bold rounded-sm">
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Chat Modal */}
      {showGroupChat && (
        <Dialog open={!!showGroupChat} onOpenChange={() => { setShowGroupChat(null); setGroupMessages([]); }}>
          <DialogContent className="bg-card border border-border/50 max-w-lg flex flex-col" style={{maxHeight: "90vh"}}>
            <DialogHeader>
              <DialogTitle className="font-heading uppercase flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                {showGroupChat.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-3 py-4" style={{minHeight: "300px", maxHeight: "400px"}}>
              {groupMessages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Start the conversation!</p>
              ) : (
                groupMessages.map(msg => (
                  <div key={msg.id} className="bg-background rounded-sm p-3 border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-primary">{msg.author_name}</span>
                      <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 pt-3 border-t border-border">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..." className={inputClass + " flex-1"} />
              <Button onClick={sendMessage} className="bg-primary text-black font-bold rounded-sm px-4">Send</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ScoutingGroups;
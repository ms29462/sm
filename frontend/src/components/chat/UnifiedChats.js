import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MessageCircle, CheckCircle, XCircle, Clock, Inbox } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";

const STATUS_STYLES = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  accepted: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const UnifiedChats = () => {
  const [activeTab, setActiveTab] = useState("chats");
  const [chats, setChats] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [deletionRequested, setDeletionRequested] = useState({});
  const { unreadChats } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadChats();
    loadRequests();
  }, []);

  const loadChats = async () => {
    try {
      const res = await api.getMyChats();
      setChats(res.data || []);
    } catch (e) {
      toast.error("Failed to load chats");
    }
    setLoadingChats(false);
  };

  const loadRequests = async () => {
    try {
      const res = await api.getMyChatRequests();
      setRequests(res.data || []);
    } catch (e) {}
    setLoadingRequests(false);
  };

  const handleRequestDeletion = async (reqId) => {
    try {
      await api.requestChatDeletion(reqId);
    } catch (e) {}
    setDeletionRequested(prev => ({ ...prev, [reqId]: true }));
  };

  const handleRespond = async (requestId, status) => {
    try {
      await api.respondToChatRequest(requestId, status);
      toast.success(status === "accepted" ? "Request accepted!" : "Request declined");
      loadRequests();
    } catch (e) {
      toast.error("Failed to respond");
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const totalUnread = Object.values(unreadChats).reduce((a, b) => a + b, 0);

  const tabClass = (tab) =>
    `flex-1 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${
      activeTab === tab
        ? "border-primary text-primary"
        : "border-transparent text-muted-foreground hover:text-white"
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-border/50 bg-background sticky top-0 z-10">
        <button className={tabClass("chats")} onClick={() => setActiveTab("chats")}>
          <span className="flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Chats
            {totalUnread > 0 && (
              <span className="bg-primary text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </span>
        </button>
        <button className={tabClass("requests")} onClick={() => setActiveTab("requests")}>
          <span className="flex items-center justify-center gap-2">
            <Inbox className="w-4 h-4" />
            Requests
            {pendingRequests.length > 0 && (
              <span className="bg-yellow-500 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Chats Tab */}
      {activeTab === "chats" && (
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="p-8 text-center text-primary font-heading">LOADING...</div>
          ) : chats.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No chats yet</p>
            </div>
          ) : (
            chats.map(chat => {
              const unread = unreadChats[chat.id] || 0;
              return (
                <div key={chat.room_id} onClick={() => navigate(`/chat/${chat.id}`)}
                  className="flex items-center gap-4 p-4 border-b border-border/30 hover:bg-white/5 cursor-pointer transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{user?.role === "player" ? (chat.org_playing_level || chat.org_name || "Scout / Organization") : chat.other_party || "Chat Room"}</p>
                    <p className="text-xs text-muted-foreground truncate">{chat.last_message?.message || "No messages yet"}</p>
                  </div>
                  {unread > 0 && (
                    <span className="bg-primary text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {unread}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loadingRequests ? (
            <div className="p-8 text-center text-primary font-heading">LOADING...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No chat requests yet</p>
            </div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="bg-card border border-border/50 rounded-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">{user?.role === "player" ? "Scout / Organization" : req.requester_name || "Organization"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-sm border uppercase font-bold ${STATUS_STYLES[req.status] || STATUS_STYLES.pending}`}>
                    {req.status}
                  </span>
                </div>
                {req.message && (
                  <p className="text-sm text-muted-foreground mb-3 bg-background/50 p-2 rounded-sm">"{req.message}"</p>
                )}
                {req.status === "pending" && user?.role === "player" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleRespond(req.id, "accepted")}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold rounded-sm py-2 text-sm flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Accept
                    </button>
                    <button onClick={() => handleRespond(req.id, "rejected")}
                      className="flex-1 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-sm py-2 text-sm flex items-center justify-center gap-1">
                      <XCircle className="w-4 h-4" /> Decline
                    </button>
                  </div>
                )}
                {user?.role !== "player" && (
                  <div className="mt-2">
                    {deletionRequested[req.id] ? (
                      <p className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Deletion request sent to admin
                      </p>
                    ) : (
                      <button onClick={() => handleRequestDeletion(req.id)}
                        className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-sm px-3 py-1.5 transition-colors">
                        Request Deletion
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedChats;
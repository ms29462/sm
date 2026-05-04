import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";

const ChatList = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { unreadChats } = useNotifications();

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const response = await api.getMyChats();
      setChats(response.data);
    } catch (error) {
      toast.error("Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { day: "2-digit", month: "short" });
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
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-heading font-bold uppercase">MY CHATS</h1>
          {Object.keys(unreadChats).length > 0 && (
            <span className="bg-primary text-black text-xs font-bold px-2 py-1 rounded-full">
              {Object.keys(unreadChats).length} NEW
            </span>
          )}
        </div>
        <p className="text-muted-foreground">Your chat conversations</p>
      </div>

      {chats.length === 0 ? (
        <div data-testid="no-chats" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No chat rooms available yet</p>
          <p className="text-sm text-muted-foreground mt-2">Admin will create chat rooms for you</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => {
            const unreadCount = unreadChats[chat.id] || 0;
            const hasUnread = unreadCount > 0;
            return (
              <div
                key={chat.id}
                data-testid={`chat-${chat.id}`}
                onClick={() => navigate(`/chat/${chat.id}`)}
                className={`bg-card border p-6 rounded-sm transition-colors cursor-pointer ${
                  hasUnread
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/50 hover:border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-sm bg-muted flex items-center justify-center border border-border">
                        <MessageCircle className="w-6 h-6 text-muted-foreground" />
                      </div>
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 bg-primary text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-heading font-bold uppercase truncate ${hasUnread ? "text-white" : "text-foreground"}`}>
                          {chat.other_party}
                        </h3>
                        {hasUnread && (
                          <span className="flex-shrink-0 px-2 py-0.5 bg-primary text-black text-[10px] font-bold uppercase tracking-wide rounded-sm">
                            New
                          </span>
                        )}
                      </div>
                      {chat.last_message ? (
                        <p className={`text-sm truncate ${hasUnread ? "text-white/80" : "text-muted-foreground"}`}>
                          {chat.last_message.message}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No messages yet</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {chat.last_message && (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(chat.last_message.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatList;

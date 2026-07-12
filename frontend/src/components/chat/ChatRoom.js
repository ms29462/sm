import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import useSocket from "@/hooks/useSocket";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return timeStr;
  if (diffDays === 1) return `Yesterday ${timeStr}`;
  if (diffDays < 7) return `${date.toLocaleDateString([], { weekday: "short" })} ${timeStr}`;
  return `${date.toLocaleDateString([], { day: "2-digit", month: "short" })} ${timeStr}`;
};

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markChatAsRead } = useNotifications();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const { socket, emit, on, off, isConnected } = useSocket();

  useEffect(() => {
    markChatAsRead(roomId);
  }, [roomId, markChatAsRead]);

  useEffect(() => {
    if (socket && isConnected && roomId) {
      emit("join_chat_room", {
        room_id: roomId,
        user_id: user.userId
      });

      const handlePreviousMessages = (data) => {
        setMessages(data.messages);
        setHasMore(data.messages.length === 50);
      };

      const handleNewMessage = (message) => {
        setMessages(prev => [...prev, message]);
        setTypingUser(null);
      };

      const handleUserTyping = (data) => {
        if (data.user_id !== user.userId) {
          setTypingUser(data.sender_name);
        }
      };

      const handleUserStoppedTyping = (data) => {
        if (data.user_id !== user.userId) {
          setTypingUser(null);
        }
      };

      const handleMessageBlocked = (data) => {
        toast.error(data.reason || "Upgrade to Premium to continue this conversation.", {
          action: {
            label: "Upgrade",
            onClick: async () => {
              try {
                const res = await api.createPremiumCheckout();
                window.location.href = res.data.checkout_url;
              } catch (e) {
                navigate("/player/credits");
              }
            }
          },
          duration: 8000
        });
      };

      on("message_blocked", handleMessageBlocked);
      on("previous_messages", handlePreviousMessages);
      on("new_chat_message", handleNewMessage);
      on("user_typing", handleUserTyping);
      on("user_stopped_typing", handleUserStoppedTyping);

      return () => {
        off("message_blocked", handleMessageBlocked);
        off("previous_messages", handlePreviousMessages);
        off("new_chat_message", handleNewMessage);
        off("user_typing", handleUserTyping);
        off("user_stopped_typing", handleUserStoppedTyping);
      };
    }
  }, [socket, isConnected, roomId, emit, on, off, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const loadOlderMessages = async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = messages[0];
      const response = await api.getChatMessages(roomId, oldest.timestamp, 50);
      const older = response.data.messages;
      setMessages(prev => [...older, ...prev]);
      setHasMore(response.data.has_more);
    } catch (error) {
      console.error("Failed to load older messages:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleTyping = useCallback((value) => {
    setNewMessage(value);
    if (!isTypingRef.current && value.length > 0) {
      isTypingRef.current = true;
      emit("typing_start", {
        room_id: roomId,
        user_id: user.userId,
        sender_name: user.name || 'User'
      });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        emit("typing_stop", { room_id: roomId, user_id: user.userId });
      }, 2000);
    } else {
      isTypingRef.current = false;
      emit("typing_stop", { room_id: roomId, user_id: user.userId });
    }
  }, [roomId, user, emit]);

  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected) {
      isTypingRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emit("typing_stop", { room_id: roomId, user_id: user.userId });
      emit("send_chat_message", {
        room_id: roomId,
        sender_id: user.userId,
        sender_name: user.name || 'User',
        sender_role: user.role,
        message: newMessage.trim()
      });
      setNewMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-card border-b border-border p-4 flex items-center space-x-4">
        <Button
          data-testid="back-btn"
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-heading font-bold uppercase">CHAT ROOM</h2>
          <p className="text-sm text-muted-foreground">
            {isConnected ? "Connected" : "Connecting..."}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4 max-w-4xl mx-auto">

          {/* Load older messages button */}
          {hasMore && (
            <div className="flex justify-center py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadOlderMessages}
                disabled={loadingMore}
                className="text-xs text-muted-foreground hover:text-white"
              >
                {loadingMore ? (
                  <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Loading...</>
                ) : (
                  "Load older messages"
                )}
              </Button>
            </div>
          )}

          {messages.map((message) => {
            const isMe = message.sender_id === user.userId;
            return (
              <div
                key={message.id}
                data-testid={`message-${message.id}`}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-sm p-4 ${
                    isMe
                      ? "bg-primary text-black"
                      : "bg-card border border-border"
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs font-bold uppercase mb-1 text-primary">
                      {message.sender_role === "player" ? message.sender_name : "Scout / Organization"}
                    </p>
                  )}
                  <p className="text-sm break-words">{message.message}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {formatMessageTime(message.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typingUser && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-sm px-4 py-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{typingUser} is typing</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="bg-card border-t border-border p-4">
        <div className="max-w-4xl mx-auto flex space-x-2">
          <Input
            data-testid="message-input"
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12"
            disabled={!isConnected}
          />
          <Button
            data-testid="send-btn"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12 px-6"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;

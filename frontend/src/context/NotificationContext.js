import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import useSocket from "@/hooks/useSocket";
import { toast } from "sonner";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, on, off, emit, isConnected } = useSocket();
  const [unreadChats, setUnreadChats] = useState({});
  const [pendingVideos, setPendingVideos] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [unreadApplications, setUnreadApplications] = useState(0);

  // Load initial data
  useEffect(() => {
    if (user && (user.role === "player" || user.role === "club")) {
      loadNotifications();
    }
  }, [user]);

  // Register user to personal socket room when connected
  // Re-registers on every reconnection to ensure notifications work
  useEffect(() => {
    if (socket && isConnected && user) {
      emit("register_user", { user_id: user.userId });

      // Also re-register when socket reconnects
      const handleReconnect = () => {
        emit("register_user", { user_id: user.userId });
      };
      socket.on("connect", handleReconnect);
      return () => {
        socket.off("connect", handleReconnect);
      };
    }
  }, [socket, isConnected, user, emit]);

  const loadNotifications = async () => {
    try {
      const [chatsRes, videosRes, notifsRes] = await Promise.all([
        api.getMyChats(),
        api.getMyVideos(),
        api.getNotifications()
      ]);

      const unreadMap = {};
      chatsRes.data.forEach(chat => {
        const stored = localStorage.getItem(`chat_read_${chat.id}`);
        if (!stored && chat.last_message) {
          unreadMap[chat.id] = 1;
        }
      });
      setUnreadChats(unreadMap);
      setTotalUnread(Object.keys(unreadMap).length);

      // Count unread application update notifications
      const appNotifs = (notifsRes?.data || []).filter(n => n.type === 'application_update' && !n.read);
      setUnreadApplications(appNotifs.length);

      const pending = videosRes.data.filter(v => v.is_active);
      setPendingVideos(pending);
      setTotalPending(pending.length);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  // Listen for new messages via room socket
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleNewChatMessage = (message) => {
      if (message.sender_id !== user.userId) {
        const isViewingChat = window.location.pathname.includes(`/chat/${message.room_id}`);
        if (!isViewingChat) {
          setUnreadChats(prev => ({
            ...prev,
            [message.room_id]: (prev[message.room_id] || 0) + 1
          }));
          setTotalUnread(prev => prev + 1);
          toast.info("New Message", {
            description: `${message.sender_name}: ${message.message.substring(0, 50)}`,
            duration: 5000
          });
          playNotificationSound();
        }
      }
    };

    // Listen for personal notifications (when not in the chat room)
    const handleChatNotification = (data) => {
      const isViewingChat = window.location.pathname.includes(`/chat/${data.room_id}`);
      if (!isViewingChat) {
        setUnreadChats(prev => ({
          ...prev,
          [data.room_id]: (prev[data.room_id] || 0) + 1
        }));
        setTotalUnread(prev => prev + 1);
        toast.info("New Message", {
          description: `${data.sender_name}: ${data.message.substring(0, 50)}`,
          duration: 5000
        });
        playNotificationSound();
      }
    };

    on("new_chat_message", handleNewChatMessage);
    on("chat_notification", handleChatNotification);

    return () => {
      off("new_chat_message", handleNewChatMessage);
      off("chat_notification", handleChatNotification);
    };
  }, [socket, isConnected, user, on, off]);

  // Periodically check for new video sessions
  useEffect(() => {
    if (!user || (user.role !== "player" && user.role !== "club")) return;

    const checkVideos = async () => {
      try {
        const response = await api.getMyVideos();
        const active = response.data.filter(v => v.is_active);
        const newSessions = active.filter(
          session => !pendingVideos.find(p => p.id === session.id)
        );
        if (newSessions.length > 0) {
          setPendingVideos(active);
          setTotalPending(active.length);
          newSessions.forEach(session => {
            toast.success("New Video Call", {
              description: `Video interview with ${session.other_party}`,
              duration: 10000,
              action: {
                label: "Join",
                onClick: () => window.location.href = `/video/${session.id}`
              }
            });
          });
          playNotificationSound();
        }
      } catch (error) {
        console.error("Failed to check videos:", error);
      }
    };

    const interval = setInterval(checkVideos, 30000);
    return () => clearInterval(interval);
  }, [user, pendingVideos]);

  const markChatAsRead = useCallback((chatId) => {
    setUnreadChats(prev => {
      const updated = { ...prev };
      const count = updated[chatId] || 0;
      delete updated[chatId];
      setTotalUnread(t => Math.max(0, t - count));
      return updated;
    });
    localStorage.setItem(`chat_read_${chatId}`, "true");
  }, []);

  const clearVideoNotification = useCallback((videoId) => {
    setPendingVideos(prev => prev.filter(v => v.id !== videoId));
    setTotalPending(prev => Math.max(0, prev - 1));
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKbh8LZjHAU5k9XyyHUrBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuIAUtgMzw2Ik1Bxpqve/mnE4MDlCm4fC2YxwFOJPV8sh0KwUgdcXv4JRCCxJcsejsq1gVCEOc3fLBbiAFLYDM8NiJNQcaar3v5pxODA5QpuHwtmMcBTiT1fLIdCsFIHXF7+CUQgsSXLHo7KtYFQhDnN3ywW4gBS2AzPDYiTUHGmq97+acTgwOUKbh8LZjHAU4k9XyyHUrBSB1xe/glEILElyx6OyrWBUIQ5zd8sFuIAUtgMzw2Ik1Bxpqve/mnE4MDlCm4fC2YxwFOJPV8sh0KwUgdcXv4JRCCxJcsejsq1gVCEOc3fLBbiAFLYDM8NiJNQcaar3v5pxODA5QpuHwtmMcBTiT1fLIdCsFIHXF7+CUQgsSXLHo7KtYFQhDnN3ywW4gBS2AzPDYiTUHGmq97+acTgwOUKbh8LZjHAU4k9XyyHUrBSB1xe/glEILElyx6OyrWBUIQ5zd8sFuIAUtgMzw2Ik1Bxpqve/mnE4MDlCm4fC2YxwFOJPV8sh0KwUgdcXv4JRCCxJcsejsq1gVCEOc3fLBbiAFLYDM8NiJNQcaar3v5pxODA==");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {
      // Silently fail
    }
  };

  const value = {
    unreadChats,
    pendingVideos,
    totalUnread,
    totalPending,
    unreadApplications,
    markChatAsRead,
    clearVideoNotification,
    refreshNotifications: loadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};


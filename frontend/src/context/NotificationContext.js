import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import useSocket from '@/hooks/useSocket';
import { toast } from 'sonner';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, on, off, isConnected } = useSocket();
  const [unreadChats, setUnreadChats] = useState({});
  const [pendingVideos, setPendingVideos] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  // Load initial data
  useEffect(() => {
    if (user && (user.role === 'player' || user.role === 'club')) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const [chatsRes, videosRes] = await Promise.all([
        api.getMyChats(),
        api.getMyVideos()
      ]);

      // Initialize unread counts (simplified - all new messages count as unread)
      const unreadMap = {};
      chatsRes.data.forEach(chat => {
        const stored = localStorage.getItem(`chat_read_${chat.id}`);
        if (!stored && chat.last_message) {
          unreadMap[chat.id] = 1;
        }
      });
      setUnreadChats(unreadMap);
      setTotalUnread(Object.keys(unreadMap).length);

      // Set pending video calls
      const pending = videosRes.data.filter(v => v.is_active);
      setPendingVideos(pending);
      setTotalPending(pending.length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // Listen for new messages
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleNewChatMessage = (message) => {
      // Only notify if message is not from current user
      if (message.sender_id !== user.userId) {
        // Check if user is currently viewing this chat
        const isViewingChat = window.location.pathname.includes(`/chat/${message.room_id}`);
        
        if (!isViewingChat) {
          setUnreadChats(prev => ({
            ...prev,
            [message.room_id]: (prev[message.room_id] || 0) + 1
          }));
          setTotalUnread(prev => prev + 1);

          toast.info('New Message', {
            description: `${message.sender_name}: ${message.message.substring(0, 50)}...`,
            duration: 5000
          });

          // Play notification sound (optional)
          playNotificationSound();
        }
      }
    };

    on('new_chat_message', handleNewChatMessage);

    return () => {
      off('new_chat_message', handleNewChatMessage);
    };
  }, [socket, isConnected, user, on, off]);

  // Periodically check for new video sessions
  useEffect(() => {
    if (!user || (user.role !== 'player' && user.role !== 'club')) return;

    const checkVideos = async () => {
      try {
        const response = await api.getMyVideos();
        const active = response.data.filter(v => v.is_active);
        
        // Check if there are new video sessions
        const newSessions = active.filter(
          session => !pendingVideos.find(p => p.id === session.id)
        );

        if (newSessions.length > 0) {
          setPendingVideos(active);
          setTotalPending(active.length);

          newSessions.forEach(session => {
            toast.success('New Video Call', {
              description: `Video interview with ${session.other_party}`,
              duration: 10000,
              action: {
                label: 'Join',
                onClick: () => window.location.href = `/video/${session.id}`
              }
            });
          });

          playNotificationSound();
        }
      } catch (error) {
        console.error('Failed to check videos:', error);
      }
    };

    const interval = setInterval(checkVideos, 30000); // Check every 30 seconds
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
    localStorage.setItem(`chat_read_${chatId}`, 'true');
  }, []);

  const clearVideoNotification = useCallback((videoId) => {
    setPendingVideos(prev => prev.filter(v => v.id !== videoId));
    setTotalPending(prev => Math.max(0, prev - 1));
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKbh8LZjHAU5k9XyyHUrBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuIAUtgMzw2Ik1Bxpqve/mnE4MDlCm4fC2YxwFOJPV8sh0KwUgdcXv4JRCCxJcsejsq1gVCEOc3fLBbiAFLYDM8NiJNQcaar3v5pxODA5QpuHwtmMcBTiT1fLIdCsFIHXF7+CUQgsSXLHo7KtYFQhDnN3ywW4gBS2AzPDYiTUHGmq97+acTgwOUKbh8LZjHAU4k9XyyHUrBSB1xe/glEILElyx6OyrWBUIQ5zd8sFuIAUtgMzw2Ik1Bxpqve/mnE4MDlCm4fC2YxwFOJPV8sh0KwUgdcXv4JRCCxJcsejsq1gVCEOc3fLBbiAFLYDM8NiJNQcaar3v5pxODA5QpuHwtmMcBTiT1fLIdCsFIHXF7+CUQgsSXLHo7KtYFQhDnN3ywW4gBS2AzPDYiTUHGmq97+acTgwOUKbh8LZjHAU4k9XyyHUrBSB1xe/glEILElyx6OyrWBUIQ5zd8sFuIAUtgMzw2Ik1Bxpqve/mnE4MDlCm4fC2YxwFOJPV8sh0KwUgdcXv4JRCCxJcsejsq1gVCEOc3fLBbiAFLYDM8NiJNQcaar3v5pxODA5QpuHwtmMcBTiT1fLIdCsFIHXF7+CUQgsSXLHo7KtYFQhDnN3ywW4gBS2AzPDYiTUHGmq97+acTgwOUKbh8LZjHAU4k9XyyHUrBSB1xe/glEILElyx6OyrWBUIQ5zd8sFuIAUtgMzw2Ik1Bxpqve/mnE4MDlCm4fC2YxwFOJPV8sh0KwUgdcXv4JRCCxJcsejsq1gVCEOc3fLBbiAFLYDM8NiJNQcaar3v5pxODA==');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore if autoplay is blocked
    } catch (error) {
      // Silently fail if audio doesn't work
    }
  };

  const value = {
    unreadChats,
    pendingVideos,
    totalUnread,
    totalPending,
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
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
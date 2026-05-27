import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Bell, X, Check, Eye, Briefcase, Target, Trophy, Star, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NOTIFICATION_ICONS = {
  profile_viewed: Eye,
  pipeline_update: Target,
  application_update: Briefcase,
  chat_request: MessageCircle,
  chat_request_rejected: MessageCircle,
  shortlisted: Star,
  trial_invitation: Trophy,
  default: Bell,
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      const notifs = res.data || [];
      setNotifications(notifs.slice(0, 20));
      setUnread(notifs.filter(n => !n.read).length);
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifs.map(n => api.markNotificationRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch (e) {}
  };

  const markRead = async (notif) => {
    if (!notif.read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        setUnread(prev => Math.max(0, prev - 1));
      } catch (e) {}
    }
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) loadNotifications(); }}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-black text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-64 top-4 w-80 bg-card border border-border/50 rounded-sm shadow-xl z-[100]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h3 className="font-heading font-bold uppercase text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => {
                const Icon = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.default;
                return (
                  <div
                    key={notif.id}
                    onClick={() => markRead(notif)}
                    className={`flex items-start gap-3 p-4 border-b border-border/30 cursor-pointer hover:bg-white/5 transition-colors ${!notif.read ? "bg-primary/5" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 ${!notif.read ? "bg-primary/20" : "bg-white/5"}`}>
                      <Icon className={`w-4 h-4 ${!notif.read ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!notif.read ? "text-white font-medium" : "text-muted-foreground"}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{getTimeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
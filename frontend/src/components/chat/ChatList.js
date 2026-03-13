import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MessageCircle, Video } from 'lucide-react';

const ChatList = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const response = await api.getMyChats();
      setChats(response.data);
    } catch (error) {
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">MY CHATS</h1>
        <p className="text-muted-foreground">Your chat conversations</p>
      </div>

      {chats.length === 0 ? (
        <div data-testid="no-chats" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No chat rooms available yet</p>
          <p className="text-sm text-muted-foreground mt-2">Admin will create chat rooms for you</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              data-testid={`chat-${chat.id}`}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-heading font-bold uppercase mb-2">
                    {chat.other_party}
                  </h3>
                  {chat.last_message && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {chat.last_message.message}
                    </p>
                  )}
                </div>
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatList;
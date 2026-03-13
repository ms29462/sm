import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useSocket from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const AdminChatViewer = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket, emit, on, off, isConnected } = useSocket();

  useEffect(() => {
    loadChatRoom();
  }, [roomId]);

  useEffect(() => {
    if (socket && isConnected && roomId) {
      // Admin joins as observer
      emit('join_chat_room', {
        room_id: roomId,
        user_id: 'admin'
      });

      const handleNewMessage = (message) => {
        setMessages(prev => [...prev, message]);
      };

      on('new_chat_message', handleNewMessage);

      return () => {
        off('new_chat_message', handleNewMessage);
      };
    }
  }, [socket, isConnected, roomId, emit, on, off]);

  const loadChatRoom = async () => {
    try {
      const response = await api.getChatRoomMessages(roomId);
      setRoomInfo({
        player_name: response.data.player_name,
        club_name: response.data.club_name
      });
      setMessages(response.data.messages);
    } catch (error) {
      toast.error('Failed to load chat room');
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
      <div className="mb-8 flex items-center space-x-4">
        <Button
          data-testid="back-btn"
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/chats')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase mb-2">
            {roomInfo?.player_name} ↔ {roomInfo?.club_name}
          </h1>
          <p className="text-muted-foreground">
            Monitoring chat room • {isConnected ? 'Live' : 'Offline'}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-sm">
        <ScrollArea className="h-[600px] p-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No messages yet</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  data-testid={`message-${message.id}`}
                  className="bg-background border border-border p-4 rounded-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-bold uppercase text-primary">
                      {message.sender_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{message.message}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AdminChatViewer;
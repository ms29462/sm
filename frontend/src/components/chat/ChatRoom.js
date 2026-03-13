import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useSocket from '@/hooks/useSocket';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markChatAsRead } = useNotifications();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const messagesEndRef = useRef(null);
  const { socket, emit, on, off, isConnected } = useSocket();

  useEffect(() => {
    // Mark this chat as read when opened
    markChatAsRead(roomId);
  }, [roomId, markChatAsRead]);

  useEffect(() => {
    if (socket && isConnected && roomId) {
      // Join chat room
      emit('join_chat_room', {
        room_id: roomId,
        user_id: user.userId
      });

      // Listen for previous messages
      const handlePreviousMessages = (data) => {
        setMessages(data.messages);
      };

      // Listen for new messages
      const handleNewMessage = (message) => {
        setMessages(prev => [...prev, message]);
      };

      on('previous_messages', handlePreviousMessages);
      on('new_chat_message', handleNewMessage);

      return () => {
        off('previous_messages', handlePreviousMessages);
        off('new_chat_message', handleNewMessage);
      };
    }
  }, [socket, isConnected, roomId, emit, on, off, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected) {
      emit('send_chat_message', {
        room_id: roomId,
        sender_id: user.userId,
        sender_name: user.email,
        message: newMessage.trim()
      });
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
            {isConnected ? 'Connected' : 'Connecting...'}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => {
            const isMe = message.sender_id === user.userId;
            return (
              <div
                key={message.id}
                data-testid={`message-${message.id}`}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-sm p-4 ${
                    isMe
                      ? 'bg-primary text-black'
                      : 'bg-card border border-border'
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs font-bold uppercase mb-1 text-primary">
                      {message.sender_name}
                    </p>
                  )}
                  <p className="text-sm break-words">{message.message}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="bg-card border-t border-border p-4">
        <div className="max-w-4xl mx-auto flex space-x-2">
          <Input
            data-testid="message-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
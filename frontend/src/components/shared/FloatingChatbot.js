import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Trash2, Sparkles, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Bonjour ! Je suis l'assistant IA de SoccerMatch. Comment puis-je vous aider aujourd'hui ?\n\nVous pouvez me demander de :\n• Rechercher des joueurs (ex: \"Montre-moi les milieux gauchers français\")\n• Trouver des opportunités\n• Répondre à vos questions sur la plateforme"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.sendChatbotQuery(userMessage, sessionId);
      const data = response.data;

      let assistantMessage = data.response || "Je n'ai pas pu traiter votre demande.";
      
      // If we have search results, add some context
      if (data.action === 'search_players' && data.results && data.results.length > 0) {
        // Response already formatted by backend
      } else if (data.action === 'search_opportunities' && data.results && data.results.length > 0) {
        // Response already formatted by backend
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantMessage,
        results: data.results,
        action: data.action
      }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Désolé, une erreur s'est produite. Veuillez réessayer."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = async () => {
    try {
      await api.clearChatbotSession();
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
    setMessages([
      {
        role: 'assistant',
        content: "Conversation effacée. Comment puis-je vous aider ?"
      }
    ]);
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={index}
        className={cn(
          "flex gap-2 mb-3",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-emerald-600" : "bg-zinc-700"
        )}>
          {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-emerald-400" />}
        </div>
        <div
          className={cn(
            "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
            isUser 
              ? "bg-emerald-600 text-white rounded-tr-sm" 
              : "bg-zinc-800 text-zinc-100 rounded-tl-sm"
          )}
        >
          <div className="whitespace-pre-wrap leading-relaxed">
            {formatMessageContent(message.content)}
          </div>
        </div>
      </div>
    );
  };

  const formatMessageContent = (content) => {
    // Simple markdown-like formatting for bold text
    return content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      // Handle bullet points
      if (part.includes('•')) {
        return part.split('\n').map((line, j) => (
          <span key={`${i}-${j}`}>
            {line}
            {j < part.split('\n').length - 1 && <br />}
          </span>
        ));
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full shadow-lg",
          "bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600",
          "flex items-center justify-center transition-all duration-300",
          "hover:scale-110 active:scale-95",
          isOpen && "scale-0 opacity-0"
        )}
        data-testid="chatbot-toggle-btn"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </span>
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-20 right-6 z-50 w-[380px] h-[500px] max-h-[70vh]",
          "bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800",
          "flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
        data-testid="chatbot-window"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Assistant SoccerMatch</h3>
              <p className="text-emerald-200 text-xs">Recherche IA intelligente</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
              title="Effacer la conversation"
              data-testid="chatbot-clear-btn"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
              data-testid="chatbot-close-btn"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-1">
            {messages.map((msg, idx) => renderMessage(msg, idx))}
            {isLoading && (
              <div className="flex gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span className="text-zinc-400 text-sm">Recherche en cours...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: Milieux gauchers franco-gambiens..."
              className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
              disabled={isLoading}
              data-testid="chatbot-input"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3"
              data-testid="chatbot-send-btn"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-zinc-500 text-xs mt-2 text-center">
            Propulsé par l'IA Gemini
          </p>
        </div>
      </div>
    </>
  );
};

export default FloatingChatbot;

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';

const RequestChatDialog = ({ playerId, playerName, requesterType = 'club' }) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const getButtonText = () => {
    switch (requesterType) {
      case 'agent':
        return 'REQUEST TO CONNECT';
      case 'specialist':
        return 'OFFER SERVICES';
      default:
        return 'REQUEST INTERVIEW CHAT';
    }
  };

  const getDialogTitle = () => {
    switch (requesterType) {
      case 'agent':
        return 'REQUEST TO CONNECT WITH PLAYER';
      case 'specialist':
        return 'OFFER YOUR SERVICES';
      default:
        return 'REQUEST INTERVIEW CHAT';
    }
  };

  const getPlaceholder = () => {
    switch (requesterType) {
      case 'agent':
        return 'Tell the player why you want to represent them, your experience, and what you can offer...';
      case 'specialist':
        return 'Describe the services you can offer this player (training programs, rehab, nutrition plans, etc.)...';
      default:
        return 'Add any notes for the admin about why you want to chat with this player...';
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.requestChat(playerId, notes);
      toast.success('Chat request sent! The player will be notified.');
      setOpen(false);
      setNotes('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-testid="request-chat-btn"
          className="bg-blue-500 text-white font-bold uppercase tracking-wide hover:bg-blue-600 rounded-sm h-12 px-6"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {getButtonText()}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-bold uppercase">{getDialogTitle()}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Send a request to connect with {playerName}. They will be notified and can accept or decline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="notes" className="text-sm font-medium uppercase tracking-wide">
              Your Message
            </Label>
            <Textarea
              id="notes"
              data-testid="request-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm min-h-[120px]"
              placeholder={getPlaceholder()}
            />
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-sm">
            <p className="text-sm text-blue-400">
              <strong>Note:</strong> {playerName} will receive a notification about your request. If they accept, an admin will create a private chat room for you.
            </p>
          </div>
          <Button
            data-testid="submit-request-btn"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12"
          >
            {loading ? 'SENDING REQUEST...' : 'SEND REQUEST'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestChatDialog;

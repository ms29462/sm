import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';

const RequestChatDialog = ({ playerId, playerName }) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.requestChat(playerId, notes);
      toast.success('Chat request sent to admin!');
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
          REQUEST INTERVIEW CHAT
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-bold uppercase">REQUEST INTERVIEW CHAT</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Request a private chat with {playerName}. The admin will review and create the chat room for you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="notes" className="text-sm font-medium uppercase tracking-wide">
              Message to Admin (Optional)
            </Label>
            <Textarea
              id="notes"
              data-testid="request-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm min-h-[120px]"
              placeholder="Add any notes for the admin about why you want to chat with this player..."
            />
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-sm">
            <p className="text-sm text-blue-400">
              <strong>Note:</strong> Only admins can create chat rooms. Your request will be reviewed, and you'll be notified when the chat is available.
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
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MessageCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

const ChatRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await api.getMyChatRequests();
      setRequests(response.data);
    } catch (error) {
      toast.error('Failed to load chat requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, status) => {
    try {
      await api.respondToChatRequest(requestId, status);
      toast.success(status === 'accepted' ? 'Request accepted! Admin will create the chat room.' : 'Request rejected');
      loadRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to respond to request');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs uppercase tracking-wider rounded-sm bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            PENDING
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs uppercase tracking-wider rounded-sm bg-green-500/10 text-green-500 border border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            ACCEPTED
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs uppercase tracking-wider rounded-sm bg-red-500/10 text-red-500 border border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            REJECTED
          </span>
        );
      default:
        return null;
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
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">CHAT REQUESTS</h1>
        <p className="text-muted-foreground">Clubs that want to connect with you</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No chat requests yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              data-testid={`chat-request-${request.id}`}
              className="bg-card border border-border/50 p-6 rounded-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-heading font-bold uppercase">{request.club_name}</h3>
                    {getStatusBadge(request.status)}
                  </div>
                  {request.message && (
                    <p className="text-muted-foreground mb-3">"{request.message}"</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Received: {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {request.status === 'pending' && (
                  <div className="flex gap-3">
                    <Button
                      data-testid={`accept-request-${request.id}`}
                      onClick={() => handleRespond(request.id, 'accepted')}
                      className="bg-green-500 text-white font-bold uppercase tracking-wide hover:bg-green-600 rounded-sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      ACCEPT
                    </Button>
                    <Button
                      data-testid={`reject-request-${request.id}`}
                      onClick={() => handleRespond(request.id, 'rejected')}
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold uppercase tracking-wide rounded-sm"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      REJECT
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatRequests;

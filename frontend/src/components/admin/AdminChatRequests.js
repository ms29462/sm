import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MessageSquare, CheckCircle, XCircle, Clock, Plus, Building, Briefcase, Activity } from 'lucide-react';

const AdminChatRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingChat, setCreatingChat] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await api.getAdminChatRequests();
      setRequests(response.data);
    } catch (error) {
      toast.error('Failed to load chat requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async (request) => {
    setCreatingChat(request.id);
    try {
      // Use requester_id if available, fall back to club_id for legacy requests
      const requesterId = request.requester_id || request.club_id;
      await api.createChatRoom(request.player_id, requesterId);
      toast.success('Chat room created successfully!');
      loadRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create chat room');
    } finally {
      setCreatingChat(null);
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

  const getRequesterTypeBadge = (requesterType) => {
    switch (requesterType) {
      case 'agent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-sm bg-purple-500/10 text-purple-500">
            <Briefcase className="w-3 h-3 mr-1" /> Agent
          </span>
        );
      case 'specialist':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-sm bg-cyan-500/10 text-cyan-500">
            <Activity className="w-3 h-3 mr-1" /> Specialist
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-sm bg-blue-500/10 text-blue-500">
            <Building className="w-3 h-3 mr-1" /> Club
          </span>
        );
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
        <p className="text-muted-foreground">Manage chat requests from clubs, agents, and specialists to players</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No chat requests yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              data-testid={`admin-chat-request-${request.id}`}
              className="bg-card border border-border/50 p-6 rounded-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getStatusBadge(request.status)}
                    {getRequesterTypeBadge(request.requester_type)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Requester</p>
                      <p className="font-medium">{request.requester_name || request.club_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Player</p>
                      <p className="font-medium">{request.player_name}</p>
                    </div>
                  </div>
                  {request.message && (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Message</p>
                      <p className="text-muted-foreground">"{request.message}"</p>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(request.created_at).toLocaleString()}
                    {request.responded_at && ` • Responded: ${new Date(request.responded_at).toLocaleString()}`}
                  </p>
                </div>
                
                {request.status === 'accepted' && (
                  <Button
                    data-testid={`create-chat-${request.id}`}
                    onClick={() => handleCreateChat(request)}
                    disabled={creatingChat === request.id}
                    className="bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {creatingChat === request.id ? 'CREATING...' : 'CREATE CHAT ROOM'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminChatRequests;

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

const STATUS_OPTIONS = ['submitted', 'viewed', 'shortlisted', 'rejected', 'accepted'];
const STATUS_COLORS = {
  submitted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  viewed: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  shortlisted: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  accepted: 'bg-green-500/10 text-green-500 border-green-500/20',
};

const ClubApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await api.getClubApplications();
      setApplications(response.data);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await api.updateApplicationStatus(applicationId, newStatus);
      toast.success('Status updated');
      loadApplications();
    } catch (error) {
      toast.error('Failed to update status');
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
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">APPLICATIONS</h1>
        <p className="text-muted-foreground">Review and manage player applications</p>
      </div>

      {applications.length === 0 ? (
        <div data-testid="no-applications" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No applications received yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              data-testid={`application-card-${app.id}`}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-heading font-bold uppercase mb-1">{app.player.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Applied for: {app.opportunity.position} · {app.opportunity.league_level}
                  </p>
                </div>
                <span
                  data-testid={`status-${app.id}`}
                  className={`px-3 py-1 text-[10px] uppercase tracking-wider border rounded-sm ${STATUS_COLORS[app.status]}`}
                >
                  {app.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
                {app.player.position && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Position</span>
                    <span className="font-medium">{app.player.position}</span>
                  </div>
                )}
                {app.player.age && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Age</span>
                    <span className="font-medium">{app.player.age} years</span>
                  </div>
                )}
                {app.player.nationality && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Nationality</span>
                    <span className="font-medium">{app.player.nationality}</span>
                  </div>
                )}
                {app.player.playing_level && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Level</span>
                    <span className="font-medium">{app.player.playing_level}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center space-x-6 font-mono text-xs text-muted-foreground">
                  <span>GOALS: {app.player.goals || 0}</span>
                  <span>ASSISTS: {app.player.assists || 0}</span>
                  <span>GAMES: {app.player.games || 0}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground uppercase tracking-wide">UPDATE STATUS:</span>
                  <Select value={app.status} onValueChange={(value) => handleStatusChange(app.id, value)}>
                    <SelectTrigger
                      data-testid={`status-select-${app.id}`}
                      className="w-40 bg-black/20 border-white/10 focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-10"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubApplications;
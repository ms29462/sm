import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

const STATUS_COLORS = {
  submitted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  viewed: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  shortlisted: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  accepted: 'bg-green-500/10 text-green-500 border-green-500/20',
};

const PlayerApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await api.getMyApplications();
      setApplications(response.data);
    } catch (error) {
      toast.error('Failed to load applications');
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
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">MY APPLICATIONS</h1>
        <p className="text-muted-foreground">Track your application status</p>
      </div>

      {applications.length === 0 ? (
        <div data-testid="no-applications" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">You haven't applied to any opportunities yet</p>
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
                  <h3 className="text-xl font-heading font-bold uppercase mb-1">{app.opportunity.club_name}</h3>
                  <p className="text-sm text-muted-foreground">{app.opportunity.position} Â· {app.opportunity.league_level}</p>
                </div>
                <span
                  data-testid={`status-${app.id}`}
                  className={`px-3 py-1 text-[10px] uppercase tracking-wider border rounded-sm ${STATUS_COLORS[app.status]}`}
                >
                  {app.status}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {app.opportunity.salary_range && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Salary Range</span>
                    <span className="font-medium font-mono">{app.opportunity.salary_range}</span>
                  </div>
                )}
                {app.opportunity.contract_duration && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Contract Duration</span>
                    <span className="font-medium">{app.opportunity.contract_duration}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block mb-1">Applied On</span>
                  <span className="font-medium">{new Date(app.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerApplications;

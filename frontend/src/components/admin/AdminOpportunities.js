import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Briefcase, Trash2 } from 'lucide-react';

const AdminOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      const response = await api.getAllOpportunities();
      setOpportunities(response.data);
    } catch (error) {
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      await api.deleteOpportunityAdmin(id);
      toast.success('Opportunity deleted');
      loadOpportunities();
    } catch (error) {
      toast.error('Failed to delete opportunity');
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
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">OPPORTUNITY MODERATION</h1>
        <p className="text-muted-foreground">Review and moderate posted opportunities</p>
      </div>

      {opportunities.length === 0 ? (
        <div data-testid="no-opportunities" className="bg-card border border-border/50 p-12 rounded-sm text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No opportunities posted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              data-testid={`opportunity-card-${opp.id}`}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-heading font-bold uppercase">{opp.position}</h3>
                    <span className="bg-white/10 text-white border border-white/20 uppercase text-[10px] tracking-wider px-2 py-1">
                      {opp.league_level}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Posted by: <span className="font-medium">{opp.club_name}</span>
                    {opp.club_country && ` Â· ${opp.club_country}`}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">{opp.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {opp.salary_range && (
                      <div>
                        <span className="text-muted-foreground block mb-1">Salary Range</span>
                        <span className="font-medium font-mono">{opp.salary_range}</span>
                      </div>
                    )}
                    {opp.contract_duration && (
                      <div>
                        <span className="text-muted-foreground block mb-1">Duration</span>
                        <span className="font-medium">{opp.contract_duration}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground block mb-1">Posted On</span>
                      <span className="font-medium">{new Date(opp.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <Button
                  data-testid={`delete-btn-${opp.id}`}
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(opp.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-4"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOpportunities;


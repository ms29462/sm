import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { FileText, Building, MapPin, DollarSign, Clock } from 'lucide-react';

const AgentOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      const response = await api.getAgentOpportunities();
      setOpportunities(response.data || []);
    } catch (error) {
      toast.error('Failed to load opportunities');
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
    <div className="p-8" data-testid="agent-opportunities">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-heading font-bold uppercase">OPPORTUNITIES</h1>
        </div>
        <p className="text-muted-foreground">Browse available positions to match with your players</p>
      </div>

      {opportunities.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-sm text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No opportunities available at the moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map(opp => (
            <div
              key={opp.id}
              className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-5 h-5 text-primary" />
                    <h3 className="font-heading font-bold uppercase text-lg">{opp.club_name}</h3>
                  </div>
                  {opp.club_country && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{opp.club_country}</span>
                    </div>
                  )}
                </div>
                <span className="px-3 py-1 bg-primary text-black font-bold text-sm rounded-sm uppercase">
                  {opp.position}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-muted-foreground">League Level</p>
                  <p className="font-medium">{opp.league_level}</p>
                </div>
                {opp.salary_range && (
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Salary
                    </p>
                    <p className="font-medium">{opp.salary_range}</p>
                  </div>
                )}
                {opp.contract_duration && (
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Duration
                    </p>
                    <p className="font-medium">{opp.contract_duration}</p>
                  </div>
                )}
              </div>

              <p className="text-muted-foreground text-sm">{opp.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentOpportunities;

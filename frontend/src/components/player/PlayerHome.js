import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Briefcase, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlayerHome = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, recommendedRes] = await Promise.all([
        api.getPlayerProfile(),
        api.getRecommendedOpportunities(),
      ]);
      setProfile(profileRes.data);
      setRecommended(recommendedRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (opportunityId) => {
    try {
      await api.createApplication({ opportunity_id: opportunityId });
      toast.success('Application submitted!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to apply');
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
        <h1 className="text-3xl font-heading font-bold uppercase mb-2">DASHBOARD</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.name}</p>
      </div>

      {!profile?.approved && (
        <div
          data-testid="approval-pending-alert"
          className="bg-card border border-yellow-500/50 p-6 rounded-sm mb-8 flex items-start space-x-4"
        >
          <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-heading font-bold text-lg mb-2">APPROVAL PENDING</h3>
            <p className="text-muted-foreground">
              Your profile is awaiting admin approval. Complete your profile to speed up the process.
            </p>
            <Button
              data-testid="complete-profile-btn"
              onClick={() => navigate('/player/profile')}
              className="mt-4 bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-10 px-6"
            >
              COMPLETE PROFILE
            </Button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-heading font-bold uppercase">RECOMMENDED FOR YOU</h2>
          </div>
          <Button
            data-testid="view-all-opportunities-btn"
            variant="ghost"
            className="text-primary hover:text-primary/80"
            onClick={() => navigate('/player/opportunities')}
          >
            VIEW ALL
          </Button>
        </div>

        {recommended.length === 0 ? (
          <div data-testid="no-recommendations" className="bg-card border border-border/50 p-12 rounded-sm text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Complete your profile to get personalized recommendations
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recommended.slice(0, 4).map((opp) => (
              <div
                key={opp.id}
                data-testid={`opportunity-card-${opp.id}`}
                className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-heading font-bold uppercase mb-1">{opp.club_name}</h3>
                    <p className="text-sm text-muted-foreground">{opp.club_country}</p>
                  </div>
                  <span className="bg-white/10 text-white border border-white/20 uppercase text-[10px] tracking-wider px-2 py-1">
                    {opp.position}
                  </span>
                </div>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">League Level:</span>
                    <span className="font-medium">{opp.league_level}</span>
                  </div>
                  {opp.salary_range && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Salary:</span>
                      <span className="font-medium font-mono">{opp.salary_range}</span>
                    </div>
                  )}
                  {opp.contract_duration && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{opp.contract_duration}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{opp.description}</p>
                <Button
                  data-testid={`apply-btn-${opp.id}`}
                  onClick={() => handleApply(opp.id)}
                  className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-10"
                >
                  APPLY NOW
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerHome;
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import OpportunityCard from '@/components/player/OpportunityCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Briefcase, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import ProfileCompletionBanner from '@/components/player/ProfileCompletionBanner';

const PlayerHome = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
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
    <div className="p-4 md:p-8">
      <ProfileCompletionBanner />
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-2">DASHBOARD</h1>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
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
              <OpportunityCard
                key={opp.id}
                opp={opp}
                testId={`opportunity-card-${opp.id}`}
                onApply={handleApply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerHome;
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Trophy, Clock, DollarSign, FileText, Building } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const OpportunityDetail = () => {
  const { opportunityId } = useParams();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    loadOpportunity();
  }, [opportunityId]);

  const loadOpportunity = async () => {
    try {
      const appsRes = await api.getMyApplications();
      const ids = new Set((appsRes.data || []).map(a => a.opportunity_id));
      setHasApplied(ids.has(opportunityId));
    } catch (e) {}
    setLoading(true);
    try {
      const res = await api.getOpportunities();
      const opp = (res.data || []).find(o => o.id === opportunityId);
      if (opp) {
        setOpportunity(opp);
        // Try to get match score
        try {
          const scoreRes = await api.getMatchScore(opportunityId);
          setMatchScore(scoreRes.data);
        } catch (e) {}
      }
    } catch (e) {
      toast.error("Failed to load opportunity");
    }
    setLoading(false);
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.createApplication({ opportunity_id: opportunityId });
      toast.success("Application submitted successfully!");
      setShowConfirm(false);
      setHasApplied(true);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to apply");
    }
    setApplying(false);
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-primary text-xl font-heading">LOADING...</div>
    </div>
  );

  if (!opportunity) return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">Opportunity not found</p>
      <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
    </div>
  );

  const scoreColor = matchScore?.fit_score >= 80 ? "#22c55e" : matchScore?.fit_score >= 65 ? "#eab308" : matchScore?.fit_score >= 50 ? "#f97316" : "#ef4444";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Opportunities
      </button>

      {/* Header */}
      <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-heading font-bold uppercase mb-1">{opportunity.club_name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{opportunity.club_country || "International"}</span>
            </div>
          </div>
          <span className="bg-primary/10 text-primary border border-primary/20 uppercase text-sm tracking-wider px-4 py-2 rounded-sm font-bold">
            {opportunity.position}
          </span>
        </div>

        {/* Match Score */}
        {matchScore?.fit_score !== undefined && (
          <div className="bg-black/20 border border-white/10 rounded-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground uppercase tracking-wide">Your Match Score</span>
              <span className="text-2xl font-heading font-bold" style={{ color: scoreColor }}>
                {Math.round(matchScore.fit_score)}<span className="text-sm text-muted-foreground font-normal">/100</span>
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full" style={{ width: `${matchScore.fit_score}%`, backgroundColor: scoreColor }} />
            </div>
            <p className="text-sm text-muted-foreground">{matchScore.fit_label}</p>
          </div>
        )}

        {hasApplied ? (
          <Button disabled className="w-full bg-green-500/10 text-green-500 border border-green-500/20 rounded-sm h-12 font-bold uppercase tracking-wide cursor-not-allowed">
            ✓ Already Applied
          </Button>
        ) : (
          <Button
            onClick={() => setShowConfirm(true)}
            className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12"
          >
            APPLY NOW
          </Button>
        )}
      </div>

      {/* Details */}
      <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
        <h2 className="text-xl font-heading font-bold uppercase mb-6 pb-3 border-b border-border">Opportunity Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-background border border-border/50 rounded-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">League Level</span>
            </div>
            <p className="font-medium">{opportunity.league_level}</p>
          </div>
          {opportunity.salary_range && (
            <div className="bg-background border border-border/50 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Salary</span>
              </div>
              <p className="font-medium font-mono">{opportunity.salary_range}</p>
            </div>
          )}
          {opportunity.contract_duration && (
            <div className="bg-background border border-border/50 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Contract Duration</span>
              </div>
              <p className="font-medium">{opportunity.contract_duration}</p>
            </div>
          )}
          <div className="bg-background border border-border/50 rounded-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Organization</span>
            </div>
            <p className="font-medium">{opportunity.club_name}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {opportunity.description && (
        <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
          <h2 className="text-xl font-heading font-bold uppercase mb-4 pb-3 border-b border-border">Description</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{opportunity.description}</p>
        </div>
      )}

      {/* Posted date */}
      <p className="text-xs text-muted-foreground text-center">
        Posted {new Date(opportunity.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Apply to Opportunity"
        description={`Are you sure you want to apply to this ${opportunity.position} position at ${opportunity.club_name}?`}
        confirmLabel="Apply Now"
        confirmVariant="primary"
        onConfirm={handleApply}
        loading={applying}
      />
    </div>
  );
};

export default OpportunityDetail;
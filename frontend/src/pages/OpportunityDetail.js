import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Trophy, Clock, DollarSign, FileText, Building } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const OpportunityDetail = () => {
  const { opportunityId } = useParams();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState(null);
  const location = useLocation();
  const passedScore = location.state?.displayScore ?? null;
  const passedLabel = location.state?.scoreLabel || null;
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
      const res = await api.getOpportunityDetail(opportunityId);
      const opp = res.data;
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
      const detail = e.response?.data?.detail || "Failed to apply";
      if (detail.includes("Insufficient credits") || detail.includes("credits")) {
        toast.error(detail, {
          action: {
            label: "Buy Credits",
            onClick: () => window.location.href = "/player/credits?tab=buy"
          },
          duration: 6000
        });
      } else {
        toast.error(detail);
      }
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

  const displayScore = matchScore?.fit_score ?? passedScore;
  const displayLabel = matchScore?.fit_label ?? passedLabel;
  const scoreColor = displayScore >= 80 ? "#22c55e" : displayScore >= 65 ? "#eab308" : displayScore >= 50 ? "#f97316" : "#ef4444";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Opportunities
      </button>

      {/* Header */}
      <div className="bg-card border border-border/50 p-8 rounded-sm mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold uppercase mb-1">{opportunity.country || opportunity.club_country || "International"}</h1>
            {opportunity.club_id !== "anonymous" && opportunity.club_name && (
              <p className="text-lg text-primary font-medium mt-1">{opportunity.club_name}</p>
            )}
          </div>
          <span className="bg-primary/10 text-primary border border-primary/20 uppercase text-sm tracking-wider px-4 py-2 rounded-sm font-bold">
            {opportunity.position}
          </span>
        </div>

        {/* Match Score */}
        {(displayScore !== null && displayScore !== undefined) && (
          <div className="bg-black/20 border border-white/10 rounded-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground uppercase tracking-wide">Your Match Score</span>
              <span className="text-2xl font-heading font-bold" style={{ color: scoreColor }}>
                {Math.round(displayScore)}<span className="text-sm text-muted-foreground font-normal">/100</span>
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full" style={{ width: `${displayScore}%`, backgroundColor: scoreColor }} />
            </div>
            <p className="text-sm text-muted-foreground">{displayLabel}</p>
          </div>
        )}

        {hasApplied ? (
          <Button disabled className="w-full bg-green-500/10 text-green-500 border border-green-500/20 rounded-sm h-12 font-bold uppercase tracking-wide cursor-not-allowed">
            ✓ Already Applied
          </Button>
        ) : (
          <>
            {opportunity.credit_cost && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-sm mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Application Cost</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Credits deducted on apply</p>
                </div>
                <p className="text-2xl font-heading font-bold text-primary">{opportunity.credit_cost} cr.</p>
              </div>
            )}
            {opportunity.max_applicants && (
              <div className="p-3 bg-card border border-border/50 rounded-sm mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Spots Remaining</p>
                <p className={`text-lg font-heading font-bold ${(opportunity.max_applicants - (opportunity.applicants_count ?? 0)) <= 0 ? "text-red-400" : "text-green-400"}`}>
                  {Math.max(opportunity.max_applicants - (opportunity.applicants_count ?? 0), 0)}/{opportunity.max_applicants}
                </p>
              </div>
            )}
          <Button
            onClick={() => setShowConfirm(true)}
            className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12"
          >
            APPLY NOW
          </Button>
          </>
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
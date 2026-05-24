import { useState } from "react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import { Target, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const getFitScoreColor = (score) => {
  if (score >= 80) return "text-green-400";
  if (score >= 65) return "text-yellow-400";
  if (score >= 50) return "text-orange-400";
  return "text-red-400";
};

const getFitScoreBg = (score) => {
  if (score >= 80) return "bg-green-500/10";
  if (score >= 65) return "bg-yellow-500/10";
  if (score >= 50) return "bg-orange-500/10";
  return "bg-red-500/10";
};

const OpportunityCard = ({ opp, matchScore, score, onApply, testId }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [applying, setApplying] = useState(false);
  const handleApply = async () => {
    setApplying(true);
    try {
      await api.createApplication({ opportunity_id: opp.id });
      toast.success("Application submitted successfully!");
      setShowConfirm(false);
      if (onApply) onApply(opp.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to apply");
    }
    setApplying(false);
  };

  // Support both simple score number and full score object
  const simpleScore = typeof matchScore === "number" ? matchScore : null;
  const fullScore = score || null;
  const displayScore = fullScore?.fit_score ?? simpleScore;
  const scoreLabel = fullScore?.fit_label || (displayScore >= 80 ? "Strong fit" : displayScore >= 65 ? "Good fit" : displayScore >= 50 ? "Borderline fit" : "Weak fit");

  return (
    <div
      data-testid={testId || `opportunity-card-${opp.id}`}
      className="bg-card border border-border/50 p-6 rounded-sm hover:border-primary/50 transition-colors flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-heading font-bold uppercase mb-1">{opp.club_name}</h3>
          <p className="text-sm text-muted-foreground">{opp.club_country || "International"}</p>
        </div>
        <span className="bg-white/10 text-white border border-white/20 uppercase text-[10px] tracking-wider px-2 py-1">
          {opp.position}
        </span>
      </div>

      {/* Match Score */}
      {displayScore !== null && displayScore !== undefined && (
        <div className={`mb-4 p-3 rounded-sm ${getFitScoreBg(displayScore)} border border-border/30`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Match Score</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-xl font-heading font-bold ${getFitScoreColor(displayScore)}`}>
                {Math.round(displayScore)}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1">
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${displayScore}%`,
              backgroundColor: displayScore >= 80 ? "#22c55e" : displayScore >= 65 ? "#eab308" : displayScore >= 50 ? "#f97316" : "#ef4444"
            }} />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{scoreLabel}</span>
            {fullScore?.position_match && (
              <span className="text-primary flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Position match
              </span>
            )}
          </div>
        </div>
      )}

      {/* Details */}
      <div className="space-y-2 mb-4 text-sm flex-1">
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
        {opp.description && (
          <p className="text-muted-foreground text-xs mt-2 line-clamp-2">{opp.description}</p>
        )}
      </div>

      {/* Apply Button */}
      <Button
        data-testid={`apply-btn-${opp.id}`}
        onClick={() => setShowConfirm(true)}
        className="w-full bg-primary text-black font-bold uppercase tracking-wide hover:bg-primary/90 rounded-sm h-12 mt-auto"
      >
        APPLY NOW
      </Button>
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Apply to Opportunity"
        description={`Are you sure you want to apply to this ${opp.position} position at ${opp.club_name}?`}
        confirmLabel="Apply Now"
        confirmVariant="primary"
        onConfirm={handleApply}
        loading={applying}
      />
    </div>
  );
};

export default OpportunityCard;
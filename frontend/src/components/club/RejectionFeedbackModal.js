import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const REASONS = [
  { code: "position_not_needed", label: "Not recruiting for this position" },
  { code: "squad_complete",      label: "Squad complete in this position" },
  { code: "age_mismatch",        label: "Age group doesn't match" },
  { code: "level_mismatch",      label: "Level doesn't match" },
  { code: "physical_mismatch",   label: "Physical profile doesn't match" },
  { code: "foot_mismatch",       label: "Preferred foot doesn't match" },
  { code: "eligibility",         label: "Eligibility requirement not met" },
  { code: "insufficient_video",  label: "Not enough video to assess" },
  { code: "incomplete_profile",  label: "Profile information missing" },
  { code: "availability_location", label: "Availability or location doesn't match" },
  { code: "opportunity_closed",  label: "Opportunity filled or closed" },
  { code: "other",               label: "Other" },
];

const TIPS = [
  { code: "add_video",        label: "Add a longer or higher-quality video" },
  { code: "complete_profile", label: "Complete your profile" },
  { code: "keep_updated",     label: "Keep your profile up to date" },
  { code: "apply_others",     label: "Apply to other matching opportunities" },
];

const RejectionFeedbackModal = ({ applicationId, playerName, onConfirmed, onCancel }) => {
  const [reasons, setReasons] = useState([]);
  const [tips, setTips] = useState([]);
  const [message, setMessage] = useState("");
  const [otherText, setOtherText] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const toggle = (list, setList, code) =>
    setList(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);

  const validate = () => {
    const e = {};
    if (reasons.length === 0) e.reasons = "Select at least one reason.";
    if (reasons.includes("other") && !otherText.trim()) e.otherText = "Please describe the other reason.";
    if (otherText.length > 200) e.otherText = "Max 200 characters.";
    if (message.length > 300) e.message = "Max 300 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.rejectApplicationWithFeedback(applicationId, {
        reasons,
        tips,
        message: message.trim() || null,
        other_text: reasons.includes("other") ? otherText.trim() : null,
      });
      toast.success("Application rejected and feedback sent to the player.");
      onConfirmed();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (detail === "Feedback already submitted for this application") {
        toast.error("This application was already rejected.");
        onConfirmed();
      } else {
        toast.error(detail || "Failed to save. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const chip = (active) =>
    `px-3 py-2 text-xs rounded-sm border-2 font-medium cursor-pointer transition-all select-none ${
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-white/10 text-muted-foreground hover:border-white/30"
    }`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rejection-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
    >
      <div
        className="bg-card border border-border/50 rounded-sm w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 id="rejection-modal-title" className="font-heading font-bold uppercase text-lg">
            Rejection Feedback
          </h2>
          <button onClick={onCancel} aria-label="Close" className="text-muted-foreground hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {playerName && (
            <p className="text-sm text-muted-foreground">
              You are rejecting <strong className="text-white">{playerName}</strong>'s application.
              This feedback will be sent to the player by email.
            </p>
          )}

          {/* Reasons */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-bold">
              Reasons <span className="text-red-400">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map(r => (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => toggle(reasons, setReasons, r.code)}
                  className={chip(reasons.includes(r.code))}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {errors.reasons && (
              <p className="flex items-center gap-1 text-red-400 text-xs mt-2">
                <AlertCircle className="w-3 h-3" /> {errors.reasons}
              </p>
            )}
            {reasons.includes("other") && (
              <div className="mt-3">
                <input
                  type="text"
                  maxLength={200}
                  value={otherText}
                  onChange={e => setOtherText(e.target.value)}
                  placeholder="Describe the other reason (required)..."
                  className="w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm px-3 h-10 text-sm text-white outline-none"
                  aria-label="Other reason"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{otherText.length}/200</p>
                {errors.otherText && (
                  <p className="flex items-center gap-1 text-red-400 text-xs mt-1">
                    <AlertCircle className="w-3 h-3" /> {errors.otherText}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tips */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-bold">
              Tips for the player <span className="text-muted-foreground font-normal">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {TIPS.map(t => (
                <button
                  key={t.code}
                  type="button"
                  onClick={() => toggle(tips, setTips, t.code)}
                  className={chip(tips.includes(t.code))}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-bold">
              Message <span className="text-muted-foreground font-normal">(optional, max 300 chars)</span>
            </p>
            <textarea
              rows={3}
              maxLength={300}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add a personal message to the player..."
              className="w-full bg-black/20 border border-white/10 focus:border-primary rounded-sm px-3 py-2 text-sm text-white outline-none resize-none"
              aria-label="Optional message"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/300</p>
            {errors.message && (
              <p className="flex items-center gap-1 text-red-400 text-xs mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onCancel} className="flex-1 rounded-sm" disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-wide rounded-sm"
          >
            {saving ? "Saving…" : "Confirm Rejection"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RejectionFeedbackModal;

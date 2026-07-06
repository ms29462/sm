import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { api } from "@/lib/api";

const CATEGORIES = [
  { id: "suspicious_behavior", label: "Suspicious Behavior" },
  { id: "harassment", label: "Harassment" },
  { id: "inappropriate_communication", label: "Inappropriate Communication" },
  { id: "other", label: "Other" },
];

const ReportUserDialog = ({ reportedUserId, triggerLabel = "Report" }) => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    if (!description.trim()) {
      toast.error("Please describe what happened");
      return;
    }
    setLoading(true);
    try {
      await api.createReport({ reported_user_id: reportedUserId, category, description });
      toast.success("Report submitted. Our team will review it shortly.");
      setOpen(false);
      setCategory("");
      setDescription("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <Flag className="w-4 h-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-2">Category</p>
            <div className="space-y-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-sm border text-sm transition-colors ${
                    category === c.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Additional details
            </p>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened..."
              rows={4}
            />
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full bg-destructive text-white hover:bg-destructive/90">
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Reports are confidential and reviewed by Soccer Match administrators only.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportUserDialog;
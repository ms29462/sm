import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ConfirmDialog = ({ open, onOpenChange, title, description, confirmLabel = "Confirm", confirmVariant = "destructive", onConfirm, loading = false }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border/50 max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading uppercase">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1 rounded-sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className={`flex-1 rounded-sm font-bold ${
              confirmVariant === "destructive"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-primary hover:bg-primary/90 text-black"
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
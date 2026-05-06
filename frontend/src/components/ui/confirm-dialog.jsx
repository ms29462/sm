import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Reusable confirmation dialog - replaces window.confirm
 * Usage:
 *   const { confirm, ConfirmDialog } = useConfirm()
 *   const ok = await confirm("Are you sure?")
 *   if (ok) { ... }
 */
export const useConfirm = () => {
  const [state, setState] = useState({ open: false, message: "", title: "", resolve: null });

  const confirm = (message, title = "Are you sure?") => {
    return new Promise((resolve) => {
      setState({ open: true, message, title, resolve });
    });
  };

  const handleConfirm = () => {
    state.resolve(true);
    setState({ open: false, message: "", title: "", resolve: null });
  };

  const handleCancel = () => {
    state.resolve(false);
    setState({ open: false, message: "", title: "", resolve: null });
  };

  const ConfirmDialog = () => (
    <AlertDialog open={state.open} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent className="bg-card border border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading uppercase">{state.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {state.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} className="rounded-sm uppercase text-xs tracking-wide">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-white hover:bg-destructive/90 rounded-sm uppercase text-xs tracking-wide">
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, ConfirmDialog };
};

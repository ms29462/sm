import { useState, useEffect } from 'react';
import { usePWA } from '@/context/PWAContext';
import { Button } from '@/components/ui/button';
import { Download, X, WifiOff, Trophy, Smartphone, Bell, Zap } from 'lucide-react';

const PWAInstallBanner = () => {
  const { isInstallable, isInstalled, isOnline, installApp } = usePWA() || {};
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isInstallable && !dismissed && !isInstalled) {
      const timer = setTimeout(() => setShowModal(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, dismissed, isInstalled]);

  const handleInstall = async () => {
    const result = await installApp?.();
    if (result) setShowModal(false);
  };

  const handleDismiss = () => {
    setShowModal(false);
    setDismissed(true);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-card border border-border/50 rounded-sm w-full max-w-sm shadow-2xl relative">
        {/* Close button */}
        <button onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="bg-primary p-6 rounded-t-sm text-black text-center">
          <div className="w-16 h-16 bg-black/10 rounded-sm flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-bold text-xl uppercase">Install SoccerMatch</h2>
          <p className="text-sm opacity-80 mt-1">Your football recruitment platform</p>
        </div>

        {/* Features */}
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Zap className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Faster access — launch like a native app</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Bell className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Push notifications for new opportunities</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Smartphone className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Works on desktop and mobile</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <Button onClick={handleDismiss} variant="outline"
            className="flex-1 border-white/20 text-muted-foreground hover:text-white rounded-sm">
            Not now
          </Button>
          <Button onClick={handleInstall}
            className="flex-1 bg-primary text-black font-bold rounded-sm">
            <Download className="w-4 h-4 mr-2" /> Install
          </Button>
        </div>
      </div>
    </div>
  );
};

export const OfflineBanner = () => {
  const { isOnline } = usePWA() || { isOnline: true };
  if (isOnline) return null;
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 text-sm font-medium z-50">
      <WifiOff className="w-4 h-4 inline mr-2" />
      You're offline. Some features may be unavailable.
    </div>
  );
};

export default PWAInstallBanner;
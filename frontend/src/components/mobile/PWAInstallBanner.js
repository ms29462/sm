import { useState, useEffect } from 'react';
import { usePWA } from '@/context/PWAContext';
import { Button } from '@/components/ui/button';
import { Download, X, Wifi, WifiOff } from 'lucide-react';

const PWAInstallBanner = () => {
  const { isInstallable, isInstalled, isOnline, installApp } = usePWA() || {};
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show banner after 5 seconds if installable and not dismissed
    if (isInstallable && !dismissed && !isInstalled) {
      const timer = setTimeout(() => setShowBanner(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, dismissed, isInstalled]);

  const handleInstall = async () => {
    const result = await installApp?.();
    if (result) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gradient-to-r from-primary to-green-600 text-black p-4 rounded-xl shadow-lg z-50 animate-in slide-in-from-bottom">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded-full"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="p-2 bg-black/10 rounded-lg">
          <Download className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold">Install SoccerMatch</h3>
          <p className="text-sm opacity-90 mb-3">
            Get the full app experience with offline access and notifications
          </p>
          <Button
            onClick={handleInstall}
            className="bg-black text-white hover:bg-black/80 w-full"
          >
            Install App
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
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 text-sm font-medium z-50 safe-area-top">
      <WifiOff className="w-4 h-4 inline mr-2" />
      You're offline. Some features may be unavailable.
    </div>
  );
};

export default PWAInstallBanner;

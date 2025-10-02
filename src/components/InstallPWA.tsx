import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Empêcher le mini-infobar par défaut d'apparaître sur mobile
      e.preventDefault();
      // Stocker l'événement pour pouvoir le déclencher plus tard
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      // Cacher le bouton après l'installation
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Afficher le prompt d'installation
    deferredPrompt.prompt();

    // Attendre que l'utilisateur réponde au prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('L\'utilisateur a accepté l\'installation de la PWA');
    } else {
      console.log('L\'utilisateur a refusé l\'installation de la PWA');
    }

    // On ne peut utiliser le prompt qu'une seule fois
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Ne pas afficher le bouton si la PWA n'est pas installable
  if (!isInstallable) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="outline"
      className="w-full gap-2 rounded-lg p-4 text-sm font-semibold"
    >
      <Download className="h-4 w-4" />
      Installer l'application
    </Button>
  );
};

export default InstallPWA;

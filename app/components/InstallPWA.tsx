"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          },
          (err) => {
            console.log('ServiceWorker registration failed: ', err);
          }
        );
      });
    }

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Update UI to show install button
      setIsInstallable(true);
      // Show the prompt after a slight delay to ensure users see it
      setTimeout(() => {
        setIsVisible(true);
      }, 2000);
    });

    // Hide the prompt if app was installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      setIsInstallable(false);
      setIsVisible(false);
      setDeferredPrompt(null);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User ${outcome} the install prompt`);

    // We no longer need the prompt, clear it
    setDeferredPrompt(null);
    setIsInstallable(false);
    setIsVisible(false);
  };

  // Don't render anything if the app can't be installed
  if (!isInstallable || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 flex justify-center z-50 px-4 pb-4">
      <div className="bg-white rounded-lg shadow-xl p-4 flex items-center space-x-3 border border-gray-200 max-w-sm">
        <div className="flex-shrink-0">
          <Download className="h-6 w-6 text-green-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install DeChat</h3>
          <p className="text-xs text-gray-500">Add to your home screen for easy access</p>
        </div>
        <Button 
          onClick={handleInstallClick}
          size="sm"
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
        >
          Install
        </Button>
      </div>
    </div>
  );
} 
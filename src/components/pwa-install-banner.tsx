"use client";

import { useEffect, useState } from "react";
import { Download, Monitor, X, Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (PWA installed & opened)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed banner recently
    const dismissedTime = localStorage.getItem("gyrex_pwa_banner_dismissed");
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("gyrex_pwa_banner_dismissed", Date.now().toString());
  };

  if (isInstalled || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-3 shadow-lg border-b border-indigo-500/20 relative z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-400/30 text-indigo-300">
            <Monitor className="w-5 h-5 hidden sm:block" />
            <Smartphone className="w-5 h-5 sm:hidden" />
          </div>
          <div>
            <span className="font-semibold text-indigo-200">Install Gyrex Clinic App</span>
            <p className="text-xs text-slate-300">
              Open directly from your Desktop or Phone without typing URLs!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {deferredPrompt && (
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20"
            >
              <Download className="w-4 h-4 mr-1.5" />
              1-Click Install App
            </Button>
          )}

          <a
            href="/download/Gyrex-Clinic-Setup.bat"
            download="Gyrex-Clinic-Setup.bat"
            className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Windows .exe Setup
          </a>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

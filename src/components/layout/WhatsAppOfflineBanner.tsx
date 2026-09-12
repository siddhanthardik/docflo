"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowRight, X } from "lucide-react";

export function WhatsAppOfflineBanner() {
  const [status, setStatus] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    const checkStatus = () => {
      fetch("/api/whatsapp/qr")
        .then((res) => res.json())
        .then((data) => {
          if (isMounted) {
            setStatus(data.status);
            // If it reconnects, reset dismissed state
            if (data.status === "CONNECTED") {
              setDismissed(false);
            }
          }
        })
        .catch(() => {});
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Don't show if connected, loading, dismissed, or already on the WhatsApp settings page
  if (!status || status === "CONNECTED" || dismissed || pathname === "/settings/whatsapp") {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2 text-xs sm:text-sm shadow-sm transition-all duration-200 z-30">
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-center sm:justify-start">
        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0 animate-bounce" />
        <p className="font-medium truncate leading-tight">
          <span className="font-bold">WhatsApp Disconnected:</span>{" "}
          <span className="hidden sm:inline">AI Receptionist, reminders, & message automations are paused.</span>
          <span className="sm:hidden">Automations paused.</span>
        </p>
        <Link
          href="/settings/whatsapp"
          className="inline-flex items-center gap-1 bg-white text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-md font-semibold text-xs transition-colors shrink-0 shadow-xs ml-2"
        >
          <span>Reconnect Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
        title="Dismiss for now"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

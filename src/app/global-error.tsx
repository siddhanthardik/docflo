"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, LifeBuoy, ArrowLeft } from "lucide-react";
import { GyrexLogo } from "@/components/ui/GyrexLogo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [countdown, setCountdown] = useState(25);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    console.error("Gyrex Global System Error:", error);
  }, [error]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.reload();
          return 25;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleManualReset = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 sm:p-10 shadow-xl relative z-10 text-center">
          {/* Brand Header */}
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/50 shadow-inner">
              <GyrexLogo className="h-9 w-auto" />
            </div>
          </div>

          {/* Pulse Upgrade Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            System Upgrade in Progress
          </div>

          {/* Heading & Subtitle */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
            Enhancing Your Platform Experience
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            We are currently deploying feature updates and optimizations to the Gyrex platform. Your clinical data, patient records, and automated WhatsApp workflows remain completely safe and operational.
          </p>

          {/* Auto-Reload Progress Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-8 shadow-inner">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
              <span>Auto-reconnecting to updated services...</span>
              <span className="font-mono text-indigo-600 font-bold">{countdown}s</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${((25 - countdown) / 25) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleManualReset}
              disabled={isRefreshing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Reconnecting..." : "Check Status & Reload"}
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-5 py-3 rounded-xl border border-slate-200 shadow-sm transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Dashboard
            </button>
          </div>

          {/* Reassurance Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Encrypted & Secured Environment</span>
            </div>
            <a
              href="mailto:support@gyrex.in"
              className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
            >
              <LifeBuoy className="h-3.5 w-3.5" />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { isPlatformRole } from "@/lib/permissions";

export default function VerifyEmailPendingPage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Auto-check on mount: If user already verified in another tab or on mobile, auto-redirect to dashboard
  useEffect(() => {
    let isMounted = true;
    async function checkLiveStatus() {
      try {
        const res = await fetch("/api/auth/verify-email/status");
        if (res.ok) {
          const data = await res.json();
          if (data.verified && isMounted) {
            setIsVerified(true);
            await update({ verified: true, emailVerified: data.emailVerified || new Date().toISOString() });
            const targetUrl = session?.user?.role && isPlatformRole(session.user.role) ? "/admin" : "/dashboard";
            window.location.href = targetUrl;
          }
        }
      } catch {}
    }
    checkLiveStatus();
    return () => {
      isMounted = false;
    };
  }, [update, session?.user?.role]);

  const handleResend = async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });
      if (res.ok) {
        toast({ title: "Email sent", description: "Verification email has been sent successfully. Please check your inbox and spam folder." });
      } else {
        const errData = await res.json().catch(() => ({}));
        toast({ title: "Notice", description: errData.message || "Failed to send verification email.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong sending the verification email.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAlreadyVerified = async () => {
    setChecking(true);
    try {
      // 1. Check live database verification status
      const res = await fetch("/api/auth/verify-email/status");
      const data = await res.json().catch(() => ({}));

      if (data.verified) {
        setIsVerified(true);
        toast({ title: "Email Verified!", description: "Your email is confirmed. Redirecting to your dashboard..." });
        // 2. Refresh JWT session cookie so middleware reads fresh verified state
        await update({ verified: true, emailVerified: data.emailVerified || new Date().toISOString() });
        setTimeout(() => {
          const targetUrl = session?.user?.role && isPlatformRole(session.user.role) ? "/admin" : "/dashboard";
          window.location.href = targetUrl;
        }, 500);
      } else {
        toast({
          title: "Not Verified Yet",
          description: "We haven't received confirmation for your email yet. Please click the verification link in your email, or click 'Resend Verification Email' below.",
          variant: "destructive"
        });
        setChecking(false);
      }
    } catch {
      toast({ title: "Error", description: "Could not refresh your session. Please try signing out and back in.", variant: "destructive" });
      setChecking(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Email Verified!</h2>
          <p className="text-sm text-slate-500">Redirecting to your dashboard...</p>
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-6">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Email</h1>
        <p className="text-slate-500 mb-8">
          Your grace period for using Gyrex without a verified email has expired. Please check your inbox and verify your email address to regain access.
        </p>
        <div className="space-y-3">
          <button
            onClick={handleAlreadyVerified}
            disabled={checking}
            className="w-full bg-emerald-600 text-white rounded-xl py-3 font-semibold hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {checking && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{checking ? "Checking..." : "✓ I've Already Verified My Email"}</span>
          </button>
          <button
            onClick={handleResend}
            disabled={loading || !session?.user?.email}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? "Sending..." : "Resend Verification Email"}</span>
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full block bg-white text-slate-700 border border-slate-300 rounded-xl py-3 font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

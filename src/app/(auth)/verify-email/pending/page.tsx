"use client";

import { useState } from "react";
import { useSession, SessionProvider } from "next-auth/react";
import { Activity, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

function VerifyEmailPendingContent() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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
        toast({ title: "Email sent", description: "Verification email has been sent successfully." });
      } else {
        toast({ title: "Error", description: "Failed to send verification email.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
            onClick={handleResend}
            disabled={loading || !session?.user?.email}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Resend Verification Email"}
          </button>
          <Link
            href="/api/auth/signout"
            className="w-full block bg-white text-slate-700 border border-slate-300 rounded-xl py-3 font-semibold hover:bg-slate-50 transition"
          >
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPendingPage() {
  return (
    <SessionProvider>
      <VerifyEmailPendingContent />
    </SessionProvider>
  );
}

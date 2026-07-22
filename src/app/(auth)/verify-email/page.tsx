"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GyrexLogo } from "@/components/ui/GyrexLogo";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setErrorMessage("Invalid verification link. Missing token or email parameters.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });

        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Failed to verify email. The link may have expired.");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        setErrorMessage("Network error during verification. Please try again.");
      }
    }

    verify();
  }, [token, email, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <GyrexLogo size="lg" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-200/80 text-center">
          
          {status === "loading" && (
            <div className="py-8 space-y-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">Verifying your email...</h2>
              <p className="text-xs text-slate-500">Please wait while we confirm your email address.</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Email Verified!</h2>
              <p className="text-sm text-slate-600 max-w-xs mx-auto">
                Your email address <strong className="text-slate-900">{email}</strong> has been successfully verified.
              </p>
              <div className="pt-4">
                <Link
                  href="/dashboard"
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 inline-flex items-center justify-center gap-2 transition-all"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-[11px] text-slate-400">Redirecting automatically in 3 seconds...</p>
            </div>
          )}

          {status === "error" && (
            <div className="py-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
                <XCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verification Failed</h2>
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 max-w-xs mx-auto">
                {errorMessage}
              </p>
              <div className="pt-2 space-y-2">
                <Link
                  href="/login"
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 inline-flex items-center justify-center gap-2 transition-all"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

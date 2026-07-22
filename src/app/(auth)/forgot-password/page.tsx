"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { GyrexLogo } from "@/components/ui/GyrexLogo";


export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSubmitted(true);
      } else {
        toast({ title: "Error", description: data.error || "Failed to send reset link", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] bg-indigo-600 flex-col justify-between p-10 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-800/40 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
          <Link href="/" className="flex items-center gap-2">
            <GyrexLogo size="lg" />
          </Link>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            Regain access to your clinic.
          </h1>
          <p className="text-indigo-100 text-lg leading-relaxed font-medium">
            Reset your password securely to continue managing your patients and appointments.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-32 bg-white overflow-y-auto">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile Header */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <GyrexLogo size="lg" />
          </Link>

          {!submitted ? (
            <>
              <div className="mb-10">
                <Link href="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Forgot Password</h2>
                <p className="text-gray-500 text-[15px]">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all outline-none shadow-sm"
                    placeholder="name@clinic.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-[15px] font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2"
                >
                  {loading ? "Sending link..." : "Send reset link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Check your email</h2>
              <p className="text-gray-500 text-[15px] mb-8">
                We've sent a password reset link to <span className="font-semibold text-gray-900">{email}</span>.
              </p>
              <Link
                href="/login"
                className="w-full inline-block rounded-xl bg-indigo-600 px-4 py-3 text-[15px] font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all active:scale-[0.98]"
              >
                Return to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

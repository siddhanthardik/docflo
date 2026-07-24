"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Activity, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { GyrexLogo } from "@/components/ui/GyrexLogo";

export function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          affiliateCode: searchParams.get("ref") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast({ title: "Account created!", description: "Sign in to complete your profile setup." });
      router.push("/login?setup=1");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 shadow-xl shadow-slate-200/50">
        
        {/* Centered Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <GyrexLogo size="md" />
          </Link>
        </div>

        {searchParams.get("ref") && (
          <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700 text-center">
            You are registering via a partner referral link.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Full Name</label>
            <input
              type="text"
              placeholder="Dr. Priya Sharma"
              value={formData.name}
              onChange={set("name")}
              required
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email</label>
            <input
              type="email"
              placeholder="doctor@yourclinic.com"
              value={formData.email}
              onChange={set("email")}
              required
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 10 chars, uppercase, lowercase & number"
                value={formData.password}
                onChange={set("password")}
                minLength={8}
                required
                className="w-full h-11 px-4 pr-12 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={set("confirmPassword")}
                minLength={8}
                required
                className="w-full h-11 px-4 pr-12 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 animate-spin" /> Creating account…
              </span>
            ) : (
              <>Create Free Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 pt-2">
            By signing up you agree to our{" "}
            <Link href="/terms" className="underline hover:text-slate-600">Terms</Link>{" "}and{" "}
            <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
          </p>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function RegisterPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <RegisterPage />
    </Suspense>
  );
}
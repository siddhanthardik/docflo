"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Activity, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get("setup") === "1";
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast({ title: "Invalid credentials", description: "Check your email and password.", variant: "destructive" });
      } else {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const role = session?.user?.role;
        if (isSetup) {
          window.location.href = "/settings?welcome=1";
        } else if (role === "SUPERADMIN" || role === "ADMIN" || role === "SALES" || role === "ACCOUNTS" || role === "MARKETING") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/dashboard";
        }
      }

    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* ── Left brand panel ───────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] bg-indigo-600 flex-col justify-between p-10 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-800/40 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-black text-lg tracking-tight">DocFlo</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-3xl font-black text-white leading-tight">
              Welcome back,<br />Doctor.
            </h2>
            <p className="text-indigo-200 text-sm mt-3 leading-relaxed max-w-xs">
              Sign in to manage your appointments, patient CRM, WhatsApp automation, and local SEO rankings all in one place.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "500+", label: "Clinics growing" },
              { value: "3.2×", label: "Avg. patient growth" },
              { value: "98%", label: "Profile uptime" },
              { value: "₹0", label: "14-day trial cost" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-3">
                <div className="text-xl font-black text-white">{s.value}</div>
                <div className="text-xs text-indigo-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-indigo-300 text-xs">© {new Date().getFullYear()} DocFlo · Healthcare GBP Platform</p>
        </div>
      </div>

      {/* ── Right form panel ───────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-slate-900 text-base">DocFlo</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to your account</h1>
            <p className="text-sm text-slate-500 mt-1">Access your GBP dashboard and ranking reports.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email</label>
              <input
                type="email"
                placeholder="doctor@yourclinic.com"
                value={formData.email}
                onChange={set("email")}
                required
                autoComplete="email"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Password</label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={set("password")}
                  required
                  autoComplete="current-password"
                  className="w-full h-11 px-4 pr-12 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-indigo-300/30 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-spin" /> Signing in…
                </span>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-indigo-600 hover:underline">
                Start free trial
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const PERKS = [
  "Smart WhatsApp Patient Booking",
  "AI-Powered GBP Local SEO",
  "Automated WhatsApp Reviews",
  "Patient CRM & Engagement",
  "14-day free trial — no credit card",
];

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    clinicName: "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
    <div className="min-h-screen flex font-sans">
      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] bg-indigo-600 flex-col justify-between p-10 relative overflow-hidden shrink-0">
        {/* Background texture */}
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

        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-indigo-100 text-xs font-bold mb-4">
              14-day free trial · No credit card
            </div>
            <h2 className="text-3xl font-black text-white leading-tight">
              The Complete Patient<br />Acquisition Engine.
            </h2>
            <p className="text-indigo-200 text-sm mt-3 leading-relaxed max-w-xs">
              DocFlo automates your local SEO, WhatsApp bookings, patient CRM, and review generation so you can focus on care.
            </p>
          </div>

          <div className="space-y-3">
            {PERKS.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-indigo-300 shrink-0" />
                <span className="text-sm text-indigo-100 font-medium">{p}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/10">
            <div className="flex -space-x-2">
              {["DR","KS","AM","PV"].map((i, idx) => (
                <div key={idx} className="w-8 h-8 rounded-full bg-indigo-400 border-2 border-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                  {i}
                </div>
              ))}
            </div>
            <p className="text-xs text-indigo-200 font-medium">500+ doctors already growing with DocFlo</p>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-indigo-300 text-xs">© {new Date().getFullYear()} DocFlo · Healthcare GBP Platform</p>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────── */}
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create your account</h1>
            <p className="text-sm text-slate-500 mt-1">Start your 14-day free trial. No credit card required.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                placeholder="Dr. Priya Sharma"
                value={formData.name}
                onChange={set("name")}
                required
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
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
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Clinic Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Clinic / Hospital Name</label>
              <input
                type="text"
                placeholder="City Medical Center"
                value={formData.clinicName}
                onChange={set("clinicName")}
                required
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={set("password")}
                  minLength={8}
                  required
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
                  <Activity className="w-4 h-4 animate-spin" /> Creating account…
                </span>
              ) : (
                <>Create Free Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-center text-xs text-slate-400 pt-1">
              By signing up you agree to our{" "}
              <Link href="/terms" className="underline hover:text-slate-600">Terms</Link>{" "}and{" "}
              <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
            </p>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-indigo-600 hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
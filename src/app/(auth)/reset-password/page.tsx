"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Activity, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { GyrexLogo } from "@/components/ui/GyrexLogo";


function ResetPasswordForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [success, setSuccess] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [key]: e.target.value }));

  // Basic password strength meter
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score < 2) return { text: "Weak", color: "bg-red-500", w: "w-1/4" };
    if (score < 4) return { text: "Fair", color: "bg-yellow-500", w: "w-2/4" };
    if (score === 4) return { text: "Good", color: "bg-blue-500", w: "w-3/4" };
    return { text: "Strong", color: "bg-green-500", w: "w-full" };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !email) {
      toast({ title: "Error", description: "Invalid reset link.", variant: "destructive" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, ...formData }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
      } else {
        toast({ title: "Error", description: data.error || "Failed to reset password", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Password reset complete</h2>
        <p className="text-gray-500 text-[15px] mb-8">
          Your password has been successfully updated. You can now log in with your new password.
        </p>
        <Link
          href="/login"
          className="w-full inline-block rounded-xl bg-indigo-600 px-4 py-3 text-[15px] font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all active:scale-[0.98]"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Reset Password</h2>
        <p className="text-gray-500 text-[15px]">
          Enter your new password below to reset it for <span className="font-semibold text-gray-900">{email}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700">New Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={set("password")}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all outline-none shadow-sm"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 h-full px-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Password strength:</span>
                <span className="font-semibold text-gray-700">{strength.text}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${strength.w} ${strength.color} transition-all duration-300`}></div>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Must be at least 10 characters with a mix of letters and numbers.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">Confirm Password</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={formData.confirmPassword}
              onChange={set("confirmPassword")}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-[15px] text-gray-900 placeholder:text-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all outline-none shadow-sm"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-0 top-0 h-full px-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !token || !email}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-[15px] font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <h1 className="text-4xl lg:text-50xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            Secure your account.
          </h1>
          <p className="text-indigo-100 text-lg leading-relaxed font-medium">
            Choose a strong password to protect your clinic data and patient records.
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
          <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

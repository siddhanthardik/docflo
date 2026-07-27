"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Activity, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { GyrexLogo } from "@/components/ui/GyrexLogo";

// ── Helpers ──────────────────────────────────────────────────────────────────
const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

type FieldErrors = { email?: string; password?: string };
type Touched    = { email?: boolean; password?: boolean };

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] text-rose-600 font-semibold mt-1">
      <AlertCircle className="w-3 h-3 shrink-0" /> {msg}
    </p>
  );
}

function InputWrapper({
  hasError,
  children,
}: {
  hasError: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative rounded-xl border transition-all ${
        hasError
          ? "border-rose-400 ring-2 ring-rose-400/20"
          : "border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20"
      }`}
    >
      {children}
    </div>
  );
}

// ── Login content ─────────────────────────────────────────────────────────────
function LoginContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get("setup") === "1";

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Touched>({});

  // ── Validators ──────────────────────────────────────────────────────────────
  const validateEmail = (v: string): string | undefined => {
    if (!v.trim()) return "Email address is required.";
    if (!isValidEmail(v)) return "Please enter a valid email address.";
    return undefined;
  };

  const validatePassword = (v: string): string | undefined => {
    if (!v) return "Password is required.";
    if (v.length < 6) return "Password must be at least 6 characters.";
    return undefined;
  };

  // ── Change handlers ──────────────────────────────────────────────────────────
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFormData(prev => ({ ...prev, email: v }));
    if (touched.email) setErrors(prev => ({ ...prev, email: validateEmail(v) }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFormData(prev => ({ ...prev, password: v }));
    if (touched.password) setErrors(prev => ({ ...prev, password: validatePassword(v) }));
  };

  // ── Blur handlers ────────────────────────────────────────────────────────────
  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    setErrors(prev => ({ ...prev, email: validateEmail(formData.email) }));
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    setErrors(prev => ({ ...prev, password: validatePassword(formData.password) }));
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Touch all fields on submit
    setTouched({ email: true, password: true });
    const emailErr = validateEmail(formData.email);
    const passwordErr = validatePassword(formData.password);
    if (emailErr || passwordErr) {
      setErrors({ email: emailErr, password: passwordErr });
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Invalid credentials",
          description: "Check your email and password.",
          variant: "destructive",
        });
      } else {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const role = session?.user?.role;
        if (isSetup) {
          window.location.href = "/settings?welcome=1";
        } else if (
          role === "SUPERADMIN" || role === "ADMIN" || role === "SALES" ||
          role === "ACCOUNTS" || role === "MARKETING"
        ) {
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

  const emailOk = touched.email && !errors.email && formData.email;
  const passwordOk = touched.password && !errors.password && formData.password;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 shadow-xl shadow-slate-200/50">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/"><GyrexLogo size="md" /></Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email</label>
            <InputWrapper hasError={!!errors.email && !!touched.email}>
              <input
                type="email"
                placeholder="doctor@yourclinic.com"
                value={formData.email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                autoComplete="email"
                disabled={loading}
                className="w-full h-11 px-4 pr-10 rounded-xl bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {emailOk && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
              )}
            </InputWrapper>
            <FieldError msg={touched.email ? errors.email : undefined} />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Password</label>
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline font-semibold">
                Forgot password?
              </Link>
            </div>
            <InputWrapper hasError={!!errors.password && !!touched.password}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                autoComplete="current-password"
                disabled={loading}
                className="w-full h-11 px-4 pr-20 rounded-xl bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {passwordOk && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </InputWrapper>
            <FieldError msg={touched.password ? errors.password : undefined} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <><Activity className="w-4 h-4 animate-spin" /> Signing in…</>
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-bold text-blue-600 hover:underline">
              Start free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Activity className="w-6 h-6 animate-spin text-blue-600" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
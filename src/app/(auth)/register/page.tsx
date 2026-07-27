"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Activity, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { GyrexLogo } from "@/components/ui/GyrexLogo";

// ── Helpers ──────────────────────────────────────────────────────────────────
const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type Touched = {
  name?: boolean;
  email?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
};

// ── Password strength rules ────────────────────────────────────────────────
const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "Uppercase letter (A–Z)", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Lowercase letter (a–z)", test: (v: string) => /[a-z]/.test(v) },
  { label: "Number (0–9)", test: (v: string) => /[0-9]/.test(v) },
];

function getPasswordStrength(v: string): { score: number; label: string; color: string } {
  const score = PASSWORD_RULES.filter(r => r.test(v)).length;
  if (score <= 1) return { score, label: "Weak", color: "bg-rose-500" };
  if (score === 2) return { score, label: "Fair", color: "bg-amber-400" };
  if (score === 3) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

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

// ── Register page ─────────────────────────────────────────────────────────────
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Touched>({});

  // ── Validators ──────────────────────────────────────────────────────────────
  const validateName = (v: string): string | undefined => {
    if (!v.trim()) return "Full name is required.";
    if (v.trim().length < 2) return "Name must be at least 2 characters.";
    if (/[^a-zA-Z\s.'"-]/.test(v)) return "Name should only contain letters and spaces.";
    return undefined;
  };

  const validateEmail = (v: string): string | undefined => {
    if (!v.trim()) return "Email address is required.";
    if (!isValidEmail(v)) return "Please enter a valid email address.";
    return undefined;
  };

  const validatePassword = (v: string): string | undefined => {
    if (!v) return "Password is required.";
    const failedRules = PASSWORD_RULES.filter(r => !r.test(v));
    if (failedRules.length > 0) return "Password does not meet all requirements below.";
    return undefined;
  };

  const validateConfirmPassword = (v: string, pw: string): string | undefined => {
    if (!v) return "Please confirm your password.";
    if (v !== pw) return "Passwords do not match.";
    return undefined;
  };

  // ── Change handlers ──────────────────────────────────────────────────────────
  const handleChange = (key: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFormData(prev => ({ ...prev, [key]: v }));

    if (!touched[key]) return;

    // Real-time re-validation
    let err: string | undefined;
    if (key === "name") err = validateName(v);
    else if (key === "email") err = validateEmail(v);
    else if (key === "password") {
      err = validatePassword(v);
      // Also revalidate confirmPassword if it's been touched
      if (touched.confirmPassword) {
        setErrors(prev => ({
          ...prev,
          password: err,
          confirmPassword: validateConfirmPassword(formData.confirmPassword, v),
        }));
        return;
      }
    } else if (key === "confirmPassword") {
      err = validateConfirmPassword(v, formData.password);
    }
    setErrors(prev => ({ ...prev, [key]: err }));
  };

  // ── Blur handlers ────────────────────────────────────────────────────────────
  const handleBlur = (key: keyof typeof formData) => () => {
    setTouched(prev => ({ ...prev, [key]: true }));
    let err: string | undefined;
    if (key === "name") err = validateName(formData.name);
    else if (key === "email") err = validateEmail(formData.email);
    else if (key === "password") err = validatePassword(formData.password);
    else if (key === "confirmPassword")
      err = validateConfirmPassword(formData.confirmPassword, formData.password);
    setErrors(prev => ({ ...prev, [key]: err }));
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Touch all fields
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    const nameErr     = validateName(formData.name);
    const emailErr    = validateEmail(formData.email);
    const passwordErr = validatePassword(formData.password);
    const confirmErr  = validateConfirmPassword(formData.confirmPassword, formData.password);

    if (nameErr || emailErr || passwordErr || confirmErr) {
      setErrors({
        name: nameErr,
        email: emailErr,
        password: passwordErr,
        confirmPassword: confirmErr,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
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

  const strength = getPasswordStrength(formData.password);
  const nameOk    = touched.name && !errors.name && formData.name;
  const emailOk   = touched.email && !errors.email && formData.email;
  const confirmOk = touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 shadow-xl shadow-slate-200/50">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/"><GyrexLogo size="md" /></Link>
        </div>

        {searchParams.get("ref") && (
          <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700 text-center">
            You are registering via a partner referral link.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Full Name</label>
            <InputWrapper hasError={!!errors.name && !!touched.name}>
              <input
                type="text"
                placeholder="Dr. Priya Sharma"
                value={formData.name}
                onChange={handleChange("name")}
                onBlur={handleBlur("name")}
                disabled={loading}
                className="w-full h-11 px-4 pr-10 rounded-xl bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {nameOk && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
              )}
            </InputWrapper>
            <FieldError msg={touched.name ? errors.name : undefined} />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email</label>
            <InputWrapper hasError={!!errors.email && !!touched.email}>
              <input
                type="email"
                placeholder="doctor@yourclinic.com"
                value={formData.email}
                onChange={handleChange("email")}
                onBlur={handleBlur("email")}
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
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Password</label>
            <InputWrapper hasError={!!errors.password && !!touched.password}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange("password")}
                onBlur={handleBlur("password")}
                disabled={loading}
                className="w-full h-11 px-4 pr-12 rounded-xl bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </InputWrapper>

            {/* Password strength bar (shows once user starts typing) */}
            {formData.password && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 grid grid-cols-4 gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          i < strength.score ? strength.color : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-[11px] font-bold ${
                    strength.score <= 1 ? "text-rose-500" :
                    strength.score === 2 ? "text-amber-500" :
                    strength.score === 3 ? "text-blue-500" : "text-emerald-600"
                  }`}>{strength.label}</span>
                </div>
                {/* Rule checklist */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                  {PASSWORD_RULES.map(rule => {
                    const passed = rule.test(formData.password);
                    return (
                      <div key={rule.label} className="flex items-center gap-1">
                        {passed
                          ? <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          : <X className="w-3 h-3 text-slate-300 shrink-0" />
                        }
                        <span className={`text-[11px] ${passed ? "text-emerald-700" : "text-slate-400"}`}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <FieldError msg={touched.password ? errors.password : undefined} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Confirm Password</label>
            <InputWrapper hasError={!!errors.confirmPassword && !!touched.confirmPassword}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                onBlur={handleBlur("confirmPassword")}
                disabled={loading}
                className="w-full h-11 px-4 pr-20 rounded-xl bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {confirmOk && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(s => !s)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </InputWrapper>
            <FieldError msg={touched.confirmPassword ? errors.confirmPassword : undefined} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <><Activity className="w-4 h-4 animate-spin" /> Creating account…</>
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

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-blue-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Activity className="w-6 h-6 animate-spin text-blue-600" /></div>}>
      <RegisterPage />
    </Suspense>
  );
}
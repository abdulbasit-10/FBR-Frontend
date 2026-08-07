"use client";

import { useState, useEffect } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, LockKeyhole, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { auth, type LoginData } from "@/lib/auth";
import { toast } from "react-toastify";
import { LogoSpinner } from "@/components/ui/logo-spinner";

function generateCaptcha() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  useEffect(() => {
    setCaptchaCode(generateCaptcha());
  }, []);

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (captchaInput !== captchaCode) {
      setError("Invalid CAPTCHA code. Please refresh and try again.");
      refreshCaptcha();
      return;
    }

    setIsSigningIn(true);

    try {
      const res = await api.post<LoginData>("/auth/login", { email, password });
      auth.save(res.data.user, res.data.tokens);
      toast.success("Signed in successfully!");
      router.push("/dashboard");
      // isSigningIn stays true — overlay persists until dashboard mounts
    } catch (err) {
      setIsSigningIn(false);
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
      refreshCaptcha();
    }
  };

  return (
    <main
      className="h-screen w-full flex overflow-hidden text-[#4F5967] dark:text-[#9ca3af] dark:bg-[#0f1117]"
      style={{ height: '100dvh', fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Left: Form Panel ── */}
      <section className="lp-section w-full lg:flex-1 flex flex-col bg-white dark:bg-[#0f1117] overflow-y-auto">
        <div className="lp-wrap min-h-full flex flex-col justify-center px-4 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-6">
          <div className="w-full max-w-[500px] mx-auto">
            {/* Logo */}
            <div className="lp-logo relative h-7 sm:h-8 w-20 sm:w-24 mb-2.5 sm:mb-3.5 shrink-0">
              <Image
                src="/brand/lOGO.ai.svg"
                alt="Encova Solution"
                fill
                priority
                className="object-contain object-left"
              />
            </div>

            {/* Form Card */}
            <div className="border border-[#E5E7EB] dark:border-[#2e2e2e] rounded-[16px] overflow-hidden">
              <div className="lp-card-hd bg-gradient-to-r from-[#C69A52] to-[#A27B3A] px-4 sm:px-6 py-2.5 sm:py-3.5 text-white space-y-1">
                <h1 className="text-[17px] sm:text-[20px] font-bold tracking-tight">Welcome Back!</h1>
                <p className="text-[11px] sm:text-[12px] leading-snug text-white/90">
                  Sign in with your email and password. If your email exists in multiple companies, you&apos;ll pick the company after verification.
                </p>
              </div>

              <div className="lp-card-bd px-4 sm:px-7 pt-2.5 sm:pt-3.5 pb-3 sm:pb-5 space-y-2 sm:space-y-3 bg-white dark:bg-[#161a21]">
                <form onSubmit={handleSubmit} className="lp-form space-y-2 sm:space-y-3">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <FieldLabel htmlFor="email">Email Address <Req /></FieldLabel>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="You@company.com"
                        className="h-9 sm:h-10 w-full rounded-[8px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#242424] pl-10 pr-4 text-[13px] sm:text-[13.5px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] focus:border-[#C69A52] focus:outline-none dark:focus:border-[#C69A52]"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <FieldLabel htmlFor="password">Password <Req /></FieldLabel>
                    <div className="relative">
                      <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Your Password"
                        className="h-9 sm:h-10 w-full rounded-[8px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#242424] pl-10 pr-10 text-[13px] sm:text-[13.5px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] focus:border-[#C69A52] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4F5967] transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember me & Forgot Password */}
                  <div className="flex items-center justify-between text-[12.5px]">
                    <label className="flex cursor-pointer select-none items-center gap-2 text-[#4F5967] dark:text-[#9ca3af]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[#D1D5DB] accent-[#C69A52]"
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotSent(true)}
                      className="font-medium text-[#C69A52] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {forgotSent && (
                    <div className="flex items-center justify-between rounded-[8px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-[#FAF6F0] dark:bg-[#2a1a08] px-3 py-2 text-[12px] text-[#A27B3A]">
                      <span>Contact your administrator to reset your password.</span>
                      <button
                        type="button"
                        onClick={() => setForgotSent(false)}
                        className="text-[16px] leading-none text-[#A27B3A] hover:opacity-75 ml-2"
                        aria-label="Dismiss"
                      >
                        &times;
                      </button>
                    </div>
                  )}

                  {/* CAPTCHA */}
                  <div className="space-y-1.5">
                    <FieldLabel htmlFor="captcha">CAPTCHA <Req /></FieldLabel>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 sm:h-10 min-w-[84px] sm:min-w-[100px] select-none items-center justify-center rounded-[8px] border border-dashed border-[#C69A52] bg-[#FAF6F0] dark:bg-[#2a1a08] font-mono text-[14px] sm:text-[16px] font-bold tracking-[4px] sm:tracking-[5px] text-[#C69A52] px-2 sm:px-3">
                        {captchaCode}
                      </div>
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-[8px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#242424] text-[#C69A52] hover:bg-[#FAF6F0] dark:hover:bg-[#2a1a08] transition-colors"
                        aria-label="Refresh captcha"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <input
                        id="captcha"
                        type="text"
                        inputMode="numeric"
                        required
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        placeholder="Enter code"
                        className="h-9 sm:h-10 min-w-0 flex-1 rounded-[8px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#242424] px-3 sm:px-3.5 text-[13px] sm:text-[13.5px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] focus:border-[#C69A52] focus:outline-none"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-[8px] border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-2.5 text-[12px] text-red-600 dark:text-red-400">
                      <span>⚠</span> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="lp-btn flex h-10 sm:h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] bg-[#C69A52] text-[13.5px] sm:text-[14px] font-semibold text-white hover:bg-[#b58b44] active:scale-[0.99] transition-all"
                  >
                    <span>Sign In</span>
                    <span>&rarr;</span>
                  </button>
                </form>

                <div className="pt-1 text-center text-[12px] text-[#9CA3AF] space-y-0.5">
                  <p>Developed by <span className="font-semibold text-[#C69A52]">Encova Solution</span></p>
                  <p>info@encovasolution.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Right: Illustration Panel ── */}
      <section className="hidden lg:flex flex-1 flex-col items-center justify-between bg-[linear-gradient(135deg,#c79a4b_0%,#a77a2b_50%,#8e641b_100%)] px-8 pt-3 pb-5 xl:px-12 xl:pt-5 xl:pb-8 text-white text-center overflow-hidden relative select-none">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 z-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0px, transparent 64px, rgba(255,255,255,0.12) 64px, rgba(255,255,255,0.12) 65px)",
            maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
          }}
        />

        {/* 1. Top Illustration (Enlarged and Shifted Up) */}
        <div className="relative z-10 w-full max-w-[520px] xl:max-w-[600px] flex items-center justify-center">
          <Image
            src="/brand/Invoice.svg"
            alt="Invoice illustration"
            width={740}
            height={520}
            priority
            className="object-contain max-h-[220px] xl:max-h-[280px]"
          />
        </div>

        {/* 2. Middle Content Group (Shifted Upwards) */}
        <div className="relative z-10 flex flex-col items-center w-full max-w-[540px] my-auto -mt-3 mb-2">
          <h2
            className="text-[28px] xl:text-[36px] font-bold leading-[1.12] tracking-[-0.02em] text-white"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            Digital Invoicing<br />System
          </h2>

          <p className="mt-1 text-[11.5px] xl:text-[12.5px] text-white/95 font-normal leading-normal">
            FBR compliant real-time e-invoicing for modern businesses
          </p>

          <div className="flex flex-wrap justify-center gap-2 mt-3 text-[11.5px] font-medium">
            <Pill >Real-time e-invoicing</Pill>
            <Pill>FBR compliant</Pill>
            <Pill>Secure &amp; encrypted</Pill>
          </div>
        </div>

        {/* 3. Separate Standalone Digital Invoicing Logo Badge */}
        <div className="relative z-10 flex justify-center mb-0.5">
          <div className="h-[50px] w-[160px] rounded-[10px] bg-white border-2 border-[#C69A52] overflow-hidden flex items-center justify-center px-3">
            <Image
              src="/brand/Digital.svg"
              alt="Digital Invoicing"
              width={180}
              height={60}
              className="object-contain h-full w-auto"
            />
          </div>
        </div>

        {/* 4. Bottom Trust Line (Kept strictly at bottom) */}
        <div className="relative z-10 flex items-center gap-2 text-[12px] text-white/85 font-medium pb-1">
          <ShieldCheck className="h-4 w-4 shrink-0 text-white/90" />
          <span>Trusted by finance teams across Pakistan</span>
        </div>
      </section>

      {/* Loading Overlay */}
      {isSigningIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="rounded-2xl border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] px-12 py-10 shadow-2xl">
            <LogoSpinner label="Signing in..." className="mx-auto" />
          </div>
        </div>
      )}
    </main>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[13px] font-medium text-[#4F5967] dark:text-[#9ca3af]">
      {children}
    </label>
  );
}

function Req() {
  return <span className="text-[#C69A52]">*</span>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[10px] border border-white/40 bg-white/20 px-3.5 py-1.5 text-white/95 backdrop-blur-[4px] shadow-xs">
      {children}
    </span>
  );
}
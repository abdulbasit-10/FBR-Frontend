"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, LockKeyhole, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { auth, type LoginData } from "@/lib/auth";

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

  // Generate captcha only on client — avoids SSR/client hydration mismatch
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

    // Show overlay immediately — API runs in background
    setIsSigningIn(true);

    try {
      const res = await api.post<LoginData>("/auth/login", { email, password });
      auth.save(res.data.user, res.data.tokens);
      window.setTimeout(() => router.push("/dashboard?signedIn=1"), 1300);
    } catch (err) {
      // Hide overlay and surface the error
      setIsSigningIn(false);
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
      refreshCaptcha();
    }
  };

  return (
    <main className="min-h-screen bg-[#edf0f4] p-3 text-[#657080] lg:p-2.5">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-310 overflow-hidden rounded-[10px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] lg:min-h-[calc(100vh-20px)] lg:grid-cols-[1fr_1.06fr]">

        {/* ── Left: Form Panel ── */}
        <section className="flex flex-col bg-[#edf0f4] px-8 py-10 lg:px-12 lg:py-10">
          {/* Logo */}
          <div className="relative hidden h-10 w-24 shrink-0 lg:block">
            <Image src="/brand/lOGO.ai.svg" alt="Encova Solution" fill priority className="object-contain object-left" />
          </div>

          {/* Form card — vertically centred */}
          <div className="my-auto w-full h-137.5 overflow-hidden rounded-[10px] border border-[#dde1e7] bg-white shadow-[0_2px_12px_rgba(23,31,44,0.07)]">

            {/* Gold header banner */}
            <div className="bg-linear-to-r from-[#c79a50] to-[#8f6516] px-6 py-5 text-white">
              <h1 className="text-[22px] font-semibold leading-none tracking-[-0.3px]">Welcome Back!</h1>
              <p className="mt-2.5 text-[12.5px] leading-[1.55] text-white/90">
                Sign in with your email and password. If your email exists in multiple companies, you&apos;ll pick the company after verification.
              </p>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="px-6 pb-5 pt-6">

              {/* Email */}
              <div className="space-y-1.5">
                <FieldLabel htmlFor="email">Email Address <Req /></FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-3.75 w-3.75 -translate-y-1/2 text-[#9eaab6]" />
                  <input
                    id="email" type="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="You@company.com"
                    className="auth-input pl-9.5"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mt-4 space-y-1.5">
                <FieldLabel htmlFor="password">Password <Req /></FieldLabel>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-3.75 w-3.75 -translate-y-1/2 text-[#9eaab6]" />
                  <input
                    id="password" type={showPassword ? "text" : "password"} required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Your Password"
                    className="auth-input pl-9.5 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#9eaab6] transition hover:text-[#6b7a88]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password */}
              <div className="mt-3 flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-1.5 text-[11.5px] text-[#798391]">
                  <input type="checkbox" className="h-3.5 w-3.5 rounded-[3px] border-[#cbd1d8] accent-[#b48736]" />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setForgotSent(true)}
                  className="text-[11.5px] text-[#b07a2a] transition hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Forgot password notice */}
              {forgotSent && (
                <div className="mt-2 flex items-center justify-between rounded-[6px] border border-[#fde9c0] bg-[#fffbf0] px-3.5 py-2.5 text-[11.5px] text-[#8a6010]">
                  <span>Contact your administrator to reset your password.</span>
                  <button
                    type="button"
                    onClick={() => setForgotSent(false)}
                    className="ml-3 shrink-0 text-[13px] leading-none text-[#b07a2a] hover:text-[#8a6010]"
                    aria-label="Dismiss"
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* CAPTCHA */}
              <div className="mt-4 space-y-1.5">
                <FieldLabel htmlFor="captcha">CAPTCHA <Req /></FieldLabel>
                <div className="flex items-center gap-2">
                  {/* Digit display */}
                  <div className="flex h-10.5 min-w-30 select-none items-center justify-center rounded-[6px] border border-dashed border-[#cdd2d9] bg-[#fafbfc] font-mono text-[16px] font-semibold tracking-[7px] text-[#a46e1c]">
                    {captchaCode}
                  </div>
                  {/* Refresh */}
                  <button
                    type="button" onClick={refreshCaptcha}
                    className="grid h-10.5 w-10 shrink-0 place-items-center rounded-[6px] border border-[#e2e7ed] bg-white text-[#c18d3d] transition hover:bg-[#fdf6ec]"
                    aria-label="Refresh captcha"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  {/* Input */}
                  <input
                    id="captcha" type="text" inputMode="numeric" required
                    value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Enter code"
                    className="auth-input min-w-0 flex-1 px-3.5"
                  />
                </div>
              </div>

              {/* Inline error */}
              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-[6px] border border-[#f5c5c5] bg-[#fff5f5] px-3.5 py-2.5 text-[12px] leading-normal text-[#c03030]">
                  <span className="mt-px shrink-0 text-[14px] leading-none">⚠</span>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="mt-5 flex h-11.5 w-full items-center justify-center gap-2 rounded-[7px] bg-linear-to-r from-[#c99c52] to-[#9f7530] text-[13.5px] font-semibold text-white shadow-sm transition hover:from-[#b88940] hover:to-[#8e6525] active:scale-[0.99]"
              >
                Sign In <span className="text-[17px] leading-none">→</span>
              </button>
            </form>

            {/* Card footer */}
            <footer className="pb-5 pt-2 text-center text-[12px] leading-[1.65] text-[#a8b0bb]">
              Developed by{" "}
              <span className="font-medium text-[#c29240]">Encova Solution</span>
              <br />
              info@encovasolution.com
            </footer>
          </div>
        </section>

        {/* ── Right: Illustration Panel ── */}
        <section className="m-2 hidden overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#c79a4b,#a77a2b_55%,#8e641b)] text-white lg:flex">
          <div className="hero-grid relative flex w-full flex-col items-center justify-between px-8 py-10 text-center">

            {/* 1 — Invoice illustration */}
            <div className="relative w-full shrink-0 overflow-visible" style={{ height: "210px" }}>
              <Image
                src="/brand/Invoice.svg"
                alt="Invoice illustration"
                width={609} height={487} priority
                className="absolute left-1/2 top-0 w-105 max-w-none -translate-x-1/2"
              />
            </div>

            {/* 2 — Heading + subtitle + pills + badge */}
            <div className="flex flex-col items-center gap-5">
              <div>
                <h2 className="text-[40px] font-semibold leading-[1.15] tracking-[-1.8px]">
                  Digital Invoicing<br />System
                </h2>
                <p className="mt-3 text-[13px] text-white/90">
                  FBR compliant real-time e-invoicing for modern businesses
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-[11.5px] font-medium text-[#3d3020]">
                <Pill>Real-time e-invoicing</Pill>
                <Pill>FBR compliant</Pill>
                <Pill>Secure &amp; encrypted</Pill>
              </div>
              <div className="relative h-12.5 w-34 overflow-hidden rounded-[13px] bg-white shadow-md">
                <Image src="/brand/Digital.svg" alt="Digital Invoicing" width={182} height={97} className="absolute -left-6 -top-4 w-46 max-w-none" />
              </div>
            </div>

            {/* 3 — Footer trust line */}
            <div className="flex items-center gap-1.5 text-[12px] text-white/80">
              <ShieldCheck className="h-4 w-4" />
              Trusted by finance teams across Pakistan
            </div>

          </div>
        </section>
      </div>

      {isSigningIn && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/45 px-4 backdrop-blur-[6px]">
          <div className="relative h-28 w-26.25 rounded-[9px] border border-[#ead5b6] bg-white shadow-[0_10px_30px_rgba(104,77,30,0.13)]">
            <div className="absolute left-5 top-3.75 grid h-16.25 w-16.25 place-items-center rounded-full border border-[#c19651] p-1">
              <div className="grid h-full w-full place-items-center rounded-full border border-[#ecd5ad] bg-white">
                <div className="flex items-center gap-1 text-left leading-[0.78] text-[#788391]">
                  <span className="relative block h-4 w-4 overflow-hidden rounded-xs border border-[#5c74a7]">
                    <i className="absolute left-0 top-0 h-1.75 w-2.75 bg-[#5c74a7]" />
                    <i className="absolute bottom-0 left-0 h-1.5 w-1.5 bg-[#36a77d]" />
                    <i className="absolute bottom-0 right-0 h-2.25 w-1.5 bg-[#7bc15c]" />
                    <i className="absolute left-1 top-1.25 h-1.25 w-2.5 bg-white" />
                  </span>
                  <span className="text-[6px] tracking-[-0.25px]">DIGITAL<br /><b className="text-[7px] font-medium">INVOICING</b></span>
                </div>
              </div>
            </div>
            <span className="absolute inset-x-0 bottom-2.5 text-center text-[8px] text-[#66717e]">Signing in...</span>
          </div>
        </div>
      )}
    </main>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[12px] font-medium text-[#4b5768]">
      {children}
    </label>
  );
}

/** Red asterisk for required fields */
function Req() {
  return <span className="text-[#c25151]">*</span>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[5px] border border-white/40 bg-white/25 px-3 py-1.5 shadow-sm backdrop-blur-[2px]">
      {children}
    </span>
  );
}

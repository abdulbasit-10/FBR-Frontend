"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, LockKeyhole, Mail, RefreshCw, ShieldCheck } from "lucide-react";

function generateCaptcha() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (captchaInput !== captchaCode) {
      alert("Invalid captcha! Please try again.");
      refreshCaptcha();
      return;
    }
    if (email === "admin@example.com" && password === "password123") {
      setIsSigningIn(true);
      window.setTimeout(() => router.push("/dashboard?signedIn=1"), 1300);
      return;
    }
    alert("Invalid email or password!");
    refreshCaptcha();
  };

  return (
    <main className="min-h-screen bg-[#f1f3f6] p-3 text-[#657080] lg:p-2.5">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1240px] overflow-hidden rounded-[9px] lg:min-h-[calc(100vh-20px)] lg:grid-cols-[1fr_1.06fr]">
        <section className="flex min-h-0 flex-col px-0 py-1 lg:min-h-0 lg:px-11 lg:py-9">
          <div className="relative hidden h-9 w-[84px] lg:block">
            <Image src="/brand/lOGO.ai.svg" alt="Encova Solution" fill priority className="object-contain object-left" />
          </div>

          <div className="my-0 w-full max-w-[548px] overflow-hidden rounded-[8px] border border-[#d9dde3] bg-white shadow-[0_1px_2px_rgba(23,31,44,0.02)] lg:my-auto">
            <div className="bg-gradient-to-r from-[#c79a50] to-[#916817] px-5 py-3.5 text-white">
              <h1 className="text-[23px] font-medium leading-none tracking-[-0.4px]">Welcome Back!</h1>
              <p className="mt-2 text-[13px] leading-[1.25] text-white/95">
                Sign in with your email and password. If your email exists in multiple<br className="hidden sm:block" /> companies, you&apos;ll pick the company after verification.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-3 pt-5 sm:px-5">
              <FieldLabel htmlFor="email">Email Address<span className="text-[#c25151] text-[9px]">*</span></FieldLabel>
              <div className="relative -mt-2">
                <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#778291]" />
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="auth-input pl-9" />
              </div>

              <FieldLabel htmlFor="password">Password<span className="text-[#c25151] text-[9px]">*</span></FieldLabel>
              <div className="relative -mt-2">
                <LockKeyhole className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#778291]" />
                <input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter Your Password" className="auth-input pl-9 pr-9" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#778291]" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="-mt-1 flex items-center justify-between text-[9px]">
                <label className="flex cursor-pointer items-center gap-1 text-[#798391]"><input type="checkbox" className="h-3 w-3 rounded-[2px] border-[#cbd1d8] accent-[#b48736]" /> Remember me</label>
                <button type="button" onClick={() => alert("Forgot password flow not implemented yet.")} className="text-[#566578] hover:underline">Forgot Password?</button>
              </div>

              <div className="pt-1">
                <FieldLabel htmlFor="captcha">CAPTCHA<span className="text-[#c25151] text-[9px]">*</span></FieldLabel>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex h-9 min-w-[130px] items-center gap-4 rounded-[4px] border border-dashed border-[#d7dce2] bg-[#fbfcfd] px-4 font-mono text-[11px] tracking-[4px] text-[#a46e1c]">
                    {captchaCode.split("").map((digit, index) => <span key={index}>{digit}</span>)}
                  </div>
                  <button type="button" onClick={refreshCaptcha} className="grid h-8 w-7 place-items-center text-[#c18d3d]" aria-label="Refresh captcha"><RefreshCw className="h-3.5 w-3.5" /></button>
                  <input id="captcha" type="text" inputMode="numeric" required value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} className="auth-input h-9 min-w-0 flex-1 px-3" />
                </div>
              </div>

              <button type="submit" className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[#c99c52] text-[11px] font-semibold text-white transition hover:bg-[#b78a42]">Sign In <span className="text-base leading-none">→</span></button>
            </form>
            <footer className="pb-4 pt-1 text-center text-[15px] leading-[1.45] text-[#a1a9b4]">Developed by <span className="text-[#c29240]">Encova Solution</span><br />info@encovasolution.com</footer>
          </div>
        </section>

        <section className="m-0.5 hidden overflow-hidden rounded-[8px] bg-[linear-gradient(135deg,#c79a4b,#a77a2b_55%,#8e641b)] text-white lg:flex">
          <div className="hero-grid relative flex w-full flex-col items-center px-6 py-7 text-center">
            <div className="relative h-[184px] w-full max-w-[360px] overflow-visible">
              <Image src="/brand/Invoice.svg" alt="Invoice illustration" width={609} height={487} priority className="absolute left-1/2 top-[-39px] w-[390px] max-w-none -translate-x-1/2" />
            </div>
            <h2 className="mt-[17px] text-[31px] font-medium leading-[1.18] tracking-[-1.5px]">Digital Invoicing<br />System</h2>
            <p className="mt-3 text-[9px] text-white/95">FBR compliant real-time e-invoicing for modern businesses</p>
            <div className="mt-6 flex flex-wrap justify-center gap-1.5 text-[8px] text-[#38352f]"><Pill>Real-time e-invoicing</Pill><Pill>FBR compliant</Pill><Pill>Secure &amp; encrypted</Pill></div>
            <div className="relative mt-5 h-[37px] w-[101px] overflow-hidden rounded-[10px] bg-white shadow-md">
              <Image src="/brand/Digital.svg" alt="Digital Invoicing" width={135} height={72} className="absolute -left-[18px] -top-[12px] w-[135px] max-w-none" />
            </div>
            <div className="mt-auto flex items-center gap-1.5 pt-12 text-[9px] text-white/90"><ShieldCheck className="h-3 w-3" />Trusted by finance teams across Pakistan</div>
          </div>
        </section>
      </div>

      {isSigningIn && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/45 px-4 backdrop-blur-[6px]">
          <div className="relative h-[112px] w-[105px] rounded-[9px] border border-[#ead5b6] bg-white shadow-[0_10px_30px_rgba(104,77,30,0.13)]">
            <div className="absolute left-[20px] top-[15px] grid h-[65px] w-[65px] place-items-center rounded-full border border-[#c19651] p-[4px]">
              <div className="grid h-full w-full place-items-center rounded-full border border-[#ecd5ad] bg-white">
                <div className="flex items-center gap-1 text-left leading-[0.78] text-[#788391]">
                  <span className="relative block h-[16px] w-[16px] overflow-hidden rounded-[2px] border border-[#5c74a7]">
                    <i className="absolute left-0 top-0 h-[7px] w-[11px] bg-[#5c74a7]" />
                    <i className="absolute bottom-0 left-0 h-[6px] w-[6px] bg-[#36a77d]" />
                    <i className="absolute bottom-0 right-0 h-[9px] w-[6px] bg-[#7bc15c]" />
                    <i className="absolute left-[4px] top-[5px] h-[5px] w-[10px] bg-white" />
                  </span>
                  <span className="text-[6px] tracking-[-0.25px]">DIGITAL<br /><b className="text-[7px] font-medium">INVOICING</b></span>
                </div>
              </div>
            </div>
            <span className="absolute inset-x-0 bottom-[10px] text-center text-[8px] text-[#66717e]">Signing in...</span>
          </div>
        </div>
      )}
    </main>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="block text-[9px] font-medium text-[#606b79]">{children}</label>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-[4px] border border-white/35 bg-white/30 px-2 py-1 shadow-sm">{children}</span>;
}

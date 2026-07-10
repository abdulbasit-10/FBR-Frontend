"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { InvoiceAnalyticsIllustration } from "@/components/auth/invoice-analytics-illustration";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy credentials
    const validEmail = "admin@example.com";
    const validPassword = "password123";

    if (email === validEmail && password === validPassword) {
      router.push("/dashboard");
    } else {
      alert("Invalid email or password!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen grid-rows-[auto_1fr] lg:grid-rows-1 lg:grid-cols-2">
        {/* Left hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background px-6 py-10 text-primary lg:px-12 lg:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(107,114,128,0.20) 1px, transparent 1px), linear-gradient(90deg, rgba(107,114,128,0.20) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative mx-auto flex h-full w-full max-w-xl flex-col justify-between gap-10 lg:max-w-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-white/90">
                  <Image
                    src="/brand/lOGO.ai.png"
                    alt="Encova Solutions logo"
                    fill
                    sizes="36px"
                    className="object-contain object-center"
                    priority
                  />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-primary">Encova</div>
                  <div className="text-xs text-primary/70">Solutions</div>
                </div>
              </div>

              <div className="rounded-full border border-primary/20 bg-white/40 px-3 py-1 text-xs font-semibold text-primary/80 backdrop-blur">
                Enterprise Edition
              </div>
            </div>

            <div className="space-y-6">
              <div className="mx-auto w-full max-w-[520px]">
                <InvoiceAnalyticsIllustration />
              </div>

              <div className="flex flex-col items-center space-y-8 text-center">
                <div className="space-y-3">
                  <h1 className="text-3xl font-extrabold tracking-tight text-primary lg:text-4xl">
                    Digital Invoicing System
                  </h1>
                  <p className="max-w-xl text-sm text-primary/75 lg:text-base">
                    FBR compliant real-time e-invoicing for modern businesses
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {["FBR compliant", "Real-time e-invoicing", "Secure & encrypted"].map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-full border border-primary/15 bg-white/40 px-3 py-1 text-xs font-semibold text-primary/80 backdrop-blur"
                    >
                      {label}
                    </span>
                  ))}
                </div>

                <div className="inline-flex items-center gap-3 rounded-2xl border border-primary/15 bg-white/40 px-4 py-3 backdrop-blur">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/50">
                    <span className="text-xs font-extrabold text-primary/90">DI</span>
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-sm font-bold text-primary/90">Digital Invoicing</div>
                    <div className="text-xs text-primary/70">Compliance & reporting</div>
                  </div>
                </div>

                <div className="flex w-full flex-col items-center gap-4 md:flex-row md:justify-center md:gap-12">
                  <div className="text-xs text-primary/70">
                    Trusted by finance teams across Pakistan
                  </div>

                  {/* <div className="text-xs text-primary/70">
                    <div className="font-semibold text-primary/80">TMR Consulting</div>
                    <div>Developed & supported</div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right login */}
        <section className="flex items-center justify-center bg-background px-6 py-12 lg:px-12">
          <Card className="w-full max-w-md rounded-3xl border border-border bg-card shadow-[0_18px_50px_-20px_rgba(0,0,0,0.18)]">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-2xl font-extrabold tracking-tight">Welcome back</CardTitle>
              <CardDescription className="text-sm">
                Sign in with your email and password
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-foreground">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 rounded-2xl pl-11 pr-4"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="password" className="text-sm font-semibold text-foreground">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => alert("Forgot password flow not implemented yet.")}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 rounded-2xl pl-11 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Sign in
                </Button>
              </form>

              <div className="text-center text-xs text-muted-foreground">
                Developed by <span className="font-semibold text-foreground">Encova Solutions</span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

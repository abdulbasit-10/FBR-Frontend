"use client";

import * as React from "react";

import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { GsapReveal } from "@/components/dashboard/gsap-reveal";

function SignedInToast({
  showSignedIn,
  setShowSignedIn,
}: {
  showSignedIn: boolean;
  setShowSignedIn: (v: boolean) => void;
}) {
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (!searchParams.get("signedIn")) return;
    setShowSignedIn(true);
    const timer = window.setTimeout(() => setShowSignedIn(false), 4000);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  if (!showSignedIn) return null;
  return (
    <div className="fixed right-4 top-3 z-50 flex w-[157px] items-center gap-1.5 rounded-[4px] border border-[#b8ebca] bg-[#ecfff2] px-3 py-3 text-[9px] font-medium text-[#16753b] shadow-sm">
      <CheckCircle2 className="h-3.5 w-3.5" /> Signed in.
    </div>
  );
}

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [showSignedIn, setShowSignedIn] = React.useState(false);

  return (
    <GsapReveal>
      <div className="h-screen w-full bg-[#f0f2f5] dark:bg-[#191919] overflow-x-hidden">
        <div className="flex h-full w-full">
          <div className="hidden lg:block h-full flex-shrink-0">
            <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <TopNav />

            <main className="relative flex-1 overflow-y-auto px-3 py-3 lg:px-4 lg:py-3">
              <React.Suspense>
                <SignedInToast
                  showSignedIn={showSignedIn}
                  setShowSignedIn={setShowSignedIn}
                />
              </React.Suspense>
              {children}
            </main>
          </div>
        </div>
      </div>
    </GsapReveal>
  );
}


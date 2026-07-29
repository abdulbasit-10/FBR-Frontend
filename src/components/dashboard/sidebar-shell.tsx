"use client";

import * as React from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { GsapReveal } from "@/components/dashboard/gsap-reveal";

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <GsapReveal>
      <div className="h-screen w-full bg-[#f0f2f5] overflow-x-hidden">
        <div className="flex h-full w-full">
          <div className="hidden lg:block h-full flex-shrink-0">
            <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <TopNav
              sidebarCollapsed={collapsed}
              onSidebarCollapsedChange={setCollapsed}
            />

            <main className="relative flex-1 overflow-y-auto bg-[#f0f2f5] px-3 py-3 lg:px-4 lg:py-3">
              {children}
            </main>
          </div>
        </div>
      </div>
    </GsapReveal>
  );
}


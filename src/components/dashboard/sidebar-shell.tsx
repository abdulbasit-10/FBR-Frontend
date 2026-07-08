"use client";

import * as React from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { GsapReveal } from "@/components/dashboard/gsap-reveal";

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <GsapReveal>
      <div className="min-h-screen w-screen bg-background overflow-hidden">
        <div className="flex min-h-screen w-full">
          <div className="hidden lg:block">
            <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <TopNav
              user={{ name: "Kainat Tajammul", role: "Developer" }}
              sidebarCollapsed={collapsed}
              onSidebarCollapsedChange={setCollapsed}
            />

            <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8">{children}</main>
          </div>
        </div>
      </div>
    </GsapReveal>
  );
}


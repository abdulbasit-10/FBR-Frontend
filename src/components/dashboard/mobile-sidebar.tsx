"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MobileSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open sidebar</span>
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-[320px] overflow-hidden rounded-r-3xl border-r bg-sidebar text-sidebar-foreground shadow-2xl">
            <div className="h-full" onClick={() => setOpen(false)}>
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}


"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-12 w-12 rounded-2xl hover:bg-accent/80 transition-all duration-500 hover:scale-110")}
      >
        <span className="relative inline-flex items-center justify-center w-full h-full">
          <Sun className="h-6 w-6 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl shadow-xl border-0 p-2">
        <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-xl text-base font-bold py-3 px-4 cursor-pointer hover:bg-accent/80">
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-xl text-base font-bold py-3 px-4 cursor-pointer hover:bg-accent/80">
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-xl text-base font-bold py-3 px-4 cursor-pointer hover:bg-accent/80">
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


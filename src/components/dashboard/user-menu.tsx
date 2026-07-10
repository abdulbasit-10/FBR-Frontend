"use client";

import { LogOut, Settings, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type UserInfo = {
  name: string;
  role: string;
};

export function UserMenu({ user }: { user: UserInfo }) {
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost" }), "h-10 gap-3 rounded-lg px-2 hover:bg-[#F3F4F6] dark:hover:bg-[#111827] transition-all")}
      >
        <span className="flex items-center gap-3">
          <Avatar className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary/70">
            <AvatarFallback className="text-xs font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <div className="text-sm font-semibold text-foreground">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.role}</div>
          </div>
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border border-[#E5E7EB] dark:border-[#1F2937] p-1">
        <DropdownMenuLabel className="text-sm font-semibold px-3 py-2">Account</DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem className="rounded-lg text-sm font-medium py-2 px-3 cursor-pointer hover:bg-[#F3F4F6] dark:hover:bg-[#111827] gap-2">
          <User className="h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-lg text-sm font-medium py-2 px-3 cursor-pointer hover:bg-[#F3F4F6] dark:hover:bg-[#111827] gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem className="text-destructive focus:text-destructive rounded-lg text-sm font-medium py-2 px-3 cursor-pointer hover:bg-destructive/10 gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


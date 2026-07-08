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
        className={cn(buttonVariants({ variant: "ghost" }), "h-14 gap-4 rounded-3xl px-4 hover:bg-accent/80 transition-all duration-500 hover:scale-105")}
      >
        <span className="flex items-center gap-4">
          <Avatar className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70">
            <AvatarFallback className="text-sm font-extrabold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left leading-tight sm:block">
            <div className="text-base font-bold">{user.name}</div>
            <div className="text-sm text-muted-foreground font-medium">{user.role}</div>
          </div>
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 rounded-3xl shadow-xl border-0 p-3">
        <DropdownMenuLabel className="text-lg font-extrabold px-3 py-2">Account</DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-3 my-2" />
        <DropdownMenuItem className="rounded-2xl text-base font-bold py-3 px-4 cursor-pointer hover:bg-accent/80 gap-3">
          <User className="h-5 w-5" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-2xl text-base font-bold py-3 px-4 cursor-pointer hover:bg-accent/80 gap-3">
          <Settings className="h-5 w-5" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="mx-3 my-2" />
        <DropdownMenuItem className="text-destructive focus:text-destructive rounded-2xl text-base font-bold py-3 px-4 cursor-pointer hover:bg-destructive/10 gap-3">
          <LogOut className="h-5 w-5" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


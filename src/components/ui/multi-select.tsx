"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
    options: readonly string[];
    value: string[];
    onChange: (next: string[]) => void;
    placeholder?: string;
    className?: string;
}

/** Lightweight checkbox-dropdown multi-select — no external deps, matches the app's plain <select> styling. */
export function MultiSelect({ options, value, onChange, placeholder = "-- Select --", className }: MultiSelectProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const toggle = (opt: string) => {
        onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "flex h-9 w-full items-center justify-between rounded-lg border px-3 text-[13px] font-medium cursor-pointer text-left",
                    className,
                )}
            >
                <span className={cn("truncate", value.length === 0 && "text-[#9CA3AF] font-normal")}>
                    {value.length === 0 ? placeholder : value.join(", ")}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
            </button>
            {open && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1c1c1c] shadow-lg py-1">
                    {options.map((opt) => {
                        const checked = value.includes(opt);
                        return (
                            <label
                                key={opt}
                                className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-[#1E293B] dark:text-[#f0f0f0] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] cursor-pointer"
                            >
                                <span
                                    className={cn(
                                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                        checked ? "bg-[#C69A52] border-[#C69A52]" : "border-[#D1D5DB] dark:border-[#4a4a4a]",
                                    )}
                                >
                                    {checked && <Check className="h-3 w-3 text-white" />}
                                </span>
                                <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(opt)} />
                                {opt}
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

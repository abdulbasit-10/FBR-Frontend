"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoSpinnerProps {
    label?: string;
    size?: number;
    className?: string;
}

/**
 * Reusable branded spinner — shows Digital.svg logo inside a spinning ring.
 * Used in: SelectCustomerModal, and any future loading states.
 */
export function LogoSpinner({ label, size = 64, className }: LogoSpinnerProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
            <div className="relative" style={{ width: size, height: size }}>
                {/* Spinning ring */}
                <svg
                    className="absolute inset-0 animate-spin"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                >
                    <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#e8d9be"
                        strokeWidth="3"
                    />
                    <path
                        d="M32 4 A28 28 0 0 1 60 32"
                        stroke="#c99d54"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Logo in center */}
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ padding: size * 0.22 }}
                >
                    <div className="relative w-full h-full">
                        <Image
                            src="/brand/Digital.svg"
                            alt="Loading"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            </div>

            {label && (
                <p className="text-xs text-[#9ca3af] tracking-wide">{label}</p>
            )}
        </div>
    );
}

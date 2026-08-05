"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoSpinnerProps {
    label?: string;
    size?: number;
    className?: string;
}

// Three rings ripple outward one by one with staggered delays
const RINGS = [
    { rFactor: 0.29, stroke: "#c99d54", strokeWidth: 2, delay: "0s" },
    { rFactor: 0.37, stroke: "#d4ad68", strokeWidth: 1.5, delay: "0.87s" },
    { rFactor: 0.45, stroke: "#e8d9be", strokeWidth: 1.5, delay: "1.74s" },
];

export function LogoSpinner({ label, size = 140, className }: LogoSpinnerProps) {
    const cx = size / 2;

    return (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <div className="relative" style={{ width: size, height: size }}>
                {RINGS.map(({ rFactor, stroke, strokeWidth, delay }, i) => (
                    <svg
                        key={i}
                        className="ring-pulse absolute inset-0"
                        style={{ animationDelay: delay }}
                        viewBox={`0 0 ${size} ${size}`}
                        width={size}
                        height={size}
                    >
                        <circle cx={cx} cy={cx} r={size * rFactor} fill="none"
                            stroke={stroke} strokeWidth={strokeWidth} />
                    </svg>
                ))}

                {/* Logo — static, centered inside all rings */}
                <div className="absolute inset-0 flex items-center justify-center"
                    style={{ padding: size * 0.24 }}>
                    <div className="relative w-full h-full">
                        <Image src="/brand/Digital.svg" alt="Loading" fill className="object-contain" />
                    </div>
                </div>
            </div>

            {label && (
                <p className="text-[13px] text-[#9ca3af] tracking-wide">{label}</p>
            )}
        </div>
    );
}

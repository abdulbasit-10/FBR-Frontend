"use client";

import { createPortal } from "react-dom";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    loadingLabel?: string;
}

/**
 * Reusable confirmation dialog — Figma-exact sizing/styling.
 * Used for: Logout, Reset Invoice, and any future destructive actions.
 */
export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    isLoading = false,
    loadingLabel,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const modal = (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 px-4 backdrop-blur-[2px]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div
                className="absolute inset-0"
                onClick={() => !isLoading && onClose()}
            />

            <div className="relative flex w-158.75 min-h-[117.73px] flex-col justify-between rounded-[10.64px] border-[1.06px] border-[#D4D4D4] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e] px-[21.27px] py-[14.89px] shadow-xl">
                {/* Title + Message */}
                <div className="text-left">
                    <h2 className="text-[15px] font-bold leading-tight text-[#111827] dark:text-[#f0f0f0]">{title}</h2>
                    <p className="mt-1 text-[12px] font-normal leading-snug text-[#8E95A2] dark:text-[#6b7280]">
                        {message}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end items-center gap-2.5 pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-[8px] border border-[#94D8D5] dark:border-[#2a4a4a] bg-[#F1F8F8] dark:bg-[#1a2e2e] px-5 py-1.5 text-[12px] font-medium text-[#2C3E50] dark:text-[#9ca3af] transition hover:bg-[#e4f3f3] dark:hover:bg-[#1e3535] disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="rounded-[8px] border border-[#FCA5A5] dark:border-[#5a1a1a] bg-[#FFF5F5] dark:bg-[#2a1a1a] px-5 py-1.5 text-[12px] font-medium text-[#2C3E50] dark:text-[#f87171] transition hover:bg-[#fee2e2] dark:hover:bg-[#3a1a1a] disabled:opacity-60"
                    >
                        {isLoading && loadingLabel ? loadingLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}

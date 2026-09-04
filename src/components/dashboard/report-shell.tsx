"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Download, Printer, RefreshCw, X, FileBarChart2, ChevronDown } from "lucide-react";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";

export const SALES_ACTIONS = ["All", "Sales Invoice", "Sales Return", "Credit Note"];
export const PURCHASE_ACTIONS = ["All", "Purchase Invoice", "Purchase Return", "Debit Note"];
export const INVENTORY_ACTIONS = ["All", "Sales Invoice", "Purchase Invoice", "Sales Return", "Purchase Return", "Inventory Adjustment"];

const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};

export interface ReportShellProps {
    title: string;
    partyLabel: string;
    partyPlaceholder: string;
    selectedParty: string;
    onSelectPartyClick: () => void;
    onClearParty: () => void;
    actionOptions: string[];
    dateFromLabel?: string;
    dateToLabel?: string;
    actionLabel?: string;
    dateFrom: string;
    onDateFromChange: (v: string) => void;
    dateTo: string;
    onDateToChange: (v: string) => void;
    action: string;
    onActionChange: (v: string) => void;
    onApplyFilters: () => void;
    onResetFilters: () => void;
    onRefresh: () => void;
    onExport?: () => void;
    onPrint?: () => void;
    isLoading: boolean;
    hasData: boolean;
    children?: React.ReactNode;
}

export function ReportShell({
    title,
    partyLabel,
    partyPlaceholder,
    selectedParty,
    onSelectPartyClick,
    onClearParty,
    actionOptions,
    dateFromLabel = "Created at from",
    dateToLabel = "Created at to",
    actionLabel = "Action",
    dateFrom, onDateFromChange,
    dateTo, onDateToChange,
    action, onActionChange,
    onApplyFilters,
    onResetFilters,
    onRefresh,
    onExport,
    onPrint,
    isLoading,
    hasData,
    children,
}: ReportShellProps) {
    const router = useRouter();

    const handleApply = () => {
        if (!dateFrom && !dateTo && !selectedParty && action === "All") {
            toast.error("Choose at least one filter before applying.");
            return;
        }
        onApplyFilters();
    };

    return (
        <div className="min-h-full space-y-2.5" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-0.5">
                <button onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-[16px] font-bold text-[#1E293B] dark:text-white hover:opacity-75 transition-opacity print:hover:opacity-100">
                    <ChevronLeft className="h-4.5 w-4.5 text-[#A27B3A] print:hidden" />
                    {title}
                </button>
                <div className="flex items-center gap-1.5 print:hidden">
                    <button type="button" onClick={() => onExport ? onExport() : toast.error("No data to export.")}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                        <Download className="h-3 w-3 text-[#A27B3A]" /> Export
                    </button>
                    <button type="button" onClick={() => onPrint ? onPrint() : window.print()}
                        className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs cursor-pointer">
                        <Printer className="h-3 w-3" /> Print
                    </button>
                    <button type="button" onClick={onRefresh}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                        <RefreshCw className="h-3 w-3 text-[#A27B3A]" /> Refresh
                    </button>
                </div>
            </div>

            {/* ── Filters card ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] p-3 shadow-xs space-y-2 print:hidden">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Filters</p>
                <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">{dateFromLabel}</label>
                        <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)}
                            className="h-9 w-40 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#1e1e1e]! text-[12px] text-[#1E293B] dark:text-white px-3 focus:outline-none focus:border-[#C69A52] scheme-light" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">{dateToLabel}</label>
                        <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)}
                            className="h-9 w-40 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#1e1e1e]! text-[12px] text-[#1E293B] dark:text-white px-3 focus:outline-none focus:border-[#C69A52] scheme-light" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">{actionLabel}</label>
                        <select value={action} onChange={(e) => onActionChange(e.target.value)}
                            className="h-9 min-w-35 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] text-[12px] text-[#1E293B] dark:text-white px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer"
                            style={selectArrow}>
                            {actionOptions.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">{partyLabel}</label>
                        <div className="relative">
                            <div role="button" tabIndex={0} onClick={onSelectPartyClick}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelectPartyClick(); }}
                                className="flex h-9 min-w-44 cursor-pointer items-center justify-between gap-2 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3 text-[12px] text-left transition-colors hover:border-[#C69A52]">
                                <span className={cn(selectedParty ? "text-[#1E293B] dark:text-white font-medium" : "text-[#9CA3AF]")}>
                                    {selectedParty || partyPlaceholder}
                                </span>
                                {selectedParty ? (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); onClearParty(); }}
                                        className="text-[#9CA3AF] hover:text-red-500 transition-colors cursor-pointer">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                ) : (
                                    <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 pb-0.5">
                        <button type="button" onClick={handleApply}
                            className="h-9 rounded-[6px] bg-[#1E293B] dark:bg-[#2d2d2d] px-4 text-[12px] font-semibold text-white hover:bg-[#0f172a] dark:hover:bg-[#3a3a3a] transition-colors cursor-pointer">
                            Apply filters
                        </button>
                        <button type="button" onClick={onResetFilters}
                            className="h-9 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                            Reset filters
                        </button>
                    </div>
                </div>
                <p className="text-[11px] text-[#9CA3AF]">
                    Choose date range, customer, or document type, then apply filters to load data.
                </p>
            </div>

            {/* ── Report content area ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] shadow-xs overflow-hidden print:rounded-none print:border-0 print:shadow-none">
                {isLoading ? (
                    <div className="py-16 text-center">
                        <LogoSpinner label="Loading report…" className="mx-auto" />
                    </div>
                ) : !hasData ? (
                    <div className="m-3 rounded-[8px] border-2 border-dashed border-[#E3D2BA] dark:border-[#3a3a3a] py-12 flex flex-col items-center gap-2.5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF6EE] dark:bg-[#2a2a2a] border border-[#E3D2BA] dark:border-[#3a3a3a]">
                            <FileBarChart2 className="h-5 w-5 text-[#C69A52]" />
                        </div>
                        <p className="text-[13px] font-semibold text-[#1E293B] dark:text-white">No report data yet</p>
                        <p className="text-[12px] text-[#9CA3AF] text-center max-w-sm">
                            Choose a date range, document type, or party filter, then click{" "}
                            <button type="button" onClick={handleApply} className="text-[#C69A52] underline underline-offset-2 font-medium cursor-pointer">
                                Apply filters
                            </button>{" "}
                            to load the report.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-[#FAF6F0] [&::-webkit-scrollbar-thumb]:bg-[#D1B88A] [&::-webkit-scrollbar-thumb]:rounded-full">
                        <table className="w-full text-[12px] border-collapse">
                            {children}
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

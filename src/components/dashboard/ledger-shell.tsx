"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Download, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";

export const DOC_TYPE_OPTIONS = ["All", "Sales Invoice", "Sales Return", "Purchase Invoice", "Purchase Return", "Credit Note", "Debit Note"];
export const ROW_OPTIONS = [50, 100, 200];

export const fmt = (n: number) =>
    n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};

export const selectCls =
    "h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";

export interface LedgerShellProps {
    title: string;
    entityTypeLabel: string;
    entityTypeOptions: string[];
    columns: string[];
    loadingLabel: string;
    emptyMessage: string;
    isLoading: boolean;
    hasRows: boolean;
    search: string;
    onSearchChange: (v: string) => void;
    dateFrom: string;
    onDateFromChange: (v: string) => void;
    dateTo: string;
    onDateToChange: (v: string) => void;
    docType: string;
    onDocTypeChange: (v: string) => void;
    entityType: string;
    onEntityTypeChange: (v: string) => void;
    rowsPerPage: number;
    onRowsPerPageChange: (v: number) => void;
    page: number;
    totalPages: number;
    onPageChange: (p: number) => void;
    onRefresh: () => void;
    dateFromLabel?: string;
    dateToLabel?: string;
    filterHint?: string;
    children: React.ReactNode; // rendered <tr> rows
}

export function LedgerShell({
    title,
    entityTypeLabel,
    entityTypeOptions,
    columns,
    loadingLabel,
    emptyMessage,
    isLoading,
    hasRows,
    search, onSearchChange,
    dateFrom, onDateFromChange,
    dateTo, onDateToChange,
    docType, onDocTypeChange,
    entityType, onEntityTypeChange,
    rowsPerPage, onRowsPerPageChange,
    page, totalPages, onPageChange,
    onRefresh,
    dateFromLabel = "Posting date from",
    dateToLabel = "Posting date to",
    filterHint,
    children,
}: LedgerShellProps) {
    const router = useRouter();

    return (
        <div className="min-h-full space-y-4 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-1">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-1.5 text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75 transition-opacity"
                >
                    <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                    {title}
                </button>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => { onRefresh(); toast.success("Ledger refreshed."); }}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors"
                    >
                        <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                    </button>
                    <button
                        type="button"
                        onClick={() => toast.success("Exported successfully.")}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs"
                    >
                        <Download className="h-3.5 w-3.5" /> Export
                    </button>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 space-y-3">
                <div className="flex items-center gap-2 max-w-2xl">
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder="Name, customer no, mapping id, NTN, STRN"
                            value={search}
                            onChange={(e) => { onSearchChange(e.target.value); onPageChange(1); }}
                            className="h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => onPageChange(1)}
                        className="h-10 rounded-[6px] bg-[#C69A52] px-6 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors shadow-xs"
                    >
                        Search
                    </button>
                </div>
                <div className="flex flex-wrap items-end gap-3 pt-1">
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">{dateFromLabel}</label>
                        <input type="date" value={dateFrom}
                            onChange={(e) => { onDateFromChange(e.target.value); onPageChange(1); }}
                            className="h-10 w-44 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] scheme-light" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">{dateToLabel}</label>
                        <input type="date" value={dateTo}
                            onChange={(e) => { onDateToChange(e.target.value); onPageChange(1); }}
                            className="h-10 w-44 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] scheme-light" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Document type</label>
                        <select value={docType} onChange={(e) => { onDocTypeChange(e.target.value); onPageChange(1); }}
                            className={cn(selectCls, "min-w-35")} style={selectArrow}>
                            {DOC_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">{entityTypeLabel}</label>
                        <select value={entityType} onChange={(e) => { onEntityTypeChange(e.target.value); onPageChange(1); }}
                            className={cn(selectCls, "min-w-35")} style={selectArrow}>
                            {entityTypeOptions.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                </div>
                {filterHint && <p className="text-[11px] text-[#9CA3AF] pt-0.5">{filterHint}</p>}
            </div>

            {/* ── Table container ── */}
            <div className="rounded-[16px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                    <button type="button" onClick={() => toast.success("Exported successfully.")}
                        className="flex h-8 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <Download className="h-3.5 w-3.5 text-[#A27B3A]" /> Export
                    </button>
                    <p className="text-[11px] text-[#9CA3AF] italic">Scroll right to view row actions</p>
                </div>

                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-[#FAF6F0] [&::-webkit-scrollbar-thumb]:bg-[#D1B88A] [&::-webkit-scrollbar-thumb]:rounded-full">
                    <table className="w-full text-[12px] border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                {columns.map((col) => (
                                    <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-12 text-center bg-white dark:bg-[#242424]">
                                        <LogoSpinner label={loadingLabel} className="mx-auto" />
                                    </td>
                                </tr>
                            ) : !hasRows ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-12 text-center bg-white dark:bg-[#242424]">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6EE]">
                                                <BookOpen className="h-5 w-5 text-[#C69A52]" />
                                            </div>
                                            <p className="text-[12px] text-[#9CA3AF] italic">{emptyMessage}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : children}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">Row</span>
                        <select value={rowsPerPage} onChange={(e) => { onRowsPerPageChange(Number(e.target.value)); onPageChange(1); }}
                            className="h-8 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-2 focus:outline-none focus:border-[#C69A52] appearance-none"
                            style={selectArrow}>
                            {ROW_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">
                            Page <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{page}</span> of{" "}
                            <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{totalPages}</span>
                        </span>
                        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

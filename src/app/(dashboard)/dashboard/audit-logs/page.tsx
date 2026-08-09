"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, ChevronRight, Download, RefreshCw,
    SlidersHorizontal, X, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";
import { selectArrow, selectCls, btnOutline } from "@/components/dashboard/transaction-list-shell";
import { toast } from "react-toastify";
import { apiLogsService, type ApiLog } from "@/lib/services";

// Shape the backend ApiLog into the row layout this page renders.
interface AuditLog {
    id: number;
    company: string;
    user: string;
    email: string;
    action: string;
    entity: string;
    description: string;
    createdAt: string;
}

const toRow = (l: ApiLog): AuditLog => {
    // Entity is the first path segment (e.g. "/invoices/abc-uuid" → "Invoice").
    const first = (l.endpoint.split("/").filter(Boolean)[0] ?? "").toLowerCase();
    const entity = first
        ? first.charAt(0).toUpperCase() + first.slice(1).replace(/s$/, "")
        : l.direction === "outbound"
          ? "FBR"
          : "System";
    const status = l.responseStatus ?? "—";
    return {
        id: l.id,
        company: l.companyId ? `Company #${l.companyId}` : "—",
        user: l.userId ? `User #${l.userId}` : "System",
        email: "—",
        action: l.method,
        entity,
        description: `${l.direction === "outbound" ? "→ FBR " : ""}${l.method} ${l.endpoint} · ${status}${
            l.errorMessage ? ` · ${l.errorMessage}` : ""
        }`,
        createdAt: l.createdAt.replace("T", " ").replace(/\.\d+Z?$/, ""),
    };
};

const ACTION_OPTIONS = ["All", "GET", "POST", "PUT", "DELETE"];
const ENTITY_OPTIONS = ["All", "Invoice", "Customer", "Product", "User", "Setting", "FBR"];
const PAGE_SIZE = 50;

const TABLE_COLS = ["Company", "User", "Method", "Entity", "Description", "Created at"];

export default function AuditLogsPage() {
    const router = useRouter();
    const [showFilters, setShowFilters] = useState(false);

    // pending filter state (before Apply)
    const [pendingAction, setPendingAction] = useState("All");
    const [pendingEntity, setPendingEntity] = useState("All");
    const [pendingFrom, setPendingFrom] = useState("");
    const [pendingTo, setPendingTo] = useState("");

    // applied filter state
    const [appliedAction, setAppliedAction] = useState("All");
    const [appliedEntity, setAppliedEntity] = useState("All");
    const [appliedFrom, setAppliedFrom] = useState("");
    const [appliedTo, setAppliedTo] = useState("");

    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    const load = useCallback(
        (showToast = false) => {
            setIsLoading(true);
            setLogs([]);
            apiLogsService
                .list({
                    page,
                    limit: PAGE_SIZE,
                    search: search.trim() || undefined,
                    from: appliedFrom || undefined,
                    to: appliedTo || undefined,
                })
                .then((res) => {
                    setLogs(res.data.rows.map(toRow));
                    setTotal(res.data.meta.total);
                    if (showToast) toast.success("Audit logs refreshed.");
                })
                .catch((err) =>
                    toast.error(err instanceof Error ? err.message : "Failed to load audit logs."),
                )
                .finally(() => setIsLoading(false));
        },
        [page, search, appliedFrom, appliedTo],
    );

    useEffect(() => load(), [load]);

    const applyFilters = () => {
        setAppliedAction(pendingAction); setAppliedEntity(pendingEntity);
        setAppliedFrom(pendingFrom); setAppliedTo(pendingTo);
        setPage(1);
        toast.success("Filters applied.");
    };

    const resetFilters = () => {
        setPendingAction("All"); setPendingEntity("All");
        setPendingFrom(""); setPendingTo("");
        setAppliedAction("All"); setAppliedEntity("All");
        setAppliedFrom(""); setAppliedTo("");
        setPage(1);
        toast.info("Filters cleared.");
    };

    const filtered = logs.filter((log) => {
        // Server handles search/date; apply action/entity client-side for the current page.
        return (
            (appliedAction === "All" || log.action === appliedAction) &&
            (appliedEntity === "All" || log.entity === appliedEntity)
        );
    });

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const paginated = filtered;

    return (
        <div className="min-h-full space-y-4 text-[#4f5967]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-1">
                <button onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-1.5 text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75 transition-opacity">
                    <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                    Audit logs
                </button>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => toast.success("Exported successfully.")} className={`h-9 ${btnOutline}`}>
                        <Download className="h-3.5 w-3.5 text-[#A27B3A]" /> Export
                    </button>
                    <button type="button" onClick={() => load(true)} className={`h-9 ${btnOutline}`}>
                        <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                    </button>
                    <button type="button" onClick={() => setShowFilters((v) => !v)}
                        className={cn(`h-9 ${btnOutline}`, showFilters && "border-[#C69A52] bg-[#FAF6F0] dark:bg-[#2a1e0a] text-[#A27B3A]")}>
                        <SlidersHorizontal className="h-3.5 w-3.5 text-[#A27B3A]" />
                        {showFilters ? "Hide filters" : "Show filters"}
                    </button>
                </div>
            </div>

            {/* ── FILTERS card (toggleable) ── */}
            {showFilters && (
                <div className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5 shadow-xs space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Filters</p>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1">
                            <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Action</label>
                            <select value={pendingAction} onChange={(e) => setPendingAction(e.target.value)}
                                className={cn(selectCls, "min-w-35")} style={selectArrow}>
                                {ACTION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Entity</label>
                            <select value={pendingEntity} onChange={(e) => setPendingEntity(e.target.value)}
                                className={cn(selectCls, "min-w-35")} style={selectArrow}>
                                {ENTITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Created at from</label>
                            <input type="date" value={pendingFrom} onChange={(e) => setPendingFrom(e.target.value)}
                                className="h-10 w-44 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] scheme-light dark:scheme-dark" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Created at to</label>
                            <input type="date" value={pendingTo} onChange={(e) => setPendingTo(e.target.value)}
                                className="h-10 w-44 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] scheme-light dark:scheme-dark" />
                        </div>
                        <div className="flex items-center gap-2 pb-0.5">
                            <button type="button" onClick={applyFilters}
                                className="h-10 rounded-[6px] bg-[#1E293B] dark:bg-[#2d2d2d] px-5 text-[12px] font-semibold text-white hover:bg-[#0f172a] dark:hover:bg-[#3a3a3a] transition-colors">
                                Apply filters
                            </button>
                            <button type="button" onClick={resetFilters}
                                className={`h-10 ${btnOutline} px-4`}>
                                Reset filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ACTIVITY card ── */}
            <div className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] shadow-xs">
                <div className="p-5 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Activity</p>

                    {/* Search row */}
                    <div className="flex items-center gap-2 max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                            <Input type="text" value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Search within this page (company, user, email, description)..."
                                className="h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! pl-9 text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none" />
                        </div>
                        <button type="button" onClick={() => setPage(1)}
                            className="h-10 rounded-[6px] bg-[#C69A52] px-5 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors">
                            Search
                        </button>
                        <button type="button" onClick={() => { setSearch(""); setPage(1); }}
                            className={`h-10 ${btnOutline} gap-1`}>
                            <X className="h-3.5 w-3.5 text-[#9CA3AF]" /> Clear
                        </button>
                        {!isLoading && (
                            <span className="text-[12px] text-[#9CA3AF] whitespace-nowrap">
                                {filtered.length} row(s) on this page ({total} total)
                            </span>
                        )}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-[#FAF6F0] [&::-webkit-scrollbar-thumb]:bg-[#D1B88A] [&::-webkit-scrollbar-thumb]:rounded-full">
                        <table className="w-full text-[12px] border-collapse">
                            <thead>
                                <tr className="bg-[#C69A52] text-white">
                                    {TABLE_COLS.map((col) => (
                                        <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={TABLE_COLS.length} className="py-12 text-center bg-white dark:bg-[#242424]">
                                            <LogoSpinner label="Loading..." className="mx-auto" />
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={TABLE_COLS.length} className="py-10 text-center text-[12px] text-[#9CA3AF] italic bg-white dark:bg-[#242424]">
                                            No logs for these filters.
                                        </td>
                                    </tr>
                                ) : paginated.map((log, i) => (
                                    <tr key={log.id} className={cn(i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#1e1e1e]/50", "hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors")}>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{log.company}</td>
                                        <td className="px-3 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{log.user}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold", {
                                                "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800": log.action === "GET",
                                                "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800": log.action === "POST",
                                                "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800": log.action === "PUT",
                                                "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800": log.action === "DELETE",
                                            })}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{log.entity}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] max-w-xs truncate" title={log.description}>{log.description}</td>
                                        <td className="px-3 py-2.5 text-[#9CA3AF] whitespace-nowrap">{log.createdAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between border-t border-[#F3F4F6] dark:border-[#2e2e2e] px-5 py-3">
                    <span className="text-[12px] text-[#9CA3AF]">
                        {isLoading ? "—" : total} logs total
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">
                            Page <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{page}</span> of{" "}
                            <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{totalPages}</span>
                        </span>
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

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

const MOCK_LOGS: AuditLog[] = [
    { id: 1, company: "Bio World Traders", user: "Super Admin", email: "admin@bioworld.com", action: "Created", entity: "Invoice", description: "Created sales invoice SI-0001 for ABC Corporation", createdAt: "2026-07-01 09:14:22" },
    { id: 2, company: "Bio World Traders", user: "Super Admin", email: "admin@bioworld.com", action: "Posted", entity: "Invoice", description: "Posted invoice SI-0001", createdAt: "2026-07-01 09:15:05" },
    { id: 3, company: "Bio World Traders", user: "Super Admin", email: "admin@bioworld.com", action: "Created", entity: "Purchase", description: "Created purchase invoice PI-0001 from Alpha Suppliers", createdAt: "2026-07-02 10:22:10" },
    { id: 4, company: "Bio World Traders", user: "Kainat Tajamul", email: "kainat@bioworld.com", action: "Updated", entity: "Customer", description: "Updated customer C-0002 XYZ Ltd contact details", createdAt: "2026-07-03 14:38:47" },
    { id: 5, company: "Bio World Traders", user: "Super Admin", email: "admin@bioworld.com", action: "Login", entity: "User", description: "User logged in from 192.168.1.10", createdAt: "2026-07-05 08:01:33" },
    { id: 6, company: "Bio World Traders", user: "Kainat Tajamul", email: "kainat@bioworld.com", action: "Deleted", entity: "Invoice", description: "Deleted draft invoice SI-0007", createdAt: "2026-07-06 11:55:00" },
    { id: 7, company: "Bio World Traders", user: "Super Admin", email: "admin@bioworld.com", action: "Created", entity: "Vendor", description: "Created vendor V-0003 Gamma Imports", createdAt: "2026-07-08 16:04:18" },
    { id: 8, company: "Bio World Traders", user: "Super Admin", email: "admin@bioworld.com", action: "Logout", entity: "User", description: "User session ended", createdAt: "2026-07-08 17:30:00" },
];

const ACTION_OPTIONS = ["All", "Created", "Updated", "Deleted", "Posted", "Unposted", "Login", "Logout"];
const ENTITY_OPTIONS = ["All", "Invoice", "Purchase", "Customer", "Vendor", "Item", "User", "Settings"];
const PAGE_SIZE = 50;

const TABLE_COLS = ["Company", "User", "Email", "Action", "Entity", "Description", "Created at"];

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
    const [page, setPage] = useState(1);

    const load = useCallback(() => {
        setIsLoading(true); setLogs([]);
        const t = setTimeout(() => { setLogs(MOCK_LOGS); setIsLoading(false); }, 1000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => load(), [load]);

    const applyFilters = () => {
        setAppliedAction(pendingAction); setAppliedEntity(pendingEntity);
        setAppliedFrom(pendingFrom); setAppliedTo(pendingTo);
        setPage(1);
    };

    const resetFilters = () => {
        setPendingAction("All"); setPendingEntity("All");
        setPendingFrom(""); setPendingTo("");
        setAppliedAction("All"); setAppliedEntity("All");
        setAppliedFrom(""); setAppliedTo("");
        setPage(1);
    };

    const filtered = logs.filter((log) => {
        const q = search.toLowerCase();
        return (
            (!q || log.company.toLowerCase().includes(q) || log.user.toLowerCase().includes(q) ||
                log.email.toLowerCase().includes(q) || log.description.toLowerCase().includes(q)) &&
            (appliedAction === "All" || log.action === appliedAction) &&
            (appliedEntity === "All" || log.entity === appliedEntity) &&
            (!appliedFrom || log.createdAt >= appliedFrom) &&
            (!appliedTo || log.createdAt <= appliedTo)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="min-h-full space-y-4 text-[#4f5967]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-1">
                <button onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-1.5 text-[18px] font-bold text-[#1E293B] hover:opacity-75 transition-opacity">
                    <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                    Audit logs
                </button>
                <div className="flex items-center gap-2">
                    <button type="button" className={`h-9 ${btnOutline}`}>
                        <Download className="h-3.5 w-3.5 text-[#A27B3A]" /> Export
                    </button>
                    <button type="button" onClick={load} className={`h-9 ${btnOutline}`}>
                        <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                    </button>
                    <button type="button" onClick={() => setShowFilters((v) => !v)}
                        className={cn(`h-9 ${btnOutline}`, showFilters && "border-[#C69A52] bg-[#FAF6F0] text-[#A27B3A]")}>
                        <SlidersHorizontal className="h-3.5 w-3.5 text-[#A27B3A]" />
                        {showFilters ? "Hide filters" : "Show filters"}
                    </button>
                </div>
            </div>

            {/* ── FILTERS card (toggleable) ── */}
            {showFilters && (
                <div className="rounded-[11px] border border-[#E5E7EB] bg-white p-5 shadow-xs space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Filters</p>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1">
                            <label className="text-[12px] font-medium text-[#4F5967] block">Action</label>
                            <select value={pendingAction} onChange={(e) => setPendingAction(e.target.value)}
                                className={cn(selectCls, "min-w-35")} style={selectArrow}>
                                {ACTION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[12px] font-medium text-[#4F5967] block">Entity</label>
                            <select value={pendingEntity} onChange={(e) => setPendingEntity(e.target.value)}
                                className={cn(selectCls, "min-w-35")} style={selectArrow}>
                                {ENTITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[12px] font-medium text-[#4F5967] block">Created at from</label>
                            <input type="date" value={pendingFrom} onChange={(e) => setPendingFrom(e.target.value)}
                                className="h-10 w-44 rounded-[6px] border border-[#D1D5DB] bg-white text-[12px] text-[#1E293B] px-3 focus:outline-none focus:border-[#C69A52] scheme-light" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[12px] font-medium text-[#4F5967] block">Created at to</label>
                            <input type="date" value={pendingTo} onChange={(e) => setPendingTo(e.target.value)}
                                className="h-10 w-44 rounded-[6px] border border-[#D1D5DB] bg-white text-[12px] text-[#1E293B] px-3 focus:outline-none focus:border-[#C69A52] scheme-light" />
                        </div>
                        <div className="flex items-center gap-2 pb-0.5">
                            <button type="button" onClick={applyFilters}
                                className="h-10 rounded-[6px] bg-[#1E293B] px-5 text-[12px] font-semibold text-white hover:bg-[#0f172a] transition-colors">
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
            <div className="rounded-[11px] border border-[#E5E7EB] bg-white shadow-xs">
                <div className="p-5 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Activity</p>

                    {/* Search row */}
                    <div className="flex items-center gap-2 max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                            <Input type="text" value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Search within this page (company, user, email, description)..."
                                className="h-10 rounded-[6px] border border-[#D1D5DB] bg-white! pl-9 text-[12px] text-[#1E293B] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none" />
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
                                {filtered.length} row(s) shown
                            </span>
                        )}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-[#FAF6F0] [&::-webkit-scrollbar-thumb]:bg-[#D1B88A] [&::-webkit-scrollbar-thumb]:rounded-full">
                        <table className="w-full text-[12px] border-collapse">
                            <thead>
                                <tr className="bg-[#C69A52] text-white">
                                    {TABLE_COLS.map((col) => (
                                        <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F3F4F6]">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={TABLE_COLS.length} className="py-12 text-center bg-white">
                                            <LogoSpinner label="Loading..." className="mx-auto" />
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={TABLE_COLS.length} className="py-10 text-center text-[12px] text-[#9CA3AF] italic bg-white">
                                            No logs for these filters.
                                        </td>
                                    </tr>
                                ) : paginated.map((log, i) => (
                                    <tr key={log.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#FAF6F0]/30", "hover:bg-[#FAF6F0] transition-colors")}>
                                        <td className="px-3 py-2.5 text-[#4F5967] whitespace-nowrap">{log.company}</td>
                                        <td className="px-3 py-2.5 font-medium text-[#1E293B] whitespace-nowrap">{log.user}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967]">{log.email}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", {
                                                "bg-green-50 text-green-700 border border-green-200": log.action === "Created" || log.action === "Posted",
                                                "bg-yellow-50 text-yellow-700 border border-yellow-200": log.action === "Updated" || log.action === "Unposted",
                                                "bg-red-50 text-red-600 border border-red-200": log.action === "Deleted",
                                                "bg-blue-50 text-blue-600 border border-blue-200": log.action === "Login" || log.action === "Logout",
                                            })}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-[#4F5967]">{log.entity}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] max-w-xs truncate">{log.description}</td>
                                        <td className="px-3 py-2.5 text-[#9CA3AF] whitespace-nowrap">{log.createdAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between border-t border-[#F3F4F6] px-5 py-3">
                    <span className="text-[12px] text-[#9CA3AF]">
                        {isLoading ? "—" : filtered.length} logs total
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] bg-white text-[#4F5967] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[12px] text-[#4F5967]">
                            Page <span className="font-semibold text-[#1E293B]">{page}</span> of{" "}
                            <span className="font-semibold text-[#1E293B]">{totalPages}</span>
                        </span>
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] bg-white text-[#4F5967] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";
import { selectArrow, selectCls, btnOutline } from "@/components/dashboard/transaction-list-shell";

interface SupportRequest {
    id: number;
    no: string;
    title: string;
    status: "Open" | "In Progress" | "Resolved" | "Closed";
    createdAt: string;
}

const MOCK_REQUESTS: SupportRequest[] = [
    { id: 1, no: "SR-0001", title: "Unable to post sales invoice SI-0003", status: "Open", createdAt: "2026-07-10 09:22:11" },
    { id: 2, no: "SR-0002", title: "FBR sync not working for purchase invoices", status: "In Progress", createdAt: "2026-07-15 14:05:33" },
    { id: 3, no: "SR-0003", title: "Discount not calculating correctly on returns", status: "Resolved", createdAt: "2026-07-20 11:48:00" },
];

const STATUS_OPTIONS = ["All", "Open", "In Progress", "Resolved", "Closed"];
const PAGE_SIZE = 50;

const STATUS_BADGE: Record<SupportRequest["status"], string> = {
    "Open": "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
    "In Progress": "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
    "Resolved": "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
    "Closed": "bg-[#F3F4F6] dark:bg-[#2a2a2a] text-[#6B7280] dark:text-[#9ca3af] border border-[#E5E7EB] dark:border-[#3a3a3a]",
};

export default function SupportPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [requests, setRequests] = useState<SupportRequest[]>([]);
    const [page, setPage] = useState(1);

    const load = useCallback(() => {
        setIsLoading(true); setRequests([]);
        const t = setTimeout(() => { setRequests(MOCK_REQUESTS); setIsLoading(false); }, 1000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => load(), [load]);

    const resetFilters = () => { setSearch(""); setStatusFilter("All"); setPage(1); };

    const filtered = requests.filter((r) => {
        const q = search.toLowerCase();
        return (
            (!q || r.title.toLowerCase().includes(q) || r.no.toLowerCase().includes(q)) &&
            (statusFilter === "All" || r.status === statusFilter)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="min-h-full space-y-4 text-[#4f5967]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-1">
                <button onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-1.5 text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75 transition-opacity">
                    <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                    Support
                </button>
                <button type="button" onClick={() => router.push("/dashboard/support/new")}
                    className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                    <Plus className="h-3.5 w-3.5" /> New Request
                </button>
            </div>

            {/* ── Filters card ── */}
            <div className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5 shadow-xs space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Filters</p>
                <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1 flex-1 min-w-60">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Action</label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Input type="text" value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Search within this page (company, user, email, description)..."
                                    className="h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none" />
                            </div>
                            <button type="button" onClick={() => setPage(1)}
                                className="h-10 rounded-[6px] bg-[#C69A52] px-5 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors">
                                Search
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Status</label>
                        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className={cn(selectCls, "min-w-35")} style={selectArrow}>
                            {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="pb-0.5">
                        <button type="button" onClick={resetFilters} className={`h-10 ${btnOutline} px-4`}>
                            Reset filters
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Requests card ── */}
            <div className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] shadow-xs">
                <div className="p-5 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Requests</p>

                    <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                        <table className="w-full text-[12px] border-collapse">
                            <thead>
                                <tr className="bg-[#C69A52] text-white">
                                    {["No", "Title", "Status", "Created"].map((col) => (
                                        <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center bg-white dark:bg-[#242424]">
                                            <LogoSpinner label="Loading..." className="mx-auto" />
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-10 text-center text-[12px] text-[#9CA3AF] italic bg-white dark:bg-[#242424]">
                                            No requests yet.
                                        </td>
                                    </tr>
                                ) : paginated.map((r, i) => (
                                    <tr key={r.id} className={cn("cursor-pointer transition-colors hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]", i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#1e1e1e]/50")}
                                        onClick={() => { }}>
                                        <td className="px-3 py-2.5 font-medium text-[#C69A52] whitespace-nowrap">{r.no}</td>
                                        <td className="px-3 py-2.5 text-[#1E293B] dark:text-[#f0f0f0]">{r.title}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", STATUS_BADGE[r.status])}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-[#9CA3AF] whitespace-nowrap">{r.createdAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Pagination (centered per Figma) ── */}
                <div className="flex items-center justify-center border-t border-[#F3F4F6] dark:border-[#2e2e2e] py-3 gap-2">
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
    );
}

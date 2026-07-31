"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    RefreshCw,
    Plus,
    CheckSquare,
    Printer,
    Copy,
    Download,
    ChevronLeft,
    ChevronRight,
    FileText,
    Square,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SalesInvoice {
    id: number;
    invoiceNo: string;
    customerNo: string;
    customerName: string;
    status: "Posted" | "UnPosted" | "Cancelled";
    docDate: string;
    postingDate: string;
    assessedValue: number;
    amtExclDisc: number;
    discount: number;
    amtExclST: number;
    salesTax: number;
    amtInclST: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_INVOICES: SalesInvoice[] = [
    { id: 1, invoiceNo: "SI-0001", customerNo: "C-0001", customerName: "ABC Corporation", status: "Posted", docDate: "2026-07-01", postingDate: "2026-07-01", assessedValue: 50000, amtExclDisc: 50000, discount: 0, amtExclST: 50000, salesTax: 8500, amtInclST: 58500 },
    { id: 2, invoiceNo: "SI-0002", customerNo: "C-0002", customerName: "XYZ Ltd", status: "Posted", docDate: "2026-07-03", postingDate: "2026-07-03", assessedValue: 25000, amtExclDisc: 25000, discount: 2500, amtExclST: 22500, salesTax: 3825, amtInclST: 26325 },
    { id: 3, invoiceNo: "SI-0003", customerNo: "C-0003", customerName: "Global Traders", status: "UnPosted", docDate: "2026-07-05", postingDate: "2026-07-05", assessedValue: 75000, amtExclDisc: 75000, discount: 0, amtExclST: 75000, salesTax: 12750, amtInclST: 87750 },
    { id: 4, invoiceNo: "SI-0004", customerNo: "C-0001", customerName: "ABC Corporation", status: "Posted", docDate: "2026-07-10", postingDate: "2026-07-10", assessedValue: 15000, amtExclDisc: 15000, discount: 1500, amtExclST: 13500, salesTax: 2295, amtInclST: 15795 },
    { id: 5, invoiceNo: "SI-0005", customerNo: "C-0004", customerName: "Metro Supplies", status: "Cancelled", docDate: "2026-07-12", postingDate: "2026-07-12", assessedValue: 32000, amtExclDisc: 32000, discount: 0, amtExclST: 32000, salesTax: 5440, amtInclST: 37440 },
];

const STATUS_OPTIONS = ["All", "Posted", "UnPosted", "Cancelled"];
const SOURCE_OPTIONS = ["All", "Manual", "API", "Import"];
const ROW_OPTIONS = [50, 100, 200];

const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TABLE_COLS = [
    "Invoice no", "Customer No", "Customer Name", "Status",
    "Doc date", "Posting date", "Assessed value",
    "Amt excl disc", "Discount", "Amt excl ST", "Sales tax", "Amt incl ST",
];

const selectStyle = "h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";
const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};

export default function SalesInvoicesPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [status, setStatus] = useState("All");
    const [source, setSource] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);

    const load = useCallback(() => {
        setIsLoading(true);
        setInvoices([]);
        const t = setTimeout(() => { setInvoices(MOCK_INVOICES); setIsLoading(false); }, 1000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => load(), [load]);

    const filtered = invoices.filter((inv) => {
        const q = search.toLowerCase();
        const matchesSearch = !q ||
            inv.invoiceNo.toLowerCase().includes(q) ||
            inv.customerNo.toLowerCase().includes(q) ||
            inv.customerName.toLowerCase().includes(q);
        const matchesStatus = status === "All" || inv.status === status;
        const matchesSource = source === "All";
        const matchesFrom = !dateFrom || inv.docDate >= dateFrom;
        const matchesTo = !dateTo || inv.docDate <= dateTo;
        return matchesSearch && matchesStatus && matchesSource && matchesFrom && matchesTo;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const toggleSelect = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((i) => i.id)));
    };

    const statusBadge = (s: SalesInvoice["status"]) => {
        const map = {
            Posted: "bg-green-50 text-green-700 border border-green-200",
            UnPosted: "bg-yellow-50 text-yellow-700 border border-yellow-200",
            Cancelled: "bg-red-50 text-red-600 border border-red-200",
        };
        return (
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", map[s])}>
                {s}
            </span>
        );
    };

    return (
        <div className="min-h-full space-y-4 text-[#4f5967]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Page Level Header Bar ── */}
            <div className="flex items-center justify-between pb-1">
                <h1 className="text-[18px] font-bold text-[#1E293B]">All Sales Invoices</h1>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => load()}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] bg-white px-3.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors"
                    >
                        <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/sales/create-invoice")}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs"
                    >
                        <Plus className="h-3.5 w-3.5" /> New
                    </button>
                    <button
                        type="button"
                        onClick={toggleAll}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] bg-white px-3.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors"
                    >
                        <CheckSquare className="h-3.5 w-3.5 text-[#A27B3A]" /> Select All
                    </button>
                    <button
                        type="button"
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] bg-white px-3.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors"
                    >
                        <Printer className="h-3.5 w-3.5 text-[#A27B3A]" /> Print
                    </button>
                    <button
                        type="button"
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] bg-white px-3.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors"
                    >
                        <Copy className="h-3.5 w-3.5 text-[#A27B3A]" /> Copy
                    </button>
                </div>
            </div>

            {/* ── SMTP warning banner ── */}
            <div className="rounded-[6px] border border-[#F3D89A] dark:border-[#4a3010] bg-[#FFFBEB] dark:bg-[#1e1a08] px-4 py-2.5">
                <p className="text-[11px] text-[#92590A] italic">
                    Email filter is hidden until SMTP is configured on the company profile.
                </p>
            </div>

            {/* ── SECTION 1: FILTER CONTAINER ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 space-y-3 min-h-43.25">
                {/* Search Input Row */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Input
                            type="text"
                            placeholder="Name, customer no, mapping id, NTN, STRN,"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] shadow-none"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setPage(1)}
                        className="h-10 rounded-[6px] bg-[#C69A52] px-6 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors shadow-xs"
                    >
                        Search
                    </button>
                </div>

                {/* Filter Dropdowns Row */}
                <div className="flex flex-wrap items-end gap-3 pt-1">
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Date from</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                            className="h-10 w-44 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] shadow-none scheme-light"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Date to</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                            className="h-10 w-44 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] shadow-none scheme-light"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Status</label>
                        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={cn(selectStyle, "h-10 min-w-30")} style={selectArrow}>
                            {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Source</label>
                        <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className={cn(selectStyle, "h-10 min-w-30")} style={selectArrow}>
                            {SOURCE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                </div>

                {/* Helper text */}
                <p className="text-[11px] text-[#9CA3AF] pt-0.5">
                    Date range includes invoices where document date or posting date falls between the selected days (inclusive). Leave dates empty to load all periods. Provide both from and to, or neither.
                </p>
            </div>


            {/* ── SECTION 2: TABLE & ACTIONS CONTAINER ── */}
            <div className="rounded-[16px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 shadow-xs space-y-3">

                {/* Export & Row Info Bar */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        className="flex h-8 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors"
                    >
                        <Download className="h-3.5 w-3.5 text-[#A27B3A]" /> Export
                    </button>
                    <p className="text-[11px] text-[#9CA3AF] italic">Scroll right to view row actions</p>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                    <table className="w-full text-[12px] min-w-225 border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                <th className="w-10 px-3 py-2.5 text-center">
                                    <button
                                        type="button"
                                        onClick={toggleAll}
                                        className="h-4 w-4 rounded-[3px] border border-white/60 bg-transparent flex items-center justify-center mx-auto hover:border-white transition-colors"
                                    >
                                        <Square className="h-3 w-3 text-white fill-white/20" />
                                    </button>
                                </th>
                                {TABLE_COLS.map((col) => (
                                    <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length + 1} className="py-10 text-center bg-white dark:bg-[#242424]">
                                        <LogoSpinner label="Loading Sales Invoices..." className="mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length + 1} className="py-12 text-center bg-white dark:bg-[#242424]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6EE]">
                                                <FileText className="h-5 w-5 text-[#C69A52]" />
                                            </div>
                                            <p className="text-[12px] text-[#9CA3AF] italic">No invoices match the current filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((inv, i) => (
                                    <tr
                                        key={inv.id}
                                        className={cn(
                                            "cursor-pointer transition-colors",
                                            i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]",
                                            "hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]",
                                            selected.has(inv.id) && "bg-[#FAF6F0] dark:bg-[#3a2a10]"
                                        )}
                                        onClick={() => toggleSelect(inv.id)}
                                    >
                                        <td className="px-3 py-2.5 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(inv.id)}
                                                onChange={() => toggleSelect(inv.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-4 w-4 rounded border-[#D1D5DB] accent-[#C69A52] cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-3 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{inv.invoiceNo}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.customerNo}</td>
                                        <td className="px-3 py-2.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{inv.customerName}</td>
                                        <td className="px-3 py-2.5">{statusBadge(inv.status)}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.docDate}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.postingDate}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.assessedValue)}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.amtExclDisc)}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.discount)}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.amtExclST)}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.salesTax)}</td>
                                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-[#A27B3A]">{fmt(inv.amtInclST)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination Controls — Positioned directly below table */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">Row</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                            className="h-8 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-2 focus:outline-none focus:border-[#C69A52] appearance-none"
                            style={selectArrow}
                        >
                            {ROW_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">
                            Page <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{page}</span> of{" "}
                            <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{totalPages}</span>
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
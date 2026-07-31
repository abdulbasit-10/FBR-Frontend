"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    RefreshCw,
    Plus,
    Download,
    ChevronLeft,
    ChevronRight,
    FileText,
    Square,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";
import {
    SelectPurchaseInvoiceModal,
    type PurchaseInvoiceForReturn,
} from "@/components/dashboard/select-purchase-invoice-modal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseReturn {
    id: number;
    returnNo: string;
    originalPI: string;
    vendorNo: string;
    vendorName: string;
    status: "Posted" | "UnPosted" | "Cancelled";
    source: string;
    user: string;
    docDate: string;
    postingDate: string;
    assessedValue: number;
    discount: number;
    salesTax: number;
    furtherTax: number;
    advanceTax: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_RETURNS: PurchaseReturn[] = [
    { id: 1, returnNo: "PR-0001", originalPI: "PI-0001", vendorNo: "V-0001", vendorName: "Alpha Suppliers", status: "Posted", source: "Manual", user: "Admin", docDate: "2026-07-05", postingDate: "2026-07-05", assessedValue: 20000, discount: 0, salesTax: 3400, furtherTax: 0, advanceTax: 400 },
    { id: 2, returnNo: "PR-0002", originalPI: "PI-0002", vendorNo: "V-0002", vendorName: "Beta Distributors", status: "UnPosted", source: "Manual", user: "Admin", docDate: "2026-07-09", postingDate: "2026-07-09", assessedValue: 9000, discount: 900, salesTax: 1229, furtherTax: 0, advanceTax: 180 },
];

const STATUS_OPTIONS = ["All", "Posted", "UnPosted", "Cancelled"];
const SOURCE_OPTIONS = ["All", "Manual", "API", "Import"];
const ROW_OPTIONS = [50, 100, 200];
const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TABLE_COLS = [
    "Return No", "Original PI", "Vendor No", "Vendor Name",
    "Status", "Source", "User", "Doc Date", "Posting Date",
    "Assessed Value", "Discount", "Sales Tax", "Further Tax", "Advance Tax",
];

const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};
const selectCls = "h-10 rounded-[6px] border border-[#D1D5DB] bg-white text-[12px] text-[#1E293B] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";

export default function PurchaseReturnPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [status, setStatus] = useState("All");
    const [source, setSource] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [returns, setReturns] = useState<PurchaseReturn[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);

    const load = useCallback(() => {
        setIsLoading(true); setReturns([]);
        const t = setTimeout(() => { setReturns(MOCK_RETURNS); setIsLoading(false); }, 1000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => load(), [load]);

    const filtered = returns.filter((r) => {
        const q = search.toLowerCase();
        return (
            (!q || r.returnNo.toLowerCase().includes(q) || r.originalPI.toLowerCase().includes(q) || r.vendorName.toLowerCase().includes(q)) &&
            (status === "All" || r.status === status) &&
            (source === "All" || r.source === source) &&
            (!dateFrom || r.docDate >= dateFrom) &&
            (!dateTo || r.docDate <= dateTo)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const toggleSelect = (id: number) =>
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () =>
        setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((r) => r.id)));

    const handleInvoiceSelect = (inv: PurchaseInvoiceForReturn) => {
        const params = new URLSearchParams({
            invoiceNo: inv.invoiceNo, vendor: inv.vendor,
            vendorNo: inv.vendorNo, docDate: inv.docDate,
            assessed: String(inv.assessed), discount: String(inv.discount),
        });
        router.push(`/dashboard/transactions/purchases/returns/create?${params.toString()}`);
    };

    const statusBadge = (s: PurchaseReturn["status"]) => {
        const map = { Posted: "bg-green-50 text-green-700 border border-green-200", UnPosted: "bg-yellow-50 text-yellow-700 border border-yellow-200", Cancelled: "bg-red-50 text-red-600 border border-red-200" };
        return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", map[s])}>{s}</span>;
    };

    return (
        <div className="min-h-full space-y-4 text-[#4f5967]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Page Header Controls ── */}
            <div className="flex items-center justify-between pb-1">
                <h1 className="text-[18px] font-bold text-[#1E293B]">Purchase Return</h1>
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
                        onClick={() => setShowModal(true)}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs"
                    >
                        <Plus className="h-3.5 w-3.5" /> New
                    </button>
                </div>
            </div>

            {/* ── SECTION 1: FILTER CONTAINER ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-4 space-y-3">
                {/* Search Input Row */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Input
                            type="text"
                            placeholder="Name, customer no, mapping id, NTN, STRN,"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="h-10 rounded-[6px] border border-[#D1D5DB] bg-white! text-[12px] text-[#1E293B] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] shadow-none"
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

                {/* Filter Controls Row */}
                <div className="flex flex-wrap items-end gap-3 pt-1">
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] block">Date from</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                            className="h-10 w-44 rounded-[6px] border border-[#D1D5DB] bg-white! text-[12px] text-[#1E293B] px-3 focus:outline-none focus:border-[#C69A52] shadow-none scheme-light"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] block">Date to</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                            className="h-10 w-44 rounded-[6px] border border-[#D1D5DB] bg-white! text-[12px] text-[#1E293B] px-3 focus:outline-none focus:border-[#C69A52] shadow-none scheme-light"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] block">Status</label>
                        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={cn(selectCls, "h-10 min-w-30")} style={selectArrow}>
                            {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] block">Source</label>
                        <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className={cn(selectCls, "h-10 min-w-30")} style={selectArrow}>
                            {SOURCE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                </div>

                <p className="text-[11px] text-[#9CA3AF] pt-0.5">
                    Date range includes returns where document date or posting date falls between the selected days (inclusive). Leave dates empty to include all periods. Provide both from and to, or neither.
                </p>
            </div>

            {/* ── SECTION 2: TABLE & ACTIONS CONTAINER ── */}
            <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-4 shadow-xs space-y-3">

                {/* Export & Scroll Indicator Bar */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        className="flex h-8 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] bg-white px-3 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors"
                    >
                        <Download className="h-3.5 w-3.5 text-[#A27B3A]" /> Export
                    </button>
                    <p className="text-[11px] text-[#9CA3AF] italic">Scroll right to view row actions</p>
                </div>

                {/* Table Wrapper with Custom Slim Scrollbar styling */}
                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] scrollbar-thin scrollbar-thumb-[#E3D2BA] scrollbar-track-[#FAF6F0] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-[#FAF6F0] [&::-webkit-scrollbar-thumb]:bg-[#D1B88A] [&::-webkit-scrollbar-thumb]:rounded-full">
                    <table className="w-full text-[12px] border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                <th className="sticky left-0 bg-[#C69A52] w-10 px-3 py-2.5 text-center z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
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
                        <tbody className="divide-y divide-[#F3F4F6]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length + 1} className="py-12 text-center bg-white">
                                        <LogoSpinner label="Loading Purchase Returns..." className="mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length + 1} className="py-12 text-center bg-white">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6EE]">
                                                <FileText className="h-5 w-5 text-[#C69A52]" />
                                            </div>
                                            <p className="text-[12px] text-[#9CA3AF] italic">No purchase returns match the current filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((r, i) => {
                                    const isSelected = selected.has(r.id);
                                    const rowBg = isSelected ? "bg-[#FAF6F0]" : i % 2 === 0 ? "bg-white" : "bg-[#FAF6F0]/30";
                                    return (
                                        <tr
                                            key={r.id}
                                            className={cn("cursor-pointer transition-colors hover:bg-[#FAF6F0]", rowBg)}
                                            onClick={() => toggleSelect(r.id)}
                                        >
                                            <td className={cn("sticky left-0 text-center px-3 py-2.5 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]", rowBg)}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(r.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="h-4 w-4 rounded border-[#D1D5DB] accent-[#C69A52] cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-3 py-2.5 font-medium text-[#1E293B] whitespace-nowrap">{r.returnNo}</td>
                                            <td className="px-3 py-2.5 text-[#4F5967] whitespace-nowrap">{r.originalPI}</td>
                                            <td className="px-3 py-2.5 text-[#4F5967] whitespace-nowrap">{r.vendorNo}</td>
                                            <td className="px-3 py-2.5 font-semibold text-[#1E293B] whitespace-nowrap">{r.vendorName}</td>
                                            <td className="px-3 py-2.5 whitespace-nowrap">{statusBadge(r.status)}</td>
                                            <td className="px-3 py-2.5 text-[#4F5967] whitespace-nowrap">{r.source}</td>
                                            <td className="px-3 py-2.5 text-[#4F5967] whitespace-nowrap">{r.user}</td>
                                            <td className="px-3 py-2.5 text-[#4F5967] whitespace-nowrap">{r.docDate}</td>
                                            <td className="px-3 py-2.5 text-[#4F5967] whitespace-nowrap">{r.postingDate}</td>
                                            <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] whitespace-nowrap">{fmt(r.assessedValue)}</td>
                                            <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] whitespace-nowrap">{fmt(r.discount)}</td>
                                            <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] whitespace-nowrap">{fmt(r.salesTax)}</td>
                                            <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] whitespace-nowrap">{fmt(r.furtherTax)}</td>
                                            <td className="px-3 py-2.5 text-right font-mono font-semibold text-[#A27B3A] whitespace-nowrap">{fmt(r.advanceTax)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Pagination Controls */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#4F5967]">Row</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                            className="h-8 rounded-[6px] border border-[#D1D5DB] bg-white text-[12px] text-[#1E293B] px-2 focus:outline-none focus:border-[#C69A52] appearance-none"
                            style={selectArrow}
                        >
                            {ROW_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white text-[#4F5967] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-[12px] text-[#4F5967]">
                            Page <span className="font-semibold text-[#1E293B]">{page}</span> of{" "}
                            <span className="font-semibold text-[#1E293B]">{totalPages}</span>
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white text-[#4F5967] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

            </div>

            <SelectPurchaseInvoiceModal isOpen={showModal} onClose={() => setShowModal(false)} onSelect={handleInvoiceSelect} />
        </div>
    );
}
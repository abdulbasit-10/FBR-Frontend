"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Download, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LedgerRow {
    id: number;
    invoiceNo: string;
    postingDate: string;
    documentType: string;
    customerNo: string;
    customerType: string;
    assessedValue: number;
    fed: number;
    amtExclDiscount: number;
    discount: number;
    amtExclSalesTax: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_LEDGER: LedgerRow[] = [
    { id: 1, invoiceNo: "SI-0001", postingDate: "2026-07-01", documentType: "Sales Invoice", customerNo: "C-0001", customerType: "Registered", assessedValue: 50000, fed: 0, amtExclDiscount: 50000, discount: 0, amtExclSalesTax: 50000 },
    { id: 2, invoiceNo: "SI-0002", postingDate: "2026-07-03", documentType: "Sales Invoice", customerNo: "C-0002", customerType: "Unregistered", assessedValue: 25000, fed: 500, amtExclDiscount: 25000, discount: 2500, amtExclSalesTax: 22500 },
    { id: 3, invoiceNo: "SR-0001", postingDate: "2026-07-05", documentType: "Sales Return", customerNo: "C-0001", customerType: "Registered", assessedValue: 10000, fed: 0, amtExclDiscount: 10000, discount: 0, amtExclSalesTax: 10000 },
    { id: 4, invoiceNo: "SI-0003", postingDate: "2026-07-10", documentType: "Sales Invoice", customerNo: "C-0003", customerType: "AOP", assessedValue: 75000, fed: 1500, amtExclDiscount: 75000, discount: 0, amtExclSalesTax: 75000 },
    { id: 5, invoiceNo: "CN-0001", postingDate: "2026-07-12", documentType: "Credit Note", customerNo: "C-0002", customerType: "Unregistered", assessedValue: 5000, fed: 0, amtExclDiscount: 5000, discount: 500, amtExclSalesTax: 4500 },
];

const DOC_TYPE_OPTIONS = ["All", "Sales Invoice", "Sales Return", "Credit Note", "Debit Note"];
const CUSTOMER_TYPE_OPTIONS = ["All", "Registered", "Unregistered", "AOP", "Company"];
const ROW_OPTIONS = [50, 100, 200];

const fmt = (n: number) =>
    n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};
const selectCls =
    "h-10 rounded-[6px] border border-[#D1D5DB] bg-white text-[12px] text-[#1E293B] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";

const TABLE_COLS = [
    "Invoice No",
    "Posting Date",
    "Document Type",
    "Customer No",
    "Customer Type",
    "Assessed Value",
    "FED",
    "Amount Excl. Discount",
    "Discount",
    "Amount Excl. Sales Tax",
];

export default function CustomerLedgerPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [docType, setDocType] = useState("All");
    const [customerType, setCustomerType] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [rows, setRows] = useState<LedgerRow[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);

    const load = useCallback(() => {
        setIsLoading(true);
        setRows([]);
        const t = setTimeout(() => {
            setRows(MOCK_LEDGER);
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => load(), [load]);

    const filtered = rows.filter((r) => {
        const q = search.toLowerCase();
        return (
            (!q ||
                r.invoiceNo.toLowerCase().includes(q) ||
                r.customerNo.toLowerCase().includes(q)) &&
            (docType === "All" || r.documentType === docType) &&
            (customerType === "All" || r.customerType === customerType) &&
            (!dateFrom || r.postingDate >= dateFrom) &&
            (!dateTo || r.postingDate <= dateTo)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    return (
        <div className="min-h-full space-y-4 text-[#4f5967]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Page Header Controls ── */}
            <div className="flex items-center justify-between pb-1">
                <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-[18px] font-bold text-[#1E293B] hover:opacity-75 transition-opacity">
                    <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                    Customer Ledger
                </button>
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
                        className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs"
                    >
                        <Download className="h-3.5 w-3.5" /> Export
                    </button>
                </div>
            </div>

            {/* ── SECTION 1: FILTER CONTAINER (Figma: Container:margin) ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-4 space-y-3">
                {/* Search Input Row */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Input
                            type="text"
                            placeholder="Name, customer no, mapping id, NTN, STRN"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="h-10 rounded-[6px] border border-[#D1D5DB] !bg-white text-[12px] text-[#1E293B] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] shadow-none"
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
                        <label className="text-[12px] font-medium text-[#4F5967] block">Posting date from</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                            className="h-10 w-44 rounded-[6px] border border-[#D1D5DB] !bg-white text-[12px] text-[#1E293B] px-3 focus:outline-none focus:border-[#C69A52] shadow-none [color-scheme:light]"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] block">Posting date to</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                            className="h-10 w-44 rounded-[6px] border border-[#D1D5DB] !bg-white text-[12px] text-[#1E293B] px-3 focus:outline-none focus:border-[#C69A52] shadow-none [color-scheme:light]"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] block">Document type</label>
                        <select
                            value={docType}
                            onChange={(e) => { setDocType(e.target.value); setPage(1); }}
                            className={cn(selectCls, "h-10 min-w-[140px]")}
                            style={selectArrow}
                        >
                            {DOC_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] block">Customer type</label>
                        <select
                            value={customerType}
                            onChange={(e) => { setCustomerType(e.target.value); setPage(1); }}
                            className={cn(selectCls, "h-10 min-w-[140px]")}
                            style={selectArrow}
                        >
                            {CUSTOMER_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── SECTION 2: TABLE & ACTIONS CONTAINER (Figma: Frame 2147223882) ── */}
            <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-[16px] shadow-xs space-y-3">

                {/* Export Button & Right Hint */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        className="flex h-8 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] bg-white px-3 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors"
                    >
                        <Download className="h-3.5 w-3.5 text-[#A27B3A]" /> Export
                    </button>
                    <p className="text-[11px] text-[#9CA3AF] italic">Scroll right to view row actions</p>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-[#FAF6F0] [&::-webkit-scrollbar-thumb]:bg-[#D1B88A] [&::-webkit-scrollbar-thumb]:rounded-full">
                    <table className="w-full text-[12px] border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
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
                                    <td colSpan={TABLE_COLS.length} className="py-12 text-center bg-white">
                                        <LogoSpinner label="Loading Customer Ledger..." className="mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length} className="py-12 text-center bg-white">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6EE]">
                                                <BookOpen className="h-5 w-5 text-[#C69A52]" />
                                            </div>
                                            <p className="text-[12px] text-[#9CA3AF] italic">
                                                No ledger rows match the current filters.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((row, i) => (
                                    <tr
                                        key={row.id}
                                        className={cn(
                                            i % 2 === 0 ? "bg-white" : "bg-[#FAF6F0]/30",
                                            "hover:bg-[#FAF6F0] transition-colors"
                                        )}
                                    >
                                        <td className="px-3 py-2.5 font-medium text-[#1E293B] whitespace-nowrap">
                                            {row.invoiceNo}
                                        </td>
                                        <td className="px-3 py-2.5 text-[#4F5967] whitespace-nowrap">
                                            {row.postingDate}
                                        </td>
                                        <td className="px-3 py-2.5 text-[#4F5967] whitespace-nowrap">{row.documentType}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] whitespace-nowrap">{row.customerNo}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] whitespace-nowrap">{row.customerType}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] whitespace-nowrap">
                                            {fmt(row.assessedValue)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] whitespace-nowrap">
                                            {fmt(row.fed)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] whitespace-nowrap">
                                            {fmt(row.amtExclDiscount)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] whitespace-nowrap">
                                            {fmt(row.discount)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#A27B3A] font-semibold whitespace-nowrap">
                                            {fmt(row.amtExclSalesTax)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination Controls */}
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
        </div>
    );
}
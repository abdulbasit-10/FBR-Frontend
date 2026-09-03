"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Download, ChevronLeft, ChevronRight, FileX, BookOpen, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { invoicesService, type Invoice as ApiInvoice } from "@/lib/services";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FbrDeletedInvoice {
    id: number;
    uuid: string;
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
    furtherTax: number;
    amtInclFT: number;
    advanceTax: number;
    advTaxPercent: number;
    total: number;
    fbrInvoiceNo: string;
    source: string;
    user: string;
    mappingId: string;
}

const toRow = (inv: ApiInvoice): FbrDeletedInvoice => ({
    id: inv.id,
    uuid: inv.uuid,
    invoiceNo: inv.fbrInvoiceNumber ?? `SI-${String(inv.id).padStart(4, "0")}`,
    customerNo: String(inv.customerId),
    customerName: inv.buyerBusinessName,
    status: "Cancelled",
    docDate: inv.invoiceDate?.slice(0, 10) ?? "",
    postingDate: (inv.postingDate ?? inv.invoiceDate ?? "").slice(0, 10),
    assessedValue: Number(inv.totalValueExcludingST) + Number(inv.totalDiscount),
    amtExclDisc: Number(inv.totalValueExcludingST) + Number(inv.totalDiscount),
    discount: Number(inv.totalDiscount),
    amtExclST: Number(inv.totalValueExcludingST),
    salesTax: Number(inv.totalSalesTax),
    amtInclST: Number(inv.totalValueIncludingST) - Number(inv.totalFurtherTax) - Number(inv.totalFedPayable),
    furtherTax: Number(inv.totalFurtherTax),
    amtInclFT: Number(inv.totalValueIncludingST) - Number(inv.totalFedPayable),
    advanceTax: Number(inv.advanceTax),
    advTaxPercent: Number(inv.totalValueIncludingST) > 0 ? (Number(inv.advanceTax) / Number(inv.totalValueIncludingST)) * 100 : 0,
    total: Number(inv.totalValueIncludingST) + Number(inv.advanceTax),
    fbrInvoiceNo: inv.fbrInvoiceNumber ?? "—",
    source: inv.environment === "production" ? "Production" : "Sandbox",
    user: inv.creator?.name ?? "—",
    mappingId: inv.mappingId ?? "—",
});

const STATUS_OPTIONS = ["All", "Posted", "UnPosted", "Cancelled"];
const SOURCE_OPTIONS = ["All", "Manual", "API", "Import"];
const ROW_OPTIONS = [50, 100, 200];

const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPercent = (n: number) => `${n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

const TABLE_COLS = [
    "Invoice no", "Customer No", "Customer Name", "Status",
    "Doc date", "Posting date", "Assessed value",
    "Amt excl disc", "Discount", "Amt excl ST", "Sales tax", "Amt incl ST",
    "Further tax", "Amt incl FT", "Advance tax", "Adv tax %", "Total",
    "FBR invoice no", "Source", "User", "Mapping id",
];

const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};
const selectCls = "h-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";

// ─── Component ────────────────────────────────────────────────────────────────

export default function FbrDeletedInvoicesPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [status, setStatus] = useState("All");
    const [source, setSource] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [invoices, setInvoices] = useState<FbrDeletedInvoice[]>([]);
    const [total, setTotal] = useState(0);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);

    const load = useCallback((showToast = false) => {
        setIsLoading(true);
        setInvoices([]);
        invoicesService.list({
            page, limit: rowsPerPage, status: "cancelled",
            search: search.trim() || undefined,
            from: dateFrom || undefined, to: dateTo || undefined,
            sortBy: "invoice_date", sortDir: "DESC",
        })
            .then((res) => {
                setInvoices(res.data.rows.map(toRow));
                setTotal(res.data.meta.total);
                if (showToast) toast.success("FBR deleted invoices refreshed.");
            })
            .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load."))
            .finally(() => setIsLoading(false));
    }, [page, rowsPerPage, search, dateFrom, dateTo]);

    useEffect(() => load(), [load]);

    const filtered = invoices;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
    const paginated = filtered;

    const toggleSelect = (id: number) =>
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const toggleAll = () =>
        setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((i) => i.id)));

    const statusBadge = (s: FbrDeletedInvoice["status"]) => {
        const map = {
            Posted: "bg-green-50  text-green-700 border border-green-200",
            UnPosted: "bg-yellow-50 text-yellow-700 border border-yellow-200",
            Cancelled: "bg-red-50    text-red-600    border border-red-200",
        };
        return (
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", map[s])}>
                {s}
            </span>
        );
    };

    return (
        <div className="min-h-full space-y-2.5 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Page Level Header Bar ── */}
            <div className="flex items-center justify-between pb-0.5">
                <h1 className="text-[18px] font-bold dark:text-white text-[#1E293B]">FBR Deleted Sales Invoices</h1>
                <button
                    type="button"
                    onClick={() => load(true)}
                    className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                >
                    <RefreshCw className="h-3 w-3 text-[#A27B3A]" /> Refresh
                </button>
            </div>

            {/* ── FBR info banner ── */}
            <div className="rounded-[6px] border border-[#F3D89A] dark:border-[#4a3010] bg-[#FFFBEB] dark:bg-[#1e1a08] px-3 py-1.5">
                <p className="text-[11px] text-[#92590A] italic">
                    These invoices are kept in the system but marked deleted at FBR.
                </p>
            </div>

            {/* ── SECTION 1: FILTER CONTAINER ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-2.5 space-y-2 min-h-38">
                {/* Search row */}
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder="Invoice no, FBR invoice no, mapping id, customer name"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="h-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setPage(1)}
                        className="h-9 rounded-[6px] bg-[#C69A52] px-5 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors cursor-pointer"
                    >
                        Search
                    </button>
                </div>

                {/* Filter row */}
                <div className="flex flex-wrap items-end gap-2.5 pt-0.5">
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Date from</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                            className="h-9 w-44 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] shadow-none scheme-light"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Date to</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                            className="h-9 w-44 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] shadow-none scheme-light"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Status</label>
                        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={cn(selectCls, "min-w-30")} style={selectArrow}>
                            {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Source</label>
                        <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className={cn(selectCls, "min-w-30")} style={selectArrow}>
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
            <div className="rounded-[16px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-2.5 shadow-xs space-y-2">

                {/* Export & Row Info Bar */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        className="flex h-8 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer"
                    >
                        <Download className="h-3.5 w-3.5 text-[#A27B3A]" /> Export
                    </button>
                    <p className="text-[11px] text-[#9CA3AF] italic">Scroll right to view row actions</p>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                    <table className="w-full text-[12px] min-w-275 border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                <th className="w-8 px-2 py-1.5 text-center">
                                    <input
                                        type="checkbox"
                                        checked={paginated.length > 0 && selected.size === paginated.length}
                                        onChange={toggleAll}
                                        className="h-3.5 w-3.5 accent-white cursor-pointer"
                                    />
                                </th>
                                {TABLE_COLS.map((col) => (
                                    <th key={col} className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                                        {col}
                                    </th>
                                ))}
                                <th className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length + 2} className="py-10 text-center">
                                        <LogoSpinner label="Loading FBR Deleted Invoices..." className="mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length + 2} className="py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileX className="h-8 w-8 text-[#C69A52] opacity-50" />
                                            <p className="text-[12px] text-[#9CA3AF] italic">No FBR-deleted invoices match the current filters.</p>
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
                                            selected.has(inv.id) && "bg-[#FDF3E3] dark:bg-[#3a2a10]"
                                        )}
                                        onClick={() => toggleSelect(inv.id)}
                                    >
                                        <td className="px-2 py-1.5 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(inv.id)}
                                                onChange={() => toggleSelect(inv.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-3.5 w-3.5 accent-[#C69A52] cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-2 py-1.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{inv.invoiceNo}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.customerNo}</td>
                                        <td className="px-2 py-1.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{inv.customerName}</td>
                                        <td className="px-2 py-1.5">{statusBadge(inv.status)}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.docDate}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.postingDate}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.assessedValue)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.amtExclDisc)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.discount)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.amtExclST)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.salesTax)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono font-semibold text-[#A27B3A]">{fmt(inv.amtInclST)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.furtherTax)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.amtInclFT)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.advanceTax)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmtPercent(inv.advTaxPercent)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.total)}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.fbrInvoiceNo}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.source}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.user}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.mappingId}</td>
                                        <td className="px-2 py-1.5">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    title="Open customer ledger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/dashboard/transactions/ledger/customer-ledger?invoiceUuid=${inv.uuid}`);
                                                    }}
                                                    className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] hover:text-[#A27B3A] transition-colors cursor-pointer"
                                                >
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    title="View invoice report"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/print/invoice/${inv.uuid}?view=1`);
                                                    }}
                                                    className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] hover:text-[#A27B3A] transition-colors cursor-pointer"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">Row</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                            className="h-8 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-2 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer"
                            style={selectArrow}
                        >
                            {ROW_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


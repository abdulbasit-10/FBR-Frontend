"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import {
    RefreshCw, Plus, CheckSquare, Send, Trash2,
    Download, ChevronLeft, ChevronRight, FileText, BookOpen, Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import {
    SelectInvoiceModal,
    type SaleInvoiceForReturn,
} from "@/components/dashboard/select-invoice-modal";
import {
    invoicesService,
    type Invoice as ApiInvoice,
    type InvoiceStatus,
    type InvoiceListQuery,
} from "@/lib/services";
import { exportRowsToExcel } from "@/lib/export";

interface SalesReturn {
    id: number;
    uuid: string;
    returnNo: string;
    originalId: string;
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

const uiStatus = (s: InvoiceStatus): SalesReturn["status"] => {
    if (s === "posted") return "Posted";
    if (s === "cancelled") return "Cancelled";
    return "UnPosted";
};

const apiStatus = (s: string): InvoiceStatus | undefined => {
    if (s === "Posted") return "posted";
    if (s === "Cancelled") return "cancelled";
    if (s === "UnPosted") return "draft";
    return undefined;
};

const toRow = (inv: ApiInvoice): SalesReturn => ({
    id: inv.id,
    uuid: inv.uuid,
    returnNo: inv.fbrInvoiceNumber ?? `DN-${String(inv.id).padStart(4, "0")}`,
    originalId: inv.invoiceRefNo ?? "—",
    customerNo: String(inv.customerId),
    customerName: inv.buyerBusinessName,
    status: uiStatus(inv.status),
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
    "Return no", "Original Id", "Customer No", "Customer Name", "Status",
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

function SalesReturnContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [status, setStatus] = useState(() => searchParams.get("status") ?? "All");
    const [source, setSource] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [returns, setReturns] = useState<SalesReturn[]>([]);
    const [total, setTotal] = useState(0);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [posting, setPosting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        setStatus(searchParams.get("status") ?? "All");
        setPage(1);
    }, [searchParams]);

    const load = useCallback((showToast = false) => {
        setIsLoading(true);
        setReturns([]);
        const q: InvoiceListQuery = {
            page, limit: rowsPerPage,
            search: search.trim() || undefined,
            status: apiStatus(status),
            from: dateFrom || undefined,
            to: dateTo || undefined,
            sortBy: "invoice_date", sortDir: "DESC",
        };
        // Debit Notes = sales returns in FBR
        invoicesService.list(q)
            .then((res) => {
                const debitNotes = res.data.rows.filter((inv) => inv.invoiceType === "Debit Note");
                setReturns(debitNotes.map(toRow));
                setTotal(debitNotes.length);
                if (showToast) toast.success("Sales returns refreshed.");
            })
            .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load."))
            .finally(() => setIsLoading(false));
    }, [page, rowsPerPage, search, status, dateFrom, dateTo]);

    useEffect(() => load(), [load]);

    const paginated = returns;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

    const toggleSelect = (id: number) =>
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () =>
        setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((r) => r.id)));

    const handleInvoiceSelect = (inv: SaleInvoiceForReturn) => {
        // Pass only the uuid — the create page fetches the full invoice (with items) fresh from the backend.
        router.push(`/dashboard/transactions/sales/returns/create?originalUuid=${inv.uuid}`);
    };

    const handleExport = () => {
        if (paginated.length === 0) {
            toast.error("No sales returns to export.");
            return;
        }
        const rows = paginated.map((r) => [
            r.returnNo, r.originalId, r.customerNo, r.customerName, r.status,
            r.docDate, r.postingDate, r.assessedValue,
            r.amtExclDisc, r.discount, r.amtExclST, r.salesTax, r.amtInclST,
            r.furtherTax, r.amtInclFT, r.advanceTax, r.advTaxPercent, r.total,
            r.fbrInvoiceNo, r.source, r.user, r.mappingId,
        ]);
        exportRowsToExcel("Sales_Returns", TABLE_COLS, rows);
        toast.success("Sales returns exported.");
    };

    const handlePost = async () => {
        const targets = paginated.filter((r) => selected.has(r.id) && r.status === "UnPosted");
        if (targets.length === 0) {
            toast.error("Select at least one unposted return to post.");
            return;
        }
        setPosting(true);
        let ok = 0, failed = 0;
        for (const r of targets) {
            try {
                const res = await invoicesService.submit(r.uuid, "post");
                if (res.data.status === "posted") ok++; else failed++;
            } catch {
                failed++;
            }
        }
        setPosting(false);
        setSelected(new Set());
        if (ok > 0) toast.success(`${ok} sales return${ok > 1 ? "s" : ""} posted to FBR.`);
        if (failed > 0) toast.error(`${failed} return${failed > 1 ? "s" : ""} failed to post.`);
        load(false);
    };

    const handleDelete = async () => {
        const targets = paginated.filter((r) => selected.has(r.id) && r.status !== "Posted");
        setShowDeleteConfirm(false);
        if (targets.length === 0) {
            toast.error("Posted returns cannot be deleted.");
            return;
        }
        setDeleting(true);
        let ok = 0, failed = 0;
        for (const r of targets) {
            try {
                await invoicesService.remove(r.uuid);
                ok++;
            } catch {
                failed++;
            }
        }
        setDeleting(false);
        setSelected(new Set());
        if (ok > 0) toast.success(`${ok} sales return${ok > 1 ? "s" : ""} deleted.`);
        if (failed > 0) toast.error(`${failed} return${failed > 1 ? "s" : ""} failed to delete.`);
        load(false);
    };

    const statusBadge = (s: SalesReturn["status"]) => {
        const map = { Posted: "bg-green-50 text-green-700 border border-green-200", UnPosted: "bg-yellow-50 text-yellow-700 border border-yellow-200", Cancelled: "bg-red-50 text-red-600 border border-red-200" };
        return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", map[s])}>{s}</span>;
    };

    return (
        <div className="min-h-full space-y-2.5 text-[#4f5967]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Page Level Header Bar ── */}
            <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()} className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0]" style={{ fontFamily: "'Inter', sans-serif" }}>{status === "All" ? "All" : status} Sales Returns</h1>
                </div>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => load(true)} className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer">
                        <RefreshCw className="h-3 w-3 text-[#A27B3A]" /> Refresh
                    </button>
                    <button type="button" onClick={() => setShowInvoiceModal(true)} className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs cursor-pointer">
                        <Plus className="h-3 w-3" /> New
                    </button>
                    <button type="button" onClick={toggleAll} className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer">
                        <CheckSquare className="h-3 w-3 text-[#A27B3A]" /> Select All
                    </button>
                    <button type="button" disabled={selected.size === 0 || posting} onClick={handlePost} className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                        <Send className="h-3 w-3 text-[#A27B3A]" /> {posting ? "Posting..." : "Post"}
                    </button>
                    <button type="button" disabled={selected.size === 0 || deleting} onClick={() => setShowDeleteConfirm(true)} className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                        <Trash2 className="h-3 w-3 text-[#A27B3A]" /> {deleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>

            {/* ── SECTION 1: FILTER CONTAINER ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-2.5 space-y-2 min-h-38">
                {/* Search Input Row */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Input
                            type="text"
                            placeholder="Invoice no, FBR invoice no, mapping id, customer name"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="h-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] shadow-none"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setPage(1)}
                        className="h-9 rounded-[6px] bg-[#C69A52] px-5 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors shadow-xs cursor-pointer"
                    >
                        Search
                    </button>
                </div>

                {/* Filter Dropdowns Row */}
                <div className="flex flex-wrap items-end gap-2.5 pt-0.5">
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Date from</label>
                        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-9 w-44 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] shadow-none scheme-light" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Date to</label>
                        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-9 w-44 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] shadow-none scheme-light" />
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
                    Date range includes returns where document date or posting date falls between the selected days (inclusive). Leave dates empty to include all periods. Provide both from and to, or neither.
                </p>
            </div>

            {/* ── SECTION 2: TABLE & ACTIONS CONTAINER ── */}
            <div className="rounded-[16px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-2.5 shadow-xs space-y-2">

                {/* Export & Row Info Bar */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={handleExport}
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
                                    <input type="checkbox" checked={paginated.length > 0 && selected.size === paginated.length} onChange={toggleAll} className="h-3.5 w-3.5 accent-white cursor-pointer" />
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
                                    <td colSpan={TABLE_COLS.length + 2} className="py-10 text-center bg-white dark:bg-[#242424]">
                                        <LogoSpinner label="Loading Sales Return..." className="mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length + 2} className="py-12 text-center bg-white dark:bg-[#242424]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6EE]">
                                                <FileText className="h-5 w-5 text-[#C69A52]" />
                                            </div>
                                            <p className="text-[12px] text-[#9CA3AF] italic">No sales returns match the current filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((r, i) => (
                                    <tr
                                        key={r.id}
                                        className={cn(
                                            "cursor-pointer transition-colors",
                                            i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]",
                                            "hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]",
                                            selected.has(r.id) && "bg-[#FAF6F0] dark:bg-[#3a2a10]"
                                        )}
                                        onClick={() => toggleSelect(r.id)}
                                    >
                                        <td className="px-2 py-1.5 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(r.id)}
                                                onChange={() => toggleSelect(r.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-4 w-4 rounded border-[#D1D5DB] accent-[#C69A52] cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-2 py-1.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/transactions/sales/${r.uuid}`);
                                                }}
                                                className="text-[#A27B3A] hover:underline font-semibold cursor-pointer"
                                            >
                                                {r.returnNo}
                                            </button>
                                        </td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{r.originalId}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{r.customerNo}</td>
                                        <td className="px-2 py-1.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.customerName}</td>
                                        <td className="px-2 py-1.5">{statusBadge(r.status)}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.docDate}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.postingDate}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(r.assessedValue)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(r.amtExclDisc)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(r.discount)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(r.amtExclST)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(r.salesTax)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono font-semibold text-[#A27B3A]">{fmt(r.amtInclST)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(r.furtherTax)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(r.amtInclFT)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(r.advanceTax)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmtPercent(r.advTaxPercent)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{fmt(r.total)}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.fbrInvoiceNo}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.source}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.user}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.mappingId}</td>
                                        <td className="px-2 py-1.5">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    title="Open customer ledger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/dashboard/transactions/ledger/customer-ledger?invoiceUuid=${r.uuid}`);
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
                                                        router.push(`/print/invoice/${r.uuid}?view=1`);
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

                {/* Footer / Pagination Controls */}
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

            <SelectInvoiceModal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} onSelect={handleInvoiceSelect} />

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete selected returns?"
                message="Draft/failed returns will be permanently removed. Posted returns in the selection will be skipped."
                confirmLabel="Delete"
                isLoading={deleting}
                loadingLabel="Deleting..."
            />
        </div>
    );
}

export default function SalesReturnPage() {
    return <Suspense fallback={null}><SalesReturnContent /></Suspense>;
}

"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    Eye,
    BookOpen,
    Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { exportRowsToExcel } from "@/lib/export";
import {
    invoicesService,
    type Invoice as ApiInvoice,
    type InvoiceListQuery,
    type InvoiceStatus,
} from "@/lib/services";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SalesInvoice {
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

/**
 * Map the backend Invoice model (see FBR-Backend/src/models/Invoice.ts) onto
 * the flat row shape this table renders.
 *   posted    → Posted
 *   draft     → UnPosted
 *   validated → UnPosted
 *   failed    → UnPosted
 *   cancelled → Cancelled
 */
const uiStatus = (s: InvoiceStatus): SalesInvoice["status"] => {
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

const toRow = (inv: ApiInvoice): SalesInvoice => ({
    id: inv.id,
    uuid: inv.uuid,
    invoiceNo: inv.fbrInvoiceNumber ?? `SI-${String(inv.id).padStart(4, "0")}`,
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
    "Invoice no", "Customer No", "Customer Name", "Status",
    "Doc date", "Posting date", "Assessed value",
    "Amt excl disc", "Discount", "Amt excl ST", "Sales tax", "Amt incl ST",
    "Further tax", "Amt incl FT", "Advance tax", "Adv tax %", "Total",
    "FBR invoice no", "Source", "User", "Mapping id",
];

const selectStyle = "h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";
const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};

function SalesInvoicesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [status, setStatus] = useState(() => searchParams.get("status") ?? "All");
    const [source, setSource] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
    const [total, setTotal] = useState(0);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);
    const [copying, setCopying] = useState(false);
    const [copyTargetUuid, setCopyTargetUuid] = useState<string | null>(null);
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        setStatus(searchParams.get("status") ?? "All");
        setPage(1);
    }, [searchParams]);

    const load = useCallback((showToast = false) => {
        setIsLoading(true);
        setInvoices([]);
        const params: InvoiceListQuery = {
            page,
            limit: rowsPerPage,
            search: search.trim() || undefined,
            status: apiStatus(status),
            from: dateFrom || undefined,
            to: dateTo || undefined,
            sortBy: "invoice_date",
            sortDir: "DESC",
        };
        invoicesService
            .list(params)
            .then((res) => {
                setInvoices(res.data.rows.map(toRow));
                setTotal(res.data.meta.total);
                if (showToast) toast.success("Sales invoices refreshed.");
            })
            .catch((err) =>
                toast.error(err instanceof Error ? err.message : "Failed to load invoices."),
            )
            .finally(() => setIsLoading(false));
    }, [page, rowsPerPage, search, status, dateFrom, dateTo]);

    useEffect(() => load(), [load]);

    // Server-side filtering + pagination — the response is already scoped.
    const paginated = invoices;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

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

    // Only enable Post when the selection actually contains an UnPosted row — not just "something"
    // is checked (e.g. an already-Posted invoice can't be posted again).
    const hasPostableSelection = paginated.some((i) => selected.has(i.id) && i.status === "UnPosted");

    const printInvoices = (uuids: string[]) => {
        // Print via a hidden iframe so the browser's print dialog opens directly
        // over the current page instead of navigating to a new tab.
        uuids.forEach((uuid, idx) => {
            setTimeout(() => {
                const iframe = document.createElement("iframe");
                iframe.style.position = "fixed";
                iframe.style.left = "-10000px";
                iframe.style.top = "0";
                iframe.style.width = "800px";
                iframe.style.height = "1100px";
                iframe.style.border = "0";
                iframe.src = `/print/invoice/${uuid}`;
                document.body.appendChild(iframe);
                iframe.onload = () => {
                    const cleanup = () => {
                        if (iframe.parentNode) document.body.removeChild(iframe);
                    };
                    try {
                        iframe.contentWindow?.addEventListener("afterprint", cleanup);
                    } catch {
                        // ignore — worst case iframe stays until navigation
                    }
                    setTimeout(cleanup, 15000); // safety fallback
                };
            }, idx * 800);
        });
    };

    const handlePrint = () => {
        if (selected.size === 0) {
            toast.error("Select at least one invoice to print.");
            return;
        }
        printInvoices(paginated.filter((i) => selected.has(i.id)).map((i) => i.uuid));
    };

    const copyInvoice = async (uuid: string) => {
        setCopying(true);
        try {
            const full = await invoicesService.getOne(uuid);
            const src = full.data;
            const today = new Date().toISOString().slice(0, 10);
            const created = await invoicesService.create({
                customerId: src.customerId,
                invoiceType: src.invoiceType,
                invoiceDate: today,
                postingDate: null,
                poDate: src.poDate,
                poNumber: src.poNumber,
                advanceTax: src.advanceTax,
                environment: src.environment,
                scenarioId: src.scenarioId,
                notes: src.notes,
                items: (src.items ?? []).map((it) => ({
                    productId: it.productId,
                    hsCode: it.hsCode,
                    productDescription: it.productDescription,
                    rate: it.rate,
                    uom: it.uom,
                    quantity: it.quantity,
                    valueSalesExcludingST: it.valueSalesExcludingST,
                    fixedNotifiedValueOrRetailPrice: it.fixedNotifiedValueOrRetailPrice,
                    salesTaxApplicable: it.salesTaxApplicable,
                    salesTaxWithheldAtSource: it.salesTaxWithheldAtSource,
                    extraTax: it.extraTax,
                    furtherTax: it.furtherTax,
                    sroScheduleNo: it.sroScheduleNo,
                    fedPayable: it.fedPayable,
                    discount: it.discount,
                    saleType: it.saleType,
                    sroItemSerialNo: it.sroItemSerialNo,
                    unitPrice: it.unitPrice,
                    discountPercent: it.discountPercent,
                })),
            });
            toast.success("Invoice copied as a new draft.");
            setSelected(new Set());
            router.refresh(); // bust Next.js router cache so returning to this list shows fresh data
            router.push(`/dashboard/transactions/sales/${created.data.uuid}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to copy invoice.");
        } finally {
            setCopying(false);
        }
    };

    const handleCopy = () => {
        if (selected.size !== 1) {
            toast.error("Select exactly one invoice to copy.");
            return;
        }
        const row = paginated.find((i) => selected.has(i.id));
        if (!row) return;
        setCopyTargetUuid(row.uuid);
    };

    const handlePost = async () => {
        const targets = paginated.filter((i) => selected.has(i.id) && i.status === "UnPosted");
        if (targets.length === 0) {
            toast.error("Select at least one unposted invoice to post.");
            return;
        }
        setPosting(true);
        let ok = 0, failed = 0;
        for (const i of targets) {
            try {
                const res = await invoicesService.submit(i.uuid, "post");
                if (res.data.status === "posted") ok++; else failed++;
            } catch {
                failed++;
            }
        }
        setPosting(false);
        setSelected(new Set());
        if (ok > 0) toast.success(`${ok} invoice${ok > 1 ? "s" : ""} posted to FBR.`);
        if (failed > 0) toast.error(`${failed} invoice${failed > 1 ? "s" : ""} failed to post.`);
        load(false);
    };

    const handleExport = () => {
        if (paginated.length === 0) {
            toast.error("No invoices to export.");
            return;
        }
        const rows = paginated.map((inv) => [
            inv.invoiceNo, inv.customerNo, inv.customerName, inv.status,
            inv.docDate, inv.postingDate, inv.assessedValue,
            inv.amtExclDisc, inv.discount, inv.amtExclST, inv.salesTax, inv.amtInclST,
            inv.furtherTax, inv.amtInclFT, inv.advanceTax, inv.advTaxPercent, inv.total,
            inv.fbrInvoiceNo, inv.source, inv.user, inv.mappingId,
        ]);
        exportRowsToExcel("Sales_Invoices", TABLE_COLS, rows);
        toast.success("Sales invoices exported.");
    };

    const confirmCopy = () => {
        if (!copyTargetUuid) return;
        const uuid = copyTargetUuid;
        setCopyTargetUuid(null);
        copyInvoice(uuid);
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
        <div className="min-h-full space-y-2.5 text-[#4f5967]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Page Level Header Bar ── */}
            <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()} className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0]" style={{ fontFamily: "'Inter', sans-serif" }}>{status === "All" ? "All" : status} Sales Invoices</h1>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => load(true)}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                    >
                        <RefreshCw className="h-3 w-3 text-[#A27B3A]" /> Refresh
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/sales/create-invoice")}
                        className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs cursor-pointer"
                    >
                        <Plus className="h-3 w-3" /> New
                    </button>
                    <button
                        type="button"
                        onClick={toggleAll}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                    >
                        <CheckSquare className="h-3 w-3 text-[#A27B3A]" /> Select All
                    </button>
                    <button
                        type="button"
                        disabled={!hasPostableSelection || posting}
                        onClick={handlePost}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Send className="h-3 w-3 text-[#A27B3A]" /> {posting ? "Posting..." : "Post"}
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                    >
                        <Printer className="h-3 w-3 text-[#A27B3A]" /> Print
                    </button>
                    <button
                        type="button"
                        onClick={handleCopy}
                        disabled={copying}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <Copy className="h-3 w-3 text-[#A27B3A]" /> {copying ? "Copying..." : "Copy"}
                    </button>
                </div>
            </div>

            {/* ── SMTP warning banner ── */}
            <div className="rounded-[6px] border border-[#F3D89A] dark:border-[#4a3010] bg-[#FFFBEB] dark:bg-[#1e1a08] px-3 py-1.5">
                <p className="text-[11px] text-[#92590A] italic">
                    Email filter is hidden until SMTP is configured on the company profile.
                </p>
            </div>

            {/* ── SECTION 1: FILTER CONTAINER ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-2.5 space-y-2 min-h-38">
                {/* Search Input Row */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <Input
                            type="text"
                            placeholder="Name, customer no, mapping id, NTN, STRN,"
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
                        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={cn(selectStyle, "h-9 min-w-30")} style={selectArrow}>
                            {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Source</label>
                        <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className={cn(selectStyle, "h-9 min-w-30")} style={selectArrow}>
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
                                    <button
                                        type="button"
                                        onClick={toggleAll}
                                        className="h-4 w-4 rounded-[3px] border border-white/60 bg-transparent flex items-center justify-center mx-auto hover:border-white transition-colors cursor-pointer"
                                    >
                                        <Square className="h-3 w-3 text-white fill-white/20" />
                                    </button>
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
                                        <LogoSpinner label="Loading Sales Invoices..." className="mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length + 2} className="py-12 text-center bg-white dark:bg-[#242424]">
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
                                        <td className="px-2 py-1.5 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(inv.id)}
                                                onChange={() => toggleSelect(inv.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-4 w-4 rounded border-[#D1D5DB] accent-[#C69A52] cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-2 py-1.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/transactions/sales/${inv.uuid}`);
                                                }}
                                                className="text-[#A27B3A] hover:underline font-semibold cursor-pointer"
                                            >
                                                {inv.invoiceNo}
                                            </button>
                                        </td>
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
                                                    title="Copy to a new unposted invoice"
                                                    disabled={copying}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCopyTargetUuid(inv.uuid);
                                                    }}
                                                    className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] hover:text-[#A27B3A] transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </button>
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

                {/* Footer / Pagination Controls — Positioned directly below table */}
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

            {/* ── Copy confirmation dialog ── */}
            <ConfirmDialog
                isOpen={copyTargetUuid !== null}
                onClose={() => setCopyTargetUuid(null)}
                onConfirm={confirmCopy}
                title="Copy invoice?"
                message="Create a new unposted sales invoice with the same customer and lines (today's document and posting dates)?"
                confirmLabel="Copy"
                isLoading={copying}
                loadingLabel="Copying..."
            />
        </div>
    );
}

export default function SalesInvoicesPage() {
    return <Suspense fallback={null}><SalesInvoicesContent /></Suspense>;
}
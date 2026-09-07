"use client";

import React, { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, RefreshCw, Download, Printer, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { selectArrow, selectCls, ROW_OPTIONS, fmt } from "@/components/dashboard/ledger-shell";
import { cn } from "@/lib/utils";
import { exportRowsToExcel } from "@/lib/export";
import { invoicesService, type Invoice as ApiInvoice } from "@/lib/services";
import { toast } from "react-toastify";

interface CustomerLedgerRow {
    id: number;
    invoiceNo: string;
    postingDate: string;
    documentType: string;
    customerNo: string;
    customerName: string;
    customerType: string;
    assessedValue: number;
    fed: number;
    amtExclDiscount: number;
    discount: number;
    amtExclSalesTax: number;
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

interface CustomerSummaryRow {
    customerNo: string;
    customerName: string;
    customerType: string;
    invoiceCount: number;
    assessedValue: number;
    salesTax: number;
    total: number;
}

const toRow = (inv: ApiInvoice): CustomerLedgerRow => ({
    id: inv.id,
    invoiceNo: inv.fbrInvoiceNumber ?? `SI-${String(inv.id).padStart(4, "0")}`,
    postingDate: (inv.postingDate ?? inv.invoiceDate ?? "").slice(0, 10),
    documentType: inv.invoiceType === "Debit Note" ? "Debit Note" : "Sales Invoice",
    customerNo: String(inv.customerId),
    customerName: inv.buyerBusinessName,
    customerType: inv.buyerRegistrationType ?? "—",
    assessedValue: Number(inv.totalValueExcludingST) + Number(inv.totalDiscount),
    fed: Number(inv.totalFedPayable ?? 0),
    amtExclDiscount: Number(inv.totalValueExcludingST) + Number(inv.totalDiscount),
    discount: Number(inv.totalDiscount),
    amtExclSalesTax: Number(inv.totalValueExcludingST),
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

const fmtPercent = (n: number) => `${n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

const CUSTOMER_TYPE_OPTIONS = ["All", "Registered", "Unregistered", "AOP", "Company"];
const DOC_TYPE_OPTIONS = ["All", "Sales Invoice", "Debit Note"];

const SUMMARY_COLUMNS = ["S.No", "Customer No", "Customer Name", "Customer Type", "Invoices", "Assessed Value", "Sales Tax", "Total (Incl. ST)"];
const DETAIL_COLUMNS = [
    "S.No",
    "Invoice No", "Posting Date", "Document Type", "Customer No", "Customer Name", "Customer Type",
    "Assessed Value", "FED", "Amount Excl. Discount", "Discount", "Amount Excl. ST", "Sales Tax",
    "Amount Incl. ST", "Further Tax", "Amount Incl. FT", "Advance Tax", "Adv Tax %", "Total",
    "FBR Invoice No", "Source", "User", "Mapping Id",
];

const btnOutline = "flex items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors";
const SummaryField = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
    <div>
        <p className="text-[10px] uppercase tracking-wider text-[#8a5f24] dark:text-[#c99d54]">{label}</p>
        <p className={cn("font-mono font-semibold", highlight ? "text-[#A27B3A] text-[13px]" : "text-[#1E293B] dark:text-[#f0f0f0]")}>{value}</p>
    </div>
);

function CustomerLedgerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invoiceUuid = searchParams.get("invoiceUuid");

    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [docType, setDocType] = useState("All");
    const [customerType, setCustomerType] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [rows, setRows] = useState<CustomerLedgerRow[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);
    // Drill-down: null = customer summary view, set = that customer's full statement.
    const [selectedCustomerNo, setSelectedCustomerNo] = useState<string | null>(null);

    const load = useCallback(() => {
        setIsLoading(true);
        setRows([]);
        if (invoiceUuid) {
            invoicesService
                .getOne(invoiceUuid)
                .then((res) => setRows([toRow(res.data)]))
                .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load."))
                .finally(() => setIsLoading(false));
            return;
        }
        // Fetch every matching posted document (not server-paginated) so the customer
        // summary/subtotals below are computed over the whole filtered set, not one page of it.
        invoicesService.list({
            page: 1, limit: 200, status: "posted",
            search: search.trim() || undefined,
            from: dateFrom || undefined, to: dateTo || undefined,
            sortBy: "invoice_date", sortDir: "DESC",
        })
            .then((res) => setRows(res.data.rows.map(toRow)))
            .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load."))
            .finally(() => setIsLoading(false));
    }, [search, dateFrom, dateTo, invoiceUuid]);

    useEffect(() => load(), [load]);
    useEffect(() => { setPage(1); }, [selectedCustomerNo, docType, customerType]);

    const filtered = invoiceUuid
        ? rows
        : rows.filter((r) =>
            (docType === "All" || r.documentType === docType) &&
            (customerType === "All" || r.customerType === customerType)
        );

    // ── Level 1: one row per customer, aggregated across the current filters ──
    const summaries = useMemo(() => {
        const map = new Map<string, CustomerSummaryRow>();
        for (const r of filtered) {
            const existing = map.get(r.customerNo);
            if (existing) {
                existing.invoiceCount += 1;
                existing.assessedValue += r.assessedValue;
                existing.salesTax += r.salesTax;
                existing.total += r.total;
            } else {
                map.set(r.customerNo, {
                    customerNo: r.customerNo,
                    customerName: r.customerName,
                    customerType: r.customerType,
                    invoiceCount: 1,
                    assessedValue: r.assessedValue,
                    salesTax: r.salesTax,
                    total: r.total,
                });
            }
        }
        return Array.from(map.values()).sort((a, b) => b.total - a.total);
    }, [filtered]);

    // ── Level 2: every document for the selected customer, plus a subtotal ──
    const detailRows = useMemo(
        () => (selectedCustomerNo ? filtered.filter((r) => r.customerNo === selectedCustomerNo) : []),
        [filtered, selectedCustomerNo],
    );
    const selectedCustomerName = detailRows[0]?.customerName ?? "";
    const subtotal = useMemo(
        () => detailRows.reduce((acc, r) => ({
            assessedValue: acc.assessedValue + r.assessedValue,
            fed: acc.fed + r.fed,
            amtExclDiscount: acc.amtExclDiscount + r.amtExclDiscount,
            discount: acc.discount + r.discount,
            amtExclSalesTax: acc.amtExclSalesTax + r.amtExclSalesTax,
            salesTax: acc.salesTax + r.salesTax,
            amtInclST: acc.amtInclST + r.amtInclST,
            furtherTax: acc.furtherTax + r.furtherTax,
            amtInclFT: acc.amtInclFT + r.amtInclFT,
            advanceTax: acc.advanceTax + r.advanceTax,
            total: acc.total + r.total,
        }), { assessedValue: 0, fed: 0, amtExclDiscount: 0, discount: 0, amtExclSalesTax: 0, salesTax: 0, amtInclST: 0, furtherTax: 0, amtInclFT: 0, advanceTax: 0, total: 0 }),
        [detailRows],
    );

    const isDetailView = invoiceUuid !== null || selectedCustomerNo !== null;
    const listLength = isDetailView ? detailRows.length : summaries.length;
    const totalPages = Math.max(1, Math.ceil(listLength / rowsPerPage));
    const paginatedSummaries = summaries.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const paginatedDetail = detailRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const handleExportSummary = () => {
        if (summaries.length === 0) { toast.error("No data to export."); return; }
        exportRowsToExcel(
            "Customer_Ledger_Summary",
            SUMMARY_COLUMNS.filter((c) => c !== "S.No"),
            summaries.map((s) => [s.customerNo, s.customerName, s.customerType, s.invoiceCount, s.assessedValue, s.salesTax, s.total]),
        );
    };

    const handleExportDetail = () => {
        if (detailRows.length === 0) { toast.error("No data to export."); return; }
        const rowsOut: (string | number)[][] = detailRows.map((r) => [
            r.invoiceNo, r.postingDate, r.documentType, r.customerNo, r.customerName, r.customerType,
            r.assessedValue, r.fed, r.amtExclDiscount, r.discount, r.amtExclSalesTax, r.salesTax,
            r.amtInclST, r.furtherTax, r.amtInclFT, r.advanceTax, r.advTaxPercent, r.total,
            r.fbrInvoiceNo, r.source, r.user, r.mappingId,
        ]);
        rowsOut.push([
            "Subtotal", "", "", "", "", "",
            subtotal.assessedValue, subtotal.fed, subtotal.amtExclDiscount, subtotal.discount, subtotal.amtExclSalesTax, subtotal.salesTax,
            subtotal.amtInclST, subtotal.furtherTax, subtotal.amtInclFT, subtotal.advanceTax, "", subtotal.total,
            "", "", "", "",
        ]);
        exportRowsToExcel(`Customer_Ledger_${selectedCustomerName || "Statement"}`, DETAIL_COLUMNS.filter((c) => c !== "S.No"), rowsOut);
    };

    const handlePrint = () => {
        if (isDetailView) {
            if (detailRows.length === 0) { toast.error("No data to print."); return; }
            const rowsOut: (string | number)[][] = detailRows.map((r) => [
                r.invoiceNo, r.postingDate, r.documentType, r.customerType,
                r.assessedValue, r.salesTax, r.amtInclST, r.total,
            ]);
            rowsOut.push(["Subtotal", "", "", "", subtotal.assessedValue, subtotal.salesTax, subtotal.amtInclST, subtotal.total]);
            sessionStorage.setItem("printReportPayload", JSON.stringify({
                title: `Customer Statement — ${selectedCustomerName || "Invoice"}`,
                filtersSummary: `Posting date: ${dateFrom || "—"} to ${dateTo || "—"} · Document type: ${docType}`,
                columns: ["Invoice No", "Posting Date", "Document Type", "Customer Type", "Assessed Value", "Sales Tax", "Amount Incl. ST", "Total"],
                rows: rowsOut,
            }));
        } else {
            if (summaries.length === 0) { toast.error("No data to print."); return; }
            sessionStorage.setItem("printReportPayload", JSON.stringify({
                title: "Customer Ledger Summary",
                filtersSummary: `Posting date: ${dateFrom || "—"} to ${dateTo || "—"} · Document type: ${docType} · Customer type: ${customerType}`,
                columns: SUMMARY_COLUMNS.filter((c) => c !== "S.No"),
                rows: summaries.map((s) => [s.customerNo, s.customerName, s.customerType, s.invoiceCount, s.assessedValue, s.salesTax, s.total]),
            }));
        }
        window.open("/print/report", "_blank");
    };

    /** Prints just the totals panel (not the itemized rows) — a quick one-page summary. */
    const handlePrintSummary = () => {
        if (detailRows.length === 0) { toast.error("No data to print."); return; }
        sessionStorage.setItem("printReportPayload", JSON.stringify({
            title: `Statement Summary — ${selectedCustomerName || "Customer"}`,
            filtersSummary: `Posting date: ${dateFrom || "—"} to ${dateTo || "—"} · Document type: ${docType} · ${detailRows.length} document${detailRows.length === 1 ? "" : "s"}`,
            columns: ["Field", "Amount"],
            rows: [
                ["Assessed Value", subtotal.assessedValue],
                ["FED", subtotal.fed],
                ["Amount Excl. Discount", subtotal.amtExclDiscount],
                ["Discount", subtotal.discount],
                ["Amount Excl. ST", subtotal.amtExclSalesTax],
                ["Sales Tax", subtotal.salesTax],
                ["Further Tax", subtotal.furtherTax],
                ["Amount Incl. FT", subtotal.amtInclFT],
                ["Advance Tax", subtotal.advanceTax],
                ["Amount Incl. ST", subtotal.amtInclST],
                ["Total", subtotal.total],
            ],
        }));
        window.open("/print/report", "_blank");
    };

    return (
        <div className="min-h-full space-y-2.5 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-0.5">
                {selectedCustomerNo && !invoiceUuid ? (
                    <button onClick={() => setSelectedCustomerNo(null)} className="flex items-center gap-1.5 text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75 transition-opacity">
                        <ArrowLeft className="h-5 w-5 text-[#A27B3A]" />
                        {selectedCustomerName || "Customer"} — Statement
                    </button>
                ) : (
                    <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                        Customer Ledger
                    </button>
                )}
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => { load(); toast.success("Ledger refreshed."); }} className={`h-8 ${btnOutline}`}>
                        <RefreshCw className="h-3 w-3 text-[#A27B3A]" /> Refresh
                    </button>
                    <button type="button" onClick={handlePrint} className={`h-8 ${btnOutline}`}>
                        <Printer className="h-3 w-3 text-[#A27B3A]" /> Print
                    </button>
                    <button
                        type="button"
                        onClick={isDetailView ? handleExportDetail : handleExportSummary}
                        className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs"
                    >
                        <Download className="h-3 w-3" /> Export
                    </button>
                </div>
            </div>

            {invoiceUuid && (
                <div className="rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-[#FAF6F0] dark:bg-[#241d10] px-4 py-2.5 text-[12px] text-[#8a5f24] dark:text-[#c99d54] flex items-center justify-between">
                    <span>Filtered to one document. Sales Invoice · ID {invoiceUuid}</span>
                    <button type="button" onClick={() => router.push("/dashboard/transactions/ledger/customer-ledger")} className="font-semibold underline hover:opacity-75">
                        Clear filter
                    </button>
                </div>
            )}

            {/* ── Filters (+ Statement Summary side panel in detail view) ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-2.5 flex flex-col lg:flex-row lg:items-start gap-3">
                <div className="lg:shrink-0 space-y-2">
                    <div className="flex items-center gap-2 max-w-2xl">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Name, customer no, mapping id, NTN, STRN"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none"
                            />
                        </div>
                        <button type="button" onClick={load} className="h-8 rounded-[6px] bg-[#C69A52] px-5 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                            Search
                        </button>
                    </div>
                    <div className="flex flex-wrap items-end gap-2 pt-0.5">
                        <div className="space-y-1">
                            <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Posting date from</label>
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                                className="h-8 w-40 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-2.5 focus:outline-none focus:border-[#C69A52] scheme-light" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Posting date to</label>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                                className="h-8 w-40 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-2.5 focus:outline-none focus:border-[#C69A52] scheme-light" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Document type</label>
                            <select value={docType} onChange={(e) => setDocType(e.target.value)} className={cn(selectCls, "min-w-35", "h-8")} style={selectArrow}>
                                {DOC_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Customer type</label>
                            <select value={customerType} onChange={(e) => setCustomerType(e.target.value)} className={cn(selectCls, "min-w-35", "h-8")} style={selectArrow}>
                                {CUSTOMER_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] pt-0.5">
                        {isDetailView
                            ? "Showing every document for this customer within the selected range."
                            : "Each customer appears once. Click a row to see all of their invoices with subtotals."}
                    </p>
                </div>

                {isDetailView && !isLoading && detailRows.length > 0 && (
                    <div className="lg:flex-1 rounded-[8px] border-2 border-[#C69A52] bg-[#FAF6EE] dark:bg-[#2a2210] p-2.5">
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A27B3A]">
                            Summary — {detailRows.length} document{detailRows.length === 1 ? "" : "s"}
                        </p>
                        <div className="grid grid-cols-4 gap-x-3 gap-y-1.5 text-[12px]">
                            <SummaryField label="Assessed Value" value={fmt(subtotal.assessedValue)} />
                            <SummaryField label="FED" value={fmt(subtotal.fed)} />
                            <SummaryField label="Amt Excl. Discount" value={fmt(subtotal.amtExclDiscount)} />
                            <SummaryField label="Discount" value={fmt(subtotal.discount)} />
                            <SummaryField label="Amt Excl. ST" value={fmt(subtotal.amtExclSalesTax)} />
                            <SummaryField label="Sales Tax" value={fmt(subtotal.salesTax)} />
                            <SummaryField label="Further Tax" value={fmt(subtotal.furtherTax)} />
                            <SummaryField label="Amt Incl. FT" value={fmt(subtotal.amtInclFT)} />
                            <SummaryField label="Advance Tax" value={fmt(subtotal.advanceTax)} />
                            <SummaryField label="Amt Incl. ST" value={fmt(subtotal.amtInclST)} highlight />
                            <SummaryField label="Total" value={fmt(subtotal.total)} highlight />
                            <div className="flex items-end justify-start">
                                <button
                                    type="button"
                                    onClick={handlePrintSummary}
                                    title="Print just this summary"
                                    className="flex h-7 items-center gap-1 rounded-[5px] border border-[#C69A52]/50 bg-white/60 dark:bg-black/20 px-2.5 text-[11px] font-semibold text-[#A27B3A] hover:bg-white dark:hover:bg-black/30 transition-colors"
                                >
                                    <Printer className="h-3 w-3" /> Print
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Table container ── */}
            <div className="rounded-[16px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3 shadow-xs space-y-2.5">
                <div className="overflow-auto max-h-[60vh] rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#FAF6F0] [&::-webkit-scrollbar-thumb]:bg-[#D1B88A] [&::-webkit-scrollbar-thumb]:rounded-full">
                    <table className="w-full text-[12px] border-collapse">
                        <thead>
                            <tr>
                                {(isDetailView ? DETAIL_COLUMNS : SUMMARY_COLUMNS).map((col) => (
                                    <th key={col} className="sticky top-0 z-10 bg-[#C69A52] text-white px-2.5 py-2 text-left font-semibold whitespace-nowrap">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={(isDetailView ? DETAIL_COLUMNS : SUMMARY_COLUMNS).length} className="py-12 text-center bg-white dark:bg-[#242424]">
                                        <LogoSpinner label="Loading Customer Ledger..." className="mx-auto" />
                                    </td>
                                </tr>
                            ) : isDetailView ? (
                                paginatedDetail.length === 0 ? (
                                    <tr>
                                        <td colSpan={DETAIL_COLUMNS.length} className="py-12 text-center text-[12px] text-[#9CA3AF] italic bg-white dark:bg-[#242424]">
                                            No documents for this customer in the selected range.
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {paginatedDetail.map((row, i) => (
                                            <tr key={row.id} className={cn(i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]", "hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors")}>
                                                <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{(page - 1) * rowsPerPage + i + 1}</td>
                                                <td className="px-2.5 py-2 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{row.invoiceNo}</td>
                                                <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.postingDate}</td>
                                                <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.documentType}</td>
                                                <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af]">{row.customerNo}</td>
                                                <td className="px-2.5 py-2 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{row.customerName}</td>
                                                <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af]">{row.customerType}</td>
                                                <td className="px-2.5 py-2 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(row.assessedValue)}</td>
                                                <td className="px-2.5 py-2 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.fed)}</td>
                                                <td className="px-2.5 py-2 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(row.amtExclDiscount)}</td>
                                                <td className="px-2.5 py-2 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.discount)}</td>
                                                <td className="px-2.5 py-2 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(row.amtExclSalesTax)}</td>
                                                <td className="px-2.5 py-2 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.salesTax)}</td>
                                                <td className="px-2.5 py-2 text-right font-mono font-semibold text-[#A27B3A]">{fmt(row.amtInclST)}</td>
                                                <td className="px-2.5 py-2 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.furtherTax)}</td>
                                                <td className="px-2.5 py-2 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(row.amtInclFT)}</td>
                                                <td className="px-2.5 py-2 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.advanceTax)}</td>
                                                <td className="px-2.5 py-2 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmtPercent(row.advTaxPercent)}</td>
                                                <td className="px-2.5 py-2 text-right font-mono font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{fmt(row.total)}</td>
                                                <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.fbrInvoiceNo}</td>
                                                <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.source}</td>
                                                <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.user}</td>
                                                <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.mappingId}</td>
                                            </tr>
                                        ))}
                                    </>
                                )
                            ) : paginatedSummaries.length === 0 ? (
                                <tr>
                                    <td colSpan={SUMMARY_COLUMNS.length} className="py-12 text-center text-[12px] text-[#9CA3AF] italic bg-white dark:bg-[#242424]">
                                        No customers match the current filters.
                                    </td>
                                </tr>
                            ) : (
                                paginatedSummaries.map((s, i) => (
                                    <tr
                                        key={s.customerNo}
                                        onClick={() => setSelectedCustomerNo(s.customerNo)}
                                        className={cn(i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]", "hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer")}
                                    >
                                        <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{(page - 1) * rowsPerPage + i + 1}</td>
                                        <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af]">{s.customerNo}</td>
                                        <td className="px-2.5 py-2 font-semibold text-[#A27B3A] hover:underline whitespace-nowrap">{s.customerName}</td>
                                        <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af]">{s.customerType}</td>
                                        <td className="px-2.5 py-2 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{s.invoiceCount}</td>
                                        <td className="px-2.5 py-2 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(s.assessedValue)}</td>
                                        <td className="px-2.5 py-2 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(s.salesTax)}</td>
                                        <td className="px-2.5 py-2 text-right font-mono font-semibold text-[#A27B3A]">{fmt(s.total)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">Row</span>
                        <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                            className="h-8 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-2 focus:outline-none focus:border-[#C69A52] appearance-none"
                            style={selectArrow}>
                            {ROW_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">
                            Page <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{page}</span> of{" "}
                            <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{totalPages}</span>
                        </span>
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CustomerLedgerPage() {
    return <Suspense fallback={null}><CustomerLedgerContent /></Suspense>;
}

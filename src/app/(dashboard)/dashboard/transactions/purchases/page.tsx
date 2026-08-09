"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, Plus, CheckSquare, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import {
    TransactionListShell,
    fmt,
    statusBadge,
    btnOutline,
} from "@/components/dashboard/transaction-list-shell";
import {
    purchasesService,
    type Purchase as ApiPurchase,
    type PurchaseStatus,
} from "@/lib/services";

interface PurchaseInvoice {
    id: number;
    uuid: string;
    invoiceNo: string;
    vendorNo: string;
    vendorName: string;
    vendorInvoiceNo: string;
    status: "Posted" | "UnPosted" | "Cancelled";
    source: string;
    user: string;
    docDate: string;
    postingDate: string;
    assessedValue: number;
    discount: number;
    salesTax: number;
    furtherTax: number;
}

const MOCK_PURCHASES: PurchaseInvoice[] = [];

const uiStatus = (s: PurchaseStatus): PurchaseInvoice["status"] => {
    if (s === "posted") return "Posted";
    if (s === "cancelled") return "Cancelled";
    return "UnPosted";
};

const apiStatus = (s: string): PurchaseStatus | undefined => {
    if (s === "Posted") return "posted";
    if (s === "Cancelled") return "cancelled";
    if (s === "UnPosted") return "draft";
    return undefined;
};

const toRow = (p: ApiPurchase): PurchaseInvoice => ({
    id: p.id,
    uuid: p.uuid,
    invoiceNo: p.purchaseNo ?? `PI-${String(p.id).padStart(4, "0")}`,
    vendorNo: p.vendor?.vendorNo ?? String(p.vendorId),
    vendorName: p.vendorBusinessName,
    vendorInvoiceNo: p.vendorInvoiceNo ?? "—",
    status: uiStatus(p.status),
    source: p.source,
    user: String(p.createdBy),
    docDate: p.docDate?.slice(0, 10) ?? "",
    postingDate: (p.postingDate ?? p.docDate ?? "").slice(0, 10),
    assessedValue: Number(p.assessedValue),
    discount: Number(p.totalDiscount),
    salesTax: Number(p.totalSalesTax),
    furtherTax: Number(p.totalFurtherTax),
});

const COLUMNS = [
    "Invoice No", "Vendor No", "Vendor Name", "Vendor Invoice No",
    "Status", "Source", "User", "Doc Date", "Posting Date",
    "Assessed Value", "Discount", "Sales Tax", "Further Tax",
];

const DATE_HINT = "Date range includes invoices where document date or posting date falls between the selected days (inclusive). Leave dates empty to load all periods.";

function PurchaseInvoiceContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [status, setStatus] = useState(() => searchParams.get("status") ?? "All");
    const [source, setSource] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setStatus(searchParams.get("status") ?? "All");
        setPage(1);
    }, [searchParams]);

    const load = useCallback((showToast = false) => {
        setIsLoading(true);
        setInvoices([]);
        purchasesService.list({
            page,
            limit: rowsPerPage,
            purchaseType: "Purchase Invoice",
            search: search.trim() || undefined,
            status: apiStatus(status),
            from: dateFrom || undefined,
            to: dateTo || undefined,
        })
            .then((res) => {
                setInvoices(res.data.rows.map(toRow));
                if (showToast) toast.success("Purchase invoices refreshed.");
            })
            .catch((err) => {
                const msg = err instanceof Error ? err.message : "Failed to load purchases.";
                // A permission error after a background token refresh means the new token
                // is now in localStorage — a page reload picks it up automatically.
                if (msg.toLowerCase().includes("permission")) {
                    toast.info("Permissions updated — reloading…");
                    setTimeout(() => window.location.reload(), 800);
                } else {
                    toast.error(msg);
                }
            })
            .finally(() => setIsLoading(false));
    }, [page, rowsPerPage, status, search, dateFrom, dateTo]);

    useEffect(() => load(), [load]);

    const filtered = invoices.filter((inv) => {        const q = search.toLowerCase();
        return (
            (!q || inv.invoiceNo.toLowerCase().includes(q) || inv.vendorNo.toLowerCase().includes(q) || inv.vendorName.toLowerCase().includes(q) || inv.vendorInvoiceNo.toLowerCase().includes(q)) &&
            (status === "All" || inv.status === status) &&
            (source === "All" || inv.source === source) &&
            (!dateFrom || inv.docDate >= dateFrom) &&
            (!dateTo || inv.docDate <= dateTo)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const toggleSelect = (id: number) =>
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () =>
        setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((i) => i.id)));

    return (
        <TransactionListShell
            title={`${status === "All" ? "All" : status} Purchase Invoices`}
            backHref="/dashboard"
            headerActions={<>
                <button type="button" onClick={() => load(true)} className={`h-8 ${btnOutline}`}>
                    <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                </button>
                <button type="button" onClick={() => router.push("/dashboard/transactions/purchases/create")}
                    className="flex h-8 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors">
                    <Plus className="h-3.5 w-3.5" /> New
                </button>
                <button type="button" onClick={toggleAll} className={`h-8 ${btnOutline}`}>
                    <CheckSquare className="h-3.5 w-3.5 text-[#A27B3A]" /> Select All
                </button>
                <button type="button" disabled={selected.size === 0} className={`h-8 ${btnOutline} disabled:opacity-40 disabled:cursor-not-allowed`}>
                    <Send className="h-3.5 w-3.5 text-[#A27B3A]" /> Post
                </button>
                <button type="button" disabled={selected.size === 0} className={`h-8 ${btnOutline} disabled:opacity-40 disabled:cursor-not-allowed`}>
                    <Trash2 className="h-3.5 w-3.5 text-[#A27B3A]" /> Delete
                </button>
            </>}
            columns={COLUMNS}
            withCheckbox
            isAllSelected={paginated.length > 0 && selected.size === paginated.length}
            onToggleAll={toggleAll}
            isLoading={isLoading}
            hasRows={paginated.length > 0}
            loadingLabel="Loading Purchase Invoices..."
            emptyMessage="No purchase invoices match the current filters."
            dateHint={DATE_HINT}
            search={search} onSearchChange={setSearch}
            dateFrom={dateFrom} onDateFromChange={setDateFrom}
            dateTo={dateTo} onDateToChange={setDateTo}
            status={status} onStatusChange={setStatus}
            source={source} onSourceChange={setSource}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={setRowsPerPage}
            page={page} totalPages={totalPages} onPageChange={setPage}
        >
            {paginated.map((inv, i) => (
                <tr key={inv.id}
                    className={cn("cursor-pointer transition-colors hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]", selected.has(inv.id) ? "bg-[#FDF3E3] dark:bg-[#3a2a10]" : i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]")}
                    onClick={() => toggleSelect(inv.id)}>
                    <td className="px-3 py-2.5 text-center">
                        <input type="checkbox" checked={selected.has(inv.id)} onChange={() => toggleSelect(inv.id)}
                            onClick={(e) => e.stopPropagation()} className="h-3.5 w-3.5 accent-[#C69A52] cursor-pointer" />
                    </td>
                    <td className="px-3 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{inv.invoiceNo}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.vendorNo}</td>
                    <td className="px-3 py-2.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{inv.vendorName}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.vendorInvoiceNo}</td>
                    <td className="px-3 py-2.5">{statusBadge(inv.status)}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.source}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.user}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.docDate}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.postingDate}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.assessedValue)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.discount)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.salesTax)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#A27B3A] font-semibold">{fmt(inv.furtherTax)}</td>
                </tr>
            ))}
        </TransactionListShell>
    );
}

export default function PurchaseInvoicePage() {
    return <Suspense fallback={null}><PurchaseInvoiceContent /></Suspense>;
}

"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, Plus, CheckSquare, Send, Trash2, BookOpen, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import {
    TransactionListShell,
    fmt,
    statusBadge,
    btnOutline,
} from "@/components/dashboard/transaction-list-shell";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
    purchasesService,
    type Purchase as ApiPurchase,
    type PurchaseStatus,
} from "@/lib/services";
import { exportRowsToExcel } from "@/lib/export";

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
    amtExclST: number;
    salesTax: number;
    amtInclST: number;
    furtherTax: number;
    amtInclFT: number;
    advanceTax: number;
    advTaxPercent: number;
    total: number;
}

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
    amtExclST: Number(p.totalValueExcludingST),
    salesTax: Number(p.totalSalesTax),
    amtInclST: Number(p.totalValueIncludingST) - Number(p.totalFurtherTax) - Number(p.totalFedPayable),
    furtherTax: Number(p.totalFurtherTax),
    amtInclFT: Number(p.totalValueIncludingST) - Number(p.totalFedPayable),
    advanceTax: Number(p.advanceTax),
    advTaxPercent: Number(p.totalValueIncludingST) > 0 ? (Number(p.advanceTax) / Number(p.totalValueIncludingST)) * 100 : 0,
    total: Number(p.totalValueIncludingST) + Number(p.advanceTax),
});

const fmtPercent = (n: number) => `${n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

const COLUMNS = [
    "Invoice No", "Vendor No", "Vendor Name", "Vendor Invoice No",
    "Status", "Source", "User", "Doc Date", "Posting Date",
    "Assessed Value", "Discount", "Amt Excl ST", "Sales Tax", "Amt Incl ST",
    "Further Tax", "Amt Incl FT", "Advance Tax", "Adv Tax %", "Total", "Actions",
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
    const [posting, setPosting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

    const filtered = invoices.filter((inv) => {
        const q = search.toLowerCase();
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

    const handleExport = () => {
        if (paginated.length === 0) {
            toast.error("No purchase invoices to export.");
            return;
        }
        const exportCols = COLUMNS.filter((c) => c !== "Actions");
        const rows = paginated.map((inv) => [
            inv.invoiceNo, inv.vendorNo, inv.vendorName, inv.vendorInvoiceNo,
            inv.status, inv.source, inv.user, inv.docDate, inv.postingDate,
            inv.assessedValue, inv.discount, inv.amtExclST, inv.salesTax, inv.amtInclST,
            inv.furtherTax, inv.amtInclFT, inv.advanceTax, inv.advTaxPercent, inv.total,
        ]);
        exportRowsToExcel("Purchase_Invoices", exportCols, rows);
        toast.success("Purchase invoices exported.");
    };

    const handlePost = async () => {
        const targets = paginated.filter((i) => selected.has(i.id) && i.status === "UnPosted");
        if (targets.length === 0) {
            toast.error("Select at least one unposted invoice to post.");
            return;
        }
        setPosting(true);
        let ok = 0, failed = 0;
        for (const inv of targets) {
            try {
                await purchasesService.post(inv.uuid);
                ok++;
            } catch {
                failed++;
            }
        }
        setPosting(false);
        setSelected(new Set());
        if (ok > 0) toast.success(`${ok} purchase invoice${ok > 1 ? "s" : ""} posted.`);
        if (failed > 0) toast.error(`${failed} invoice${failed > 1 ? "s" : ""} failed to post.`);
        load(false);
    };

    const handleDelete = async () => {
        const targets = paginated.filter((i) => selected.has(i.id) && i.status !== "Posted");
        setShowDeleteConfirm(false);
        if (targets.length === 0) {
            toast.error("Posted invoices cannot be deleted.");
            return;
        }
        setDeleting(true);
        let ok = 0, failed = 0;
        for (const inv of targets) {
            try {
                await purchasesService.remove(inv.uuid);
                ok++;
            } catch {
                failed++;
            }
        }
        setDeleting(false);
        setSelected(new Set());
        if (ok > 0) toast.success(`${ok} purchase invoice${ok > 1 ? "s" : ""} deleted.`);
        if (failed > 0) toast.error(`${failed} invoice${failed > 1 ? "s" : ""} failed to delete.`);
        load(false);
    };

    return (
        <>
            <TransactionListShell
                title={`${status === "All" ? "All" : status} Purchase Invoices`}
                backHref="/dashboard"
                headerActions={<>
                    <button type="button" onClick={() => load(true)} className={`h-8 ${btnOutline}`}>
                        <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                    </button>
                    <button type="button" onClick={() => router.push("/dashboard/transactions/purchases/create")}
                        className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors cursor-pointer">
                        <Plus className="h-3.5 w-3.5" /> New
                    </button>
                    <button type="button" onClick={toggleAll} className={`h-8 ${btnOutline}`}>
                        <CheckSquare className="h-3.5 w-3.5 text-[#A27B3A]" /> Select All
                    </button>
                    <button type="button" disabled={selected.size === 0 || posting} onClick={handlePost} className={`h-8 ${btnOutline} disabled:opacity-40 disabled:cursor-not-allowed`}>
                        <Send className="h-3.5 w-3.5 text-[#A27B3A]" /> {posting ? "Posting..." : "Post"}
                    </button>
                    <button type="button" disabled={selected.size === 0 || deleting} onClick={() => setShowDeleteConfirm(true)} className={`h-8 ${btnOutline} disabled:opacity-40 disabled:cursor-not-allowed`}>
                        <Trash2 className="h-3.5 w-3.5 text-[#A27B3A]" /> {deleting ? "Deleting..." : "Delete"}
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
                onExport={handleExport}
            >
                {paginated.map((inv, i) => (
                    <tr key={inv.id}
                        className={cn("cursor-pointer transition-colors hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]", selected.has(inv.id) ? "bg-[#FDF3E3] dark:bg-[#3a2a10]" : i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]")}
                        onClick={() => toggleSelect(inv.id)}>
                        <td className="px-2 py-1.5 text-center">
                            <input type="checkbox" checked={selected.has(inv.id)} onChange={() => toggleSelect(inv.id)}
                                onClick={(e) => e.stopPropagation()} className="h-3.5 w-3.5 accent-[#C69A52] cursor-pointer" />
                        </td>
                        <td className="px-2 py-1.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{inv.invoiceNo}</td>
                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.vendorNo}</td>
                        <td className="px-2 py-1.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{inv.vendorName}</td>
                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.vendorInvoiceNo}</td>
                        <td className="px-2 py-1.5">{statusBadge(inv.status)}</td>
                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.source}</td>
                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.user}</td>
                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.docDate}</td>
                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.postingDate}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.assessedValue)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.discount)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.amtExclST)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.salesTax)}</td>
                        <td className="px-2 py-1.5 text-right font-mono font-semibold text-[#A27B3A]">{fmt(inv.amtInclST)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.furtherTax)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.amtInclFT)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.advanceTax)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmtPercent(inv.advTaxPercent)}</td>
                        <td className="px-2 py-1.5 text-right font-mono font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.total)}</td>
                        <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    title="Open vendor ledger"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/dashboard/transactions/ledger/vendor-ledger?purchaseUuid=${inv.uuid}`);
                                    }}
                                    className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] hover:text-[#A27B3A] transition-colors cursor-pointer"
                                >
                                    <BookOpen className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    title="View purchase invoice"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/print/purchase/${inv.uuid}`);
                                    }}
                                    className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] hover:text-[#A27B3A] transition-colors cursor-pointer"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </TransactionListShell>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete selected purchase invoices?"
                message="Unposted purchase invoices in the selection will be permanently removed. Posted invoices will be skipped."
                confirmLabel="Delete"
                isLoading={deleting}
                loadingLabel="Deleting..."
            />
        </>
    );
}

export default function PurchaseInvoicePage() {
    return <Suspense fallback={null}><PurchaseInvoiceContent /></Suspense>;
}

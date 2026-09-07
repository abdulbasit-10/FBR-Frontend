"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, Plus, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import {
    TransactionListShell,
    fmt,
    statusBadge,
    btnOutline,
} from "@/components/dashboard/transaction-list-shell";
import {
    SelectPurchaseInvoiceModal,
    type PurchaseInvoiceForReturn,
} from "@/components/dashboard/select-purchase-invoice-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { exportRowsToExcel } from "@/lib/export";
import {
    purchasesService,
    type Purchase as ApiPurchase,
    type PurchaseStatus,
} from "@/lib/services";

interface PurchaseReturn {
    id: number;
    uuid: string;
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

const MOCK_RETURNS: PurchaseReturn[] = [];

const uiStatus = (s: PurchaseStatus): PurchaseReturn["status"] => {
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

const toRow = (p: ApiPurchase): PurchaseReturn => ({
    id: p.id,
    uuid: p.uuid,
    returnNo: p.purchaseNo ?? `PR-${String(p.id).padStart(4, "0")}`,
    originalPI: p.vendorInvoiceNo ?? "—",
    vendorNo: p.vendor?.vendorNo ?? String(p.vendorId),
    vendorName: p.vendorBusinessName,
    status: uiStatus(p.status),
    source: p.source,
    user: String(p.createdBy),
    docDate: p.docDate?.slice(0, 10) ?? "",
    postingDate: (p.postingDate ?? p.docDate ?? "").slice(0, 10),
    assessedValue: Number(p.assessedValue),
    discount: Number(p.totalDiscount),
    salesTax: Number(p.totalSalesTax),
    furtherTax: Number(p.totalFurtherTax),
    advanceTax: Number(p.advanceTax),
});

const COLUMNS = [
    "S.No", "Return No", "Original PI", "Vendor No", "Vendor Name",
    "Status", "Source", "User", "Doc Date", "Posting Date",
    "Assessed Value", "Discount", "Sales Tax", "Further Tax", "Advance Tax",
];

const DATE_HINT = "Date range includes returns where document date or posting date falls between the selected days (inclusive). Leave dates empty to include all periods.";

function PurchaseReturnContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [status, setStatus] = useState(() => searchParams.get("status") ?? "All");
    const [source, setSource] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [returns, setReturns] = useState<PurchaseReturn[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
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
        purchasesService.list({
            page,
            limit: rowsPerPage,
            purchaseType: "Purchase Return",
            search: search.trim() || undefined,
            status: apiStatus(status),
            from: dateFrom || undefined,
            to: dateTo || undefined,
        })
            .then((res) => {
                setReturns(res.data.rows.map(toRow));
                if (showToast) toast.success("Purchase returns refreshed.");
            })
            .catch((err) => {
                const msg = err instanceof Error ? err.message : "Failed to load purchase returns.";
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

    const handleExport = () => {
        if (paginated.length === 0) { toast.error("No returns to export."); return; }
        exportRowsToExcel(
            "Purchase_Returns",
            COLUMNS.filter((c) => c !== "S.No"),
            paginated.map((r) => [r.returnNo, r.originalPI, r.vendorNo, r.vendorName, r.status, r.source, r.user, r.docDate, r.postingDate, r.assessedValue, r.discount, r.salesTax, r.furtherTax, r.advanceTax]),
        );
        toast.success("Purchase returns exported.");
    };

    const toggleSelect = (id: number) =>
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () =>
        setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((r) => r.id)));

    const handleInvoiceSelect = (inv: PurchaseInvoiceForReturn) => {
        const params = new URLSearchParams({ originalUuid: inv.uuid });
        router.push(`/dashboard/transactions/purchases/returns/create?${params.toString()}`);
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
                await purchasesService.post(r.uuid);
                ok++;
            } catch {
                failed++;
            }
        }
        setPosting(false);
        setSelected(new Set());
        if (ok > 0) toast.success(`${ok} purchase return${ok > 1 ? "s" : ""} posted.`);
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
                await purchasesService.remove(r.uuid);
                ok++;
            } catch {
                failed++;
            }
        }
        setDeleting(false);
        setSelected(new Set());
        if (ok > 0) toast.success(`${ok} purchase return${ok > 1 ? "s" : ""} deleted.`);
        if (failed > 0) toast.error(`${failed} return${failed > 1 ? "s" : ""} failed to delete.`);
        load(false);
    };

    return (
        <>
            <TransactionListShell
                title={`${status === "All" ? "All" : status} Purchase Returns`}
                backHref="/dashboard"
                headerActions={<>
                    <button type="button" onClick={() => load(true)} className={`h-9 ${btnOutline}`}>
                        <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                    </button>
                    <button type="button" disabled={selected.size === 0 || posting} onClick={handlePost} className={`h-9 ${btnOutline} disabled:opacity-40 disabled:cursor-not-allowed`}>
                        <Send className="h-3.5 w-3.5 text-[#A27B3A]" /> {posting ? "Posting..." : "Post"}
                    </button>
                    <button type="button" disabled={selected.size === 0 || deleting} onClick={() => setShowDeleteConfirm(true)} className={`h-9 ${btnOutline} disabled:opacity-40 disabled:cursor-not-allowed`}>
                        <Trash2 className="h-3.5 w-3.5 text-[#A27B3A]" /> {deleting ? "Deleting..." : "Delete"}
                    </button>
                    <button type="button" onClick={() => setShowModal(true)}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                        <Plus className="h-3.5 w-3.5" /> New
                    </button>
                </>}
                columns={COLUMNS}
                withCheckbox
                isAllSelected={paginated.length > 0 && selected.size === paginated.length}
                onToggleAll={toggleAll}
                isLoading={isLoading}
                hasRows={paginated.length > 0}
                loadingLabel="Loading Purchase Returns..."
                emptyMessage="No purchase returns match the current filters."
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
                {paginated.map((r, i) => {
                    const isSelected = selected.has(r.id);
                    return (
                        <tr key={r.id}
                            className={cn("cursor-pointer transition-colors hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]", isSelected ? "bg-[#FAF6F0] dark:bg-[#3a2a10]" : i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]")}
                            onClick={() => toggleSelect(r.id)}>
                            <td className="px-3 py-2.5 text-center">
                                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(r.id)}
                                    onClick={(e) => e.stopPropagation()} className="h-4 w-4 rounded border-[#D1D5DB] accent-[#C69A52] cursor-pointer" />
                            </td>
                            <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{(page - 1) * rowsPerPage + i + 1}</td>
                            <td className="px-3 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.returnNo}</td>
                            <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.originalPI}</td>
                            <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.vendorNo}</td>
                            <td className="px-3 py-2.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.vendorName}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap">{statusBadge(r.status)}</td>
                            <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.source}</td>
                            <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.user}</td>
                            <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.docDate}</td>
                            <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.postingDate}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{fmt(r.assessedValue)}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{fmt(r.discount)}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{fmt(r.salesTax)}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{fmt(r.furtherTax)}</td>
                            <td className="px-3 py-2.5 text-right font-mono font-semibold text-[#A27B3A] whitespace-nowrap">{fmt(r.advanceTax)}</td>
                        </tr>
                    );
                })}
            </TransactionListShell>
            <SelectPurchaseInvoiceModal isOpen={showModal} onClose={() => setShowModal(false)} onSelect={handleInvoiceSelect} />
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete selected purchase returns?"
                message="Unposted purchase returns in the selection will be permanently removed. Posted returns will be skipped."
                confirmLabel="Delete"
                isLoading={deleting}
                loadingLabel="Deleting..."
            />
        </>
    );
}

export default function PurchaseReturnPage() {
    return <Suspense fallback={null}><PurchaseReturnContent /></Suspense>;
}
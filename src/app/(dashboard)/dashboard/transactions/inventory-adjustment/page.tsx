"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, Plus, Eye, Send, Trash2 } from "lucide-react";
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
    inventoryAdjustmentsService,
    type InventoryAdjustment as ApiAdjustment,
    type InventoryAdjustmentStatus,
} from "@/lib/services";

interface InventoryAdjustment {
    id: number;
    uuid: string;
    adjustmentNo: string;
    status: "Posted" | "UnPosted" | "Cancelled";
    source: string;
    user: string;
    docDate: string;
    postingDate: string;
    lines: number;
    lineTotal: number;
}

const MOCK_ADJUSTMENTS: InventoryAdjustment[] = [];

const uiStatus = (s: InventoryAdjustmentStatus): InventoryAdjustment["status"] => {
    if (s === "posted") return "Posted";
    if (s === "cancelled") return "Cancelled";
    return "UnPosted";
};

const apiStatus = (s: string): InventoryAdjustmentStatus | undefined => {
    if (s === "Posted") return "posted";
    if (s === "Cancelled") return "cancelled";
    if (s === "UnPosted") return "draft";
    return undefined;
};

const toRow = (a: ApiAdjustment): InventoryAdjustment => ({
    id: a.id,
    uuid: a.uuid,
    adjustmentNo: a.adjustmentNo ?? `IA-${String(a.id).padStart(4, "0")}`,
    status: uiStatus(a.status),
    source: a.source,
    user: String(a.createdBy),
    docDate: a.docDate?.slice(0, 10) ?? "",
    postingDate: (a.postingDate ?? a.docDate ?? "").slice(0, 10),
    lines: a.lines,
    lineTotal: Number(a.lineTotal),
});

const COLUMNS = [
    "Adjustment No", "Status", "Source", "User",
    "Doc Date", "Posting Date", "Lines", "Line Total", "Actions",
];

const DATE_HINT = "Date range includes adjustments where document date or posting date falls between the selected days (inclusive). Leave dates empty to load all periods. Provide both from and to, or neither.";

function InventoryAdjustmentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [status, setStatus] = useState(() => searchParams.get("status") ?? "All");
    const [source, setSource] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
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
        setAdjustments([]);
        inventoryAdjustmentsService.list({
            page,
            limit: rowsPerPage,
            search: search.trim() || undefined,
            status: apiStatus(status),
            from: dateFrom || undefined,
            to: dateTo || undefined,
        })
            .then((res) => {
                setAdjustments(res.data.rows.map(toRow));
                if (showToast) toast.success("Inventory adjustments refreshed.");
            })
            .catch((err) => {
                const msg = err instanceof Error ? err.message : "Failed to load adjustments.";
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

    const filtered = adjustments.filter((a) => {
        const q = search.toLowerCase();
        return (
            (!q || a.adjustmentNo.toLowerCase().includes(q)) &&
            (status === "All" || a.status === status) &&
            (source === "All" || a.source === source) &&
            (!dateFrom || a.docDate >= dateFrom) &&
            (!dateTo || a.docDate <= dateTo)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const toggleSelect = (id: number) =>
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () =>
        setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((a) => a.id)));

    const handlePost = async () => {
        const targets = paginated.filter((a) => selected.has(a.id) && a.status === "UnPosted");
        if (targets.length === 0) {
            toast.error("Select at least one unposted adjustment to post.");
            return;
        }
        setPosting(true);
        let ok = 0, failed = 0;
        for (const a of targets) {
            try {
                await inventoryAdjustmentsService.post(a.uuid);
                ok++;
            } catch {
                failed++;
            }
        }
        setPosting(false);
        setSelected(new Set());
        if (ok > 0) toast.success(`${ok} adjustment${ok > 1 ? "s" : ""} posted.`);
        if (failed > 0) toast.error(`${failed} adjustment${failed > 1 ? "s" : ""} failed to post.`);
        load(false);
    };

    const handleDelete = async () => {
        const targets = paginated.filter((a) => selected.has(a.id) && a.status !== "Posted");
        setShowDeleteConfirm(false);
        if (targets.length === 0) {
            toast.error("Posted adjustments cannot be deleted.");
            return;
        }
        setDeleting(true);
        let ok = 0, failed = 0;
        for (const a of targets) {
            try {
                await inventoryAdjustmentsService.remove(a.uuid);
                ok++;
            } catch {
                failed++;
            }
        }
        setDeleting(false);
        setSelected(new Set());
        if (ok > 0) toast.success(`${ok} adjustment${ok > 1 ? "s" : ""} deleted.`);
        if (failed > 0) toast.error(`${failed} adjustment${failed > 1 ? "s" : ""} failed to delete.`);
        load(false);
    };

    return (
        <>
        <TransactionListShell
            title={`${status === "All" ? "All" : status} Inventory Adjustments`}
            backHref="/dashboard"
            searchPlaceholder="Adjustment Number"
            headerActions={<>
                <button type="button" onClick={() => load(true)} className={`h-9 ${btnOutline}`}>
                    <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                </button>
                <button type="button" onClick={() => router.push("/dashboard/transactions/inventory-adjustment/create")}
                    className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                    <Plus className="h-3.5 w-3.5" /> New
                </button>
                <button type="button" disabled={selected.size === 0 || posting} onClick={handlePost} className={`h-9 ${btnOutline} disabled:opacity-40 disabled:cursor-not-allowed`}>
                    <Send className="h-3.5 w-3.5 text-[#A27B3A]" /> {posting ? "Posting..." : "Post"}
                </button>
                <button type="button" disabled={selected.size === 0 || deleting} onClick={() => setShowDeleteConfirm(true)} className={`h-9 ${btnOutline} disabled:opacity-40 disabled:cursor-not-allowed`}>
                    <Trash2 className="h-3.5 w-3.5 text-[#A27B3A]" /> {deleting ? "Deleting..." : "Delete"}
                </button>
            </>}
            columns={COLUMNS}
            withCheckbox
            isAllSelected={paginated.length > 0 && selected.size === paginated.length}
            onToggleAll={toggleAll}
            isLoading={isLoading}
            hasRows={paginated.length > 0}
            loadingLabel="Loading Inventory Adjustments..."
            emptyMessage="No adjustments match the current filters."
            dateHint={DATE_HINT}
            search={search} onSearchChange={setSearch}
            dateFrom={dateFrom} onDateFromChange={setDateFrom}
            dateTo={dateTo} onDateToChange={setDateTo}
            status={status} onStatusChange={setStatus}
            source={source} onSourceChange={setSource}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={setRowsPerPage}
            page={page} totalPages={totalPages} onPageChange={setPage}
        >
            {paginated.map((a, i) => (
                <tr key={a.id}
                    className={cn("cursor-pointer transition-colors hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]", selected.has(a.id) ? "bg-[#FDF3E3] dark:bg-[#3a2a10]" : i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]")}
                    onClick={() => toggleSelect(a.id)}>
                    <td className="px-3 py-2.5 text-center">
                        <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)}
                            onClick={(e) => e.stopPropagation()} className="h-3.5 w-3.5 accent-[#C69A52] cursor-pointer" />
                    </td>
                    <td className="px-3 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{a.adjustmentNo}</td>
                    <td className="px-3 py-2.5">{statusBadge(a.status)}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{a.source}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{a.user}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{a.docDate}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{a.postingDate}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{a.lines}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#A27B3A] font-semibold">{fmt(a.lineTotal)}</td>
                    <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => router.push(`/dashboard/transactions/inventory-adjustment/${a.uuid}`)}
                            className="flex items-center gap-1 rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 py-1 text-[11px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                            <Eye className="h-3 w-3" /> View
                        </button>
                    </td>
                </tr>
            ))}
        </TransactionListShell>

        <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
            title="Delete selected inventory adjustments?"
            message="Unposted adjustments in the selection will be permanently removed. Posted adjustments will be skipped."
            confirmLabel="Delete"
            isLoading={deleting}
            loadingLabel="Deleting..."
        />
        </>
    );
}

export default function InventoryAdjustmentPage() {
    return <Suspense fallback={null}><InventoryAdjustmentContent /></Suspense>;
}

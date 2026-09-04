"use client";

import { useCallback, useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, RefreshCw, Send, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { fmt, statusBadge } from "@/components/dashboard/transaction-list-shell";
import {
    inventoryAdjustmentsService,
    type InventoryAdjustment,
    type InventoryAdjustmentStatus,
} from "@/lib/services";

const uiStatus = (s: InventoryAdjustmentStatus): "Posted" | "UnPosted" | "Cancelled" => {
    if (s === "posted") return "Posted";
    if (s === "cancelled") return "Cancelled";
    return "UnPosted";
};

const cardCls = "rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e] p-3 shadow-xs";
const labelCls = "text-[11px] font-medium text-[#4F5967] dark:text-[#9ca3af]";
const valueCls = "text-[13px] font-semibold text-[#1E293B] dark:text-[#f0f0f0]";

export default function InventoryAdjustmentDetailPage(
    { params }: { params: Promise<{ uuid: string }> },
) {
    const { uuid } = usePromise(params);
    const router = useRouter();
    const [adj, setAdj] = useState<InventoryAdjustment | null>(null);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await inventoryAdjustmentsService.getOne(uuid);
            setAdj(res.data);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load adjustment.");
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => { load(); }, [load]);

    const handlePost = async () => {
        setPosting(true);
        try {
            const res = await inventoryAdjustmentsService.post(uuid);
            setAdj(res.data);
            router.refresh();
            toast.success("Inventory adjustment posted.");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to post adjustment.");
        } finally {
            setPosting(false);
        }
    };

    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        setDeleting(true);
        try {
            await inventoryAdjustmentsService.remove(uuid);
            toast.success("Inventory adjustment deleted.");
            router.push("/dashboard/transactions/inventory-adjustment");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete adjustment.");
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <LogoSpinner label="Loading Inventory Adjustment..." />
            </div>
        );
    }

    if (!adj) {
        return (
            <div className="min-h-full space-y-3 text-[#4f5967]" style={{ fontFamily: "'Inter', sans-serif" }}>
                <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-[#A27B3A] hover:opacity-75 transition-opacity cursor-pointer">
                    <ChevronLeft className="h-5 w-5" /> Back
                </button>
                <div className="rounded-[10px] border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
                    Inventory adjustment not found.
                </div>
            </div>
        );
    }

    const status = uiStatus(adj.status);
    const isDraft = adj.status === "draft";

    return (
        <div className="min-h-full space-y-2.5 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-0.5">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[16px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75 transition-opacity cursor-pointer">
                    <ChevronLeft className="h-4.5 w-4.5 text-[#A27B3A]" />
                    {adj.adjustmentNo ?? `IA-${String(adj.id).padStart(4, "0")}`}
                    {statusBadge(status)}
                </button>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={load} className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                        <RefreshCw className="h-3 w-3 text-[#A27B3A]" /> Refresh
                    </button>
                    {isDraft && (
                        <>
                            <button type="button" disabled={deleting} onClick={() => setShowDeleteConfirm(true)} className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer disabled:opacity-50">
                                <Trash2 className="h-3 w-3 text-[#A27B3A]" /> Delete
                            </button>
                            <button type="button" disabled={posting} onClick={handlePost} className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs cursor-pointer disabled:opacity-50">
                                <Send className="h-3 w-3" /> {posting ? "Posting..." : "Post"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Adjustment Header */}
            <div className={`${cardCls} space-y-2.5`}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Adjustment Header</p>
                <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                    <div className="space-y-1">
                        <p className={labelCls}>Doc Date</p>
                        <p className={valueCls}>{adj.docDate?.slice(0, 10) ?? "—"}</p>
                    </div>
                    <div className="space-y-1">
                        <p className={labelCls}>Posting Date</p>
                        <p className={valueCls}>{adj.postingDate?.slice(0, 10) ?? "—"}</p>
                    </div>
                    <div className="space-y-1">
                        <p className={labelCls}>Source</p>
                        <p className={valueCls}>{adj.source}</p>
                    </div>
                    <div className="space-y-1">
                        <p className={labelCls}>Lines</p>
                        <p className={valueCls}>{adj.lines}</p>
                    </div>
                    <div className="space-y-1">
                        <p className={labelCls}>Line Total</p>
                        <p className={valueCls}>{fmt(Number(adj.lineTotal))}</p>
                    </div>
                    <div className="space-y-1">
                        <p className={labelCls}>Posted At</p>
                        <p className={valueCls}>{adj.postedAt ? adj.postedAt.slice(0, 10) : "—"}</p>
                    </div>
                    {(adj.reason || adj.notes) && (
                        <div className="col-span-2 sm:col-span-3 lg:col-span-6 space-y-1">
                            <p className={labelCls}>Reason / Notes</p>
                            <p className="text-[12px] text-[#1E293B] dark:text-[#f0f0f0]">{adj.reason || adj.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Items */}
            <div className={`${cardCls} space-y-2.5`}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Items</p>
                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                    <table className="w-full min-w-150 text-[12px] border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                {["#", "Description", "UOM", "Qty", "Unit Cost", "Line Value"].map((h) => (
                                    <th key={h} className="px-3 py-1.5 text-left font-semibold whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                            {(adj.items ?? []).map((it, i) => (
                                <tr key={it.id} className={i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]"}>
                                    <td className="px-3 py-1.5 text-[#1E293B] dark:text-[#f0f0f0] font-medium">{it.itemSrNo}</td>
                                    <td className="px-3 py-1.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{it.productDescription}</td>
                                    <td className="px-3 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{it.uom}</td>
                                    <td className="px-3 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{it.quantity}</td>
                                    <td className="px-3 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(Number(it.unitCost))}</td>
                                    <td className="px-3 py-1.5 text-right font-mono font-semibold text-[#A27B3A]">{fmt(Number(it.lineValue))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete this inventory adjustment?"
                message="This draft adjustment will be permanently removed."
                confirmLabel="Delete"
                isLoading={deleting}
                loadingLabel="Deleting..."
            />
        </div>
    );
}

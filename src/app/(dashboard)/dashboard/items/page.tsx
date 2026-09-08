"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    RefreshCw, Plus, CheckSquare, Trash2, Download,
    ChevronLeft, ChevronRight, Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { productsService, type Product } from "@/lib/services";
import { exportRowsToExcel } from "@/lib/export";

// Local row shape flattens the backend Product model for the table.
interface Item {
    id: number;
    uuid: string;
    itemNo: string;
    name: string;
    type: string;
    hsCode: string;
    category: string;
    saleType: string;
    tax: string;
    unitCost: number;
    unitPrice: number;
    retail: number;
}

const TYPE_OPTIONS = ["All", "Goods", "Service", "Digital"];
const ROW_OPTIONS = [50, 100, 200];
const TABLE_COLS = ["Item No", "Name", "Type", "HS Code", "Sale Type", "Tax", "Unit Price", "Retail", "Actions"];

const toRow = (p: Product): Item => ({
    id: p.id,
    uuid: p.uuid,
    itemNo: `I-${String(p.id).padStart(6, "0")}`,
    name: p.name,
    type: "Goods",
    hsCode: p.hsCode,
    category: p.description ?? "—",
    saleType: p.saleType,
    tax: p.rate,
    unitCost: 0,
    unitPrice: p.unitPrice,
    retail: p.fixedNotifiedValueOrRetailPrice,
});

const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};
const selectCls = "h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";

export default function ItemsPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [items, setItems] = useState<Item[]>([]);
    const [total, setTotal] = useState(0);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const load = useCallback(
        async (showToast = false) => {
            setIsLoading(true);
            setItems([]);
            try {
                const res = await productsService.list({
                    page,
                    limit: rowsPerPage,
                    search: search.trim() || undefined,
                    sortBy: "createdAt",
                    sortDir: "DESC",
                });
                setItems(res.data.rows.map(toRow));
                setTotal(res.data.meta.total);
                if (showToast) toast.success("Items refreshed.");
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to load items.");
            } finally {
                setIsLoading(false);
            }
        },
        [page, rowsPerPage, search],
    );

    useEffect(() => {
        load();
    }, [load]);

    // Server does the filtering + pagination.
    const paginated = items;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

    const handleExport = () => {
        if (paginated.length === 0) { toast.error("No items to export."); return; }
        exportRowsToExcel(
            "Items",
            TABLE_COLS.slice(0, -1),
            paginated.map((i) => [i.itemNo, i.name, i.type, i.hsCode, i.saleType, i.tax, i.unitPrice, i.retail]),
        );
        toast.success("Items exported.");
    };

    const handleDelete = async () => {
        if (selected.size === 0) return;
        setIsDeleting(true);
        const rowsToDelete = items.filter((it) => selected.has(it.id));
        const results = await Promise.allSettled(rowsToDelete.map((it) => productsService.remove(it.uuid)));
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed === 0) toast.success(`${rowsToDelete.length} item(s) deleted.`);
        else toast.error(`${failed} of ${rowsToDelete.length} deletions failed.`);
        setSelected(new Set());
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        load();
    };

    const toggleSelect = (id: number) =>
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () =>
        setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((c) => c.id)));

    const fmt = (n: number) => n.toFixed(2);

    return (
        <div className="min-h-full space-y-2.5 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()} className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-4.5 w-4.5" />
                    </button>
                    <h1 className="text-[16px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Items</h1>
                </div>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => load(true)}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                        <RefreshCw className="h-3 w-3 text-[#A27B3A]" /> Refresh
                    </button>
                    <button type="button" onClick={() => router.push("/dashboard/items/new")}
                        className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs cursor-pointer">
                        <Plus className="h-3 w-3" /> New
                    </button>
                    <button type="button" onClick={toggleAll}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                        <CheckSquare className="h-3 w-3 text-[#A27B3A]" /> Select All
                    </button>
                    <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={selected.size === 0}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                        <Trash2 className="h-3 w-3 text-[#A27B3A]" /> Delete
                    </button>
                </div>
            </div>

            {/* Filter card */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3 space-y-2">
                <div className="flex items-center gap-2 max-w-2xl">
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder="Name, item no, HS code, category…"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="h-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                        />
                    </div>
                    <button type="button" onClick={() => setPage(1)}
                        className="h-9 rounded-[6px] bg-[#C69A52] px-5 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors cursor-pointer">
                        Search
                    </button>
                </div>
                <div className="flex flex-wrap items-end gap-2 pt-0.5">
                    <p className="text-[11px] text-[#9CA3AF] italic">Type & source filters run on the FBR product catalog once available.</p>
                </div>
            </div>

            {/* Table card */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                    <button type="button" onClick={handleExport}
                        className="flex h-7 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                        <Download className="h-3 w-3 text-[#A27B3A]" /> Export
                    </button>
                    <p className="text-[11px] text-[#9CA3AF] italic">Scroll right to view row actions</p>
                </div>

                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                    <table className="w-full text-[12px] border-collapse min-w-[1100px]">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                <th className="w-10 px-2.5 py-1.5 text-center">
                                    <input
                                        type="checkbox"
                                        checked={paginated.length > 0 && selected.size === paginated.length}
                                        onChange={toggleAll}
                                        className="h-3.5 w-3.5 rounded border-white/60 accent-white cursor-pointer"
                                    />
                                </th>
                                {TABLE_COLS.map((col) => (
                                    <th key={col} className="px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length + 1} className="py-8 text-center bg-white dark:bg-[#242424]">
                                        <LogoSpinner label="Loading Items..." className="mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length + 1} className="py-10 text-center bg-white dark:bg-[#242424]">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6EE] dark:bg-[#2a2a2a]">
                                                <Package className="h-5 w-5 text-[#C69A52]" />
                                            </div>
                                            <p className="text-[12px] text-[#9CA3AF] italic">No items found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((item) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => toggleSelect(item.id)}
                                        className={cn(
                                            "cursor-pointer transition-colors",
                                            selected.has(item.id)
                                                ? "bg-[#FEF9EF] dark:bg-[#2d2510]"
                                                : "bg-white dark:bg-[#242424] hover:bg-[#FAFAFA] dark:hover:bg-[#2a2a2a]"
                                        )}
                                    >
                                        <td className="px-2.5 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selected.has(item.id)}
                                                onChange={() => toggleSelect(item.id)}
                                                className="h-3.5 w-3.5 rounded accent-[#C69A52] cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-2.5 py-1.5 font-medium text-[#C69A52] whitespace-nowrap">{item.itemNo}</td>
                                        <td className="px-2.5 py-1.5 text-[#1E293B] dark:text-[#f0f0f0] max-w-[200px] truncate">{item.name}</td>
                                        <td className="px-2.5 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{item.type}</td>
                                        <td className="px-2.5 py-1.5 font-mono text-[11px] text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{item.hsCode}</td>
                                        <td className="px-2.5 py-1.5 whitespace-nowrap">
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                item.saleType === "Exempt"
                                                    ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                                    : item.saleType === "Standard"
                                                        ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                                        : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                                            )}>{item.saleType}</span>
                                        </td>
                                        <td className="px-2.5 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{item.tax}</td>
                                        <td className="px-2.5 py-1.5 text-right text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap font-mono text-[11px]">{fmt(item.unitPrice)}</td>
                                        <td className="px-2.5 py-1.5 text-right text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap font-mono text-[11px]">{fmt(item.retail)}</td>
                                        <td className="px-2.5 py-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => router.push(`/dashboard/items/${item.uuid}`)}
                                                className="rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 py-1 text-[11px] font-medium text-[#C69A52] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {!isLoading && paginated.length > 0 && (<div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2 text-[12px] text-[#6B7280] dark:text-[#9ca3af]">
                        <span>Rows per page:</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                            className="h-8 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] px-2 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer"
                            style={selectArrow}
                        >
                            {ROW_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="ml-2">{total} item{total !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#6B7280] hover:bg-[#F9FAFB] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-[12px] text-[#6B7280] dark:text-[#9ca3af] px-2">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#6B7280] hover:bg-[#F9FAFB] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete items"
                message={`Are you sure you want to delete ${selected.size} item${selected.size === 1 ? "" : "s"}? This cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                isLoading={isDeleting}
                loadingLabel="Deleting…"
            />
        </div>
    );
}

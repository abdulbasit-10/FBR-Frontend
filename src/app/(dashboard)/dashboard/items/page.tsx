"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    RefreshCw, Plus, CheckSquare, Trash2, Download,
    ChevronLeft, ChevronRight, Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";

interface Item {
    id: number;
    itemNo: string;
    name: string;
    type: string;
    hsCode: string;
    category: string;
    saleType: string;
    tax: string;
    source: string;
    unitCost: number;
    unitPrice: number;
    retail: number;
}

const MOCK_ITEMS: Item[] = [
    { id: 1, itemNo: "I-000009", name: "AUGMENTIN 375MG TAB 14'S", type: "Goods", hsCode: "3004.2090", category: "Pharma", saleType: "Exempt", tax: "0%", source: "Manual", unitCost: 250.00, unitPrice: 312.00, retail: 325.00 },
    { id: 2, itemNo: "I-000008", name: "PANADOL EXTRA TABLET 20'S", type: "Goods", hsCode: "3004.9010", category: "Pharma", saleType: "Standard", tax: "17%", source: "API", unitCost: 45.00, unitPrice: 56.00, retail: 62.00 },
    { id: 3, itemNo: "I-000007", name: "CIPROFLOXACIN 500MG TAB", type: "Goods", hsCode: "3004.2010", category: "Pharma", saleType: "Reduced", tax: "5%", source: "Import", unitCost: 120.00, unitPrice: 148.00, retail: 155.00 },
    { id: 4, itemNo: "I-000006", name: "OMEPRAZOLE 20MG CAP", type: "Goods", hsCode: "3004.9020", category: "Pharma", saleType: "Exempt", tax: "0%", source: "Manual", unitCost: 90.00, unitPrice: 112.00, retail: 118.00 },
    { id: 5, itemNo: "I-000005", name: "AMOXICILLIN 500MG CAP", type: "Goods", hsCode: "3004.2030", category: "Pharma", saleType: "Standard", tax: "17%", source: "Manual", unitCost: 185.00, unitPrice: 225.00, retail: 240.00 },
    { id: 6, itemNo: "I-000004", name: "METFORMIN 500MG TAB", type: "Goods", hsCode: "3004.3010", category: "Diabetics", saleType: "Exempt", tax: "0%", source: "API", unitCost: 55.00, unitPrice: 68.00, retail: 72.00 },
    { id: 7, itemNo: "I-000003", name: "COUGH SYRUP 120ML", type: "Goods", hsCode: "3004.9090", category: "OTC", saleType: "Standard", tax: "17%", source: "Manual", unitCost: 75.00, unitPrice: 92.00, retail: 98.00 },
    { id: 8, itemNo: "I-000002", name: "VITAMIN C 500MG EFFERVESCENT", type: "Goods", hsCode: "2936.2100", category: "Supplements", saleType: "Exempt", tax: "0%", source: "Import", unitCost: 210.00, unitPrice: 265.00, retail: 280.00 },
    { id: 9, itemNo: "I-000001", name: "SURGICAL GLOVES L (100 PCS)", type: "Goods", hsCode: "4015.1100", category: "Surgical", saleType: "Standard", tax: "17%", source: "Manual", unitCost: 850.00, unitPrice: 1050.00, retail: 1100.00 },
];

const SOURCE_OPTIONS = ["All", "Manual", "API", "Import"];
const TYPE_OPTIONS = ["All", "Goods", "Service", "Digital"];
const ROW_OPTIONS = [50, 100, 200];
const TABLE_COLS = ["Item No", "Name", "Type", "HS Code", "Category", "Sale Type", "Tax", "Source", "Unit Cost", "Unit Price", "Retail", "Actions"];

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
    const [source, setSource] = useState("All");
    const [type, setType] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [items, setItems] = useState<Item[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);

    const load = useCallback((showToast = false) => {
        setIsLoading(true); setItems([]);
        const t = setTimeout(() => { setItems(MOCK_ITEMS); setIsLoading(false); if (showToast) toast.success("Items refreshed."); }, 1000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => load(), [load]);

    const filtered = items.filter((item) => {
        const q = search.toLowerCase();
        return (
            (!q || item.itemNo.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.hsCode.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)) &&
            (type === "All" || item.type === type) &&
            (source === "All" || item.source === source)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const toggleSelect = (id: number) =>
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () =>
        setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((c) => c.id)));

    const fmt = (n: number) => n.toFixed(2);

    return (
        <div className="min-h-full space-y-4 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()} className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Items</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => load(true)}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                    </button>
                    <button type="button" onClick={() => router.push("/dashboard/items/new")}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                        <Plus className="h-3.5 w-3.5" /> New
                    </button>
                    <button type="button" onClick={toggleAll}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <CheckSquare className="h-3.5 w-3.5 text-[#A27B3A]" /> Select All
                    </button>
                    <button type="button" disabled={selected.size === 0}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        <Trash2 className="h-3.5 w-3.5 text-[#A27B3A]" /> Delete
                    </button>
                </div>
            </div>

            {/* Filter card */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 space-y-3">
                <div className="flex items-center gap-2 max-w-2xl">
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder="Name, item no, HS code, category…"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                        />
                    </div>
                    <button type="button" onClick={() => setPage(1)}
                        className="h-10 rounded-[6px] bg-[#C69A52] px-6 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors">
                        Search
                    </button>
                </div>
                <div className="flex flex-wrap items-end gap-3 pt-1">
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Source</label>
                        <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }}
                            className={cn(selectCls, "min-w-32")} style={selectArrow}>
                            {SOURCE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Type</label>
                        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
                            className={cn(selectCls, "min-w-32")} style={selectArrow}>
                            {TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table card */}
            <div className="rounded-[16px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                    <button type="button" onClick={() => toast.success("Exported successfully.")}
                        className="flex h-8 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <Download className="h-3.5 w-3.5 text-[#A27B3A]" /> Export
                    </button>
                    <p className="text-[11px] text-[#9CA3AF] italic">Scroll right to view row actions</p>
                </div>

                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                    <table className="w-full text-[12px] border-collapse min-w-[1100px]">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                <th className="w-10 px-3 py-2.5 text-center">
                                    <input
                                        type="checkbox"
                                        checked={paginated.length > 0 && selected.size === paginated.length}
                                        onChange={toggleAll}
                                        className="h-4 w-4 rounded border-white/60 accent-white cursor-pointer"
                                    />
                                </th>
                                {TABLE_COLS.map((col) => (
                                    <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length + 1} className="py-10 text-center bg-white dark:bg-[#242424]">
                                        <LogoSpinner label="Loading Items..." className="mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length + 1} className="py-12 text-center bg-white dark:bg-[#242424]">
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
                                        <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selected.has(item.id)}
                                                onChange={() => toggleSelect(item.id)}
                                                className="h-4 w-4 rounded accent-[#C69A52] cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-3 py-2.5 font-medium text-[#C69A52] whitespace-nowrap">{item.itemNo}</td>
                                        <td className="px-3 py-2.5 text-[#1E293B] dark:text-[#f0f0f0] max-w-[200px] truncate">{item.name}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{item.type}</td>
                                        <td className="px-3 py-2.5 font-mono text-[11px] text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{item.hsCode}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{item.category}</td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                item.saleType === "Exempt"
                                                    ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                                    : item.saleType === "Standard"
                                                        ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                                        : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                                            )}>{item.saleType}</span>
                                        </td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{item.tax}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{item.source}</td>
                                        <td className="px-3 py-2.5 text-right text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap font-mono text-[11px]">{fmt(item.unitCost)}</td>
                                        <td className="px-3 py-2.5 text-right text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap font-mono text-[11px]">{fmt(item.unitPrice)}</td>
                                        <td className="px-3 py-2.5 text-right text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap font-mono text-[11px]">{fmt(item.retail)}</td>
                                        <td className="px-3 py-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => router.push(`/dashboard/items/${item.id}`)}
                                                className="rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 py-1 text-[11px] font-medium text-[#C69A52] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {!isLoading && filtered.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
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
                            <span className="ml-2">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#6B7280] hover:bg-[#F9FAFB] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                                className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#6B7280] hover:bg-[#F9FAFB] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

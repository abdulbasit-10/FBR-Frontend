"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Search, RefreshCw, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { LogoSpinner } from "@/components/ui/logo-spinner";

export interface Item {
    id: number;
    itemNo: string;
    name: string;
    type: string;
    hsCode: string;
    category: string;
    saleType: string;
    tax: number;
    unitPrice: number;
}

interface SelectItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: Item) => void;
}

const MOCK_ITEMS: Item[] = [
    { id: 1, itemNo: "ITEM-001", name: "Laptop 15\"", type: "Finished Goods", hsCode: "8471.30", category: "Electronics", saleType: "Taxable", tax: 17, unitPrice: 95000 },
    { id: 2, itemNo: "ITEM-002", name: "Mobile Phone", type: "Finished Goods", hsCode: "8517.12", category: "Electronics", saleType: "Taxable", tax: 17, unitPrice: 52000 },
    { id: 3, itemNo: "ITEM-003", name: "Plastic Casing", type: "Raw Material", hsCode: "3926.90", category: "Packaging", saleType: "Taxable", tax: 17, unitPrice: 320 },
    { id: 4, itemNo: "ITEM-004", name: "Steel Sheet", type: "Raw Material", hsCode: "7204.10", category: "Metal", saleType: "Exempt", tax: 0, unitPrice: 0 },
    { id: 5, itemNo: "ITEM-005", name: "Assembly Service", type: "Service", hsCode: "9987.00", category: "Services", saleType: "Taxable", tax: 13, unitPrice: 5000 },
];

const TYPE_OPTIONS = ["All", "Finished Goods", "Raw Material", "Semi-Finished", "Service", "Consumable"];
const PAGE_SIZE = 10;

const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};

const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function SelectItemModal({ isOpen, onClose, onSelect }: SelectItemModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [items, setItems] = useState<Item[]>([]);
    const [page, setPage] = useState(1);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const loadItems = useCallback(() => {
        setIsLoading(true); setItems([]);
        const t = setTimeout(() => { setItems(MOCK_ITEMS); setIsLoading(false); }, 1000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery(""); setTypeFilter("All"); setPage(1);
            const cleanup = loadItems();
            const ft = setTimeout(() => searchInputRef.current?.focus(), 80);
            return () => { cleanup(); clearTimeout(ft); };
        }
    }, [isOpen, loadItems]);

    useEffect(() => {
        if (!isOpen) return;
        const sw = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden";
        document.body.style.paddingRight = `${sw}px`;
        return () => { document.body.style.overflow = ""; document.body.style.paddingRight = ""; };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    const filtered = items.filter((item) => {
        const q = searchQuery.toLowerCase();
        return (
            (!q || item.name.toLowerCase().includes(q) || item.itemNo.toLowerCase().includes(q) || item.hsCode.toLowerCase().includes(q)) &&
            (typeFilter === "All" || item.type === typeFilter)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (!isOpen) return null;

    const modal = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans" style={{ fontFamily: "'Inter', sans-serif" }} aria-modal="true" role="dialog" aria-label="Select Item">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

            <div className="relative z-10 w-full max-w-4xl rounded-[16px] border-[1.14px] border-[#CDCBCB] bg-white shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6] shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6F0] border border-[#E3D2BA]">
                        <Package className="h-5 w-5 text-[#A27B3A]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[15px] font-bold text-[#1E293B]">Select Item</p>
                        <p className="text-[11px] text-[#9CA3AF]">Search and select an item to add to the adjustment</p>
                    </div>
                    <button onClick={onClose} className="flex items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-3 py-1.5 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] transition-colors">
                        <X className="h-3.5 w-3.5" /> Close
                    </button>
                </div>

                {/* Search + filters */}
                <div className="px-6 pt-4 pb-2 shrink-0 flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-50">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                        <input ref={searchInputRef} type="text" value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            placeholder="Name, item no, HS code"
                            className="h-10 w-full rounded-[6px] border border-[#D1D5DB] bg-white pl-9 pr-3 text-[12px] text-[#1E293B] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C69A52] shadow-none" />
                    </div>
                    <button onClick={() => setPage(1)} className="h-10 rounded-[6px] bg-[#C69A52] px-6 text-[13px] font-semibold text-white hover:bg-[#b58b44] transition-colors shadow-xs">Search</button>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-[#4F5967]">Type</span>
                        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                            className="h-10 rounded-[6px] border border-[#D1D5DB] bg-white text-[12px] text-[#1E293B] px-3 focus:outline-none focus:border-[#C69A52] appearance-none min-w-32"
                            style={selectArrow}>
                            {TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <button onClick={loadItems} className="flex h-10 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] bg-white px-3 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors">
                        <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto px-6 pb-2">
                    <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB]">
                        <table className="w-full text-[12px] border-collapse">
                            <thead>
                                <tr className="bg-[#C69A52] text-white">
                                    {["Item No", "Name", "Type", "HS Code", "Category", "Sale Type", "Tax %", "Unit Price"].map((col) => (
                                        <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F3F4F6]">
                                {isLoading ? (
                                    <tr><td colSpan={8} className="py-10 text-center bg-white">
                                        <LogoSpinner label="Loading Items..." className="mx-auto" />
                                    </td></tr>
                                ) : paginated.length === 0 ? (
                                    <tr><td colSpan={8} className="py-10 text-center text-[12px] text-[#9CA3AF] italic bg-white">
                                        No items match the current search or filters.
                                    </td></tr>
                                ) : paginated.map((item, i) => (
                                    <tr key={item.id}
                                        className={cn("cursor-pointer transition-colors hover:bg-[#FAF6F0]", i % 2 === 0 ? "bg-white" : "bg-[#FAF6F0]/30")}
                                        onClick={() => { onSelect(item); onClose(); }}>
                                        <td className="px-3 py-2.5 font-medium text-[#1E293B]">{item.itemNo}</td>
                                        <td className="px-3 py-2.5 text-[#1E293B] font-medium whitespace-nowrap">{item.name}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967]">{item.type}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967]">{item.hsCode}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967]">{item.category}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967]">{item.saleType}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#4F5967]">{item.tax}%</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#A27B3A] font-semibold">{fmt(item.unitPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer pagination */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-[#F3F4F6] shrink-0">
                    <div />
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] bg-white text-[#4F5967] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[12px] text-[#4F5967]">
                            Page <span className="font-semibold text-[#1E293B]">{page}</span> of{" "}
                            <span className="font-semibold text-[#1E293B]">{totalPages}</span>
                        </span>
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] bg-white text-[#4F5967] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Search, RefreshCw, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { LogoSpinner } from "@/components/ui/logo-spinner";

export interface PurchaseInvoiceForReturn {
    id: number;
    invoiceNo: string;
    vendor: string;
    vendorNo: string;
    docDate: string;
    postDate: string;
    assessed: number;
    discount: number;
}

interface SelectPurchaseInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (invoice: PurchaseInvoiceForReturn) => void;
}

const MOCK_INVOICES: PurchaseInvoiceForReturn[] = [
    { id: 1, invoiceNo: "PI-0001", vendor: "Alpha Suppliers", vendorNo: "V-0001", docDate: "2026-07-02", postDate: "2026-07-02", assessed: 80000, discount: 0 },
    { id: 2, invoiceNo: "PI-0002", vendor: "Beta Distributors", vendorNo: "V-0002", docDate: "2026-07-06", postDate: "2026-07-06", assessed: 45000, discount: 4500 },
    { id: 3, invoiceNo: "PI-0003", vendor: "Alpha Suppliers", vendorNo: "V-0001", docDate: "2026-07-14", postDate: "2026-07-14", assessed: 32000, discount: 0 },
];

const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PAGE_SIZE = 10;

export function SelectPurchaseInvoiceModal({ isOpen, onClose, onSelect }: SelectPurchaseInvoiceModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [invoices, setInvoices] = useState<PurchaseInvoiceForReturn[]>([]);
    const [page, setPage] = useState(1);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const loadInvoices = useCallback(() => {
        setIsLoading(true); setInvoices([]);
        const t = setTimeout(() => { setInvoices(MOCK_INVOICES); setIsLoading(false); }, 1200);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery(""); setPage(1);
            const cleanup = loadInvoices();
            const ft = setTimeout(() => searchInputRef.current?.focus(), 80);
            return () => { cleanup(); clearTimeout(ft); };
        }
    }, [isOpen, loadInvoices]);

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

    const filtered = invoices.filter((inv) => {
        const q = searchQuery.toLowerCase();
        return !q || inv.invoiceNo.toLowerCase().includes(q) || inv.vendor.toLowerCase().includes(q) || inv.vendorNo.toLowerCase().includes(q);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (!isOpen) return null;

    const modal = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }} aria-modal="true" role="dialog">
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" onClick={onClose} />

            <div className="relative z-10 w-full max-w-195 rounded-[14px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">

                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F3F4F6] dark:border-[#2e2e2e] shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#FAF6F0] dark:bg-[#2a2a2a] border border-[#E3D2BA] dark:border-[#3a3a3a]">
                        <FileText className="h-4.5 w-4.5 text-[#A27B3A]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[14px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Select Purchase Invoice For Return</p>
                        <p className="text-[11px] text-[#9CA3AF]">Search and select a customer to continue</p>
                    </div>
                    <button onClick={onClose} className="flex items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3 py-1.5 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors">
                        <X className="h-3.5 w-3.5" /> Close
                    </button>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 px-5 pt-4 pb-3 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
                        <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            placeholder="Name, HS code, category, sale type..."
                            className="h-9 w-full rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] pl-9 pr-3 text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C69A52] shadow-none" />
                    </div>
                    <button onClick={() => setPage(1)} className="h-9 rounded-[6px] bg-[#C69A52] px-5 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors">Search</button>
                    <button onClick={loadInvoices} className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors">
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto min-h-40">
                    <table className="w-full text-[12px] min-w-155">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[#C69A52] text-white">
                                {["Select", "Invoice No", "Vendor", "Vendor No", "Doc date", "Post date", "Assessed", "Discount"].map((h) => (
                                    <th key={h} className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                            {isLoading ? (
                                <tr><td colSpan={8} className="py-12 text-center bg-white dark:bg-[#1a1a1a]"><LogoSpinner label="Loading invoices..." className="mx-auto" /></td></tr>
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={8} className="py-10 text-center text-[12px] text-[#9CA3AF] italic px-6 bg-white dark:bg-[#1a1a1a]">
                                    No posted purchase invoices with returnable quantities. Post a purchase invoice first, or complete existing returns.
                                </td></tr>
                            ) : (
                                paginated.map((inv, i) => (
                                    <tr key={inv.id} className={cn("cursor-pointer transition-colors", i % 2 === 0 ? "bg-white dark:bg-[#1a1a1a]" : "bg-[#FAF6F0]/30 dark:bg-[#1e1e1e]", "hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]")} onClick={() => { onSelect(inv); onClose(); }}>
                                        <td className="px-4 py-2.5">
                                            <button onClick={(e) => { e.stopPropagation(); onSelect(inv); onClose(); }} className="h-4 w-4 rounded-full border-2 border-[#C69A52] bg-white dark:bg-[#1a1a1a] hover:bg-[#C69A52] dark:hover:bg-[#C69A52] transition-colors block" aria-label={`Select ${inv.invoiceNo}`} />
                                        </td>
                                        <td className="px-4 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0]">{inv.invoiceNo}</td>
                                        <td className="px-4 py-2.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{inv.vendor}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.vendorNo}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.docDate}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.postDate}</td>
                                        <td className="px-4 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.assessed)}</td>
                                        <td className="px-4 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.discount)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-3 border-t border-[#F3F4F6] dark:border-[#2e2e2e] bg-[#FAF6EE] dark:bg-[#1e1e1e] px-5 py-2.5 shrink-0">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
                    <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">Page <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{page}</span> of <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{totalPages}</span></span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Search, RefreshCw, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { LogoSpinner } from "@/components/ui/logo-spinner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SaleInvoiceForReturn {
    id: number;
    invoiceNo: string;
    customer: string;
    customerNo: string;
    docDate: string;
    postDate: string;
    assessed: number;
    discount: number;
}

interface SelectInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (invoice: SaleInvoiceForReturn) => void;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_INVOICES: SaleInvoiceForReturn[] = [
    { id: 1, invoiceNo: "SI-0001", customer: "ABC Corporation", customerNo: "C-0001", docDate: "2026-07-01", postDate: "2026-07-01", assessed: 50000, discount: 0 },
    { id: 2, invoiceNo: "SI-0002", customer: "XYZ Ltd", customerNo: "C-0002", docDate: "2026-07-03", postDate: "2026-07-03", assessed: 25000, discount: 2500 },
    { id: 3, invoiceNo: "SI-0004", customer: "ABC Corporation", customerNo: "C-0001", docDate: "2026-07-10", postDate: "2026-07-10", assessed: 15000, discount: 1500 },
];

const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PAGE_SIZE = 10;

// ─── Component ────────────────────────────────────────────────────────────────

export function SelectInvoiceModal({ isOpen, onClose, onSelect }: SelectInvoiceModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [invoices, setInvoices] = useState<SaleInvoiceForReturn[]>([]);
    const [page, setPage] = useState(1);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const loadInvoices = useCallback(() => {
        setIsLoading(true);
        setInvoices([]);
        const t = setTimeout(() => { setInvoices(MOCK_INVOICES); setIsLoading(false); }, 1200);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery("");
            setPage(1);
            const cleanup = loadInvoices();
            const focusTimer = setTimeout(() => searchInputRef.current?.focus(), 80);
            return () => { cleanup(); clearTimeout(focusTimer); };
        }
    }, [isOpen, loadInvoices]);

    // Lock scroll and compensate scrollbar width to prevent layout shift
    useEffect(() => {
        if (!isOpen) return;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden";
        document.body.style.paddingRight = `${scrollbarWidth}px`;
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
        return !q ||
            inv.invoiceNo.toLowerCase().includes(q) ||
            inv.customer.toLowerCase().includes(q) ||
            inv.customerNo.toLowerCase().includes(q);
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (!isOpen) return null;

    const modal = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ fontFamily: "'Inter', sans-serif" }}
            aria-modal="true"
            role="dialog"
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

            <div className="relative z-10 w-full max-w-195 rounded-[14px] border border-[#E5E7EB] bg-white shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">

                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F3F4F6] shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#FAF6F0] border border-[#E3D2BA]">
                        <FileText className="h-4.5 w-4.5 text-[#A27B3A]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[14px] font-bold text-[#1E293B]">Select Sale Invoice For Return</p>
                        <p className="text-[11px] text-[#9CA3AF]">Search and select a customer to continue</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-3 py-1.5 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] transition-colors"
                    >
                        <X className="h-3.5 w-3.5" /> Close
                    </button>
                </div>

                {/* Search row */}
                <div className="flex items-center gap-2 px-5 pt-4 pb-3 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            placeholder="Name, HS code, category, sale type..."
                            className="h-9 w-full rounded-[6px] border border-[#D1D5DB] bg-white pl-9 pr-3 text-[12px] text-[#1E293B] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C69A52] shadow-none"
                        />
                    </div>
                    <button
                        onClick={() => setPage(1)}
                        className="h-9 rounded-[6px] bg-[#C69A52] px-5 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors"
                    >
                        Search
                    </button>
                    <button
                        onClick={loadInvoices}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] bg-white px-3 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] transition-colors"
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto min-h-40">
                    <table className="w-full text-[12px] min-w-155">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[#C69A52] text-white">
                                {["Select", "Invoice no", "Customer", "Cust no", "Doc date", "Post date", "Assessed", "Discount"].map((h) => (
                                    <th key={h} className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center">
                                        <LogoSpinner label="Loading Sale Invoices..." className="mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-10 text-center text-[12px] text-[#9CA3AF] italic">
                                        No items match the current search or filters.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((inv, i) => (
                                    <tr
                                        key={inv.id}
                                        className={cn(
                                            "cursor-pointer transition-colors",
                                            i % 2 === 0 ? "bg-white" : "bg-[#FAF6F0]/30",
                                            "hover:bg-[#FAF6F0]"
                                        )}
                                        onClick={() => { onSelect(inv); onClose(); }}
                                    >
                                        <td className="px-4 py-2.5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSelect(inv); onClose(); }}
                                                className="h-4 w-4 rounded-full border-2 border-[#C69A52] bg-white hover:bg-[#C69A52] transition-colors block"
                                                aria-label={`Select ${inv.invoiceNo}`}
                                            />
                                        </td>
                                        <td className="px-4 py-2.5 font-medium text-[#1E293B]">{inv.invoiceNo}</td>
                                        <td className="px-4 py-2.5 font-semibold text-[#1E293B]">{inv.customer}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967]">{inv.customerNo}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967] whitespace-nowrap">{inv.docDate}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967] whitespace-nowrap">{inv.postDate}</td>
                                        <td className="px-4 py-2.5 text-right font-mono text-[#1E293B]">{fmt(inv.assessed)}</td>
                                        <td className="px-4 py-2.5 text-right font-mono text-[#4F5967]">{fmt(inv.discount)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-3 border-t border-[#F3F4F6] bg-[#FAF6EE] px-5 py-2.5 shrink-0">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] bg-white text-[#4F5967] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[12px] text-[#4F5967]">
                        Page <span className="font-semibold text-[#1E293B]">{page}</span> of{" "}
                        <span className="font-semibold text-[#1E293B]">{totalPages}</span>
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] bg-white text-[#4F5967] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}

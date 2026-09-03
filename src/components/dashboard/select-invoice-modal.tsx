"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Search, RefreshCw, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { invoicesService, type Invoice as ApiInvoice } from "@/lib/services";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SaleInvoiceForReturn {
    id: number;
    uuid: string;
    invoiceNo: string;
    fbrInvoiceNumber: string;
    customer: string;
    customerNo: string;
    docDate: string;
    postDate: string;
    assessed: number;
    discount: number;
    salesTax: number;
    furtherTax: number;
    advanceTax: number;
    total: number;
    mappingId: string;
}

interface SelectInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (invoice: SaleInvoiceForReturn) => void;
}

// Map the real backend Invoice model onto this modal's display shape — only
// posted Sale Invoices (with a real FBR invoice number) can be returned.
const toRow = (inv: ApiInvoice): SaleInvoiceForReturn => ({
    id: inv.id,
    uuid: inv.uuid,
    invoiceNo: inv.fbrInvoiceNumber ?? `SI-${String(inv.id).padStart(4, "0")}`,
    fbrInvoiceNumber: inv.fbrInvoiceNumber ?? "",
    customer: inv.buyerBusinessName,
    customerNo: String(inv.customerId),
    docDate: inv.invoiceDate?.slice(0, 10) ?? "",
    postDate: (inv.postingDate ?? inv.invoiceDate ?? "").slice(0, 10),
    assessed: Number(inv.totalValueExcludingST) + Number(inv.totalDiscount),
    discount: Number(inv.totalDiscount),
    salesTax: Number(inv.totalSalesTax),
    furtherTax: Number(inv.totalFurtherTax),
    advanceTax: Number(inv.advanceTax),
    total: Number(inv.totalValueIncludingST) + Number(inv.advanceTax),
    mappingId: inv.mappingId ?? "—",
});

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
        invoicesService
            .list({ status: "posted", limit: 200, sortBy: "invoice_date", sortDir: "DESC" })
            .then((res) => {
                const saleInvoices = res.data.rows.filter(
                    (inv) => inv.invoiceType === "Sale Invoice" && !!inv.fbrInvoiceNumber,
                );
                setInvoices(saleInvoices.map(toRow));
            })
            .catch(() => setInvoices([]))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery("");
            setPage(1);
            loadInvoices();
            const focusTimer = setTimeout(() => searchInputRef.current?.focus(), 80);
            return () => clearTimeout(focusTimer);
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

            <div className="relative z-10 w-full max-w-240 rounded-[14px] border border-[#E5E7EB] bg-white shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">

                {/* Header */}
                <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[#F3F4F6] shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#FAF6F0] border border-[#E3D2BA]">
                        <FileText className="h-4 w-4 text-[#A27B3A]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[13px] font-bold text-[#1E293B]">Select Sale Invoice For Return</p>
                        <p className="text-[11px] text-[#9CA3AF]">Search and select a customer to continue</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 py-1 text-[11px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                    >
                        <X className="h-3.5 w-3.5" /> Close
                    </button>
                </div>

                {/* Search row */}
                <div className="flex items-center gap-2 px-4 pt-2.5 pb-2 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            placeholder="Name, HS code, category, sale type..."
                            className="h-8 w-full rounded-[6px] border border-[#D1D5DB] bg-white pl-9 pr-3 text-[12px] text-[#1E293B] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C69A52] shadow-none"
                        />
                    </div>
                    <button
                        onClick={() => setPage(1)}
                        className="h-8 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors cursor-pointer"
                    >
                        Search
                    </button>
                    <button
                        onClick={loadInvoices}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto min-h-40">
                    <table className="w-full text-[12px] min-w-260">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[#C69A52] text-white">
                                {["Select", "Invoice no", "Customer", "Cust no", "Doc date", "Post date", "Assessed", "Discount", "Sales tax", "Further tax", "Advance tax", "Total", "Mapping id"].map((h) => (
                                    <th key={h} className="px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={13} className="py-10 text-center">
                                        <LogoSpinner label="Loading Sale Invoices..." className="mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="py-8 text-center text-[12px] text-[#9CA3AF] italic">
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
                                        <td className="px-2.5 py-1.5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSelect(inv); onClose(); }}
                                                className="rounded-[6px] border border-[#94D8D5] bg-[#F1F8F8] px-2.5 py-0.5 text-[11px] font-semibold text-[#0F766E] hover:bg-[#E0F2F2] transition-colors cursor-pointer"
                                            >
                                                Select
                                            </button>
                                        </td>
                                        <td className="px-2.5 py-1.5 font-medium text-[#1E293B] whitespace-nowrap">{inv.invoiceNo}</td>
                                        <td className="px-2.5 py-1.5 font-semibold text-[#1E293B] whitespace-nowrap">{inv.customer}</td>
                                        <td className="px-2.5 py-1.5 text-[#4F5967]">{inv.customerNo}</td>
                                        <td className="px-2.5 py-1.5 text-[#4F5967] whitespace-nowrap">{inv.docDate}</td>
                                        <td className="px-2.5 py-1.5 text-[#4F5967] whitespace-nowrap">{inv.postDate}</td>
                                        <td className="px-2.5 py-1.5 text-right font-mono text-[#1E293B]">{fmt(inv.assessed)}</td>
                                        <td className="px-2.5 py-1.5 text-right font-mono text-[#4F5967]">{fmt(inv.discount)}</td>
                                        <td className="px-2.5 py-1.5 text-right font-mono text-[#4F5967]">{fmt(inv.salesTax)}</td>
                                        <td className="px-2.5 py-1.5 text-right font-mono text-[#4F5967]">{fmt(inv.furtherTax)}</td>
                                        <td className="px-2.5 py-1.5 text-right font-mono text-[#4F5967]">{fmt(inv.advanceTax)}</td>
                                        <td className="px-2.5 py-1.5 text-right font-mono font-semibold text-[#A27B3A]">{fmt(inv.total)}</td>
                                        <td className="px-2.5 py-1.5 text-[#4F5967] whitespace-nowrap">{inv.mappingId}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-3 border-t border-[#F3F4F6] bg-[#FAF6EE] px-3 py-1.5 shrink-0">
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

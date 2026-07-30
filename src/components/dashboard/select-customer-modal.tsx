"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Search, RefreshCw, ChevronLeft, ChevronRight, User } from "lucide-react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { LogoSpinner } from "@/components/ui/logo-spinner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Customer {
    id: number;
    customerNo: string;
    name: string;
    province: string;
    type: string;
    registration: string;
    ntn: string;
    strn: string;
}

interface SelectCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: Customer) => void;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CUSTOMERS: Customer[] = [
    {
        id: 1,
        customerNo: "C-0001",
        name: "ABC Corporation",
        province: "Punjab",
        type: "Registered",
        registration: "Active",
        ntn: "1234567-8",
        strn: "16-00-1234-567-89",
    },
    {
        id: 2,
        customerNo: "C-0002",
        name: "XYZ Ltd",
        province: "Sindh",
        type: "Unregistered",
        registration: "Active",
        ntn: "9876543-2",
        strn: "—",
    },
    {
        id: 3,
        customerNo: "C-0003",
        name: "Global Traders",
        province: "KPK",
        type: "Registered",
        registration: "Inactive",
        ntn: "1122334-4",
        strn: "16-00-1122-334-45",
    },
];

const TYPE_OPTIONS = ["All", "Registered", "Unregistered"];
const REGISTRATION_OPTIONS = ["All", "Active", "Inactive"];
const PAGE_SIZE = 10;

// ─── Component ────────────────────────────────────────────────────────────────

export function SelectCustomerModal({ isOpen, onClose, onSelect }: SelectCustomerModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [registrationFilter, setRegistrationFilter] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [page, setPage] = useState(1);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Simulate initial load
    const loadCustomers = useCallback(() => {
        setIsLoading(true);
        setCustomers([]);
        const timer = setTimeout(() => {
            setCustomers(MOCK_CUSTOMERS);
            setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery("");
            setTypeFilter("All");
            setRegistrationFilter("All");
            setPage(1);
            const cleanup = loadCustomers();
            const focusTimer = setTimeout(() => searchInputRef.current?.focus(), 80);
            return () => {
                cleanup();
                clearTimeout(focusTimer);
            };
        }
    }, [isOpen, loadCustomers]);

    // Lock body scroll and compensate for scrollbar width to prevent layout shift
    useEffect(() => {
        if (!isOpen) return;
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden";
        document.body.style.paddingRight = `${scrollbarWidth}px`;
        return () => {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        };
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    const filtered = customers.filter((c) => {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
            !q ||
            c.name.toLowerCase().includes(q) ||
            c.customerNo.toLowerCase().includes(q) ||
            c.ntn.toLowerCase().includes(q) ||
            c.strn.toLowerCase().includes(q);
        const matchesType = typeFilter === "All" || c.type === typeFilter;
        const matchesReg = registrationFilter === "All" || c.registration === registrationFilter;
        return matchesQuery && matchesType && matchesReg;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (!isOpen) return null;

    const modal = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
            style={{ fontFamily: "'Inter', sans-serif" }}
            aria-modal="true"
            role="dialog"
            aria-label="Select Customer"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Panel (Exact width: 928px) */}
            <div className="relative z-10 w-full max-w-[928px] rounded-[16px] border-[1.14px] border-[#CDCBCB] bg-white shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

                {/* ── Header ── */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6] shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6F0] border border-[#E3D2BA]">
                        <User className="h-5 w-5 text-[#A27B3A]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[15px] font-bold text-[#1E293B]">Select Customer</p>
                        <p className="text-[11px] text-[#9CA3AF]">Search and select a customer to continue</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-3 py-1.5 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                        Close
                    </button>
                </div>

                {/* ── Search row ── */}
                <div className="px-6 pt-4 pb-2 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                placeholder="Name, customer no, mapping id, NTN, STRN,"
                                className="h-[40px] w-full rounded-[6px] border border-[#D1D5DB] bg-white pl-9 pr-3 text-[12px] text-[#1E293B] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C69A52] shadow-none"
                            />
                        </div>
                        <button
                            onClick={() => setPage(1)}
                            className="h-[40px] rounded-[6px] bg-[#C69A52] px-6 text-[13px] font-semibold text-white hover:bg-[#b58b44] transition-colors shadow-xs"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* ── Filter row ── */}
                <div className="flex items-center justify-between px-6 pb-4 pt-1 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] text-[#4F5967] font-medium">Type</span>
                            <select
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                                className="h-8 rounded-[6px] border border-[#D1D5DB] bg-white px-3 pr-8 text-[12px] text-[#1E293B] focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer"
                                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                            >
                                {TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[12px] text-[#4F5967] font-medium">Registration</span>
                            <select
                                value={registrationFilter}
                                onChange={(e) => { setRegistrationFilter(e.target.value); setPage(1); }}
                                className="h-8 rounded-[6px] border border-[#D1D5DB] bg-white px-3 pr-8 text-[12px] text-[#1E293B] focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer"
                                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                            >
                                {REGISTRATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={loadCustomers}
                        className="flex items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] bg-white px-3 py-1.5 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] transition-colors"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                    </button>
                </div>

                {/* ── Table ── */}
                <div className="flex-1 overflow-auto min-h-[200px]">
                    <table className="w-full text-[12px] min-w-[750px]">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[#C69A52] text-white">
                                {["Slect", "Customer no", "Name", "Province", "Type", "Registration", "NTN", "STRN"].map((h) => (
                                    <th key={h} className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="py-14 text-center">
                                        <LogoSpinner label="Loading Customers...." className="mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-[12px] text-[#9CA3AF] italic">
                                        No customers match the current search or filters.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((c, i) => (
                                    <tr
                                        key={c.id}
                                        className={cn(
                                            "transition-colors cursor-pointer",
                                            i % 2 === 0 ? "bg-white" : "bg-[#FAF6F0]/30",
                                            "hover:bg-[#FAF6F0]"
                                        )}
                                        onClick={() => { onSelect(c); onClose(); }}
                                    >
                                        <td className="px-4 py-2.5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSelect(c); onClose(); }}
                                                className="h-4 w-4 rounded-full border-2 border-[#C69A52] bg-white hover:bg-[#C69A52] transition-colors block"
                                                aria-label={`Select ${c.name}`}
                                            />
                                        </td>
                                        <td className="px-4 py-2.5 text-[#4F5967] font-medium">{c.customerNo}</td>
                                        <td className="px-4 py-2.5 text-[#1E293B] font-bold">{c.name}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967]">{c.province}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967]">{c.type}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                                                c.registration === "Active"
                                                    ? "bg-green-50 text-green-700 border border-green-200"
                                                    : "bg-gray-100 text-gray-500 border border-gray-200"
                                            )}>
                                                {c.registration}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[#4F5967] font-mono">{c.ntn}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967] font-mono">{c.strn}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                <div className="flex items-center justify-center gap-3 border-t border-[#F3F4F6] bg-[#FAF6EE] px-5 py-2.5 shrink-0">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-[#E5E7EB] bg-white text-[#4F5967] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                        className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-[#E5E7EB] bg-white text-[#4F5967] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
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
    { id: 1, customerNo: "C-000209", name: "DINAR HOSPITAL D.I KHAN", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "999999999", strn: "—" },
    { id: 2, customerNo: "C-000208", name: "A_one Pharmacy", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "999999999", strn: "—" },
    { id: 3, customerNo: "C-000207", name: "AMIN WZIRSTAN PHARMACY", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "1110181965", strn: "—" },
    { id: 4, customerNo: "C-000206", name: "Musa Pharmacy", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "999999999", strn: "—" },
    { id: 5, customerNo: "C-000205", name: "ONCOMED PHARMA", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Registered", ntn: "1521135", strn: "—" },
    { id: 6, customerNo: "C-000204", name: "FARMAN MEDICINE COMPANY", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Registered", ntn: "F617441", strn: "—" },
    { id: 7, customerNo: "C-000203", name: "AL HAMZA PHARMACY", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "8131978", strn: "—" },
    { id: 8, customerNo: "C-000202", name: "HEALTHCARE VACCINE HOUSE", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "9997735", strn: "—" },
    { id: 9, customerNo: "C-000201", name: "FAIR PRICE PHARMACY", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Registered", ntn: "5051406", strn: "—" },
    { id: 10, customerNo: "C-000200", name: "MAX HEALTH PHARMACY", province: "Punjab", type: "Individual", registration: "Unregistered", ntn: "332024545", strn: "—" },
    { id: 11, customerNo: "C-000199", name: "SHAH SAUD", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "332024545", strn: "—" },
    { id: 12, customerNo: "C-000198", name: "KOHAT BANNU", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "999999999", strn: "—" },
    { id: 13, customerNo: "C-000197", name: "IBRAHIM MUSA PHARMACY", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "C895660", strn: "—" },
];

const TYPE_OPTIONS = ["All", "Individual", "Company", "AOP"];
const REGISTRATION_OPTIONS = ["All", "Registered", "Unregistered"];
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
            <div className="relative z-10 w-full max-w-[928px] rounded-[16px] border-[1.14px] border-[#CDCBCB] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

                {/* ── Header ── */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6] dark:border-[#2e2e2e] shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6F0] dark:bg-[#2a2a2a] border border-[#E3D2BA] dark:border-[#3a3a3a]">
                        <User className="h-5 w-5 text-[#A27B3A]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[15px] font-bold text-[#1E293B] dark:text-white">Select Customer</p>
                        <p className="text-[11px] text-[#9CA3AF]">Search and select a customer to continue</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3 py-1.5 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors"
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
                                className="h-[40px] w-full rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] pl-9 pr-3 text-[12px] text-[#1E293B] dark:text-white placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C69A52] shadow-none"
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
                            <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af] font-medium">Type</span>
                            <select
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                                className="h-8 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3 pr-8 text-[12px] text-[#1E293B] dark:text-white focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer"
                                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                            >
                                {TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af] font-medium">Registration</span>
                            <select
                                value={registrationFilter}
                                onChange={(e) => { setRegistrationFilter(e.target.value); setPage(1); }}
                                className="h-8 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3 pr-8 text-[12px] text-[#1E293B] dark:text-white focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer"
                                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}
                            >
                                {REGISTRATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={loadCustomers}
                        className="flex items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3 py-1.5 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors"
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
                                            i % 2 === 0 ? "bg-white dark:bg-[#1a1a1a]" : "bg-[#FAF6F0]/30 dark:bg-[#1e1e1e]",
                                            "hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]"
                                        )}
                                        onClick={() => { onSelect(c); onClose(); }}
                                    >
                                        <td className="px-4 py-2.5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSelect(c); onClose(); }}
                                                className="h-7 rounded-[5px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3 text-[11px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors"
                                            >
                                                Select
                                            </button>
                                        </td>
                                        <td className="px-4 py-2.5 text-[#4F5967] dark:text-[#9ca3af] font-medium">{c.customerNo}</td>
                                        <td className="px-4 py-2.5 text-[#1E293B] dark:text-white font-bold">{c.name}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{c.province}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{c.type}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                                                c.registration === "Registered"
                                                    ? "bg-green-50 text-green-700 border border-green-200"
                                                    : "bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]"
                                            )}>
                                                {c.registration}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[#4F5967] dark:text-[#9ca3af] font-mono">{c.ntn}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967] dark:text-[#9ca3af] font-mono">{c.strn}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                <div className="flex items-center justify-center gap-3 border-t border-[#F3F4F6] dark:border-[#2e2e2e] bg-[#FAF6EE] dark:bg-[#1e1e1e] px-5 py-2.5 shrink-0">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">
                        Page <span className="font-semibold text-[#1E293B] dark:text-white">{page}</span> of{" "}
                        <span className="font-semibold text-[#1E293B] dark:text-white">{totalPages}</span>
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
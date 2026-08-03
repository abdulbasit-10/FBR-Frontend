"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Search, RefreshCw, ChevronLeft, ChevronRight, Store } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { LogoSpinner } from "@/components/ui/logo-spinner";

export interface Vendor {
    id: number;
    vendorNo: string;
    name: string;
    province: string;
    type: string;
    registration: string;
    ntn: string;
    strn: string;
}

interface SelectVendorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (vendor: Vendor) => void;
}

const MOCK_VENDORS: Vendor[] = [
    { id: 1, vendorNo: "V-000209", name: "DINAR HOSPITAL D.I KHAN", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "999999999", strn: "—" },
    { id: 2, vendorNo: "V-000208", name: "A_one Pharmacy", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "999999999", strn: "—" },
    { id: 3, vendorNo: "V-000207", name: "AMIN WZIRSTAN PHARMACY", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "1110181965", strn: "—" },
    { id: 4, vendorNo: "V-000206", name: "Musa Pharmacy", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "999999999", strn: "—" },
    { id: 5, vendorNo: "V-000205", name: "ONCOMED PHARMA", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Registered", ntn: "1521135", strn: "—" },
    { id: 6, vendorNo: "V-000204", name: "FARMAN MEDICINE COMPANY", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Registered", ntn: "F617441", strn: "—" },
    { id: 7, vendorNo: "V-000203", name: "AL HAMZA PHARMACY", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "8131978", strn: "—" },
    { id: 8, vendorNo: "V-000202", name: "HEALTHCARE VACCINE HOUSE", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "9997735", strn: "—" },
    { id: 9, vendorNo: "V-000201", name: "FAIR PRICE PHARMACY", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Registered", ntn: "5051406", strn: "—" },
    { id: 10, vendorNo: "V-000200", name: "MAX HEALTH PHARMACY", province: "Punjab", type: "Individual", registration: "Unregistered", ntn: "332024545", strn: "—" },
    { id: 11, vendorNo: "V-000199", name: "SHAH SAUD", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "332024545", strn: "—" },
    { id: 12, vendorNo: "V-000198", name: "KOHAT BANNU", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "999999999", strn: "—" },
    { id: 13, vendorNo: "V-000197", name: "IBRAHIM MUSA PHARMACY", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "C895660", strn: "—" },
];

const TYPE_OPTIONS = ["All", "Individual", "Company", "AOP"];
const REGISTRATION_OPTIONS = ["All", "Registered", "Unregistered"];
const PAGE_SIZE = 10;

export function SelectVendorModal({ isOpen, onClose, onSelect }: SelectVendorModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [registrationFilter, setRegistrationFilter] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [page, setPage] = useState(1);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const loadVendors = useCallback(() => {
        setIsLoading(true); setVendors([]);
        const t = setTimeout(() => { setVendors(MOCK_VENDORS); setIsLoading(false); }, 1200);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery(""); setTypeFilter("All"); setRegistrationFilter("All"); setPage(1);
            const cleanup = loadVendors();
            const ft = setTimeout(() => searchInputRef.current?.focus(), 80);
            return () => { cleanup(); clearTimeout(ft); };
        }
    }, [isOpen, loadVendors]);

    // Prevent layout shift when modal opens
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

    const filtered = vendors.filter((v) => {
        const q = searchQuery.toLowerCase();
        return (
            (!q || v.name.toLowerCase().includes(q) || v.vendorNo.toLowerCase().includes(q) || v.ntn.toLowerCase().includes(q) || v.strn.toLowerCase().includes(q)) &&
            (typeFilter === "All" || v.type === typeFilter) &&
            (registrationFilter === "All" || v.registration === registrationFilter)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (!isOpen) return null;

    const modal = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans" style={{ fontFamily: "'Inter', sans-serif" }} aria-modal="true" role="dialog" aria-label="Select Vendor">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

            <div className="relative z-10 w-full max-w-232 rounded-[16px] border-[1.14px] border-[#CDCBCB] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6] dark:border-[#2e2e2e] shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6F0] dark:bg-[#2a2a2a] border border-[#E3D2BA] dark:border-[#3a3a3a]">
                        <Store className="h-5 w-5 text-[#A27B3A]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[15px] font-bold text-[#1E293B] dark:text-white">Select Vendor</p>
                        <p className="text-[11px] text-[#9CA3AF]">Search and select a customer to continue</p>
                    </div>
                    <button onClick={onClose} className="flex items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3 py-1.5 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors">
                        <X className="h-3.5 w-3.5" /> Close
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 pt-4 pb-2 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                            <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                placeholder="Name, customer no, mapping id, NTN, STRN,"
                                className="h-10 w-full rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] pl-9 pr-3 text-[12px] text-[#1E293B] dark:text-white placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C69A52] shadow-none" />
                        </div>
                        <button onClick={() => setPage(1)} className="h-10 rounded-[6px] bg-[#C69A52] px-6 text-[13px] font-semibold text-white hover:bg-[#b58b44] transition-colors shadow-xs">Search</button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between px-6 pb-4 pt-1 shrink-0">
                    <div className="flex items-center gap-6">
                        {[
                            { label: "Type", value: typeFilter, set: setTypeFilter, opts: TYPE_OPTIONS },
                            { label: "Registration", value: registrationFilter, set: setRegistrationFilter, opts: REGISTRATION_OPTIONS },
                        ].map(({ label, value, set, opts }) => (
                            <div key={label} className="flex items-center gap-2">
                                <span className="text-[12px] text-[#4F5967] font-medium">{label}</span>
                                <select value={value} onChange={(e) => { set(e.target.value); setPage(1); }}
                                    className="h-8 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3 pr-8 text-[12px] text-[#1E293B] dark:text-white focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer"
                                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
                                    {opts.map((o) => <option key={o}>{o}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    <button onClick={loadVendors} className="flex items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3 py-1.5 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors">
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto min-h-50">
                    <table className="w-full text-[12px] min-w-187.5">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[#C69A52] text-white">
                                {["Slect", "Vendor no", "Name", "Province", "Type", "Registration", "NTN", "STRN"].map((h) => (
                                    <th key={h} className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6]">
                            {isLoading ? (
                                <tr><td colSpan={8} className="py-14 text-center"><LogoSpinner label="Loading Vendors..." className="mx-auto" /></td></tr>
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={8} className="py-12 text-center text-[12px] text-[#9CA3AF] italic">No vendors match the current search or filters.</td></tr>
                            ) : (
                                paginated.map((v, i) => (
                                    <tr key={v.id} className={cn("transition-colors cursor-pointer", i % 2 === 0 ? "bg-white dark:bg-[#1a1a1a]" : "bg-[#FAF6F0]/30 dark:bg-[#1e1e1e]", "hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]")} onClick={() => { onSelect(v); onClose(); }}>
                                        <td className="px-4 py-2.5">
                                            <button onClick={(e) => { e.stopPropagation(); onSelect(v); onClose(); }} className="h-7 rounded-[5px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3 text-[11px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors">Select</button>
                                        </td>
                                        <td className="px-4 py-2.5 text-[#4F5967] dark:text-[#9ca3af] font-medium">{v.vendorNo}</td>
                                        <td className="px-4 py-2.5 text-[#1E293B] dark:text-white font-bold">{v.name}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{v.province}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{v.type}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", v.registration === "Registered" ? "bg-green-50 text-green-700 border border-green-200" : "bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]")}>{v.registration}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[#4F5967] dark:text-[#9ca3af] font-mono">{v.ntn}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967] dark:text-[#9ca3af] font-mono">{v.strn}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-3 border-t border-[#F3F4F6] dark:border-[#2e2e2e] bg-[#FAF6EE] dark:bg-[#1e1e1e] px-5 py-2.5 shrink-0">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
                    <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">Page <span className="font-semibold text-[#1E293B] dark:text-white">{page}</span> of <span className="font-semibold text-[#1E293B] dark:text-white">{totalPages}</span></span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}

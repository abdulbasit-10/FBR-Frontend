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
    { id: 1, vendorNo: "V-0001", name: "Alpha Suppliers", province: "Punjab", type: "Registered", registration: "Active", ntn: "2234567-8", strn: "16-00-2234-567-89" },
    { id: 2, vendorNo: "V-0002", name: "Beta Distributors", province: "Sindh", type: "Registered", registration: "Active", ntn: "3876543-2", strn: "16-00-3876-543-21" },
    { id: 3, vendorNo: "V-0003", name: "Gamma Wholesale", province: "KPK", type: "Unregistered", registration: "Inactive", ntn: "4122334-4", strn: "—" },
];

const TYPE_OPTIONS = ["All", "Registered", "Unregistered"];
const REGISTRATION_OPTIONS = ["All", "Active", "Inactive"];
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

            <div className="relative z-10 w-full max-w-232 rounded-[16px] border-[1.14px] border-[#CDCBCB] bg-white shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F3F4F6] shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6F0] border border-[#E3D2BA]">
                        <Store className="h-5 w-5 text-[#A27B3A]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[15px] font-bold text-[#1E293B]">Select Vendor</p>
                        <p className="text-[11px] text-[#9CA3AF]">Search and select a customer to continue</p>
                    </div>
                    <button onClick={onClose} className="flex items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-3 py-1.5 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] transition-colors">
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
                                className="h-10 w-full rounded-[6px] border border-[#D1D5DB] bg-white pl-9 pr-3 text-[12px] text-[#1E293B] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C69A52] shadow-none" />
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
                                    className="h-8 rounded-[6px] border border-[#D1D5DB] bg-white px-3 pr-8 text-[12px] text-[#1E293B] focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer"
                                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center" }}>
                                    {opts.map((o) => <option key={o}>{o}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    <button onClick={loadVendors} className="flex items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] bg-white px-3 py-1.5 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] transition-colors">
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
                                    <tr key={v.id} className={cn("transition-colors cursor-pointer", i % 2 === 0 ? "bg-white" : "bg-[#FAF6F0]/30", "hover:bg-[#FAF6F0]")} onClick={() => { onSelect(v); onClose(); }}>
                                        <td className="px-4 py-2.5">
                                            <button onClick={(e) => { e.stopPropagation(); onSelect(v); onClose(); }} className="h-4 w-4 rounded-full border-2 border-[#C69A52] bg-white hover:bg-[#C69A52] transition-colors block" aria-label={`Select ${v.name}`} />
                                        </td>
                                        <td className="px-4 py-2.5 text-[#4F5967] font-medium">{v.vendorNo}</td>
                                        <td className="px-4 py-2.5 text-[#1E293B] font-bold">{v.name}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967]">{v.province}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967]">{v.type}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", v.registration === "Active" ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 border border-gray-200")}>{v.registration}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[#4F5967] font-mono">{v.ntn}</td>
                                        <td className="px-4 py-2.5 text-[#4F5967] font-mono">{v.strn}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-3 border-t border-[#F3F4F6] bg-[#FAF6EE] px-5 py-2.5 shrink-0">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] bg-white text-[#4F5967] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
                    <span className="text-[12px] text-[#4F5967]">Page <span className="font-semibold text-[#1E293B]">{page}</span> of <span className="font-semibold text-[#1E293B]">{totalPages}</span></span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] bg-white text-[#4F5967] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}

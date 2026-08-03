"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Plus, CheckSquare, Trash2, Download, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";

interface Customer {
    id: number;
    customerNo: string;
    name: string;
    province: string;
    type: string;
    registration: "Registered" | "Unregistered";
    ntn: string;
    strn: string;
    source: string;
}

const MOCK_CUSTOMERS: Customer[] = [
    { id: 1, customerNo: "C-000209", name: "DINAR HOSPITAL D.I KHAN", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "999999999", strn: "—", source: "Manual" },
    { id: 2, customerNo: "C-000208", name: "A_one Pharmacy", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "999999999", strn: "—", source: "Manual" },
    { id: 3, customerNo: "C-000207", name: "AMIN WZIRSTAN PHARMACY", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "1110181965", strn: "—", source: "API" },
    { id: 4, customerNo: "C-000206", name: "Musa Pharmacy", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "999999999", strn: "—", source: "Manual" },
    { id: 5, customerNo: "C-000205", name: "ONCOMED PHARMA", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Registered", ntn: "1521135", strn: "—", source: "Import" },
    { id: 6, customerNo: "C-000204", name: "FARMAN MEDICINE COMPANY", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Registered", ntn: "F617441", strn: "—", source: "Manual" },
    { id: 7, customerNo: "C-000203", name: "AL HAMZA PHARMACY", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "8131978", strn: "—", source: "Manual" },
    { id: 8, customerNo: "C-000202", name: "HEALTHCARE VACCINE HOUSE", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Unregistered", ntn: "9997735", strn: "—", source: "Manual" },
    { id: 9, customerNo: "C-000201", name: "FAIR PRICE PHARMACY", province: "Khyber Pakhtunkhwa", type: "Individual", registration: "Registered", ntn: "5051406", strn: "—", source: "API" },
    { id: 10, customerNo: "C-000200", name: "MAX HEALTH PHARMACY", province: "Punjab", type: "Individual", registration: "Unregistered", ntn: "332024545", strn: "—", source: "Import" },
];

const TYPE_OPTIONS = ["All", "Individual", "Company", "AOP"];
const REGISTRATION_OPTIONS = ["All", "Registered", "Unregistered"];
const SOURCE_OPTIONS = ["All", "Manual", "API", "Import"];
const ROW_OPTIONS = [50, 100, 200];
const TABLE_COLS = ["Customer No", "Name", "Province", "Type", "Registration", "NTN", "STRN", "Source", "Actions"];

const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};
const selectCls = "h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";

export default function CustomersPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [type, setType] = useState("All");
    const [registration, setRegistration] = useState("All");
    const [source, setSource] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);

    const load = useCallback(() => {
        setIsLoading(true); setCustomers([]);
        const t = setTimeout(() => { setCustomers(MOCK_CUSTOMERS); setIsLoading(false); }, 1000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => load(), [load]);

    const filtered = customers.filter((c) => {
        const q = search.toLowerCase();
        return (
            (!q || c.customerNo.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.ntn.toLowerCase().includes(q) || c.strn.toLowerCase().includes(q)) &&
            (type === "All" || c.type === type) &&
            (registration === "All" || c.registration === registration) &&
            (source === "All" || c.source === source)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const toggleSelect = (id: number) =>
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () =>
        setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((c) => c.id)));

    const regBadge = (r: Customer["registration"]) => (
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
            r === "Registered"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] dark:bg-[#2a2a2a] dark:text-[#9ca3af] dark:border-[#3a3a3a]"
        )}>{r}</span>
    );

    return (
        <div className="min-h-full space-y-4 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()} className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Customers</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={load} className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                    </button>
                    <button type="button" onClick={() => router.push("/dashboard/customers/new")} className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                        <Plus className="h-3.5 w-3.5" /> New
                    </button>
                    <button type="button" onClick={toggleAll} className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <CheckSquare className="h-3.5 w-3.5 text-[#A27B3A]" /> Select All
                    </button>
                    <button type="button" disabled={selected.size === 0} className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        <Trash2 className="h-3.5 w-3.5 text-[#A27B3A]" /> Delete
                    </button>
                </div>
            </div>

            {/* Filter card */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 space-y-3">
                <div className="flex items-center gap-2 max-w-2xl">
                    <div className="flex-1">
                        <Input type="text" placeholder="Name, customer no, mapping id, NTN, STRN,"
                            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none" />
                    </div>
                    <button type="button" onClick={() => setPage(1)} className="h-10 rounded-[6px] bg-[#C69A52] px-6 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors">
                        Search
                    </button>
                </div>
                <div className="flex flex-wrap items-end gap-3 pt-1">
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Type</label>
                        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className={cn(selectCls, "min-w-32")} style={selectArrow}>
                            {TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Registration</label>
                        <select value={registration} onChange={(e) => { setRegistration(e.target.value); setPage(1); }} className={cn(selectCls, "min-w-36")} style={selectArrow}>
                            {REGISTRATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Source</label>
                        <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className={cn(selectCls, "min-w-32")} style={selectArrow}>
                            {SOURCE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table card */}
            <div className="rounded-[16px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                    <button type="button" className="flex h-8 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <Download className="h-3.5 w-3.5 text-[#A27B3A]" /> Export
                    </button>
                    <p className="text-[11px] text-[#9CA3AF] italic">Scroll right to view row actions</p>
                </div>

                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                    <table className="w-full text-[12px] border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                <th className="w-10 px-3 py-2.5 text-center">
                                    <input type="checkbox"
                                        checked={paginated.length > 0 && selected.size === paginated.length}
                                        onChange={toggleAll}
                                        className="h-4 w-4 rounded border-white/60 accent-white cursor-pointer" />
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
                                        <LogoSpinner label="Loading Customers..." className="mx-auto" />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={TABLE_COLS.length + 1} className="py-12 text-center bg-white dark:bg-[#242424]">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6EE]">
                                                <Users className="h-5 w-5 text-[#C69A52]" />
                                            </div>
                                            <p className="text-[12px] text-[#9CA3AF] italic">No customers match the current search or filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((c, i) => (
                                    <tr key={c.id} onClick={() => toggleSelect(c.id)}
                                        className={cn("cursor-pointer transition-colors hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]",
                                            selected.has(c.id) ? "bg-[#FDF3E3] dark:bg-[#3a2a10]" : i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]"
                                        )}>
                                        <td className="px-3 py-2.5 text-center">
                                            <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)}
                                                onClick={(e) => e.stopPropagation()} className="h-4 w-4 rounded border-[#D1D5DB] accent-[#C69A52] cursor-pointer" />
                                        </td>
                                        <td className="px-3 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{c.customerNo}</td>
                                        <td className="px-3 py-2.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{c.name}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{c.province}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{c.type}</td>
                                        <td className="px-3 py-2.5">{regBadge(c.registration)}</td>
                                        <td className="px-3 py-2.5 font-mono text-[#4F5967] dark:text-[#9ca3af]">{c.ntn}</td>
                                        <td className="px-3 py-2.5 font-mono text-[#4F5967] dark:text-[#9ca3af]">{c.strn}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{c.source}</td>
                                        <td className="px-3 py-2.5">
                                            <button type="button" onClick={(e) => e.stopPropagation()}
                                                className="rounded-[5px] border border-[#C69A52] px-2.5 py-1 text-[11px] font-semibold text-[#C69A52] hover:bg-[#C69A52] hover:text-white transition-colors">
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">Row</span>
                        <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                            className="h-8 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-2 focus:outline-none focus:border-[#C69A52] appearance-none"
                            style={selectArrow}>
                            {ROW_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">
                            Page <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{page}</span> of{" "}
                            <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{totalPages}</span>
                        </span>
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

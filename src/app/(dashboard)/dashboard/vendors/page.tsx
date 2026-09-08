"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Building2,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    Download,
    Plus,
    RefreshCw,
    Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { vendorsService, type Vendor as ApiVendor } from "@/lib/services";
import { exportRowsToExcel } from "@/lib/export";

interface VendorRow {
    id: number;
    uuid: string;
    vendorNo: string;
    name: string;
    province: string;
    type: string;
    registration: "Registered" | "Unregistered";
    ntn: string;
    strn: string;
}

const TYPE_OPTIONS = ["All", "Individual", "Company"];
const REGISTRATION_OPTIONS = ["All", "Registered", "Unregistered"];
const ROW_OPTIONS = [50, 100, 200];
const TABLE_COLS = ["Vendor No", "Name", "Province", "Type", "Registration", "NTN", "STRN", "Actions"];

const toRow = (v: ApiVendor): VendorRow => ({
    id: v.id,
    uuid: v.uuid,
    vendorNo: v.vendorNo ?? "—",
    name: v.businessName,
    province: v.province,
    type: v.vendorType,
    registration: v.registrationType,
    ntn: v.ntnCnic ?? "—",
    strn: v.strn ?? "—",
});

const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};
const selectCls = "h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";

export default function VendorsPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [type, setType] = useState("All");
    const [registration, setRegistration] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [vendors, setVendors] = useState<VendorRow[]>([]);
    const [total, setTotal] = useState(0);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);

    const load = useCallback(
        async (showToast = false) => {
            setIsLoading(true);
            setVendors([]);
            try {
                const res = await vendorsService.list({
                    page,
                    limit: rowsPerPage,
                    search: search.trim() || undefined,
                    type: type !== "All" ? type : undefined,
                    registrationType: registration !== "All" ? registration : undefined,
                    sortBy: "createdAt",
                    sortDir: "DESC",
                });
                setVendors(res.data.rows.map(toRow));
                setTotal(res.data.meta.total);
                if (showToast) toast.success("Vendors refreshed.");
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to load vendors.";
                if (msg.toLowerCase().includes("permission")) {
                    toast.info("Permissions updated — reloading…");
                    setTimeout(() => window.location.reload(), 800);
                } else {
                    toast.error(msg);
                }
            } finally {
                setIsLoading(false);
            }
        },
        [page, rowsPerPage, search, type, registration],
    );

    useEffect(() => {
        load();
    }, [load]);

    const paginated = vendors;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

    const handleExport = () => {
        if (paginated.length === 0) { toast.error("No vendors to export."); return; }
        exportRowsToExcel(
            "Vendors",
            TABLE_COLS.slice(0, -1),
            paginated.map((v) => [v.vendorNo, v.name, v.province, v.type, v.registration, v.ntn, v.strn]),
        );
        toast.success("Vendors exported.");
    };

    const handleDelete = async () => {
        if (selected.size === 0) return;
        const rowsToDelete = vendors.filter((v) => selected.has(v.id));
        const results = await Promise.allSettled(rowsToDelete.map((v) => vendorsService.remove(v.uuid)));
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed === 0) toast.success(`${rowsToDelete.length} vendor(s) deleted.`);
        else toast.error(`${failed} of ${rowsToDelete.length} deletions failed.`);
        setSelected(new Set());
        load();
    };

    const toggleSelect = (id: number) =>
        setSelected((prev) => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    const toggleAll = () =>
        setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((v) => v.id)));

    const regBadge = (r: VendorRow["registration"]) => (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                r === "Registered"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] dark:bg-[#2a2a2a] dark:text-[#9ca3af] dark:border-[#3a3a3a]",
            )}
        >
            {r}
        </span>
    );

    return (
        <div className="h-full flex flex-col gap-2.5 overflow-hidden text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between pb-0.5">
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()} className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-4.5 w-4.5" />
                    </button>
                    <h1 className="text-[16px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Vendors</h1>
                </div>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => load(true)} className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                        <RefreshCw className="h-3 w-3 text-[#A27B3A]" /> Refresh
                    </button>
                    <button type="button" onClick={() => router.push("/dashboard/vendors/new")} className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs cursor-pointer">
                        <Plus className="h-3 w-3" /> New
                    </button>
                    <button type="button" onClick={toggleAll} className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                        <CheckSquare className="h-3 w-3 text-[#A27B3A]" /> Select All
                    </button>
                    <button type="button" onClick={handleDelete} disabled={selected.size === 0} className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                        <Trash2 className="h-3 w-3 text-[#A27B3A]" /> Delete
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="shrink-0 rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3 space-y-2">
                <div className="flex items-center gap-2 max-w-2xl">
                    <Input type="text" placeholder="Name, vendor no, NTN, STRN" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none" />
                    <button type="button" onClick={() => setPage(1)} className="h-9 rounded-[6px] bg-[#C69A52] px-5 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors cursor-pointer">Search</button>
                </div>
                <div className="flex flex-wrap items-end gap-2 pt-0.5">
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
                </div>
            </div>

            {/* Table */}
            <div className="flex min-h-0 flex-col gap-2 rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3 shadow-xs">
                <div className="flex shrink-0 items-center justify-between">
                    <button type="button" onClick={handleExport} className="flex h-7 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                        <Download className="h-3 w-3 text-[#A27B3A]" /> Export
                    </button>
                </div>
                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#FAF6F0] dark:[&::-webkit-scrollbar-track]:bg-[#1a1a1a] [&::-webkit-scrollbar-thumb]:bg-[#D1B88A] [&::-webkit-scrollbar-thumb]:rounded-full">
                    <table className="w-full text-[12px] border-collapse min-w-[900px]">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[#C69A52] text-white">
                                <th className="w-10 px-2.5 py-1.5 text-center">
                                    <input type="checkbox" checked={paginated.length > 0 && selected.size === paginated.length} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-white/60 accent-white cursor-pointer" />
                                </th>
                                {TABLE_COLS.map((col) => <th key={col} className="px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">{col}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                            {isLoading ? (
                                <tr><td colSpan={TABLE_COLS.length + 1} className="py-8 text-center bg-white dark:bg-[#242424]"><LogoSpinner label="Loading Vendors..." className="mx-auto" /></td></tr>
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={TABLE_COLS.length + 1} className="py-10 text-center bg-white dark:bg-[#242424]">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6EE]"><Building2 className="h-5 w-5 text-[#C69A52]" /></div>
                                        <p className="text-[12px] text-[#9CA3AF] italic">No vendors match the current search or filters.</p>
                                    </div>
                                </td></tr>
                            ) : (
                                paginated.map((v, i) => (
                                    <tr key={v.id} onClick={() => toggleSelect(v.id)} className={cn("cursor-pointer transition-colors hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]", selected.has(v.id) ? "bg-[#FDF3E3] dark:bg-[#3a2a10]" : i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]")}>
                                        <td className="px-2.5 py-1.5 text-center">
                                            <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggleSelect(v.id)} onClick={(e) => e.stopPropagation()} className="h-3.5 w-3.5 rounded border-[#D1D5DB] accent-[#C69A52] cursor-pointer" />
                                        </td>
                                        <td className="px-2.5 py-1.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{v.vendorNo}</td>
                                        <td className="px-2.5 py-1.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{v.name}</td>
                                        <td className="px-2.5 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{v.province}</td>
                                        <td className="px-2.5 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{v.type}</td>
                                        <td className="px-2.5 py-1.5">{regBadge(v.registration)}</td>
                                        <td className="px-2.5 py-1.5 font-mono text-[#4F5967] dark:text-[#9ca3af]">{v.ntn}</td>
                                        <td className="px-2.5 py-1.5 font-mono text-[#4F5967] dark:text-[#9ca3af]">{v.strn}</td>
                                        <td className="px-2.5 py-1.5">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/vendors/${v.uuid}`); }} className="rounded-[5px] border border-[#C69A52] px-2.5 py-1 text-[11px] font-semibold text-[#C69A52] hover:bg-[#C69A52] hover:text-white transition-colors cursor-pointer">Edit</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex shrink-0 items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">Row</span>
                        <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="h-7 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-2 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer" style={selectArrow}>
                            {ROW_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-6 w-6 items-center justify-center rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"><ChevronLeft className="h-3.5 w-3.5" /></button>
                        <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">Page <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{page}</span> of <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{totalPages}</span></span>
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-6 w-6 items-center justify-center rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"><ChevronRight className="h-3.5 w-3.5" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
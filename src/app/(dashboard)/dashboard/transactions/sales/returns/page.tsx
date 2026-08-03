"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    RefreshCw,
    Plus,
    CheckSquare,
    Send,
    Trash2,
    Download,
    ChevronLeft,
    ChevronRight,
    FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import {
    SelectInvoiceModal,
    type SaleInvoiceForReturn,
} from "@/components/dashboard/select-invoice-modal";

interface SalesReturn {
    id: number;
    returnNo: string;
    originalId: string;
    customerNo: string;
    customerName: string;
    status: "Posted" | "UnPosted" | "Cancelled";
    source: string;
    user: string;
    docDate: string;
    postingDate: string;
    assessedValue: number;
    discount: number;
    salesTax: number;
    furtherTax: number;
}

const MOCK_RETURNS: SalesReturn[] = [
    { id: 1, returnNo: "SR-0001", originalId: "SI-0001", customerNo: "C-0001", customerName: "ABC Corporation", status: "Posted", source: "Manual", user: "Admin", docDate: "2026-07-05", postingDate: "2026-07-05", assessedValue: 10000, discount: 0, salesTax: 1700, furtherTax: 0 },
    { id: 2, returnNo: "SR-0002", originalId: "SI-0002", customerNo: "C-0002", customerName: "XYZ Ltd", status: "UnPosted", source: "Manual", user: "Admin", docDate: "2026-07-08", postingDate: "2026-07-08", assessedValue: 5000, discount: 500, salesTax: 765, furtherTax: 0 },
];

const STATUS_OPTIONS = ["All", "Posted", "UnPosted", "Cancelled"];
const SOURCE_OPTIONS = ["All", "Manual", "API", "Import"];
const ROW_OPTIONS = [50, 100, 200];
const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TABLE_COLS = [
    "Return no", "Original Id", "Customer No", "Customer Name",
    "Status", "Source", "User", "Doc date", "Posting date",
    "Assessed value", "Discount", "Sales tax", "Further tax",
];

const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};
const selectCls = "h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";

export default function SalesReturnPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [status, setStatus] = useState(() => searchParams.get("status") ?? "All");
    const [source, setSource] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [returns, setReturns] = useState<SalesReturn[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    useEffect(() => {
        setStatus(searchParams.get("status") ?? "All");
        setPage(1);
    }, [searchParams]);

    const load = useCallback(() => {
        setIsLoading(true); setReturns([]);
        const t = setTimeout(() => { setReturns(MOCK_RETURNS); setIsLoading(false); }, 1000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => load(), [load]);

    const filtered = returns.filter((r) => {
        const q = search.toLowerCase();
        return (
            (!q || r.returnNo.toLowerCase().includes(q) || r.originalId.toLowerCase().includes(q) || r.customerName.toLowerCase().includes(q)) &&
            (status === "All" || r.status === status) &&
            (source === "All" || r.source === source) &&
            (!dateFrom || r.docDate >= dateFrom) &&
            (!dateTo || r.docDate <= dateTo)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const toggleSelect = (id: number) =>
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () =>
        setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((r) => r.id)));

    const handleInvoiceSelect = (inv: SaleInvoiceForReturn) => {
        const params = new URLSearchParams({
            invoiceNo: inv.invoiceNo, customer: inv.customer,
            customerNo: inv.customerNo, docDate: inv.docDate,
            assessed: String(inv.assessed), discount: String(inv.discount),
        });
        router.push(`/dashboard/transactions/sales/returns/create?${params.toString()}`);
    };

    const statusBadge = (s: SalesReturn["status"]) => {
        const map = { Posted: "bg-green-50 text-green-700 border border-green-200", UnPosted: "bg-yellow-50 text-yellow-700 border border-yellow-200", Cancelled: "bg-red-50 text-red-600 border border-red-200" };
        return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", map[s])}>{s}</span>;
    };

    return (
        <div className="min-h-full space-y-4 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5 shadow-xs space-y-4">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => router.back()} className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0]" style={{ fontFamily: "'Inter', sans-serif" }}>{status === "All" ? "All" : status} Sales Returns</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => load()} className="flex h-8 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                            <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                        </button>
                        <button type="button" onClick={toggleAll} className="flex h-8 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                            <CheckSquare className="h-3.5 w-3.5 text-[#A27B3A]" /> Select All
                        </button>
                        <button type="button" onClick={() => setShowInvoiceModal(true)} className="flex h-8 items-center gap-1.5 rounded-[5px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors">
                            <Plus className="h-3.5 w-3.5" /> New
                        </button>
                        <button type="button" disabled={selected.size === 0} className="flex h-8 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            <Send className="h-3.5 w-3.5 text-[#A27B3A]" /> Post
                        </button>
                        <button type="button" disabled={selected.size === 0} className="flex h-8 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            <Trash2 className="h-3.5 w-3.5 text-[#A27B3A]" /> Delete
                        </button>
                    </div>
                </div>

                {/* ── Search ── */}
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <Input type="text" placeholder="Invoice no, FBR invoice no, mapping id, customer name" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="h-9 rounded-[5px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none" />
                    </div>
                    <button type="button" onClick={() => setPage(1)} className="h-9 rounded-[5px] bg-[#C69A52] px-6 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors">Search</button>
                </div>

                {/* ── Filters ── */}
                <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1"><label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Date from</label>
                        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-10 w-44 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] shadow-none scheme-light" /></div>
                    <div className="space-y-1"><label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Date to</label>
                        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-10 w-44 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] shadow-none scheme-light" /></div>
                    <div className="space-y-1"><label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Status</label>
                        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={cn(selectCls, "min-w-27.5")} style={selectArrow}>{STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af] block">Source</label>
                        <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className={cn(selectCls, "min-w-27.5")} style={selectArrow}>{SOURCE_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select></div>
                </div>

                <p className="text-[11px] text-[#9CA3AF]">Date range includes returns where document date or posting date falls between the selected days (inclusive). Leave dates empty to include all periods. Provide both from and to, or neither.</p>

                {/* ── Toolbar ── */}
                <div className="flex items-center justify-between">
                    <button type="button" className="flex h-8 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <Download className="h-3.5 w-3.5 text-[#A27B3A]" /> Export
                    </button>
                    <p className="text-[11px] text-[#9CA3AF] italic">Scroll right to view row actions</p>
                </div>

                {/* ── Table ── */}
                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                    <table className="w-full text-[12px] min-w-225 border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                <th className="w-10 px-3 py-2.5 text-center">
                                    <input type="checkbox" checked={paginated.length > 0 && selected.size === paginated.length} onChange={toggleAll} className="h-3.5 w-3.5 accent-white cursor-pointer" />
                                </th>
                                {TABLE_COLS.map((col) => <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{col}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                            {isLoading ? (
                                <tr><td colSpan={TABLE_COLS.length + 1} className="py-14 text-center"><LogoSpinner label="Loading Sales Return..." className="mx-auto" /></td></tr>
                            ) : paginated.length === 0 ? (
                                <tr><td colSpan={TABLE_COLS.length + 1} className="py-14 text-center">
                                    <div className="flex flex-col items-center gap-2"><FileText className="h-8 w-8 text-[#C69A52] opacity-50" /><p className="text-[12px] text-[#9CA3AF] italic">No sales returns match the current filters.</p></div>
                                </td></tr>
                            ) : (
                                paginated.map((r, i) => (
                                    <tr key={r.id} className={cn("cursor-pointer transition-colors", i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]", "hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]", selected.has(r.id) && "bg-[#FDF3E3] dark:bg-[#3a2a10]")} onClick={() => toggleSelect(r.id)}>
                                        <td className="px-3 py-2.5 text-center"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} onClick={(e) => e.stopPropagation()} className="h-3.5 w-3.5 accent-[#C69A52] cursor-pointer" /></td>
                                        <td className="px-3 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.returnNo}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{r.originalId}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{r.customerNo}</td>
                                        <td className="px-3 py-2.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.customerName}</td>
                                        <td className="px-3 py-2.5">{statusBadge(r.status)}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{r.source}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{r.user}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.docDate}</td>
                                        <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.postingDate}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(r.assessedValue)}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(r.discount)}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(r.salesTax)}</td>
                                        <td className="px-3 py-2.5 text-right font-mono text-[#A27B3A] font-semibold">{fmt(r.furtherTax)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#9CA3AF] dark:text-[#666]">Row</span>
                        <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="h-7 rounded border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-2 focus:outline-none focus:border-[#C69A52] appearance-none" style={selectArrow}>
                            {ROW_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
                        <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">Page <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{page}</span> of <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{totalPages}</span></span>
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-7 w-7 items-center justify-center rounded border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
                    </div>
                </div>
            </div>

            <SelectInvoiceModal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} onSelect={handleInvoiceSelect} />
        </div>
    );
}

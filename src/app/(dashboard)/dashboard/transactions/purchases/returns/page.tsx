"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    TransactionListShell,
    fmt,
    statusBadge,
    btnOutline,
} from "@/components/dashboard/transaction-list-shell";
import {
    SelectPurchaseInvoiceModal,
    type PurchaseInvoiceForReturn,
} from "@/components/dashboard/select-purchase-invoice-modal";

interface PurchaseReturn {
    id: number;
    returnNo: string;
    originalPI: string;
    vendorNo: string;
    vendorName: string;
    status: "Posted" | "UnPosted" | "Cancelled";
    source: string;
    user: string;
    docDate: string;
    postingDate: string;
    assessedValue: number;
    discount: number;
    salesTax: number;
    furtherTax: number;
    advanceTax: number;
}

const MOCK_RETURNS: PurchaseReturn[] = [
    { id: 1, returnNo: "PR-0001", originalPI: "PI-0001", vendorNo: "V-0001", vendorName: "Alpha Suppliers", status: "Posted", source: "Manual", user: "Admin", docDate: "2026-07-05", postingDate: "2026-07-05", assessedValue: 20000, discount: 0, salesTax: 3400, furtherTax: 0, advanceTax: 400 },
    { id: 2, returnNo: "PR-0002", originalPI: "PI-0002", vendorNo: "V-0002", vendorName: "Beta Distributors", status: "UnPosted", source: "Manual", user: "Admin", docDate: "2026-07-09", postingDate: "2026-07-09", assessedValue: 9000, discount: 900, salesTax: 1229, furtherTax: 0, advanceTax: 180 },
];

const COLUMNS = [
    "Return No", "Original PI", "Vendor No", "Vendor Name",
    "Status", "Source", "User", "Doc Date", "Posting Date",
    "Assessed Value", "Discount", "Sales Tax", "Further Tax", "Advance Tax",
];

const DATE_HINT = "Date range includes returns where document date or posting date falls between the selected days (inclusive). Leave dates empty to include all periods.";

function PurchaseReturnContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [status, setStatus] = useState(() => searchParams.get("status") ?? "All");
    const [source, setSource] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [returns, setReturns] = useState<PurchaseReturn[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);

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
            (!q || r.returnNo.toLowerCase().includes(q) || r.originalPI.toLowerCase().includes(q) || r.vendorName.toLowerCase().includes(q)) &&
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

    const handleInvoiceSelect = (inv: PurchaseInvoiceForReturn) => {
        const params = new URLSearchParams({
            invoiceNo: inv.invoiceNo, vendor: inv.vendor,
            vendorNo: inv.vendorNo, docDate: inv.docDate,
            assessed: String(inv.assessed), discount: String(inv.discount),
        });
        router.push(`/dashboard/transactions/purchases/returns/create?${params.toString()}`);
    };

    return (
        <>
            <TransactionListShell
                title={`${status === "All" ? "All" : status} Purchase Returns`}
                backHref="/dashboard"
                headerActions={<>
                    <button type="button" onClick={load} className={`h-9 ${btnOutline}`}>
                        <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                    </button>
                    <button type="button" onClick={() => setShowModal(true)}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                        <Plus className="h-3.5 w-3.5" /> New
                    </button>
                </>}
                columns={COLUMNS}
                withCheckbox
                isAllSelected={paginated.length > 0 && selected.size === paginated.length}
                onToggleAll={toggleAll}
                isLoading={isLoading}
                hasRows={paginated.length > 0}
                loadingLabel="Loading Purchase Returns..."
                emptyMessage="No purchase returns match the current filters."
                dateHint={DATE_HINT}
                search={search} onSearchChange={setSearch}
                dateFrom={dateFrom} onDateFromChange={setDateFrom}
                dateTo={dateTo} onDateToChange={setDateTo}
                status={status} onStatusChange={setStatus}
                source={source} onSourceChange={setSource}
                rowsPerPage={rowsPerPage} onRowsPerPageChange={setRowsPerPage}
                page={page} totalPages={totalPages} onPageChange={setPage}
            >
                {paginated.map((r, i) => {
                    const isSelected = selected.has(r.id);
                    return (
                        <tr key={r.id}
                            className={cn("cursor-pointer transition-colors hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]", isSelected ? "bg-[#FAF6F0] dark:bg-[#3a2a10]" : i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]")}
                            onClick={() => toggleSelect(r.id)}>
                            <td className="px-3 py-2.5 text-center">
                                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(r.id)}
                                    onClick={(e) => e.stopPropagation()} className="h-4 w-4 rounded border-[#D1D5DB] accent-[#C69A52] cursor-pointer" />
                            </td>
                            <td className="px-3 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.returnNo}</td>
                            <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.originalPI}</td>
                            <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.vendorNo}</td>
                            <td className="px-3 py-2.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.vendorName}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap">{statusBadge(r.status)}</td>
                            <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.source}</td>
                            <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.user}</td>
                            <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.docDate}</td>
                            <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.postingDate}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{fmt(r.assessedValue)}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{fmt(r.discount)}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{fmt(r.salesTax)}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{fmt(r.furtherTax)}</td>
                            <td className="px-3 py-2.5 text-right font-mono font-semibold text-[#A27B3A] whitespace-nowrap">{fmt(r.advanceTax)}</td>
                        </tr>
                    );
                })}
            </TransactionListShell>
            <SelectPurchaseInvoiceModal isOpen={showModal} onClose={() => setShowModal(false)} onSelect={handleInvoiceSelect} />
        </>
    );
}

export default function PurchaseReturnPage() {
    return <Suspense fallback={null}><PurchaseReturnContent /></Suspense>;
}
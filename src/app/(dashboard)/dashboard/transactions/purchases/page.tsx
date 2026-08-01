"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Plus, CheckSquare, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    TransactionListShell,
    fmt,
    statusBadge,
    btnOutline,
} from "@/components/dashboard/transaction-list-shell";

interface PurchaseInvoice {
    id: number;
    invoiceNo: string;
    vendorNo: string;
    vendorName: string;
    vendorInvoiceNo: string;
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

const MOCK_PURCHASES: PurchaseInvoice[] = [
    { id: 1, invoiceNo: "PI-0001", vendorNo: "V-0001", vendorName: "Alpha Suppliers", vendorInvoiceNo: "VS-1001", status: "Posted", source: "Manual", user: "Admin", docDate: "2026-07-02", postingDate: "2026-07-02", assessedValue: 80000, discount: 0, salesTax: 13600, furtherTax: 0 },
    { id: 2, invoiceNo: "PI-0002", vendorNo: "V-0002", vendorName: "Beta Distributors", vendorInvoiceNo: "BD-2200", status: "UnPosted", source: "Manual", user: "Admin", docDate: "2026-07-06", postingDate: "2026-07-06", assessedValue: 45000, discount: 4500, salesTax: 6885, furtherTax: 0 },
    { id: 3, invoiceNo: "PI-0003", vendorNo: "V-0001", vendorName: "Alpha Suppliers", vendorInvoiceNo: "VS-1002", status: "Posted", source: "API", user: "Admin", docDate: "2026-07-14", postingDate: "2026-07-14", assessedValue: 32000, discount: 0, salesTax: 5440, furtherTax: 0 },
];

const COLUMNS = [
    "Invoice No", "Vendor No", "Vendor Name", "Vendor Invoice No",
    "Status", "Source", "User", "Doc Date", "Posting Date",
    "Assessed Value", "Discount", "Sales Tax", "Further Tax",
];

const DATE_HINT = "Date range includes invoices where document date or posting date falls between the selected days (inclusive). Leave dates empty to load all periods.";

export default function PurchaseInvoicePage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [status, setStatus] = useState("All");
    const [source, setSource] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);

    const load = useCallback(() => {
        setIsLoading(true); setInvoices([]);
        const t = setTimeout(() => { setInvoices(MOCK_PURCHASES); setIsLoading(false); }, 1000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => load(), [load]);

    const filtered = invoices.filter((inv) => {
        const q = search.toLowerCase();
        return (
            (!q || inv.invoiceNo.toLowerCase().includes(q) || inv.vendorNo.toLowerCase().includes(q) || inv.vendorName.toLowerCase().includes(q) || inv.vendorInvoiceNo.toLowerCase().includes(q)) &&
            (status === "All" || inv.status === status) &&
            (source === "All" || inv.source === source) &&
            (!dateFrom || inv.docDate >= dateFrom) &&
            (!dateTo || inv.docDate <= dateTo)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const toggleSelect = (id: number) =>
        setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const toggleAll = () =>
        setSelected(selected.size === paginated.length ? new Set() : new Set(paginated.map((i) => i.id)));

    return (
        <TransactionListShell
            title="Purchase Invoice"
            headerActions={<>
                <button type="button" onClick={load} className={`h-8 ${btnOutline}`}>
                    <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                </button>
                <button type="button" onClick={() => router.push("/dashboard/transactions/purchases/create")}
                    className="flex h-8 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors">
                    <Plus className="h-3.5 w-3.5" /> New
                </button>
                <button type="button" onClick={toggleAll} className={`h-8 ${btnOutline}`}>
                    <CheckSquare className="h-3.5 w-3.5 text-[#A27B3A]" /> Select All
                </button>
                <button type="button" disabled={selected.size === 0} className={`h-8 ${btnOutline} disabled:opacity-40 disabled:cursor-not-allowed`}>
                    <Send className="h-3.5 w-3.5 text-[#A27B3A]" /> Post
                </button>
                <button type="button" disabled={selected.size === 0} className={`h-8 ${btnOutline} disabled:opacity-40 disabled:cursor-not-allowed`}>
                    <Trash2 className="h-3.5 w-3.5 text-[#A27B3A]" /> Delete
                </button>
            </>}
            columns={COLUMNS}
            withCheckbox
            isAllSelected={paginated.length > 0 && selected.size === paginated.length}
            onToggleAll={toggleAll}
            isLoading={isLoading}
            hasRows={paginated.length > 0}
            loadingLabel="Loading Purchase Invoices..."
            emptyMessage="No purchase invoices match the current filters."
            dateHint={DATE_HINT}
            search={search} onSearchChange={setSearch}
            dateFrom={dateFrom} onDateFromChange={setDateFrom}
            dateTo={dateTo} onDateToChange={setDateTo}
            status={status} onStatusChange={setStatus}
            source={source} onSourceChange={setSource}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={setRowsPerPage}
            page={page} totalPages={totalPages} onPageChange={setPage}
        >
            {paginated.map((inv, i) => (
                <tr key={inv.id}
                    className={cn("cursor-pointer transition-colors hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]", selected.has(inv.id) ? "bg-[#FDF3E3] dark:bg-[#3a2a10]" : i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]")}
                    onClick={() => toggleSelect(inv.id)}>
                    <td className="px-3 py-2.5 text-center">
                        <input type="checkbox" checked={selected.has(inv.id)} onChange={() => toggleSelect(inv.id)}
                            onClick={(e) => e.stopPropagation()} className="h-3.5 w-3.5 accent-[#C69A52] cursor-pointer" />
                    </td>
                    <td className="px-3 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{inv.invoiceNo}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.vendorNo}</td>
                    <td className="px-3 py-2.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{inv.vendorName}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.vendorInvoiceNo}</td>
                    <td className="px-3 py-2.5">{statusBadge(inv.status)}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.source}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{inv.user}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.docDate}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{inv.postingDate}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(inv.assessedValue)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.discount)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(inv.salesTax)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#A27B3A] font-semibold">{fmt(inv.furtherTax)}</td>
                </tr>
            ))}
        </TransactionListShell>
    );
}

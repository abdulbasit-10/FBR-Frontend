"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { LedgerShell, fmt } from "@/components/dashboard/ledger-shell";

interface CustomerLedgerRow {
    id: number;
    invoiceNo: string;
    postingDate: string;
    documentType: string;
    customerNo: string;
    customerType: string;
    assessedValue: number;
    fed: number;
    amtExclDiscount: number;
    discount: number;
    amtExclSalesTax: number;
}

const MOCK_ROWS: CustomerLedgerRow[] = [
    { id: 1, invoiceNo: "SI-0001", postingDate: "2026-07-01", documentType: "Sales Invoice", customerNo: "C-0001", customerType: "Registered", assessedValue: 50000, fed: 0, amtExclDiscount: 50000, discount: 0, amtExclSalesTax: 50000 },
    { id: 2, invoiceNo: "SI-0002", postingDate: "2026-07-03", documentType: "Sales Invoice", customerNo: "C-0002", customerType: "Unregistered", assessedValue: 25000, fed: 500, amtExclDiscount: 25000, discount: 2500, amtExclSalesTax: 22500 },
    { id: 3, invoiceNo: "SR-0001", postingDate: "2026-07-05", documentType: "Sales Return", customerNo: "C-0001", customerType: "Registered", assessedValue: 10000, fed: 0, amtExclDiscount: 10000, discount: 0, amtExclSalesTax: 10000 },
    { id: 4, invoiceNo: "SI-0003", postingDate: "2026-07-10", documentType: "Sales Invoice", customerNo: "C-0003", customerType: "AOP", assessedValue: 75000, fed: 1500, amtExclDiscount: 75000, discount: 0, amtExclSalesTax: 75000 },
    { id: 5, invoiceNo: "CN-0001", postingDate: "2026-07-12", documentType: "Credit Note", customerNo: "C-0002", customerType: "Unregistered", assessedValue: 5000, fed: 0, amtExclDiscount: 5000, discount: 500, amtExclSalesTax: 4500 },
];

const CUSTOMER_TYPE_OPTIONS = ["All", "Registered", "Unregistered", "AOP", "Company"];

const COLUMNS = [
    "Invoice No", "Posting Date", "Document Type", "Customer No", "Customer Type",
    "Assessed Value", "FED", "Amount Excl. Discount", "Discount", "Amount Excl. Sales Tax",
];

export default function CustomerLedgerPage() {
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [docType, setDocType] = useState("All");
    const [customerType, setCustomerType] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [rows, setRows] = useState<CustomerLedgerRow[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);

    const load = useCallback(() => {
        setIsLoading(true); setRows([]);
        const t = setTimeout(() => { setRows(MOCK_ROWS); setIsLoading(false); }, 1000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => load(), [load]);

    const filtered = rows.filter((r) => {
        const q = search.toLowerCase();
        return (
            (!q || r.invoiceNo.toLowerCase().includes(q) || r.customerNo.toLowerCase().includes(q)) &&
            (docType === "All" || r.documentType === docType) &&
            (customerType === "All" || r.customerType === customerType) &&
            (!dateFrom || r.postingDate >= dateFrom) &&
            (!dateTo || r.postingDate <= dateTo)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    return (
        <LedgerShell
            title="Customer Ledger"
            entityTypeLabel="Customer type"
            entityTypeOptions={CUSTOMER_TYPE_OPTIONS}
            columns={COLUMNS}
            loadingLabel="Loading Customer Ledger..."
            emptyMessage="No ledger rows match the current filters."
            isLoading={isLoading}
            hasRows={paginated.length > 0}
            search={search} onSearchChange={setSearch}
            dateFrom={dateFrom} onDateFromChange={setDateFrom}
            dateTo={dateTo} onDateToChange={setDateTo}
            docType={docType} onDocTypeChange={setDocType}
            entityType={customerType} onEntityTypeChange={setCustomerType}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={setRowsPerPage}
            page={page} totalPages={totalPages} onPageChange={setPage}
            onRefresh={load}
        >
            {paginated.map((row, i) => (
                <tr key={row.id} className={cn(i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]", "hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors")}>
                    <td className="px-3 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{row.invoiceNo}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.postingDate}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.documentType}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{row.customerNo}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{row.customerType}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(row.assessedValue)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.fed)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(row.amtExclDiscount)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.discount)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#A27B3A] font-semibold">{fmt(row.amtExclSalesTax)}</td>
                </tr>
            ))}
        </LedgerShell>
    );
}
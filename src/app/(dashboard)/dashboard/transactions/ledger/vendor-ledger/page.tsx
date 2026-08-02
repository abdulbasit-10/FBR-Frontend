"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { LedgerShell, fmt } from "@/components/dashboard/ledger-shell";

interface VendorLedgerRow {
    id: number;
    invoiceNo: string;
    postingDate: string;
    documentType: string;
    vendorNo: string;
    vendorName: string;
    vendorType: string;
    fed: number;
    amtExclDiscount: number;
    discount: number;
    amtExclSalesTax: number;
    salesTax: number;
}

const MOCK_ROWS: VendorLedgerRow[] = [
    { id: 1, invoiceNo: "PI-0001", postingDate: "2026-07-02", documentType: "Purchase Invoice", vendorNo: "V-0001", vendorName: "Alpha Suppliers", vendorType: "Registered", fed: 0, amtExclDiscount: 80000, discount: 0, amtExclSalesTax: 80000, salesTax: 13600 },
    { id: 2, invoiceNo: "PI-0002", postingDate: "2026-07-06", documentType: "Purchase Invoice", vendorNo: "V-0002", vendorName: "Beta Distributors", vendorType: "Unregistered", fed: 900, amtExclDiscount: 45000, discount: 4500, amtExclSalesTax: 40500, salesTax: 6885 },
    { id: 3, invoiceNo: "PR-0001", postingDate: "2026-07-08", documentType: "Purchase Return", vendorNo: "V-0001", vendorName: "Alpha Suppliers", vendorType: "Registered", fed: 0, amtExclDiscount: 15000, discount: 0, amtExclSalesTax: 15000, salesTax: 2550 },
    { id: 4, invoiceNo: "PI-0003", postingDate: "2026-07-14", documentType: "Purchase Invoice", vendorNo: "V-0003", vendorName: "Gamma Imports", vendorType: "AOP", fed: 640, amtExclDiscount: 32000, discount: 0, amtExclSalesTax: 32000, salesTax: 5440 },
    { id: 5, invoiceNo: "DN-0001", postingDate: "2026-07-18", documentType: "Debit Note", vendorNo: "V-0002", vendorName: "Beta Distributors", vendorType: "Unregistered", fed: 0, amtExclDiscount: 5000, discount: 500, amtExclSalesTax: 4500, salesTax: 765 },
];

const VENDOR_TYPE_OPTIONS = ["All", "Registered", "Unregistered", "AOP", "Company"];

const COLUMNS = [
    "Invoice No", "Posting Date", "Document Type", "Vendor No", "Vendor Name",
    "Vendor Type", "FED", "Amount Excl. Discount", "Discount", "Amount Excl. Sales Tax", "Sales Tax",
];

export default function VendorLedgerPage() {
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [docType, setDocType] = useState("All");
    const [vendorType, setVendorType] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [rows, setRows] = useState<VendorLedgerRow[]>([]);
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
            (!q || r.invoiceNo.toLowerCase().includes(q) || r.vendorNo.toLowerCase().includes(q) || r.vendorName.toLowerCase().includes(q)) &&
            (docType === "All" || r.documentType === docType) &&
            (vendorType === "All" || r.vendorType === vendorType) &&
            (!dateFrom || r.postingDate >= dateFrom) &&
            (!dateTo || r.postingDate <= dateTo)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    return (
        <LedgerShell
            title="Vendor Ledger"
            entityTypeLabel="Vendor type"
            entityTypeOptions={VENDOR_TYPE_OPTIONS}
            columns={COLUMNS}
            loadingLabel="Loading Vendor Ledger..."
            emptyMessage="No ledger rows match the current filters."
            isLoading={isLoading}
            hasRows={paginated.length > 0}
            search={search} onSearchChange={setSearch}
            dateFrom={dateFrom} onDateFromChange={setDateFrom}
            dateTo={dateTo} onDateToChange={setDateTo}
            docType={docType} onDocTypeChange={setDocType}
            entityType={vendorType} onEntityTypeChange={setVendorType}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={setRowsPerPage}
            page={page} totalPages={totalPages} onPageChange={setPage}
            onRefresh={load}
        >
            {paginated.map((row, i) => (
                <tr key={row.id} className={cn(i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]", "hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors")}>
                    <td className="px-3 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{row.invoiceNo}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.postingDate}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.documentType}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{row.vendorNo}</td>
                    <td className="px-3 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{row.vendorName}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{row.vendorType}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.fed)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(row.amtExclDiscount)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.discount)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(row.amtExclSalesTax)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#A27B3A] font-semibold">{fmt(row.salesTax)}</td>
                </tr>
            ))}
        </LedgerShell>
    );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { LedgerShell, fmt } from "@/components/dashboard/ledger-shell";
import { invoicesService, type Invoice as ApiInvoice } from "@/lib/services";
import { toast } from "react-toastify";

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

const toRow = (inv: ApiInvoice): CustomerLedgerRow => ({
    id: inv.id,
    invoiceNo: inv.fbrInvoiceNumber ?? `SI-${String(inv.id).padStart(4, "0")}`,
    postingDate: (inv.postingDate ?? inv.invoiceDate ?? "").slice(0, 10),
    documentType: inv.invoiceType === "Debit Note" ? "Debit Note" : "Sales Invoice",
    customerNo: String(inv.customerId),
    customerType: inv.buyerRegistrationType ?? "—",
    assessedValue: Number(inv.totalValueExcludingST) + Number(inv.totalDiscount),
    fed: Number(inv.totalFedPayable ?? 0),
    amtExclDiscount: Number(inv.totalValueExcludingST) + Number(inv.totalDiscount),
    discount: Number(inv.totalDiscount),
    amtExclSalesTax: Number(inv.totalValueExcludingST),
});

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
    const [total, setTotal] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);

    const load = useCallback(() => {
        setIsLoading(true);
        setRows([]);
        invoicesService.list({
            page, limit: rowsPerPage, status: "posted",
            search: search.trim() || undefined,
            from: dateFrom || undefined, to: dateTo || undefined,
            sortBy: "invoice_date", sortDir: "DESC",
        })
            .then((res) => {
                setRows(res.data.rows.map(toRow));
                setTotal(res.data.meta.total);
            })
            .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load."))
            .finally(() => setIsLoading(false));
    }, [page, rowsPerPage, search, dateFrom, dateTo]);

    useEffect(() => load(), [load]);

    const filtered = rows.filter((r) =>
        (docType === "All" || r.documentType === docType) &&
        (customerType === "All" || r.customerType === customerType)
    );

    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
    const paginated = filtered;

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
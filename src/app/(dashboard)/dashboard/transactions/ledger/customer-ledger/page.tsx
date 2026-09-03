"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    customerName: string;
    customerType: string;
    assessedValue: number;
    fed: number;
    amtExclDiscount: number;
    discount: number;
    amtExclSalesTax: number;
    salesTax: number;
    amtInclST: number;
    furtherTax: number;
    amtInclFT: number;
    advanceTax: number;
    advTaxPercent: number;
    total: number;
    fbrInvoiceNo: string;
    source: string;
    user: string;
    mappingId: string;
}

const toRow = (inv: ApiInvoice): CustomerLedgerRow => ({
    id: inv.id,
    invoiceNo: inv.fbrInvoiceNumber ?? `SI-${String(inv.id).padStart(4, "0")}`,
    postingDate: (inv.postingDate ?? inv.invoiceDate ?? "").slice(0, 10),
    documentType: inv.invoiceType === "Debit Note" ? "Debit Note" : "Sales Invoice",
    customerNo: String(inv.customerId),
    customerName: inv.buyerBusinessName,
    customerType: inv.buyerRegistrationType ?? "—",
    assessedValue: Number(inv.totalValueExcludingST) + Number(inv.totalDiscount),
    fed: Number(inv.totalFedPayable ?? 0),
    amtExclDiscount: Number(inv.totalValueExcludingST) + Number(inv.totalDiscount),
    discount: Number(inv.totalDiscount),
    amtExclSalesTax: Number(inv.totalValueExcludingST),
    salesTax: Number(inv.totalSalesTax),
    amtInclST: Number(inv.totalValueIncludingST) - Number(inv.totalFurtherTax) - Number(inv.totalFedPayable),
    furtherTax: Number(inv.totalFurtherTax),
    amtInclFT: Number(inv.totalValueIncludingST) - Number(inv.totalFedPayable),
    advanceTax: Number(inv.advanceTax),
    advTaxPercent: Number(inv.totalValueIncludingST) > 0 ? (Number(inv.advanceTax) / Number(inv.totalValueIncludingST)) * 100 : 0,
    total: Number(inv.totalValueIncludingST) + Number(inv.advanceTax),
    fbrInvoiceNo: inv.fbrInvoiceNumber ?? "—",
    source: inv.environment === "production" ? "Production" : "Sandbox",
    user: inv.creator?.name ?? "—",
    mappingId: inv.mappingId ?? "—",
});

const fmtPercent = (n: number) => `${n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

const CUSTOMER_TYPE_OPTIONS = ["All", "Registered", "Unregistered", "AOP", "Company"];

const COLUMNS = [
    "Invoice No", "Posting Date", "Document Type", "Customer No", "Customer Name", "Customer Type",
    "Assessed Value", "FED", "Amount Excl. Discount", "Discount", "Amount Excl. ST", "Sales Tax",
    "Amount Incl. ST", "Further Tax", "Amount Incl. FT", "Advance Tax", "Adv Tax %", "Total",
    "FBR Invoice No", "Source", "User", "Mapping Id",
];

function CustomerLedgerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invoiceUuid = searchParams.get("invoiceUuid");

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
        if (invoiceUuid) {
            invoicesService
                .getOne(invoiceUuid)
                .then((res) => {
                    setRows([toRow(res.data)]);
                    setTotal(1);
                })
                .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load."))
                .finally(() => setIsLoading(false));
            return;
        }
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
    }, [page, rowsPerPage, search, dateFrom, dateTo, invoiceUuid]);

    useEffect(() => load(), [load]);

    const filtered = invoiceUuid
        ? rows
        : rows.filter((r) =>
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
            banner={invoiceUuid ? (
                <div className="flex items-center justify-between">
                    <span>
                        Filtered to one document. Sales Invoice · ID {invoiceUuid}
                    </span>
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/transactions/ledger/customer-ledger")}
                        className="font-semibold underline hover:opacity-75"
                    >
                        Clear filter
                    </button>
                </div>
            ) : undefined}
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
                    <td className="px-2.5 py-2 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{row.invoiceNo}</td>
                    <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.postingDate}</td>
                    <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.documentType}</td>
                    <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af]">{row.customerNo}</td>
                    <td className="px-2.5 py-2 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{row.customerName}</td>
                    <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af]">{row.customerType}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(row.assessedValue)}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.fed)}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(row.amtExclDiscount)}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.discount)}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(row.amtExclSalesTax)}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.salesTax)}</td>
                    <td className="px-2.5 py-2 text-right font-mono font-semibold text-[#A27B3A]">{fmt(row.amtInclST)}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.furtherTax)}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(row.amtInclFT)}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.advanceTax)}</td>
                    <td className="px-2.5 py-2 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmtPercent(row.advTaxPercent)}</td>
                    <td className="px-2.5 py-2 text-right font-mono font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{fmt(row.total)}</td>
                    <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.fbrInvoiceNo}</td>
                    <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.source}</td>
                    <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.user}</td>
                    <td className="px-2.5 py-2 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.mappingId}</td>
                </tr>
            ))}
        </LedgerShell>
    );
}

export default function CustomerLedgerPage() {
    return <Suspense fallback={null}><CustomerLedgerContent /></Suspense>;
}
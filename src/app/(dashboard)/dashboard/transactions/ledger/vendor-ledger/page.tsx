"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LedgerShell, fmt } from "@/components/dashboard/ledger-shell";
import {
    purchasesService,
    type Purchase as ApiPurchase,
} from "@/lib/services";
import { toast } from "react-toastify";

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

const toRow = (p: ApiPurchase): VendorLedgerRow => ({
    id: p.id,
    invoiceNo: p.purchaseNo ?? `PI-${String(p.id).padStart(4, "0")}`,
    postingDate: (p.postingDate ?? p.docDate ?? "").slice(0, 10),
    documentType: p.purchaseType,
    vendorNo: p.vendor?.vendorNo ?? String(p.vendorId),
    vendorName: p.vendorBusinessName,
    vendorType: p.vendorRegistrationType ?? "—",
    fed: Number(p.totalFedPayable),
    amtExclDiscount: Number(p.assessedValue),
    discount: Number(p.totalDiscount),
    amtExclSalesTax: Number(p.totalValueExcludingST),
    salesTax: Number(p.totalSalesTax),
});

const VENDOR_TYPE_OPTIONS = ["All", "Registered", "Unregistered", "AOP", "Company"];

const COLUMNS = [
    "Invoice No", "Posting Date", "Document Type", "Vendor No", "Vendor Name",
    "Vendor Type", "FED", "Amount Excl. Discount", "Discount", "Amount Excl. Sales Tax", "Sales Tax",
];

export default function VendorLedgerPage() {
    return <Suspense fallback={null}><VendorLedgerContent /></Suspense>;
}

function VendorLedgerContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const purchaseUuid = searchParams.get("purchaseUuid");

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
        setIsLoading(true);
        setRows([]);
        if (purchaseUuid) {
            purchasesService
                .getOne(purchaseUuid)
                .then((res) => setRows([toRow(res.data)]))
                .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load."))
                .finally(() => setIsLoading(false));
            return;
        }
        purchasesService.list({
            page,
            limit: rowsPerPage,
            status: "posted",
            search: search.trim() || undefined,
            from: dateFrom || undefined,
            to: dateTo || undefined,
        })
            .then((res) => setRows(res.data.rows.map(toRow)))
            .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load vendor ledger."))
            .finally(() => setIsLoading(false));
    }, [page, rowsPerPage, search, dateFrom, dateTo, purchaseUuid]);

    useEffect(() => load(), [load]);

    const filtered = purchaseUuid
        ? rows
        : rows.filter((r) =>
            (docType === "All" || r.documentType === docType) &&
            (vendorType === "All" || r.vendorType === vendorType)
        );
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
            banner={purchaseUuid ? (
                <div className="flex items-center justify-between">
                    <span>
                        Filtered to one document. Purchase Invoice · ID {purchaseUuid}
                    </span>
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/transactions/ledger/vendor-ledger")}
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

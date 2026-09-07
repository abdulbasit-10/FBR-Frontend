"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { LedgerShell, fmt } from "@/components/dashboard/ledger-shell";
import { exportRowsToExcel } from "@/lib/export";
import {
    ledgerService,
    type ItemLedgerRow as ApiItemLedgerRow,
    type LedgerDocumentType,
} from "@/lib/services";
import { toast } from "react-toastify";

interface ItemLedgerRow {
    id: number;
    documentNo: string;
    documentDate: string;
    postingDate: string;
    documentType: string;
    itemNo: string;
    hsCode: string;
    itemMapping: string;
    itemName: string;
    itemType: string;
    quantity: number;
    uom: string;
    unitCost: number;
    unitPrice: number;
}

const toRow = (r: ApiItemLedgerRow, idx: number): ItemLedgerRow => ({
    id: idx,
    documentNo: r.documentNo,
    documentDate: r.documentDate,
    postingDate: r.postingDate ?? r.documentDate,
    documentType: r.documentType,
    itemNo: r.itemNo != null ? String(r.itemNo) : "—",
    hsCode: r.hsCode,
    itemMapping: "—",
    itemName: r.itemName,
    itemType: r.documentType.startsWith("Purchase") ? "Purchase" : r.documentType === "Inventory Adjustment" ? "Adjustment" : "Sale",
    quantity: r.quantity,
    uom: r.uom,
    unitCost: r.unitCost,
    unitPrice: r.unitPrice,
});

const ITEM_TYPE_OPTIONS = ["All", "Finished Goods", "Raw Material", "Semi-Finished", "Service", "Consumable"];

const COLUMNS = [
    "S.No", "Document No", "Document Date", "Posting Date", "Document Type",
    "Item No", "HS Code", "Item Mapping", "Item Name", "Item Type",
    "Quantity", "UOM", "Unit Cost", "Unit Price",
];

const FILTER_HINT = "Same range for posting date and document date (both must fall within it).";

export default function ItemLedgerPage() {
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [docType, setDocType] = useState("All");
    const [itemType, setItemType] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [rows, setRows] = useState<ItemLedgerRow[]>([]);
    const [rowsPerPage, setRowsPerPage] = useState(200);
    const [page, setPage] = useState(1);

    const load = useCallback(() => {
        setIsLoading(true);
        setRows([]);
        const docTypeParam: LedgerDocumentType | undefined =
            docType === "All" ? undefined :
                docType === "Sales Invoice" ? "Sales Invoice" :
                    docType === "Sales Return" ? "Debit Note" :
                        docType === "Purchase Invoice" ? "Purchase Invoice" :
                            docType === "Purchase Return" ? "Purchase Return" :
                                docType === "Inventory Adjustment" ? "Inventory Adjustment" :
                                    undefined;
        ledgerService.items({
            from: dateFrom || undefined,
            to: dateTo || undefined,
            search: search.trim() || undefined,
            docType: docTypeParam,
        })
            .then((res) => setRows(res.data.map(toRow)))
            .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load ledger."))
            .finally(() => setIsLoading(false));
    }, [search, dateFrom, dateTo, docType]);

    useEffect(() => load(), [load]);

    const filtered = rows.filter((r) =>
        (docType === "All" || r.documentType === docType) &&
        (itemType === "All" || r.itemType === itemType)
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const handleExport = () => {
        if (paginated.length === 0) { toast.error("No rows to export."); return; }
        exportRowsToExcel(
            "Item_Ledger",
            COLUMNS.filter((c) => c !== "S.No"),
            paginated.map((r) => [r.documentNo, r.documentDate, r.postingDate, r.documentType, r.itemNo, r.hsCode, r.itemMapping, r.itemName, r.itemType, r.quantity, r.uom, r.unitCost, r.unitPrice]),
        );
        toast.success("Item ledger exported.");
    };

    return (
        <LedgerShell
            title="Item Ledger"
            entityTypeLabel="Item type"
            entityTypeOptions={ITEM_TYPE_OPTIONS}
            columns={COLUMNS}
            loadingLabel="Loading Item Ledger..."
            emptyMessage="No ledger rows match the current filters."
            filterHint={FILTER_HINT}
            dateFromLabel="Date from"
            dateToLabel="Date to"
            isLoading={isLoading}
            hasRows={paginated.length > 0}
            search={search} onSearchChange={setSearch}
            dateFrom={dateFrom} onDateFromChange={setDateFrom}
            dateTo={dateTo} onDateToChange={setDateTo}
            docType={docType} onDocTypeChange={setDocType}
            entityType={itemType} onEntityTypeChange={setItemType}
            rowsPerPage={rowsPerPage} onRowsPerPageChange={setRowsPerPage}
            page={page} totalPages={totalPages} onPageChange={setPage}
            onRefresh={load}
            onExport={handleExport}
        >
            {paginated.map((row, i) => (
                <tr key={row.id} className={cn(i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]", "hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors")}>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{(page - 1) * rowsPerPage + i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{row.documentNo}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.documentDate}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.postingDate}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{row.documentType}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{row.itemNo}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{row.hsCode}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{row.itemMapping}</td>
                    <td className="px-3 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{row.itemName}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af]">{row.itemType}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{row.quantity.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] dark:text-[#9ca3af] text-center">{row.uom}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(row.unitCost)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#A27B3A] font-semibold">{fmt(row.unitPrice)}</td>
                </tr>
            ))}
        </LedgerShell>
    );
}

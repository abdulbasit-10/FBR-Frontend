"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { LedgerShell, fmt } from "@/components/dashboard/ledger-shell";

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

const MOCK_ROWS: ItemLedgerRow[] = [
    { id: 1, documentNo: "SI-0001", documentDate: "2026-07-01", postingDate: "2026-07-01", documentType: "Sales Invoice", itemNo: "ITEM-001", hsCode: "8471.30", itemMapping: "M-001", itemName: "Laptop 15\"", itemType: "Finished Goods", quantity: 5, uom: "PCS", unitCost: 85000, unitPrice: 95000 },
    { id: 2, documentNo: "PI-0001", documentDate: "2026-07-02", postingDate: "2026-07-02", documentType: "Purchase Invoice", itemNo: "ITEM-002", hsCode: "8517.12", itemMapping: "M-002", itemName: "Mobile Phone", itemType: "Finished Goods", quantity: 20, uom: "PCS", unitCost: 45000, unitPrice: 52000 },
    { id: 3, documentNo: "SI-0002", documentDate: "2026-07-05", postingDate: "2026-07-05", documentType: "Sales Invoice", itemNo: "ITEM-003", hsCode: "3926.90", itemMapping: "M-003", itemName: "Plastic Casing", itemType: "Raw Material", quantity: 100, uom: "KG", unitCost: 250, unitPrice: 320 },
    { id: 4, documentNo: "SR-0001", documentDate: "2026-07-08", postingDate: "2026-07-08", documentType: "Sales Return", itemNo: "ITEM-001", hsCode: "8471.30", itemMapping: "M-001", itemName: "Laptop 15\"", itemType: "Finished Goods", quantity: 1, uom: "PCS", unitCost: 85000, unitPrice: 95000 },
    { id: 5, documentNo: "PI-0002", documentDate: "2026-07-10", postingDate: "2026-07-10", documentType: "Purchase Invoice", itemNo: "ITEM-004", hsCode: "7204.10", itemMapping: "M-004", itemName: "Steel Sheet", itemType: "Raw Material", quantity: 500, uom: "KG", unitCost: 180, unitPrice: 0 },
];

const ITEM_TYPE_OPTIONS = ["All", "Finished Goods", "Raw Material", "Semi-Finished", "Service", "Consumable"];

const COLUMNS = [
    "Document No", "Document Date", "Posting Date", "Document Type",
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
        setIsLoading(true); setRows([]);
        const t = setTimeout(() => { setRows(MOCK_ROWS); setIsLoading(false); }, 1000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => load(), [load]);

    const filtered = rows.filter((r) => {
        const q = search.toLowerCase();
        return (
            (!q || r.documentNo.toLowerCase().includes(q) || r.itemNo.toLowerCase().includes(q) || r.itemName.toLowerCase().includes(q)) &&
            (docType === "All" || r.documentType === docType) &&
            (itemType === "All" || r.itemType === itemType) &&
            (!dateFrom || (r.postingDate >= dateFrom && r.documentDate >= dateFrom)) &&
            (!dateTo || (r.postingDate <= dateTo && r.documentDate <= dateTo))
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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
        >
            {paginated.map((row, i) => (
                <tr key={row.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#FAF6F0]/30", "hover:bg-[#FAF6F0] transition-colors")}>
                    <td className="px-3 py-2.5 font-medium text-[#1E293B] whitespace-nowrap">{row.documentNo}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] whitespace-nowrap">{row.documentDate}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] whitespace-nowrap">{row.postingDate}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] whitespace-nowrap">{row.documentType}</td>
                    <td className="px-3 py-2.5 text-[#4F5967]">{row.itemNo}</td>
                    <td className="px-3 py-2.5 text-[#4F5967]">{row.hsCode}</td>
                    <td className="px-3 py-2.5 text-[#4F5967]">{row.itemMapping}</td>
                    <td className="px-3 py-2.5 font-medium text-[#1E293B] whitespace-nowrap">{row.itemName}</td>
                    <td className="px-3 py-2.5 text-[#4F5967]">{row.itemType}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#1E293B]">{row.quantity.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-[#4F5967] text-center">{row.uom}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#4F5967]">{fmt(row.unitCost)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#A27B3A] font-semibold">{fmt(row.unitPrice)}</td>
                </tr>
            ))}
        </LedgerShell>
    );
}

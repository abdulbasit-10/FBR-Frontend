"use client";

import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { ReportShell, INVENTORY_ACTIONS } from "@/components/dashboard/report-shell";
import { SelectItemModal, type Item } from "@/components/dashboard/select-item-modal";
import { ledgerService, type LedgerDocumentType } from "@/lib/services";
import { exportRowsToExcel } from "@/lib/export";
import { cn } from "@/lib/utils";

interface Row {
    documentNo: string;
    documentDate: string;
    documentType: string;
    itemName: string;
    hsCode: string;
    quantity: number;
    uom: string;
    unitCost: number;
    unitPrice: number;
}

const COLUMNS = ["Document No", "Document Date", "Document Type", "Item Name", "HS Code", "Quantity", "UOM", "Unit Cost", "Unit Price"];
const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toDocType = (action: string): LedgerDocumentType | undefined => {
    if (action === "Sales Return") return "Debit Note";
    if (action === "All") return undefined;
    return action as LedgerDocumentType;
};

export default function InventoryMovementReportPage() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [action, setAction] = useState("All");
    const [selectedParty, setSelectedParty] = useState<Item | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [rows, setRows] = useState<Row[]>([]);

    const handleApply = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await ledgerService.items({
                from: dateFrom || undefined,
                to: dateTo || undefined,
                docType: toDocType(action),
                productId: selectedParty?.id,
            });
            setRows(
                res.data.map((r) => ({
                    documentNo: r.documentNo,
                    documentDate: r.documentDate?.slice(0, 10) ?? "",
                    documentType: r.documentType,
                    itemName: r.itemName,
                    hsCode: r.hsCode || "—",
                    quantity: Number(r.quantity),
                    uom: r.uom,
                    unitCost: Number(r.unitCost),
                    unitPrice: Number(r.unitPrice),
                })),
            );
            setHasData(true);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to load report.");
            setHasData(false);
        } finally {
            setIsLoading(false);
        }
    }, [dateFrom, dateTo, action, selectedParty]);

    const handleReset = () => {
        setDateFrom(""); setDateTo(""); setAction("All"); setSelectedParty(null); setHasData(false); setRows([]);
    };

    const handleExport = () => {
        if (rows.length === 0) {
            toast.error("No report data to export.");
            return;
        }
        exportRowsToExcel(
            "Inventory_Movement_Report",
            COLUMNS,
            rows.map((r) => [r.documentNo, r.documentDate, r.documentType, r.itemName, r.hsCode, r.quantity, r.uom, r.unitCost, r.unitPrice]),
        );
    };

    const handlePrint = () => {
        if (rows.length === 0) {
            toast.error("No report data to print.");
            return;
        }
        sessionStorage.setItem("printReportPayload", JSON.stringify({
            title: "Inventory Movement Report",
            filtersSummary: `Posting date: ${dateFrom || "—"} to ${dateTo || "—"} · Document type: ${action} · Item: ${selectedParty?.name ?? "All Items"}`,
            columns: COLUMNS,
            rows: rows.map((r) => [r.documentNo, r.documentDate, r.documentType, r.itemName, r.hsCode, r.quantity, r.uom, r.unitCost, r.unitPrice]),
        }));
        window.open("/print/report", "_blank");
    };

    return (
        <>
            <ReportShell
                title="Inventory Movement Report"
                partyLabel="Items"
                partyPlaceholder="All Items"
                selectedParty={selectedParty?.name ?? ""}
                onSelectPartyClick={() => setShowModal(true)}
                onClearParty={() => setSelectedParty(null)}
                actionOptions={INVENTORY_ACTIONS}
                dateFromLabel="Posting date from"
                dateToLabel="Posting date to"
                actionLabel="Document type"
                dateFrom={dateFrom} onDateFromChange={setDateFrom}
                dateTo={dateTo} onDateToChange={setDateTo}
                action={action} onActionChange={setAction}
                onApplyFilters={handleApply}
                onResetFilters={handleReset}
                onRefresh={handleApply}
                onExport={handleExport}
                onPrint={handlePrint}
                isLoading={isLoading}
                hasData={hasData && rows.length > 0}
            >
                <thead>
                    <tr className="bg-[#C69A52] text-white">
                        {COLUMNS.map((col) => <th key={col} className="px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">{col}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                    {rows.map((r, i) => (
                        <tr key={i} className={cn(i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]")}>
                            <td className="px-2.5 py-1.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.documentNo}</td>
                            <td className="px-2.5 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.documentDate}</td>
                            <td className="px-2.5 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.documentType}</td>
                            <td className="px-2.5 py-1.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.itemName}</td>
                            <td className="px-2.5 py-1.5 font-mono text-[#4F5967] dark:text-[#9ca3af]">{r.hsCode}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{r.quantity}</td>
                            <td className="px-2.5 py-1.5 text-center text-[#4F5967] dark:text-[#9ca3af]">{r.uom}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(r.unitCost)}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono font-semibold text-[#A27B3A]">{fmt(r.unitPrice)}</td>
                        </tr>
                    ))}
                </tbody>
            </ReportShell>
            <SelectItemModal isOpen={showModal} onClose={() => setShowModal(false)}
                onSelect={(item) => { setSelectedParty(item); setShowModal(false); }} />
        </>
    );
}


"use client";

import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { ReportShell, PURCHASE_ACTIONS } from "@/components/dashboard/report-shell";
import { SelectVendorModal, type Vendor } from "@/components/dashboard/select-vendor-modal";
import { purchasesService, type Purchase } from "@/lib/services";
import { exportRowsToExcel } from "@/lib/export";
import { cn } from "@/lib/utils";

interface Row {
    invoiceNo: string;
    postingDate: string;
    vendorNo: string;
    vendorName: string;
    vendorType: string;
    assessedValue: number;
    discount: number;
    salesTax: number;
    amtInclST: number;
}

const COLUMNS = ["Invoice No", "Posting Date", "Vendor No", "Vendor Name", "Vendor Type", "Assessed Value", "Discount", "Sales Tax", "Amt incl. ST"];
const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// PURCHASE_ACTIONS = ["All", "Purchase Invoice", "Purchase Return", "Debit Note"] — Debit Note
// has no backing document type on the purchase side, so it always yields an empty result.
const toPurchaseType = (action: string): Purchase["purchaseType"] | null | undefined => {
    if (action === "Purchase Invoice") return "Purchase Invoice";
    if (action === "Purchase Return") return "Purchase Return";
    if (action === "Debit Note") return null;
    return undefined;
};

const toRow = (p: Purchase): Row => ({
    invoiceNo: p.purchaseNo ?? `PI-${String(p.id).padStart(4, "0")}`,
    postingDate: (p.postingDate ?? p.docDate ?? "").slice(0, 10),
    vendorNo: p.vendor?.vendorNo ?? String(p.vendorId),
    vendorName: p.vendorBusinessName,
    vendorType: p.vendorRegistrationType ?? "—",
    assessedValue: Number(p.assessedValue),
    discount: Number(p.totalDiscount),
    salesTax: Number(p.totalSalesTax),
    amtInclST: Number(p.totalValueIncludingST),
});

export default function PurchaseDetailReportPage() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [action, setAction] = useState("All");
    const [selectedParty, setSelectedParty] = useState<Vendor | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [rows, setRows] = useState<Row[]>([]);

    const handleApply = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await purchasesService.list({
                page: 1,
                limit: 200,
                status: "posted",
                from: dateFrom || undefined,
                to: dateTo || undefined,
                sortBy: "doc_date",
                sortDir: "DESC",
            });
            const wantedType = toPurchaseType(action);
            const filtered = res.data.rows.filter(
                (p) =>
                    (wantedType === undefined || p.purchaseType === wantedType) &&
                    wantedType !== null &&
                    (!selectedParty || p.vendorId === selectedParty.id),
            );
            setRows(filtered.map(toRow));
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
            "Purchase_Detail_Report",
            COLUMNS,
            rows.map((r) => [r.invoiceNo, r.postingDate, r.vendorNo, r.vendorName, r.vendorType, r.assessedValue, r.discount, r.salesTax, r.amtInclST]),
        );
    };

    const handlePrint = () => {
        if (rows.length === 0) {
            toast.error("No report data to print.");
            return;
        }
        sessionStorage.setItem("printReportPayload", JSON.stringify({
            title: "Purchase Detail Report",
            filtersSummary: `Document date: ${dateFrom || "—"} to ${dateTo || "—"} · Document type: ${action} · Vendor: ${selectedParty?.name ?? "All Vendors"}`,
            columns: COLUMNS,
            rows: rows.map((r) => [r.invoiceNo, r.postingDate, r.vendorNo, r.vendorName, r.vendorType, r.assessedValue, r.discount, r.salesTax, r.amtInclST]),
        }));
        window.open("/print/report", "_blank");
    };

    return (
        <>
            <ReportShell
                title="Purchase Detail Report"
                partyLabel="Vendors"
                partyPlaceholder="All Vendors"
                selectedParty={selectedParty?.name ?? ""}
                onSelectPartyClick={() => setShowModal(true)}
                onClearParty={() => setSelectedParty(null)}
                actionOptions={PURCHASE_ACTIONS}
                dateFromLabel="Document date from"
                dateToLabel="Document date to"
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
                <thead className="sticky top-0 z-10">
                    <tr className="bg-[#C69A52] text-white">
                        {COLUMNS.map((col) => <th key={col} className="px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">{col}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                    {rows.map((r, i) => (
                        <tr key={i} className={cn(i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]")}>
                            <td className="px-2.5 py-1.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.invoiceNo}</td>
                            <td className="px-2.5 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.postingDate}</td>
                            <td className="px-2.5 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{r.vendorNo}</td>
                            <td className="px-2.5 py-1.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.vendorName}</td>
                            <td className="px-2.5 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{r.vendorType}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(r.assessedValue)}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(r.discount)}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(r.salesTax)}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono font-semibold text-[#A27B3A]">{fmt(r.amtInclST)}</td>
                        </tr>
                    ))}
                </tbody>
            </ReportShell>
            <SelectVendorModal isOpen={showModal} onClose={() => setShowModal(false)}
                onSelect={(v) => { setSelectedParty(v); setShowModal(false); }} />
        </>
    );
}


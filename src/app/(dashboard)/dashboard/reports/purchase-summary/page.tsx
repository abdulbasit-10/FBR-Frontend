"use client";

import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { ReportShell, PURCHASE_ACTIONS } from "@/components/dashboard/report-shell";
import { SelectVendorModal, type Vendor } from "@/components/dashboard/select-vendor-modal";
import { purchasesService } from "@/lib/services";
import { exportRowsToExcel } from "@/lib/export";
import { cn } from "@/lib/utils";

interface Row {
    vendorNo: string;
    vendorName: string;
    invoiceCount: number;
    salesTax: number;
    total: number;
}

const COLUMNS = ["Vendor No", "Vendor Name", "Invoices", "Sales Tax", "Total (Incl. ST)"];
const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PurchaseSummaryReportPage() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [action, setAction] = useState("All");
    const [selectedParty, setSelectedParty] = useState<Vendor | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [rows, setRows] = useState<Row[]>([]);

    // PURCHASE_ACTIONS = ["All", "Purchase Invoice", "Purchase Return", "Debit Note"] — Debit Note
    // has no backing document type on the purchase side, so it always yields an empty result.
    const toPurchaseType = (a: string): "Purchase Invoice" | "Purchase Return" | null | undefined => {
        if (a === "Purchase Invoice") return "Purchase Invoice";
        if (a === "Purchase Return") return "Purchase Return";
        if (a === "Debit Note") return null;
        return undefined;
    };

    // No dedicated backend aggregation endpoint for purchases exists yet, so this groups
    // the posted purchase list client-side by vendor (dataset sizes here are small).
    const handleApply = useCallback(async () => {
        setIsLoading(true);
        const wantedType = toPurchaseType(action);
        if (wantedType === null) {
            setRows([]);
            setHasData(true);
            setIsLoading(false);
            return;
        }
        try {
            const res = await purchasesService.list({
                page: 1,
                limit: 200,
                status: "posted",
                purchaseType: wantedType,
                from: dateFrom || undefined,
                to: dateTo || undefined,
            });
            const filtered = selectedParty
                ? res.data.rows.filter((p) => p.vendorId === selectedParty.id)
                : res.data.rows;

            const byVendor = new Map<number, Row>();
            for (const p of filtered) {
                const key = p.vendorId;
                const existing = byVendor.get(key);
                const salesTax = Number(p.totalSalesTax);
                const total = Number(p.totalValueIncludingST);
                if (existing) {
                    existing.invoiceCount += 1;
                    existing.salesTax += salesTax;
                    existing.total += total;
                } else {
                    byVendor.set(key, {
                        vendorNo: p.vendor?.vendorNo ?? String(p.vendorId),
                        vendorName: p.vendorBusinessName,
                        invoiceCount: 1,
                        salesTax,
                        total,
                    });
                }
            }
            setRows(Array.from(byVendor.values()).sort((a, b) => b.total - a.total));
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
            "Purchase_Summary_Report",
            COLUMNS,
            rows.map((r) => [r.vendorNo, r.vendorName, r.invoiceCount, r.salesTax, r.total]),
        );
    };

    const handlePrint = () => {
        if (rows.length === 0) {
            toast.error("No report data to print.");
            return;
        }
        sessionStorage.setItem("printReportPayload", JSON.stringify({
            title: "Purchase Summary Report",
            filtersSummary: `Document date: ${dateFrom || "—"} to ${dateTo || "—"} · Document type: ${action} · Vendor: ${selectedParty?.name ?? "All Vendors"}`,
            columns: COLUMNS,
            rows: rows.map((r) => [r.vendorNo, r.vendorName, r.invoiceCount, r.salesTax, r.total]),
        }));
        window.open("/print/report", "_blank");
    };

    return (
        <>
            <ReportShell
                title="Purchase Summary Report"
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
                <thead>
                    <tr className="bg-[#C69A52] text-white">
                        {COLUMNS.map((col) => <th key={col} className="px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">{col}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                    {rows.map((r, i) => (
                        <tr key={i} className={cn(i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]")}>
                            <td className="px-2.5 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{r.vendorNo}</td>
                            <td className="px-2.5 py-1.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.vendorName}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{r.invoiceCount}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(r.salesTax)}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono font-semibold text-[#A27B3A]">{fmt(r.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </ReportShell>
            <SelectVendorModal isOpen={showModal} onClose={() => setShowModal(false)}
                onSelect={(v) => { setSelectedParty(v); setShowModal(false); }} />
        </>
    );
}


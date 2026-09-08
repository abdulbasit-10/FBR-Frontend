"use client";

import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { ReportShell, SALES_ACTIONS } from "@/components/dashboard/report-shell";
import { SelectCustomerModal, type Customer } from "@/components/dashboard/select-customer-modal";
import { reportsService } from "@/lib/services";
import { exportRowsToExcel } from "@/lib/export";
import { cn } from "@/lib/utils";

interface Row {
    customerNo: string;
    customerName: string;
    invoiceCount: number;
    salesTax: number;
    total: number;
}

const COLUMNS = ["Customer No", "Customer Name", "Invoices", "Sales Tax", "Total (Incl. ST)"];
const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SalesSummaryReportPage() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [action, setAction] = useState("All");
    const [selectedParty, setSelectedParty] = useState<Customer | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [rows, setRows] = useState<Row[]>([]);

    // Aggregated per-customer totals — the backend groups sales invoices + debit notes
    // together, so the "Document type" filter here is not applied to this summary.
    const handleApply = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await reportsService.sales({
                from: dateFrom || undefined,
                to: dateTo || undefined,
                groupBy: "customer",
            });
            const filtered = selectedParty
                ? res.data.filter((r) => r.customerId === selectedParty.id)
                : res.data;
            setRows(
                filtered.map((r) => ({
                    customerNo: String(r.customerId ?? "—"),
                    customerName: r.buyerBusinessName ?? "—",
                    invoiceCount: Number(r.count ?? 0),
                    salesTax: Number(r.salesTax ?? 0),
                    total: Number(r.total ?? 0),
                })),
            );
            setHasData(true);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to load report.");
            setHasData(false);
        } finally {
            setIsLoading(false);
        }
    }, [dateFrom, dateTo, selectedParty]);

    const handleReset = () => {
        setDateFrom(""); setDateTo(""); setAction("All"); setSelectedParty(null); setHasData(false); setRows([]);
    };

    const handleExport = () => {
        if (rows.length === 0) {
            toast.error("No report data to export.");
            return;
        }
        exportRowsToExcel(
            "Sales_Summary_Report",
            COLUMNS,
            rows.map((r) => [r.customerNo, r.customerName, r.invoiceCount, r.salesTax, r.total]),
        );
    };

    const handlePrint = () => {
        if (rows.length === 0) {
            toast.error("No report data to print.");
            return;
        }
        sessionStorage.setItem("printReportPayload", JSON.stringify({
            title: "Sales Summary Report",
            filtersSummary: `Posting date: ${dateFrom || "—"} to ${dateTo || "—"} · Customer: ${selectedParty?.name ?? "All Customers"}`,
            columns: COLUMNS,
            rows: rows.map((r) => [r.customerNo, r.customerName, r.invoiceCount, r.salesTax, r.total]),
        }));
        window.open("/print/report", "_blank");
    };

    return (
        <>
            <ReportShell
                title="Sales Summary Report"
                partyLabel="Customers"
                partyPlaceholder="All Customers"
                selectedParty={selectedParty?.name ?? ""}
                onSelectPartyClick={() => setShowModal(true)}
                onClearParty={() => setSelectedParty(null)}
                actionOptions={SALES_ACTIONS}
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
                <thead className="sticky top-0 z-10">
                    <tr className="bg-[#C69A52] text-white">
                        {COLUMNS.map((col) => <th key={col} className="px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">{col}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                    {rows.map((r, i) => (
                        <tr key={i} className={cn(i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]")}>
                            <td className="px-2.5 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{r.customerNo}</td>
                            <td className="px-2.5 py-1.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.customerName}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{r.invoiceCount}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(r.salesTax)}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono font-semibold text-[#A27B3A]">{fmt(r.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </ReportShell>
            <SelectCustomerModal isOpen={showModal} onClose={() => setShowModal(false)}
                onSelect={(c) => { setSelectedParty(c); setShowModal(false); }} />
        </>
    );
}


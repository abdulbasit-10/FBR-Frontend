"use client";

import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { ReportShell, SALES_ACTIONS } from "@/components/dashboard/report-shell";
import { SelectCustomerModal, type Customer } from "@/components/dashboard/select-customer-modal";
import { invoicesService, type Invoice } from "@/lib/services";
import { exportRowsToExcel } from "@/lib/export";
import { cn } from "@/lib/utils";

interface Row {
    invoiceNo: string;
    postingDate: string;
    customerNo: string;
    customerName: string;
    customerType: string;
    assessedValue: number;
    discount: number;
    salesTax: number;
    amtInclST: number;
}

const COLUMNS = ["Invoice No", "Posting Date", "Customer No", "Customer Name", "Customer Type", "Assessed Value", "Discount", "Sales Tax", "Amt incl. ST"];
const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// SALES_ACTIONS = ["All", "Sales Invoice", "Sales Return", "Credit Note"] — Credit Note has no
// backing document type in this system yet, so it always yields an empty result.
const toInvoiceType = (action: string): Invoice["invoiceType"] | null | undefined => {
    if (action === "Sales Invoice") return "Sale Invoice";
    if (action === "Sales Return") return "Debit Note";
    if (action === "Credit Note") return null;
    return undefined;
};

const toRow = (inv: Invoice): Row => ({
    invoiceNo: inv.fbrInvoiceNumber ?? `SI-${String(inv.id).padStart(4, "0")}`,
    postingDate: (inv.postingDate ?? inv.invoiceDate ?? "").slice(0, 10),
    customerNo: String(inv.customerId),
    customerName: inv.buyerBusinessName,
    customerType: inv.buyerRegistrationType ?? "—",
    assessedValue: Number(inv.totalValueExcludingST) + Number(inv.totalDiscount),
    discount: Number(inv.totalDiscount),
    salesTax: Number(inv.totalSalesTax),
    amtInclST: Number(inv.totalValueIncludingST),
});

export default function SalesDetailReportPage() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [action, setAction] = useState("All");
    const [selectedParty, setSelectedParty] = useState<Customer | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [rows, setRows] = useState<Row[]>([]);

    const handleApply = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await invoicesService.list({
                page: 1,
                limit: 200,
                status: "posted",
                from: dateFrom || undefined,
                to: dateTo || undefined,
                sortBy: "invoice_date",
                sortDir: "DESC",
            });
            const wantedType = toInvoiceType(action);
            const filtered = res.data.rows.filter(
                (inv) =>
                    (wantedType === undefined || inv.invoiceType === wantedType) &&
                    wantedType !== null &&
                    (!selectedParty || inv.customerId === selectedParty.id),
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
        setDateFrom(""); setDateTo(""); setAction("All"); setSelectedParty(null);
        setHasData(false); setRows([]);
    };

    const handleExport = () => {
        if (rows.length === 0) {
            toast.error("No report data to export.");
            return;
        }
        exportRowsToExcel(
            "Sales_Detail_Report",
            COLUMNS,
            rows.map((r) => [r.invoiceNo, r.postingDate, r.customerNo, r.customerName, r.customerType, r.assessedValue, r.discount, r.salesTax, r.amtInclST]),
        );
    };

    const handlePrint = () => {
        if (rows.length === 0) {
            toast.error("No report data to print.");
            return;
        }
        sessionStorage.setItem("printReportPayload", JSON.stringify({
            title: "Sales Detail Report",
            filtersSummary: `Posting date: ${dateFrom || "—"} to ${dateTo || "—"} · Document type: ${action} · Customer: ${selectedParty?.name ?? "All Customers"}`,
            columns: COLUMNS,
            rows: rows.map((r) => [r.invoiceNo, r.postingDate, r.customerNo, r.customerName, r.customerType, r.assessedValue, r.discount, r.salesTax, r.amtInclST]),
        }));
        window.open("/print/report", "_blank");
    };

    return (
        <>
            <ReportShell
                title="Sales Detail Report"
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
                <thead>
                    <tr className="bg-[#C69A52] text-white">
                        {COLUMNS.map((col) => <th key={col} className="px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">{col}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                    {rows.map((r, i) => (
                        <tr key={i} className={cn(i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]")}>
                            <td className="px-2.5 py-1.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.invoiceNo}</td>
                            <td className="px-2.5 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{r.postingDate}</td>
                            <td className="px-2.5 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{r.customerNo}</td>
                            <td className="px-2.5 py-1.5 font-semibold text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{r.customerName}</td>
                            <td className="px-2.5 py-1.5 text-[#4F5967] dark:text-[#9ca3af]">{r.customerType}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(r.assessedValue)}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(r.discount)}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(r.salesTax)}</td>
                            <td className="px-2.5 py-1.5 text-right font-mono font-semibold text-[#A27B3A]">{fmt(r.amtInclST)}</td>
                        </tr>
                    ))}
                </tbody>
            </ReportShell>

            <SelectCustomerModal isOpen={showModal} onClose={() => setShowModal(false)}
                onSelect={(c) => { setSelectedParty(c); setShowModal(false); }} />
        </>
    );
}


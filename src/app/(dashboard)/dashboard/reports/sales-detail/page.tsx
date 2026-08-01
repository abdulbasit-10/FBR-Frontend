"use client";

import { useState, useCallback } from "react";
import { ReportShell, SALES_ACTIONS } from "@/components/dashboard/report-shell";
import { SelectCustomerModal, type Customer } from "@/components/dashboard/select-customer-modal";
import { cn } from "@/lib/utils";

const COLUMNS = ["Invoice No", "Posting Date", "Customer No", "Customer Name", "Customer Type", "Assessed Value", "Discount", "Sales Tax", "Amt incl. ST"];
const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SalesDetailReportPage() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [action, setAction] = useState("All");
    const [selectedParty, setSelectedParty] = useState<Customer | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [rows, setRows] = useState<unknown[]>([]);

    const handleApply = useCallback(() => {
        setIsLoading(true); setHasData(false);
        setTimeout(() => { setRows([]); setIsLoading(false); setHasData(false); }, 1000);
    }, []);

    const handleReset = () => {
        setDateFrom(""); setDateTo(""); setAction("All"); setSelectedParty(null);
        setHasData(false); setRows([]);
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
                dateFrom={dateFrom} onDateFromChange={setDateFrom}
                dateTo={dateTo} onDateToChange={setDateTo}
                action={action} onActionChange={setAction}
                onApplyFilters={handleApply}
                onResetFilters={handleReset}
                onRefresh={handleApply}
                isLoading={isLoading}
                hasData={hasData}
            >
                <thead>
                    <tr className="bg-[#C69A52] text-white">
                        {COLUMNS.map((col) => <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{col}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                    {(rows as never[]).map((row, i) => (
                        <tr key={i} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#FAF6F0]/30")}>{row as React.ReactNode}</tr>
                    ))}
                </tbody>
            </ReportShell>

            <SelectCustomerModal isOpen={showModal} onClose={() => setShowModal(false)}
                onSelect={(c) => { setSelectedParty(c); setShowModal(false); }} />
        </>
    );
}

"use client";

import { useState, useCallback } from "react";
import { ReportShell, SALES_ACTIONS } from "@/components/dashboard/report-shell";
import { SelectCustomerModal, type Customer } from "@/components/dashboard/select-customer-modal";

export default function SalesSummaryReportPage() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [action, setAction] = useState("All");
    const [selectedParty, setSelectedParty] = useState<Customer | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasData, setHasData] = useState(false);

    const handleApply = useCallback(() => {
        setIsLoading(true); setHasData(false);
        setTimeout(() => { setIsLoading(false); setHasData(false); }, 1000);
    }, []);

    const handleReset = () => {
        setDateFrom(""); setDateTo(""); setAction("All"); setSelectedParty(null); setHasData(false);
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
                dateTo={dateTo} onDateToChange={setDateTo}
                action={action} onActionChange={setAction}
                onApplyFilters={handleApply}
                onResetFilters={handleReset}
                onRefresh={handleApply}
                isLoading={isLoading}
                hasData={hasData}
            />
            <SelectCustomerModal isOpen={showModal} onClose={() => setShowModal(false)}
                onSelect={(c) => { setSelectedParty(c); setShowModal(false); }} />
        </>
    );
}

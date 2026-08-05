"use client";

import { useState, useCallback } from "react";
import { ReportShell, PURCHASE_ACTIONS } from "@/components/dashboard/report-shell";
import { SelectVendorModal, type Vendor } from "@/components/dashboard/select-vendor-modal";

export default function PurchaseDetailReportPage() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [action, setAction] = useState("All");
    const [selectedParty, setSelectedParty] = useState<Vendor | null>(null);
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
                isLoading={isLoading}
                hasData={hasData}
            />
            <SelectVendorModal isOpen={showModal} onClose={() => setShowModal(false)}
                onSelect={(v) => { setSelectedParty(v); setShowModal(false); }} />
        </>
    );
}

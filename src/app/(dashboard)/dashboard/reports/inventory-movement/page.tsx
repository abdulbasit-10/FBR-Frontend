"use client";

import { useState, useCallback } from "react";
import { ReportShell, SALES_ACTIONS } from "@/components/dashboard/report-shell";
import { SelectItemModal, type Item } from "@/components/dashboard/select-item-modal";

export default function InventoryMovementReportPage() {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [action, setAction] = useState("All");
    const [selectedParty, setSelectedParty] = useState<Item | null>(null);
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
                title="Inventory Movement Report"
                partyLabel="Items"
                partyPlaceholder="All Items"
                selectedParty={selectedParty?.name ?? ""}
                onSelectPartyClick={() => setShowModal(true)}
                onClearParty={() => setSelectedParty(null)}
                actionOptions={["All", "Adjustment", "Transfer", "Write-off"]}
                dateFromLabel="Posting date from"
                dateToLabel="Posting date to"
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
            <SelectItemModal isOpen={showModal} onClose={() => setShowModal(false)}
                onSelect={(item) => { setSelectedParty(item); setShowModal(false); }} />
        </>
    );
}

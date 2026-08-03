"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Download, Printer, RefreshCw, FileSearch, ChevronDown, X } from "lucide-react";
import {
    SelectCustomerModal,
    type Customer,
} from "@/components/dashboard/select-customer-modal";

const DOCUMENT_TYPES = [
    { value: "all", label: "All" },
    { value: "sales-invoice", label: "Sales Invoice" },
    { value: "purchase-invoice", label: "Purchase Invoice" },
    { value: "credit-note", label: "Credit Note" },
    { value: "debit-note", label: "Debit Note" },
];

// Clean input class forcing explicit white bg and clear borders
const inputStyleClass =
    "h-[40px] rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] !bg-white dark:!bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-[12px] focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none [color-scheme:light] dark:[color-scheme:dark]";

export default function SalesDetailReportPage() {
    const router = useRouter();
    const [postingDateFrom, setPostingDateFrom] = useState("");
    const [postingDateTo, setPostingDateTo] = useState("");
    const [documentType, setDocumentType] = useState("all");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    const handleReset = () => {
        setPostingDateFrom("");
        setPostingDateTo("");
        setDocumentType("all");
        setSelectedCustomer(null);
        setHasApplied(false);
    };

    return (
        <div
            className="min-h-full space-y-4 text-[#4f5967]"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            {/* ── Main Outer Container ── */}
            <div className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5 shadow-xs space-y-5">

                {/* Page Title + Action Controls Bar */}
                <div className="flex items-center justify-between pb-1">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75 transition-opacity"
                    >
                        <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                        Sales Detail Report
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors"
                        >
                            <Download className="h-3.5 w-3.5 text-[#A27B3A]" />
                            Export
                        </button>
                        <button
                            type="button"
                            className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            Print
                        </button>
                        <button
                            type="button"
                            className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors"
                        >
                            <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e] p-4 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">
                        Filters
                    </p>

                    <div className="flex flex-wrap items-end gap-3">
                        {/* Posting date from (White BG) */}
                        <div className="flex-1 min-w-40 space-y-1.5">
                            <Label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af]">
                                Posting date from
                            </Label>
                            <Input
                                type="date"
                                value={postingDateFrom}
                                onChange={(e) => setPostingDateFrom(e.target.value)}
                                className={inputStyleClass}
                            />
                        </div>

                        {/* Posting date to (White BG) */}
                        <div className="flex-1 min-w-40 space-y-1.5">
                            <Label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af]">
                                Posting date to
                            </Label>
                            <Input
                                type="date"
                                value={postingDateTo}
                                onChange={(e) => setPostingDateTo(e.target.value)}
                                className={inputStyleClass}
                            />
                        </div>

                        {/* Document type */}
                        <div className="flex-1 min-w-37.5 space-y-1.5">
                            <Label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af]">
                                Document type
                            </Label>
                            <select
                                value={documentType}
                                onChange={(e) => setDocumentType(e.target.value)}
                                className="h-10 w-full rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] focus-visible:border-[#C69A52] appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                    backgroundRepeat: "no-repeat",
                                    backgroundPosition: "right 10px center",
                                    paddingRight: "30px",
                                }}
                            >
                                {DOCUMENT_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Customers — opens SelectCustomerModal */}
                        <div className="flex-1 min-w-42.5 space-y-1.5">
                            <Label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af]">
                                Customers
                            </Label>
                            <button
                                type="button"
                                onClick={() => setShowCustomerModal(true)}
                                className="h-10 w-full rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] px-3 flex items-center justify-between hover:border-[#C69A52] transition-colors focus:outline-none focus:border-[#C69A52]"
                            >
                                <span className={selectedCustomer ? "text-[#1E293B] dark:text-[#f0f0f0]" : "text-[#9CA3AF]"}>
                                    {selectedCustomer ? selectedCustomer.name : "All Customers"}
                                </span>
                                {selectedCustomer ? (
                                    <X
                                        className="h-3.5 w-3.5 text-[#9CA3AF] hover:text-[#A27B3A] shrink-0"
                                        onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); }}
                                    />
                                ) : (
                                    <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
                                )}
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setHasApplied(true)}
                                className="h-10 rounded-[6px] bg-[#1E293B] px-5 text-[12px] font-semibold text-white hover:bg-[#2d3e52] transition-colors whitespace-nowrap shadow-xs"
                            >
                                Apply filters
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="h-10 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-4 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors whitespace-nowrap"
                            >
                                Reset filters
                            </button>
                        </div>
                    </div>

                    {/* Helper text */}
                    <p className="text-[11px] text-[#9CA3AF] pt-0.5">
                        Choose date range, customer, or document type, then apply filters to load data.
                    </p>
                </div>

                {/* ── Content Area / Empty State Container (Clear 2px Dashed Border) ── */}
                {!hasApplied ? (
                    <div className="w-full h-40.25 rounded-[10px] border-2 border-dashed border-[#CBD5E1] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] flex flex-col items-center justify-center gap-2 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6EE] dark:bg-[#2a2a2a]">
                            <FileSearch className="h-5 w-5 text-[#C69A52]" />
                        </div>
                        <div className="text-center space-y-0.5">
                            <p className="text-[14px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">
                                No report data yet
                            </p>
                            <p className="text-[11px] text-[#9CA3AF]">
                                Choose a date range, document type, or party filter, then click{" "}
                                <span className="font-semibold text-[#A27B3A]">Apply filters</span>{" "}
                                to load the report.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Results State */
                    <div className="w-full h-40.25 rounded-[10px] border-2 border-dashed border-[#CBD5E1] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] flex items-center justify-center">
                        <p className="text-[12px] text-[#6B7280] dark:text-[#9ca3af]">
                            No records match the selected filters.
                        </p>
                    </div>
                )}
            </div>

            <SelectCustomerModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onSelect={(c) => { setSelectedCustomer(c); setShowCustomerModal(false); }}
            />
        </div>
    );
}
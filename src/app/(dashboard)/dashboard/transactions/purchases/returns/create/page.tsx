"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, RotateCcw, Save, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "react-toastify";

const inputCls =
    "h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[13px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none [color-scheme:light]";

const labelCls = "text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af]";
const cardCls = "rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5 shadow-xs";
const readonlyCls = "h-10 rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-[#F9FAFB] dark:bg-[#1e1e1e] px-3 text-[13px] text-[#4F5967] dark:text-[#9ca3af] flex items-center select-none";

const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function CreatePurchaseReturnContent() {
    const router = useRouter();
    const params = useSearchParams();

    const invoiceNo = params.get("invoiceNo") ?? "";
    const vendor = params.get("vendor") ?? "";
    const vendorNo = params.get("vendorNo") ?? "";
    const docDate = params.get("docDate") ?? "";
    const assessed = parseFloat(params.get("assessed") ?? "0");
    const discount = parseFloat(params.get("discount") ?? "0");

    const [returnDate, setReturnDate] = useState("");
    const [postingDate, setPostingDate] = useState("");
    const [reason, setReason] = useState("");
    const [showReset, setShowReset] = useState(false);

    const handleReset = () => {
        setReturnDate(""); setPostingDate(""); setReason("");
        setShowReset(false);
        toast.info("Form reset.");
    };

    const handleSave = () => {
        if (!returnDate || !postingDate) {
            toast.error("Please fill Return Date and Posting Date.");
            return;
        }
        toast.success("Purchase return saved successfully.");
        router.push("/dashboard/transactions/purchases/returns");
    };

    const net = assessed - discount;

    return (
        <div className="min-h-full space-y-4 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div className="flex items-center justify-between pb-1">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[20px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75 transition-opacity">
                    <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                    New Purchase Return
                </button>
                <div className="flex items-center gap-2.5">
                    <button type="button" onClick={() => setShowReset(true)}
                        className="flex h-9 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-4 text-[13px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <RotateCcw className="h-3.5 w-3.5 text-[#A27B3A]" /> Reset
                    </button>
                    <button type="button" onClick={handleSave}
                        className="flex h-9 items-center gap-1.5 rounded-[5px] bg-[#C69A52] px-5 text-[13px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                        <Save className="h-3.5 w-3.5" /> Save
                    </button>
                </div>
            </div>

            {/* Original Invoice (read-only) */}
            <div className={cardCls}>
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-4 w-4 text-[#A27B3A]" />
                    <p className="text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">Original Purchase Invoice</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: "Invoice No", value: invoiceNo },
                        { label: "Vendor", value: vendor },
                        { label: "Vendor No", value: vendorNo },
                        { label: "Doc Date", value: docDate },
                        { label: "Assessed", value: fmt(assessed) },
                        { label: "Discount", value: fmt(discount) },
                    ].map(({ label, value }) => (
                        <div key={label} className="space-y-1.5">
                            <Label className={labelCls}>{label}</Label>
                            <div className={readonlyCls}>{value || "—"}</div>
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex items-center justify-end gap-2 rounded-[7px] bg-[#FAF6EE] dark:bg-[#2a1e0a] border border-[#F3EAD8] dark:border-[#4a3a20] px-4 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Net Amount</span>
                    <span className="text-[14px] font-bold text-[#A27B3A]">{fmt(net)}</span>
                </div>
            </div>

            {/* Return Details */}
            <div className={cardCls}>
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#A27B3A] mb-4">Return Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Return Date <span className="text-[#C69A52]">*</span></Label>
                        <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Posting Date <span className="text-[#C69A52]">*</span></Label>
                        <Input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label className={labelCls}>Reason / Note</Label>
                        <Textarea
                            placeholder="Describe the reason for return..."
                            value={reason} onChange={(e) => setReason(e.target.value)}
                            className="min-h-24 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[13px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 py-2.5 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-none" />
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showReset}
                onClose={() => setShowReset(false)}
                onConfirm={handleReset}
                title="Reset form?"
                message="All entered return details will be cleared."
                confirmLabel="Reset"
                cancelLabel="Cancel"
            />
        </div>
    );
}

export default function CreatePurchaseReturnPage() {
    return (
        <Suspense>
            <CreatePurchaseReturnContent />
        </Suspense>
    );
}

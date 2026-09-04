"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, RotateCcw, Save, Send, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { toast } from "react-toastify";
import {
    purchasesService,
    type Purchase as ApiPurchase,
    type CreatePurchaseItemInput,
} from "@/lib/services";

const inputCls =
    "h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[13px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none [color-scheme:light]";

const labelCls = "text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af]";
const cardCls = "rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5 shadow-xs";
const readonlyCls = "h-10 rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-[#F9FAFB] dark:bg-[#1e1e1e] px-3 text-[13px] text-[#4F5967] dark:text-[#9ca3af] flex items-center select-none";

const fmt = (n: number) => (Number(n) || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const round2 = (n: number) => Math.round(n * 100) / 100;

interface ReturnLine {
    productId: number | null;
    productDescription: string;
    hsCode: string | null;
    uom: string;
    unitPrice: number;
    assessedPerUnit: number;
    retailPrice: number;
    discountPercent: number;
    taxPercent: number;
    originalQuantity: number;
    returnQuantity: number;
}

const toReturnLine = (it: NonNullable<ApiPurchase["items"]>[number]): ReturnLine => {
    const qty = Number(it.quantity) || 1;
    return {
        productId: it.productId,
        productDescription: it.productDescription,
        hsCode: it.hsCode,
        uom: it.uom,
        unitPrice: Number(it.unitPrice ?? 0),
        assessedPerUnit: Number(it.assessedPerUnit ?? it.unitPrice ?? 0),
        retailPrice: Number(it.retailPrice ?? 0),
        discountPercent: Number(it.discountPercent ?? 0),
        taxPercent: Number(it.taxPercent ?? 0),
        originalQuantity: qty,
        returnQuantity: qty,
    };
};

function CreatePurchaseReturnContent() {
    const router = useRouter();
    const params = useSearchParams();
    const originalUuid = params.get("originalUuid");

    const [isLoading, setIsLoading] = useState(true);
    const [original, setOriginal] = useState<ApiPurchase | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [returnDate, setReturnDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [postingDate, setPostingDate] = useState("");
    const [advanceTax, setAdvanceTax] = useState(0);
    const [reason, setReason] = useState("");
    const [lines, setLines] = useState<ReturnLine[]>([]);
    const [showReset, setShowReset] = useState(false);
    const [submitting, setSubmitting] = useState<null | "draft" | "post">(null);

    useEffect(() => {
        if (!originalUuid) {
            setLoadError("No original purchase invoice selected.");
            setIsLoading(false);
            return;
        }
        purchasesService
            .getOne(originalUuid)
            .then((res) => {
                const p = res.data;
                if (p.purchaseType !== "Purchase Invoice" || p.status !== "posted") {
                    setLoadError("Only posted Purchase Invoices can be returned.");
                    return;
                }
                setOriginal(p);
                setReason(`Return against invoice ${p.purchaseNo ?? p.uuid}`);
                setLines((p.items ?? []).map(toReturnLine));
            })
            .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load purchase invoice."))
            .finally(() => setIsLoading(false));
    }, [originalUuid]);

    const updateQuantity = (index: number, qty: number) => {
        setLines((prev) =>
            prev.map((l, i) => {
                if (i !== index) return l;
                const clamped = Math.max(0, Math.min(qty, l.originalQuantity));
                return { ...l, returnQuantity: clamped };
            }),
        );
    };

    const handleReset = () => {
        setLines((prev) => prev.map((l) => ({ ...l, returnQuantity: l.originalQuantity })));
        setShowReset(false);
        toast.info("Return quantities reset.");
    };

    const totals = useMemo(() => {
        let assessedValue = 0, discount = 0, salesTax = 0;
        for (const l of lines) {
            const lineAssessed = l.assessedPerUnit * l.returnQuantity;
            const lineDiscount = (lineAssessed * l.discountPercent) / 100;
            const lineExclST = lineAssessed - lineDiscount;
            const lineTax = (lineExclST * l.taxPercent) / 100;
            assessedValue += lineAssessed;
            discount += lineDiscount;
            salesTax += lineTax;
        }
        const amtExclST = assessedValue - discount;
        const amtInclST = amtExclST + salesTax;
        return {
            assessedValue: round2(assessedValue),
            discount: round2(discount),
            amtExclST: round2(amtExclST),
            salesTax: round2(salesTax),
            amtInclST: round2(amtInclST),
            grandTotal: round2(amtInclST + advanceTax),
        };
    }, [lines, advanceTax]);

    const handleSave = async (mode: "draft" | "post") => {
        if (!original) return;
        if (!returnDate) {
            toast.error("Please fill Return Date.");
            return;
        }
        const returned = lines.filter((l) => l.returnQuantity > 0);
        if (returned.length === 0) {
            toast.error("Enter a return quantity for at least one item.");
            return;
        }
        const payloadItems: CreatePurchaseItemInput[] = returned.map((l) => ({
            productId: l.productId,
            hsCode: l.hsCode,
            productDescription: l.productDescription,
            uom: l.uom,
            quantity: l.returnQuantity,
            unitPrice: l.unitPrice,
            assessedPerUnit: l.assessedPerUnit,
            retailPrice: l.retailPrice,
            discountPercent: l.discountPercent,
            taxPercent: l.taxPercent,
        }));
        setSubmitting(mode);
        try {
            const created = await purchasesService.create({
                vendorId: original.vendorId,
                purchaseType: "Purchase Return",
                originalPurchaseUuid: original.uuid,
                vendorInvoiceNo: original.vendorInvoiceNo,
                docDate: returnDate,
                postingDate: postingDate || null,
                advanceTax,
                notes: reason || null,
                items: payloadItems,
            });
            if (mode === "post") {
                await purchasesService.post(created.data.uuid);
                toast.success("Purchase return posted.");
            } else {
                toast.success("Purchase return saved as draft.");
            }
            router.refresh();
            router.push("/dashboard/transactions/purchases/returns");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save purchase return.");
        } finally {
            setSubmitting(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <LogoSpinner label="Loading purchase invoice..." />
            </div>
        );
    }

    if (loadError || !original) {
        return (
            <div className="min-h-full space-y-3 text-[#4f5967]" style={{ fontFamily: "'Inter', sans-serif" }}>
                <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-[#A27B3A] hover:opacity-75 transition-opacity cursor-pointer">
                    <ChevronLeft className="h-5 w-5" /> Back
                </button>
                <div className="rounded-[10px] border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
                    {loadError ?? "Purchase invoice not found."}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full space-y-4 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div className="flex items-center justify-between pb-1">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[20px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75 transition-opacity cursor-pointer">
                    <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                    New Purchase Return
                </button>
                <div className="flex items-center gap-2.5">
                    <button type="button" onClick={() => setShowReset(true)}
                        className="flex h-9 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-4 text-[13px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                        <RotateCcw className="h-3.5 w-3.5 text-[#A27B3A]" /> Reset quantities
                    </button>
                    <button type="button" disabled={submitting !== null} onClick={() => handleSave("draft")}
                        className="flex h-9 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-4 text-[13px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-50">
                        <Save className="h-3.5 w-3.5 text-[#A27B3A]" /> {submitting === "draft" ? "Saving..." : "Save Draft"}
                    </button>
                    <button type="button" disabled={submitting !== null} onClick={() => handleSave("post")}
                        className="flex h-9 items-center gap-1.5 rounded-[5px] bg-[#C69A52] px-5 text-[13px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs cursor-pointer disabled:opacity-50">
                        <Send className="h-3.5 w-3.5" /> {submitting === "post" ? "Posting..." : "Post"}
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
                        { label: "Invoice No", value: original.purchaseNo ?? "—" },
                        { label: "Vendor", value: original.vendorBusinessName },
                        { label: "Vendor No", value: original.vendor?.vendorNo ?? String(original.vendorId) },
                        { label: "Doc Date", value: original.docDate?.slice(0, 10) ?? "—" },
                        { label: "Assessed", value: fmt(Number(original.assessedValue)) },
                        { label: "Discount", value: fmt(Number(original.totalDiscount)) },
                    ].map(({ label, value }) => (
                        <div key={label} className="space-y-1.5">
                            <Label className={labelCls}>{label}</Label>
                            <div className={readonlyCls}>{value || "—"}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Return Details */}
            <div className={cardCls}>
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#A27B3A] mb-4">Return Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Return Date <span className="text-[#C69A52]">*</span></Label>
                        <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Posting Date</Label>
                        <Input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Advance Tax</Label>
                        <Input type="number" min={0} value={advanceTax} onChange={(e) => setAdvanceTax(Number(e.target.value) || 0)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                        <Label className={labelCls}>Reason / Note</Label>
                        <Textarea
                            placeholder="Describe the reason for return..."
                            value={reason} onChange={(e) => setReason(e.target.value)}
                            className="min-h-24 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[13px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 py-2.5 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-none" />
                    </div>
                </div>
            </div>

            {/* Line items */}
            <div className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-2.5 shadow-xs space-y-2">
                <p className="px-1 text-[12px] font-bold uppercase text-[#A27B3A]">Items being returned</p>
                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                    <table className="w-full min-w-200 text-[12px] border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                {["Description", "HS Code", "UOM", "Original Qty", "Return Qty", "Value Excl. ST", "Sales Tax", "Total"].map((h) => (
                                    <th key={h} className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                            {lines.map((l, i) => {
                                const lineAssessed = l.assessedPerUnit * l.returnQuantity;
                                const lineDiscount = (lineAssessed * l.discountPercent) / 100;
                                const lineExclST = round2(lineAssessed - lineDiscount);
                                const lineTax = round2((lineExclST * l.taxPercent) / 100);
                                return (
                                    <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]"}>
                                        <td className="px-2 py-1.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{l.productDescription}</td>
                                        <td className="px-2 py-1.5 font-mono text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{l.hsCode ?? "—"}</td>
                                        <td className="px-2 py-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{l.uom}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{l.originalQuantity}</td>
                                        <td className="px-2 py-1.5">
                                            <input
                                                type="number"
                                                min={0}
                                                max={l.originalQuantity}
                                                value={l.returnQuantity}
                                                onChange={(e) => updateQuantity(i, Number(e.target.value) || 0)}
                                                className="h-8 w-20 rounded-[6px] border border-[#E3D2BA] bg-white dark:bg-[#2a2a2a] px-2 text-[12px] text-right focus:outline-none focus:border-[#C69A52]"
                                            />
                                        </td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(lineExclST)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(lineTax)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono font-semibold text-[#A27B3A]">{fmt(lineExclST + lineTax)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Totals */}
            <div className={cardCls}>
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#A27B3A] mb-4">Totals</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: "Assessed Value", value: totals.assessedValue },
                        { label: "Discount", value: totals.discount },
                        { label: "Value Excl. ST", value: totals.amtExclST },
                        { label: "Sales Tax", value: totals.salesTax },
                        { label: "Advance Tax", value: advanceTax },
                        { label: "Grand Total", value: totals.grandTotal, highlight: true },
                    ].map(({ label, value, highlight }) => (
                        <div key={label} className="space-y-1.5">
                            <Label className={labelCls}>{label}</Label>
                            <div className={highlight ? "h-10 rounded-[6px] bg-[#FAF6EE] dark:bg-[#2a1e0a] border border-[#F3EAD8] dark:border-[#4a3a20] px-3 text-[13px] font-bold text-[#A27B3A] flex items-center" : readonlyCls}>{fmt(value)}</div>
                        </div>
                    ))}
                </div>
            </div>

            <ConfirmDialog
                isOpen={showReset}
                onClose={() => setShowReset(false)}
                onConfirm={handleReset}
                title="Reset return quantities?"
                message="All return quantities will be reset to the original invoice quantities."
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

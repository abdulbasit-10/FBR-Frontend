"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { ChevronLeft, RotateCcw, Save, Send, ShieldCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import {
    invoicesService,
    type Invoice as ApiInvoice,
    type CreateInvoiceInput,
    type CreateInvoiceItemInput,
} from "@/lib/services";
import { resolveFbrError } from "@/lib/constants/fbrErrorCodes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReturnLine {
    productId: number | null;
    productDescription: string;
    hsCode: string;
    uom: string;
    saleType: string;
    rate: string;
    originalQuantity: number;
    returnQuantity: number;
    unitPrice: number;
    fixedNotifiedValueOrRetailPrice: number;
    discountPercent: number;
    sroScheduleNo: string | null;
    sroItemSerialNo: string | null;
    // Per-unit values (original totals divided by original quantity) used to
    // scale monetary fields to whatever quantity is actually being returned.
    unitValueExclST: number;
    unitSalesTax: number;
    unitExtraTax: number;
    unitFurtherTax: number;
    unitFedPayable: number;
    unitDiscount: number;
    unitSalesTaxWithheld: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const toReturnLine = (it: NonNullable<ApiInvoice["items"]>[number]): ReturnLine => {
    const qty = Number(it.quantity) || 1;
    return {
        productId: it.productId,
        productDescription: it.productDescription,
        hsCode: it.hsCode,
        uom: it.uom,
        saleType: it.saleType,
        rate: it.rate,
        originalQuantity: qty,
        returnQuantity: qty,
        unitPrice: Number(it.unitPrice ?? 0),
        fixedNotifiedValueOrRetailPrice: Number(it.fixedNotifiedValueOrRetailPrice ?? 0),
        discountPercent: Number(it.discountPercent ?? 0),
        sroScheduleNo: it.sroScheduleNo,
        sroItemSerialNo: it.sroItemSerialNo,
        unitValueExclST: Number(it.valueSalesExcludingST) / qty,
        unitSalesTax: Number(it.salesTaxApplicable) / qty,
        unitExtraTax: Number(it.extraTax ?? 0) / qty,
        unitFurtherTax: Number(it.furtherTax ?? 0) / qty,
        unitFedPayable: Number(it.fedPayable ?? 0) / qty,
        unitDiscount: Number(it.discount ?? 0) / qty,
        unitSalesTaxWithheld: Number(it.salesTaxWithheldAtSource ?? 0) / qty,
    };
};

const fmt = (n: number) => (Number(n) || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const inputCls = "h-9 rounded-[6px] border border-[#E3D2BA] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] focus:border-[#C69A52] shadow-none";

function CreateReturnContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const originalUuid = searchParams.get("originalUuid");

    const [isLoading, setIsLoading] = useState(true);
    const [original, setOriginal] = useState<ApiInvoice | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [documentDate, setDocumentDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [postingDate, setPostingDate] = useState("");
    const [poNumber, setPoNumber] = useState("");
    const [advanceTax, setAdvanceTax] = useState(0);
    const [notes, setNotes] = useState("");
    const [lines, setLines] = useState<ReturnLine[]>([]);
    const [submitting, setSubmitting] = useState<null | "draft" | "validate" | "post">(null);

    useEffect(() => {
        if (!originalUuid) {
            setLoadError("No original invoice selected.");
            setIsLoading(false);
            return;
        }
        invoicesService
            .getOne(originalUuid)
            .then((res) => {
                const inv = res.data;
                if (inv.invoiceType !== "Sale Invoice" || !inv.fbrInvoiceNumber) {
                    setLoadError("Only posted Sale Invoices can be returned.");
                    return;
                }
                setOriginal(inv);
                setNotes(`Return against invoice ${inv.fbrInvoiceNumber}`);
                setPoNumber(inv.poNumber ?? "");
                setLines((inv.items ?? []).map(toReturnLine));
            })
            .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load invoice."))
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

    const totals = useMemo(() => {
        let assessedValue = 0, salesTax = 0, furtherTax = 0, discount = 0;
        for (const l of lines) {
            assessedValue += l.unitValueExclST * l.returnQuantity;
            salesTax += l.unitSalesTax * l.returnQuantity;
            furtherTax += l.unitFurtherTax * l.returnQuantity;
            discount += l.unitDiscount * l.returnQuantity;
        }
        const amtInclST = assessedValue + salesTax;
        return {
            assessedValue: round2(assessedValue),
            discount: round2(discount),
            salesTax: round2(salesTax),
            furtherTax: round2(furtherTax),
            amtInclST: round2(amtInclST),
            grandTotal: round2(amtInclST + furtherTax + advanceTax),
        };
    }, [lines, advanceTax]);

    const buildPayload = (): CreateInvoiceInput | null => {
        if (!original) return null;
        if (!documentDate) {
            toast.error("Document date is required.");
            return null;
        }
        const returned = lines.filter((l) => l.returnQuantity > 0);
        if (returned.length === 0) {
            toast.error("Enter a return quantity for at least one item.");
            return null;
        }

        const items: CreateInvoiceItemInput[] = returned.map((l) => ({
            productId: l.productId,
            hsCode: l.hsCode,
            productDescription: l.productDescription,
            rate: l.rate,
            uom: l.uom,
            quantity: l.returnQuantity,
            totalValues: round2((l.unitValueExclST + l.unitSalesTax) * l.returnQuantity),
            valueSalesExcludingST: round2(l.unitValueExclST * l.returnQuantity),
            fixedNotifiedValueOrRetailPrice: l.fixedNotifiedValueOrRetailPrice,
            salesTaxApplicable: round2(l.unitSalesTax * l.returnQuantity),
            salesTaxWithheldAtSource: round2(l.unitSalesTaxWithheld * l.returnQuantity),
            extraTax: round2(l.unitExtraTax * l.returnQuantity),
            furtherTax: round2(l.unitFurtherTax * l.returnQuantity),
            sroScheduleNo: l.sroScheduleNo,
            fedPayable: round2(l.unitFedPayable * l.returnQuantity),
            discount: round2(l.unitDiscount * l.returnQuantity),
            saleType: l.saleType,
            sroItemSerialNo: l.sroItemSerialNo,
            unitPrice: l.unitPrice,
            discountPercent: l.discountPercent,
        }));

        return {
            customerId: original.customerId,
            invoiceType: "Debit Note",
            invoiceDate: documentDate,
            invoiceRefNo: original.fbrInvoiceNumber,
            scenarioId: original.scenarioId,
            postingDate: postingDate || null,
            poNumber: poNumber || null,
            advanceTax,
            environment: original.environment,
            notes: notes || null,
            items,
        };
    };

    const handleSubmit = async (mode: "draft" | "validate" | "post") => {
        const payload = buildPayload();
        if (!payload) return;
        setSubmitting(mode);
        try {
            const created = await invoicesService.create(payload);
            const uuid = created.data.uuid;

            if (mode === "draft") {
                toast.success("Sales return saved as draft.");
                router.refresh();
                router.push("/dashboard/transactions/sales/returns");
                return;
            }

            const submitted = await invoicesService.submit(uuid, mode);
            if (submitted.data.status === "posted") {
                toast.success(`Posted to FBR: ${submitted.data.fbrInvoiceNumber}`);
            } else if (submitted.data.status === "validated") {
                toast.success("Sales return validated by FBR.");
            } else {
                const entry = resolveFbrError(submitted.data.fbrErrorCode);
                const msg = entry?.briefMsgDesc ?? submitted.data.fbrError ?? "FBR rejected";
                toast.error(`[${submitted.data.fbrErrorCode}] ${msg}`);
            }
            router.refresh();
            router.push("/dashboard/transactions/sales/returns");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to submit sales return.");
        } finally {
            setSubmitting(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <LogoSpinner label="Loading invoice..." />
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
                    {loadError ?? "Invoice not found."}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full space-y-2.5 text-[#4f5967]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()} className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">New Sales Return</h1>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setLines((prev) => prev.map((l) => ({ ...l, returnQuantity: l.originalQuantity })))}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                    >
                        <RotateCcw className="h-3 w-3 text-[#A27B3A]" /> Reset quantities
                    </button>
                    <button
                        type="button"
                        disabled={submitting !== null}
                        onClick={() => handleSubmit("draft")}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <Save className="h-3 w-3 text-[#A27B3A]" /> {submitting === "draft" ? "Saving..." : "Save Draft"}
                    </button>
                    <button
                        type="button"
                        disabled={submitting !== null}
                        onClick={() => handleSubmit("validate")}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <ShieldCheck className="h-3 w-3 text-[#A27B3A]" /> {submitting === "validate" ? "Validating..." : "Validate"}
                    </button>
                    <button
                        type="button"
                        disabled={submitting !== null}
                        onClick={() => handleSubmit("post")}
                        className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    >
                        <Send className="h-3 w-3" /> {submitting === "post" ? "Posting..." : "Post"}
                    </button>
                </div>
            </div>

            {/* ── Original invoice reference (read-only) ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3">
                <p className="mb-2 text-[12px] font-bold uppercase text-[#A27B3A]">Original Invoice</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                        <p className="text-[11px] text-[#9CA3AF]">FBR Invoice No</p>
                        <p className="text-[12px] font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{original.fbrInvoiceNumber}</p>
                    </div>
                    <div>
                        <p className="text-[11px] text-[#9CA3AF]">Customer</p>
                        <p className="text-[12px] font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{original.buyerBusinessName}</p>
                    </div>
                    <div>
                        <p className="text-[11px] text-[#9CA3AF]">Doc Date</p>
                        <p className="text-[12px] font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{original.invoiceDate?.slice(0, 10)}</p>
                    </div>
                    <div>
                        <p className="text-[11px] text-[#9CA3AF]">Assessed Value</p>
                        <p className="text-[12px] font-semibold text-[#1E293B] dark:text-[#f0f0f0]">
                            {fmt(Number(original.totalValueExcludingST) + Number(original.totalDiscount))}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Return details ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3 space-y-2.5">
                <p className="text-[12px] font-bold uppercase text-[#A27B3A]">Return Details</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="space-y-1">
                        <Label className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">Document Date</Label>
                        <input type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} className={`${inputCls} w-full scheme-light`} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">Posting Date</Label>
                        <input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} className={`${inputCls} w-full scheme-light`} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">PO Number</Label>
                        <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className={`${inputCls} w-full`} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">Advance Tax</Label>
                        <Input
                            type="number"
                            min={0}
                            value={advanceTax}
                            onChange={(e) => setAdvanceTax(Number(e.target.value) || 0)}
                            className={`${inputCls} w-full`}
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">Notes</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="rounded-[6px] border border-[#E3D2BA] text-[12px] focus-visible:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0" />
                </div>
            </div>

            {/* ── Line items ── */}
            <div className="rounded-[16px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-2.5 shadow-xs space-y-2">
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
                                const lineValueExclST = round2(l.unitValueExclST * l.returnQuantity);
                                const lineSalesTax = round2(l.unitSalesTax * l.returnQuantity);
                                return (
                                    <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]"}>
                                        <td className="px-2 py-1.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{l.productDescription}</td>
                                        <td className="px-2 py-1.5 font-mono text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{l.hsCode}</td>
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
                                        <td className="px-2 py-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0]">{fmt(lineValueExclST)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{fmt(lineSalesTax)}</td>
                                        <td className="px-2 py-1.5 text-right font-mono font-semibold text-[#A27B3A]">{fmt(lineValueExclST + lineSalesTax)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Totals preview ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3">
                <p className="mb-2 text-[12px] font-bold uppercase text-[#A27B3A]">Return Total</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-[12px]">
                    <div><p className="text-[#9CA3AF]">Assessed value</p><p className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{fmt(totals.assessedValue)}</p></div>
                    <div><p className="text-[#9CA3AF]">Discount</p><p className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{fmt(totals.discount)}</p></div>
                    <div><p className="text-[#9CA3AF]">Sales tax</p><p className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{fmt(totals.salesTax)}</p></div>
                    <div><p className="text-[#9CA3AF]">Further tax</p><p className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{fmt(totals.furtherTax)}</p></div>
                    <div><p className="text-[#9CA3AF]">Grand total</p><p className="font-bold text-[#A27B3A]">{fmt(totals.grandTotal)}</p></div>
                </div>
            </div>
        </div>
    );
}

export default function CreateSalesReturnPage() {
    return <Suspense fallback={null}><CreateReturnContent /></Suspense>;
}

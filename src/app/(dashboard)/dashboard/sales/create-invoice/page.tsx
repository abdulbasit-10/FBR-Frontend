"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import {
    ChevronLeft,
    Plus,
    RotateCcw,
    Save,
    Send,
    ShieldCheck,
    Trash2,
    Users,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
    SelectCustomerModal,
    type Customer,
} from "@/components/dashboard/select-customer-modal";

import {
    invoicesService,
    type CreateInvoiceInput,
    type CreateInvoiceItemInput,
    type InvoiceEnvironment,
    type InvoiceType,
} from "@/lib/services/invoices.service";
import { productsService, type Product } from "@/lib/services";
import { lookupService, type Uom } from "@/lib/services/lookup.service";
import {
    FBR_COMMON_RATES,
    FBR_SALE_TYPES,
    FBR_SANDBOX_SCENARIOS,
} from "@/lib/constants/fbr";
import { resolveFbrError } from "@/lib/constants/fbrErrorCodes";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface LineItem {
    id: string;
    productId: number | null;
    productDescription: string;
    hsCode: string;
    uom: string;
    saleType: string;
    rate: string; // exact FBR rate description, e.g. "18%"
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    valueSalesExcludingST: number;
    salesTaxApplicable: number;
    fixedNotifiedValueOrRetailPrice: number;
    salesTaxWithheldAtSource: number;
    extraTax: number;
    furtherTax: number;
    fedPayable: number;
    discount: number;
    sroScheduleNo: string;
    sroItemSerialNo: string;
}

const emptyLine = (): LineItem => ({
    id: Math.random().toString(36).slice(2, 10),
    productId: null,
    productDescription: "",
    hsCode: "",
    uom: "",
    saleType: "Goods at Standard Rate (default)",
    rate: "18%",
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    valueSalesExcludingST: 0,
    salesTaxApplicable: 0,
    fixedNotifiedValueOrRetailPrice: 0,
    salesTaxWithheldAtSource: 0,
    extraTax: 0,
    furtherTax: 0,
    fedPayable: 0,
    discount: 0,
    sroScheduleNo: "",
    sroItemSerialNo: "",
});

const parseRatePercent = (rate: string): number => {
    const m = rate.match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
};

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function CreateSalesInvoicePage() {
    const router = useRouter();

    // Invoice header
    const [invoiceType, setInvoiceType] = useState<InvoiceType>("Sale Invoice");
    const [environment, setEnvironment] = useState<InvoiceEnvironment>("sandbox");
    const [scenarioId, setScenarioId] = useState<string>("SN001");
    const [invoiceRefNo, setInvoiceRefNo] = useState("");

    const [documentDate, setDocumentDate] = useState("");
    const [postingDate, setPostingDate] = useState("");
    const [poDate, setPoDate] = useState("");
    const [poNumber, setPoNumber] = useState("");
    const [advanceTax, setAdvanceTax] = useState(0);
    const [notes, setNotes] = useState("");

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Line items + reference data
    const [items, setItems] = useState<LineItem[]>([emptyLine()]);
    const [products, setProducts] = useState<Product[]>([]);
    const [uoms, setUoms] = useState<Uom[]>([]);
    const [submitting, setSubmitting] = useState<null | "draft" | "validate" | "post">(null);

    useEffect(() => {
        productsService
            .list({ limit: 200, sortBy: "name", sortDir: "ASC" })
            .then((res) => setProducts(res.data.rows))
            .catch(() => { });
        lookupService
            .uoms()
            .then((res) => setUoms(res.data))
            .catch(() => { });
    }, []);

    // â”€â”€â”€ Line-item helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const addItem = () => setItems((xs) => [...xs, emptyLine()]);
    const removeItem = (id: string) =>
        setItems((xs) => (xs.length > 1 ? xs.filter((i) => i.id !== id) : xs));

    const recompute = (line: LineItem): LineItem => {
        const discountAmt = round2(line.unitPrice * line.quantity * (line.discountPercent / 100));
        const valueSalesExcludingST = round2(line.unitPrice * line.quantity - discountAmt);
        const ratePct = parseRatePercent(line.rate);
        const salesTaxApplicable = round2((valueSalesExcludingST * ratePct) / 100);
        return { ...line, discount: discountAmt, valueSalesExcludingST, salesTaxApplicable };
    };

    const updateItem = (id: string, patch: Partial<LineItem>, autoRecompute = true) => {
        setItems((xs) =>
            xs.map((i) => {
                if (i.id !== id) return i;
                const next = { ...i, ...patch };
                return autoRecompute ? recompute(next) : next;
            }),
        );
    };

    const onSelectProduct = (id: string, productId: number) => {
        const p = products.find((x) => x.id === productId);
        if (!p) return;
        updateItem(id, {
            productId: p.id,
            productDescription: p.description ?? p.name,
            hsCode: p.hsCode,
            uom: p.uom,
            saleType: p.saleType,
            rate: p.rate,
            unitPrice: p.unitPrice,
            fixedNotifiedValueOrRetailPrice: p.fixedNotifiedValueOrRetailPrice,
            sroScheduleNo: p.sroScheduleNo ?? "",
            sroItemSerialNo: p.sroItemSerialNo ?? "",
        });
    };

    // â”€â”€â”€ Totals (preview card) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const totals = useMemo(() => {
        const valueExcl = items.reduce((s, i) => s + i.valueSalesExcludingST, 0);
        const salesTax = items.reduce((s, i) => s + i.salesTaxApplicable, 0);
        const furtherTax = items.reduce((s, i) => s + i.furtherTax, 0);
        const extraTax = items.reduce((s, i) => s + i.extraTax, 0);
        const fed = items.reduce((s, i) => s + i.fedPayable, 0);
        const discount = items.reduce((s, i) => s + i.discount, 0);
        const totalIncl = valueExcl + salesTax + furtherTax + extraTax + fed;
        return {
            assessedValue: round2(items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)),
            discount: round2(discount),
            valueExcl: round2(valueExcl),
            salesTax: round2(salesTax),
            furtherTax: round2(furtherTax),
            totalIncl: round2(totalIncl),
            grandTotal: round2(totalIncl + advanceTax),
        };
    }, [items, advanceTax]);

    // â”€â”€â”€ Payload + submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const buildPayload = (): CreateInvoiceInput | null => {
        if (!documentDate) {
            toast.error("Document date is required");
            return null;
        }
        if (!selectedCustomer) {
            toast.error("Please select a customer");
            return null;
        }
        if (items.length === 0) {
            toast.error("Add at least one line item");
            return null;
        }
        if (invoiceType === "Debit Note" && !invoiceRefNo) {
            toast.error("Reference invoice number is required for Debit Note");
            return null;
        }
        if (environment === "sandbox" && !scenarioId) {
            toast.error("Scenario ID is required for Sandbox");
            return null;
        }

        for (const [idx, it] of items.entries()) {
            const n = idx + 1;
            if (!it.hsCode || !/^\d{4}\.\d{4}$/.test(it.hsCode)) {
                toast.error(`Line ${n}: HS code must be NNNN.NNNN`);
                return null;
            }
            if (!it.uom) {
                toast.error(`Line ${n}: UOM is required`);
                return null;
            }
            if (!it.rate) {
                toast.error(`Line ${n}: rate is required`);
                return null;
            }
            if (!it.saleType) {
                toast.error(`Line ${n}: sale type is required`);
                return null;
            }
            if (it.quantity <= 0) {
                toast.error(`Line ${n}: quantity must be > 0`);
                return null;
            }
        }

        const fbrItems: CreateInvoiceItemInput[] = items.map((i) => ({
            productId: i.productId,
            hsCode: i.hsCode,
            productDescription: i.productDescription || "Item",
            rate: i.rate,
            uom: i.uom,
            quantity: i.quantity,
            totalValues: round2(i.valueSalesExcludingST + i.salesTaxApplicable),
            valueSalesExcludingST: i.valueSalesExcludingST,
            fixedNotifiedValueOrRetailPrice: i.fixedNotifiedValueOrRetailPrice,
            salesTaxApplicable: i.salesTaxApplicable,
            salesTaxWithheldAtSource: i.salesTaxWithheldAtSource,
            extraTax: i.extraTax,
            furtherTax: i.furtherTax,
            sroScheduleNo: i.sroScheduleNo || null,
            fedPayable: i.fedPayable,
            discount: i.discount,
            saleType: i.saleType,
            sroItemSerialNo: i.sroItemSerialNo || null,
            unitPrice: i.unitPrice,
            discountPercent: i.discountPercent,
        }));

        return {
            customerId: selectedCustomer.id,
            invoiceType,
            invoiceDate: documentDate,
            postingDate: postingDate || null,
            poDate: poDate || null,
            poNumber: poNumber || null,
            advanceTax,
            environment,
            invoiceRefNo: invoiceType === "Debit Note" ? invoiceRefNo : null,
            scenarioId: environment === "sandbox" ? scenarioId : null,
            notes: notes || null,
            items: fbrItems,
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
                toast.success("Invoice saved as draft.");
                router.refresh(); // bust Next.js router cache so the list shows fresh data
                router.push("/dashboard/transactions/sales");
                return;
            }
            const submitted = await invoicesService.submit(uuid, mode);
            const fbrStatus = submitted.data.fbrStatus;
            const fbrError = submitted.data.fbrError;
            const fbrErrorCode = submitted.data.fbrErrorCode;
            if (submitted.data.status === "posted") {
                toast.success(`Posted to FBR: ${submitted.data.fbrInvoiceNumber}`);
            } else if (submitted.data.status === "validated") {
                toast.success("Invoice validated by FBR.");
            } else {
                const entry = resolveFbrError(fbrErrorCode);
                const msg =
                    entry?.briefMsgDesc ?? fbrError ?? `FBR ${fbrStatus ?? "rejected"} the invoice.`;
                toast.error(fbrErrorCode ? `[${fbrErrorCode}] ${msg}` : msg);
            }
            router.refresh(); // bust Next.js router cache so the list shows fresh data
            router.push(`/dashboard/transactions/sales`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to submit invoice.");
        } finally {
            setSubmitting(null);
        }
    };

    const resetForm = () => {
        setInvoiceType("Sale Invoice");
        setEnvironment("sandbox");
        setScenarioId("SN001");
        setInvoiceRefNo("");
        setDocumentDate("");
        setPostingDate("");
        setPoDate("");
        setPoNumber("");
        setAdvanceTax(0);
        setNotes("");
        setSelectedCustomer(null);
        setItems([emptyLine()]);
    };

    const inputStyleClass =
        "h-[38px] rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] !bg-white dark:!bg-[#2a2a2a] text-[13px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] pt-[12px] pb-[12px] pl-[15px] pr-[10px] focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none [color-scheme:light]";

    // Selects need balanced (not stacked) padding — the input's pt/pb combo overflows a <select>'s box.
    const selectStyleClass =
        "h-[38px] w-full rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[13px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none appearance-none [color-scheme:light]";

    const cellInput =
        "h-8 w-full rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-[#F9FAFB] dark:bg-[#2a2a2a] px-2 text-[12px] text-[#1E293B] dark:text-[#f0f0f0] focus:outline-none focus:ring-0 focus:border-[#C69A52] focus:bg-white focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] dark:focus:bg-[#333] shadow-none";

    return (
        <div
            className="min-h-full space-y-3 antialiased text-[#4f5967] dark:text-[#9ca3af]"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            {/* â”€â”€ Page Header â”€â”€ */}
            <div className="flex items-center justify-between pb-1">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-[20px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75 transition-opacity"
                >
                    <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                    New Sales Invoice
                </button>
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        disabled={submitting !== null}
                        className="flex h-8 items-center gap-1.5 rounded border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-4 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors disabled:opacity-60"
                    >
                        <RotateCcw className="h-3.5 w-3.5 text-[#A27B3A]" /> Reset
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit("draft")}
                        disabled={submitting !== null}
                        className="flex h-8 items-center gap-1.5 rounded border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-4 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors disabled:opacity-60"
                    >
                        <Save className="h-3.5 w-3.5 text-[#A27B3A]" />
                        {submitting === "draft" ? "Saving..." : "Save Draft"}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit("validate")}
                        disabled={submitting !== null}
                        className="flex h-8 items-center gap-1.5 rounded border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-4 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors disabled:opacity-60"
                    >
                        <ShieldCheck className="h-3.5 w-3.5 text-[#A27B3A]" />
                        {submitting === "validate" ? "Validating..." : "Validate"}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit("post")}
                        disabled={submitting !== null}
                        className="flex h-8 items-center gap-1.5 rounded bg-[#C69A52] px-5 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors  disabled:opacity-60"
                    >
                        <Send className="h-3.5 w-3.5" />
                        {submitting === "post" ? "Posting..." : "Post to FBR"}
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {/* ── SALES HEADER + GRAND TOTAL PREVIEW (one row, matched heights) ── */}
                <div className="flex flex-col md:flex-row items-stretch gap-4">
                    <div className="flex-1 rounded-lg border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] px-4 py-3">
                        <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">
                            Sales Header
                        </p>

                        <div className="flex flex-col gap-3">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="space-y-1">
                                    <Label className="text-[12px] font-medium text-[#4F5967]">
                                        Document Date <span className="text-[#A27B3A]">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={documentDate}
                                        onChange={(e) => setDocumentDate(e.target.value)}
                                        className={inputStyleClass}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[12px] font-medium text-[#4F5967]">Posting Date</Label>
                                    <Input
                                        type="date"
                                        value={postingDate}
                                        onChange={(e) => setPostingDate(e.target.value)}
                                        className={inputStyleClass}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[12px] font-medium text-[#4F5967]">PO Date</Label>
                                    <Input
                                        type="date"
                                        value={poDate}
                                        onChange={(e) => setPoDate(e.target.value)}
                                        className={inputStyleClass}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="text-[12px] font-medium text-[#4F5967]">PO Number</Label>
                                    <Input
                                        type="text"
                                        placeholder="Optional"
                                        value={poNumber}
                                        onChange={(e) => setPoNumber(e.target.value)}
                                        className={inputStyleClass}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[12px] font-medium text-[#4F5967]">Advance Tax</Label>
                                    <Input
                                        type="number"
                                        value={advanceTax === 0 ? "" : advanceTax}
                                        placeholder="0"
                                        onChange={(e) => setAdvanceTax(parseFloat(e.target.value) || 0)}
                                        className={inputStyleClass}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[12px] font-medium text-[#4F5967]">Note</Label>
                                <Textarea
                                    placeholder="Add note"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="h-14 min-h-14 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[13px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 py-2 resize-none focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-[260px] shrink-0 rounded-lg border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] px-3.5 py-2.5 flex flex-col gap-2.5">
                        <div className="flex flex-col items-center border-b border-[#F3F4F6] dark:border-[#3a3a3a] pb-2">
                            <Image
                                src="/brand/Digital.svg"
                                alt="Encova Solutions"
                                width={36}
                                height={36}
                                className="h-9 w-auto mb-1 object-contain"
                                priority
                            />
                            <h3 className="text-[13px] font-bold text-[#1E293B] dark:text-[#f0f0f0] leading-tight">
                                Encova Solutions
                            </h3>
                            <span className="text-[10px] text-[#9CA3AF] font-normal mt-0.5">
                                Sales invoice preview
                            </span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A] mb-0.5">
                                Sales Total
                            </span>

                            {[
                                ["Assessed value", totals.assessedValue.toFixed(2)],
                                ["Discount", totals.discount.toFixed(2)],
                                ["Amount excl. sales tax", totals.valueExcl.toFixed(2)],
                                ["Sales tax", totals.salesTax.toFixed(2)],
                                ["Further tax", totals.furtherTax.toFixed(2)],
                                ["Amount incl. sales tax", totals.totalIncl.toFixed(2)],
                                ["Advance tax", advanceTax.toFixed(2)],
                            ].map(([label, value]) => (
                                <div key={label} className="flex justify-between items-center text-[11px]">
                                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-normal">{label}</span>
                                    <span className="text-[#1E293B] dark:text-[#f0f0f0] font-bold">{value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="w-full h-9 rounded-[7px] bg-[#FAF6EE] dark:bg-[#2a1e0a] border border-[#F3EAD8] dark:border-[#4a3a20] px-3.5 py-2 flex items-center justify-between mt-auto">
                            <span className="text-[11px] font-bold uppercase text-[#A27B3A] tracking-wider">
                                Grand Total
                            </span>
                            <span className="text-[13px] font-bold text-[#A27B3A]">
                                {totals.grandTotal.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── FBR OPTIONS + CUSTOMER (one row, independent cards, matched heights) ── */}
                <div className="flex flex-col md:flex-row items-stretch gap-4">
                    <div className="flex-1 rounded-lg border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] px-4 py-3">
                        <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">
                            FBR Options
                        </p>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="text-[12px] font-medium text-[#4F5967]">
                                    Invoice Type <span className="text-[#A27B3A]">*</span>
                                </Label>
                                <select
                                    value={invoiceType}
                                    onChange={(e) => setInvoiceType(e.target.value as InvoiceType)}
                                    className={selectStyleClass + " pr-8"}
                                >
                                    <option value="Sale Invoice">Sale Invoice</option>
                                    <option value="Debit Note">Debit Note</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[12px] font-medium text-[#4F5967]">
                                    Environment <span className="text-[#A27B3A]">*</span>
                                </Label>
                                <select
                                    value={environment}
                                    onChange={(e) => setEnvironment(e.target.value as InvoiceEnvironment)}
                                    className={selectStyleClass + " pr-8"}
                                >
                                    <option value="sandbox">Sandbox</option>
                                    <option value="production">Production</option>
                                </select>
                            </div>

                            {environment === "sandbox" && (
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="text-[12px] font-medium text-[#4F5967]">
                                        Scenario ID <span className="text-[#A27B3A]">*</span>
                                    </Label>
                                    <select
                                        value={scenarioId}
                                        onChange={(e) => setScenarioId(e.target.value)}
                                        className={selectStyleClass + " pr-8 truncate"}
                                    >
                                        {FBR_SANDBOX_SCENARIOS.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.id} &mdash; {s.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {invoiceType === "Debit Note" && (
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="text-[12px] font-medium text-[#4F5967]">
                                        Original Invoice Ref No <span className="text-[#A27B3A]">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        placeholder="22 digits (NTN) or 28 digits (CNIC)"
                                        value={invoiceRefNo}
                                        onChange={(e) => setInvoiceRefNo(e.target.value.replace(/\D/g, ""))}
                                        maxLength={28}
                                        className={inputStyleClass}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-[300px] shrink-0 rounded-lg border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] px-4 py-3">
                        <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">
                            Customer
                        </p>

                        {selectedCustomer ? (
                            <div className="flex items-center justify-between rounded-[7px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-[#FAF6F0] dark:bg-[#2a2a2a] px-3 py-2 gap-2">
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-[#1E293B] dark:text-[#f0f0f0] truncate">
                                        {selectedCustomer.name}
                                    </p>
                                    <p className="text-[11px] text-[#6B7280] dark:text-[#9ca3af] truncate">
                                        {selectedCustomer.customerNo} &middot; {selectedCustomer.ntn} &middot;{" "}
                                        <span className="font-medium">{selectedCustomer.registration}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCustomerModal(true)}
                                    className="shrink-0 text-[12px] text-[#A27B3A] hover:underline font-medium"
                                >
                                    Change
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 rounded-[7px] border border-dashed border-[#E5E7EB] dark:border-[#3a3a3a] bg-[#FAFAF7] dark:bg-[#1f1f1f] px-3 py-4 text-center">
                                <Users className="h-6 w-6 text-[#D8C08A]" />
                                <p className="text-[11px] text-[#9CA3AF]">No customer selected yet</p>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerModal(true)}
                                    className="w-full h-[36px] rounded-[7px] border border-dashed border-[#C69B56] bg-[#C69A52]/[0.04] px-4 text-[13px] font-medium text-[#C69B56] hover:bg-[#C69A52]/[0.08] transition-colors flex items-center justify-center"
                                >
                                    Select customer
                                </button>
                            </div>
                        )}

                        <SelectCustomerModal
                            isOpen={showCustomerModal}
                            onClose={() => setShowCustomerModal(false)}
                            onSelect={(c) => {
                                setSelectedCustomer(c);
                                setShowCustomerModal(false);
                            }}
                        />
                    </div>
                </div>

                {/* ── LINE ITEMS ── */}
                <div className="rounded-lg border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] px-4 py-3 space-y-2.5">
                    <div className="flex items-center justify-between pb-1">
                        <p className="text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">
                            Line Items
                        </p>
                        <button
                            type="button"
                            onClick={addItem}
                            className="flex items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 py-1 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5 text-[#A27B3A]" /> Add line
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                        <table className="w-full text-[12px] min-w-[2100px] border-collapse">
                            <thead>
                                <tr className="bg-[#C69A52] text-white">
                                    <th className="w-16 py-1.5 px-2 text-center font-bold leading-none">#</th>
                                    <th className="w-[180px] py-1.5 px-2 text-left font-bold leading-none">Item / Description</th>
                                    <th className="w-[110px] py-1.5 px-2 text-left font-bold leading-none">HS Code</th>
                                    <th className="w-[140px] py-1.5 px-2 text-left font-bold leading-none">UOM</th>
                                    <th className="w-20 py-1.5 px-2 text-center font-bold leading-none">Qty</th>
                                    <th className="w-[100px] py-1.5 px-2 text-center font-bold leading-none">Unit Price</th>
                                    <th className="w-16 py-1.5 px-2 text-center font-bold leading-none">Disc %</th>
                                    <th className="w-[110px] py-1.5 px-2 text-right font-bold leading-none">Value Excl. ST</th>
                                    <th className="w-[95px] py-1.5 px-2 text-center font-bold leading-none">Rate</th>
                                    <th className="w-[170px] py-1.5 px-2 text-left font-bold leading-none">Sale Type</th>
                                    <th className="w-[100px] py-1.5 px-2 text-right font-bold leading-none">Sales Tax</th>
                                    <th className="w-[130px] py-1.5 px-2 text-right font-bold leading-none">Fixed / Retail Price</th>
                                    <th className="w-[110px] py-1.5 px-2 text-right font-bold leading-none">ST Withheld</th>
                                    <th className="w-[100px] py-1.5 px-2 text-right font-bold leading-none">Extra Tax</th>
                                    <th className="w-[100px] py-1.5 px-2 text-right font-bold leading-none">Further Tax</th>
                                    <th className="w-[100px] py-1.5 px-2 text-right font-bold leading-none">FED Payable</th>
                                    <th className="w-[120px] py-1.5 px-2 text-left font-bold leading-none">SRO Schedule No</th>
                                    <th className="w-[120px] py-1.5 px-2 text-left font-bold leading-none">SRO Item Serial No</th>
                                    <th className="w-10 py-1.5 px-2 text-center font-bold leading-none"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#2e2e2e] bg-white dark:bg-[#242424]">
                                {items.map((item, index) => (
                                    <React.Fragment key={item.id}>
                                        <tr className="hover:bg-[#FAF6F0]/40 dark:hover:bg-[#2a2a2a] transition-colors">
                                            <td className="py-1.5 px-2 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={addItem}
                                                        className="text-[#A27B3A] hover:text-[#b58b44]"
                                                        title="Add Line"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-red-400 hover:text-red-600"
                                                        title="Remove Line"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <span className="ml-0.5 text-[#9CA3AF] text-[11px] font-medium">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-1.5 px-2">
                                                <select
                                                    className={cellInput}
                                                    value={item.productId ?? ""}
                                                    onChange={(e) => {
                                                        const v = parseInt(e.target.value, 10);
                                                        if (Number.isFinite(v)) onSelectProduct(item.id, v);
                                                        else updateItem(item.id, { productId: null }, false);
                                                    }}
                                                >
                                                    <option value="">Select item...</option>
                                                    {products.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {item.productDescription && (
                                                    <div className="mt-1 truncate text-[10px] text-[#6B7280] dark:text-[#8a8a8a]" title={item.productDescription}>
                                                        {item.productDescription}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-1.5 px-2">
                                                <Input
                                                    type="text"
                                                    placeholder="0000.0000"
                                                    value={item.hsCode}
                                                    onChange={(e) =>
                                                        updateItem(item.id, { hsCode: e.target.value }, false)
                                                    }
                                                    className={cellInput}
                                                />
                                            </td>

                                            <td className="py-1.5 px-2">
                                                <select
                                                    className={cellInput}
                                                    value={item.uom}
                                                    onChange={(e) =>
                                                        updateItem(item.id, { uom: e.target.value }, false)
                                                    }
                                                >
                                                    <option value="">Select UOM...</option>
                                                    {uoms.map((u) => (
                                                        <option key={u.uomId} value={u.description}>
                                                            {u.description}
                                                        </option>
                                                    ))}
                                                    {item.uom &&
                                                        !uoms.some((u) => u.description === item.uom) && (
                                                            <option value={item.uom}>{item.uom}</option>
                                                        )}
                                                </select>
                                            </td>

                                            <td className="py-1.5 px-2 text-center">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step="0.0001"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        updateItem(item.id, {
                                                            quantity: parseFloat(e.target.value) || 0,
                                                        })
                                                    }
                                                    className={cellInput + " text-center"}
                                                />
                                            </td>

                                            <td className="py-1.5 px-2 text-center">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={item.unitPrice === 0 ? "" : item.unitPrice}
                                                    placeholder="0"
                                                    onChange={(e) =>
                                                        updateItem(item.id, {
                                                            unitPrice: parseFloat(e.target.value) || 0,
                                                        })
                                                    }
                                                    className={cellInput + " text-center"}
                                                />
                                            </td>

                                            <td className="py-1.5 px-2 text-center">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    step="0.01"
                                                    value={item.discountPercent === 0 ? "" : item.discountPercent}
                                                    placeholder="0"
                                                    onChange={(e) =>
                                                        updateItem(item.id, {
                                                            discountPercent: parseFloat(e.target.value) || 0,
                                                        })
                                                    }
                                                    className={cellInput + " text-center"}
                                                />
                                            </td>

                                            <td className="py-1.5 px-2 text-right">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.valueSalesExcludingST}
                                                    onChange={(e) =>
                                                        updateItem(
                                                            item.id,
                                                            {
                                                                valueSalesExcludingST:
                                                                    parseFloat(e.target.value) || 0,
                                                            },
                                                            false,
                                                        )
                                                    }
                                                    className={cellInput + " text-right"}
                                                />
                                            </td>

                                            <td className="py-1.5 px-2 text-center">
                                                <select
                                                    className={cellInput}
                                                    value={item.rate}
                                                    onChange={(e) =>
                                                        updateItem(item.id, { rate: e.target.value })
                                                    }
                                                >
                                                    {FBR_COMMON_RATES.map((r) => (
                                                        <option key={r} value={r}>
                                                            {r}
                                                        </option>
                                                    ))}
                                                    {!FBR_COMMON_RATES.includes(item.rate) && item.rate && (
                                                        <option value={item.rate}>{item.rate}</option>
                                                    )}
                                                </select>
                                            </td>

                                            <td className="py-1.5 px-2">
                                                <select
                                                    className={cellInput}
                                                    value={item.saleType}
                                                    onChange={(e) =>
                                                        updateItem(item.id, { saleType: e.target.value }, false)
                                                    }
                                                >
                                                    {FBR_SALE_TYPES.map((s) => (
                                                        <option key={s} value={s}>
                                                            {s}
                                                        </option>
                                                    ))}
                                                    {!FBR_SALE_TYPES.includes(item.saleType) && item.saleType && (
                                                        <option value={item.saleType}>{item.saleType}</option>
                                                    )}
                                                </select>
                                            </td>

                                            <td className="py-1.5 px-2 text-right">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.salesTaxApplicable}
                                                    onChange={(e) =>
                                                        updateItem(
                                                            item.id,
                                                            {
                                                                salesTaxApplicable: parseFloat(e.target.value) || 0,
                                                            },
                                                            false,
                                                        )
                                                    }
                                                    className={cellInput + " text-right"}
                                                />
                                            </td>

                                            {(
                                                [
                                                    ["fixedNotifiedValueOrRetailPrice", "right"],
                                                    ["salesTaxWithheldAtSource", "right"],
                                                    ["extraTax", "right"],
                                                    ["furtherTax", "right"],
                                                    ["fedPayable", "right"],
                                                ] as [keyof LineItem, string][]
                                            ).map(([key]) => (
                                                <td key={key} className="py-1.5 px-2 text-right">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={(item[key] as number) || ""}
                                                        placeholder="0"
                                                        onChange={(e) =>
                                                            updateItem(
                                                                item.id,
                                                                { [key]: parseFloat(e.target.value) || 0 } as Partial<LineItem>,
                                                                false,
                                                            )
                                                        }
                                                        className={cellInput + " text-right"}
                                                    />
                                                </td>
                                            ))}

                                            <td className="py-1.5 px-2">
                                                <Input
                                                    type="text"
                                                    value={item.sroScheduleNo}
                                                    placeholder="e.g. SRO123"
                                                    onChange={(e) =>
                                                        updateItem(item.id, { sroScheduleNo: e.target.value }, false)
                                                    }
                                                    className={cellInput}
                                                />
                                            </td>

                                            <td className="py-1.5 px-2">
                                                <Input
                                                    type="text"
                                                    value={item.sroItemSerialNo}
                                                    onChange={(e) =>
                                                        updateItem(item.id, { sroItemSerialNo: e.target.value }, false)
                                                    }
                                                    className={cellInput}
                                                />
                                            </td>

                                            <td className="py-1.5 px-2 text-center" />
                                        </tr>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={() => {
                    resetForm();
                    setShowResetConfirm(false);
                    toast.success("Invoice reset successfully.");
                }}
                title="Reset sales invoice?"
                message="Are you sure you want to reset the sales invoice? Header, customer, lines, and all entered values on this page will be cleared."
                confirmLabel="Reset"
                cancelLabel="Cancel"
            />
        </div>
    );
}
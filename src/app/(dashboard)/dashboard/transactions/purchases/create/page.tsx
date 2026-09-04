"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Plus, Trash2, RotateCcw, Save, Send } from "lucide-react";
import Image from "next/image";
import { SelectVendorModal, type Vendor } from "@/components/dashboard/select-vendor-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "react-toastify";
import { productsService, purchasesService, type Product, type CreatePurchaseItemInput, type PurchaseSource } from "@/lib/services";

interface PurchaseItem {
    id: string;
    productId: number | null;
    productName: string;
    hsCode: string;
    uom: string;
    qty: number;
    assessedPerUnit: number;
    unitPrice: number;
    retailPrice: number;
    discount: number;
    tax: number;
}

const emptyLine = (): PurchaseItem => ({
    id: Math.random().toString(36).slice(2),
    productId: null, productName: "", hsCode: "", uom: "", qty: 1,
    assessedPerUnit: 0, unitPrice: 0, retailPrice: 0, discount: 0, tax: 0,
});

const SOURCE_OPTIONS: PurchaseSource[] = ["Manual", "API", "Import"];

const inputCls =
    "h-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] !bg-white dark:!bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none [color-scheme:light]";
const selectCls =
    "h-9 w-full rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] cursor-pointer";

export default function CreatePurchaseInvoicePage() {
    const router = useRouter();
    const [documentDate, setDocumentDate] = useState("");
    const [postingDate, setPostingDate] = useState("");
    const [poDate, setPoDate] = useState("");
    const [poNumber, setPoNumber] = useState("");
    const [vendorInvoiceNo, setVendorInvoiceNo] = useState("");
    const [source, setSource] = useState<PurchaseSource>("Manual");
    const [advanceTax, setAdvanceTax] = useState(0);
    const [notes, setNotes] = useState("");
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [submitting, setSubmitting] = useState<null | "draft" | "post">(null);

    useEffect(() => {
        productsService.list({ limit: 200, sortBy: "name", sortDir: "ASC" })
            .then((res) => setProducts(res.data.rows))
            .catch(() => { });
    }, []);
    const [items, setItems] = useState<PurchaseItem[]>([emptyLine()]);

    const addItem = () => setItems((prev) => [...prev, emptyLine()]);

    const removeItem = (id: string) => setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
    const updateItem = (id: string, updates: Partial<PurchaseItem>) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));

    // Calculations — mirrors create-invoice
    const assessedValue = items.reduce((s, i) => s + i.qty * i.assessedPerUnit, 0);
    const totalDiscount = items.reduce((s, i) => s + (i.qty * i.assessedPerUnit * i.discount) / 100, 0);
    const amtExclTax = assessedValue - totalDiscount;
    const totalTax = items.reduce((s, i) => s + ((i.qty * i.assessedPerUnit * (100 - i.discount)) / 100 * i.tax) / 100, 0);
    const amtInclTax = amtExclTax + totalTax;
    const grandTotal = amtInclTax + advanceTax;

    const resetForm = () => {
        setDocumentDate(""); setPostingDate(""); setPoDate(""); setPoNumber("");
        setVendorInvoiceNo(""); setSource("Manual");
        setAdvanceTax(0); setNotes(""); setSelectedVendor(null);
        setItems([emptyLine()]);
        toast.info("Form has been reset.");
    };

    const handleSave = async (mode: "draft" | "post") => {
        if (!documentDate || !selectedVendor) {
            toast.error("Please fill all required fields.");
            return;
        }
        const validItems = items.filter((i) => i.productId !== null);
        if (validItems.length === 0) {
            toast.error("Select at least one item.");
            return;
        }
        const payloadItems: CreatePurchaseItemInput[] = validItems.map((i) => ({
            productId: i.productId,
            hsCode: i.hsCode || null,
            productDescription: i.productName,
            uom: i.uom || "Numbers, pieces, units",
            quantity: i.qty,
            unitPrice: i.unitPrice,
            assessedPerUnit: i.assessedPerUnit,
            retailPrice: i.retailPrice,
            discountPercent: i.discount,
            taxPercent: i.tax,
        }));
        setSubmitting(mode);
        try {
            const created = await purchasesService.create({
                vendorId: selectedVendor.id,
                vendorInvoiceNo: vendorInvoiceNo || null,
                docDate: documentDate,
                postingDate: postingDate || null,
                poDate: poDate || null,
                poNumber: poNumber || null,
                advanceTax,
                source,
                notes: notes || null,
                items: payloadItems,
            });
            if (mode === "post") {
                await purchasesService.post(created.data.uuid);
                toast.success("Purchase invoice posted.");
            } else {
                toast.success("Purchase invoice saved as draft.");
            }
            router.refresh();
            router.push("/dashboard/transactions/purchases");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save purchase invoice.");
        } finally {
            setSubmitting(null);
        }
    };


    return (
        <div className="min-h-full space-y-2.5 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-0.5">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75 transition-opacity cursor-pointer">
                    <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                    New Purchase Invoice
                </button>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setShowResetConfirm(true)} className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                        <RotateCcw className="h-3 w-3 text-[#A27B3A]" /> Reset
                    </button>
                    <button type="button" disabled={submitting !== null} onClick={() => handleSave("draft")} className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-50">
                        <Save className="h-3 w-3 text-[#A27B3A]" /> {submitting === "draft" ? "Saving..." : "Save Draft"}
                    </button>
                    <button type="button" disabled={submitting !== null} onClick={() => handleSave("post")} className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs cursor-pointer disabled:opacity-50">
                        <Send className="h-3 w-3" /> {submitting === "post" ? "Posting..." : "Post"}
                    </button>
                </div>
            </div>

            {/* ── Purchase Header + Total row ── */}
            <div className="flex flex-col md:flex-row items-stretch gap-2.5">
                <div className="flex-1 rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3 shadow-xs">
                    <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">Purchase Header</p>

                    <div className="flex flex-col gap-2.5">
                        <div className="grid gap-2.5 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-[12px] font-medium text-[#4F5967]">Document Date <span className="text-[#A27B3A]">*</span></Label>
                                <Input type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[12px] font-medium text-[#4F5967]">Posting Date</Label>
                                <Input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-[12px] font-medium text-[#4F5967]">PO Date</Label>
                                <Input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[12px] font-medium text-[#4F5967]">PO Number</Label>
                                <Input type="text" placeholder="Optional" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[12px] font-medium text-[#4F5967]">Advance tax ({advanceTax.toFixed(2)}%)</Label>
                            <Input type="number" value={advanceTax === 0 ? "" : advanceTax} placeholder="0" onChange={(e) => setAdvanceTax(parseFloat(e.target.value) || 0)} className={inputCls} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[12px] font-medium text-[#4F5967]">Note</Label>
                            <Textarea placeholder="Add note" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                                className="rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] resize-none focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none" />
                        </div>
                    </div>
                </div>

                {/* Purchase Total preview card */}
                <div className="w-full md:w-66 rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] px-3 py-2.5 flex flex-col justify-between gap-2.5 shadow-xs">
                    <div className="flex flex-col items-center border-b border-[#F3F4F6] dark:border-[#3a3a3a] pb-2">
                        <Image src="/brand/Digital.svg" alt="Encova Solutions" width={40} height={40} className="h-10 w-auto mb-1 object-contain" priority />
                        <h3 className="text-[13px] font-bold text-[#1E293B] dark:text-[#f0f0f0] leading-tight">Encova Solutions</h3>
                        <span className="text-[11px] text-[#9CA3AF] font-normal mt-0.5">Purchase invoice preview</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A] mb-0.5">Purchase Total</span>
                        {[
                            ["Assessed value", assessedValue.toFixed(2)],
                            ["Amount excl. discount", assessedValue.toFixed(2)],
                            ["Discount", totalDiscount.toFixed(2)],
                            ["Amount excl. sales tax", amtExclTax.toFixed(2)],
                            ["Sales tax", totalTax.toFixed(2)],
                            ["Amount incl. sales tax", amtInclTax.toFixed(2)],
                            ["Further tax", "0.00"],
                            ["Amount incl. further tax", amtInclTax.toFixed(2)],
                            ["Advance tax", advanceTax.toFixed(2)],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between items-center text-[11px]">
                                <span className="text-[#6B7280] dark:text-[#9ca3af]">{label}</span>
                                <span className="text-[#1E293B] dark:text-[#f0f0f0] font-bold">{value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="w-full rounded-[7px] bg-[#FAF6EE] dark:bg-[#2a1e0a] border border-[#F3EAD8] dark:border-[#4a3a20] px-3 py-2 flex items-center justify-between mt-auto">
                        <span className="text-[11px] font-bold uppercase text-[#A27B3A] tracking-wider">Grand Total</span>
                        <span className="text-[13px] font-bold text-[#A27B3A]">{grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* ── Purchase Options + Vendor row ── */}
            <div className="flex flex-col md:flex-row items-stretch gap-2.5">
                <div className="flex-1 rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3 shadow-xs">
                    <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">Purchase Options</p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                        <div className="space-y-1">
                            <Label className="text-[12px] font-medium text-[#4F5967]">Vendor Invoice No</Label>
                            <Input type="text" placeholder="Optional" value={vendorInvoiceNo} onChange={(e) => setVendorInvoiceNo(e.target.value)} className={inputCls} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[12px] font-medium text-[#4F5967]">Source</Label>
                            <select value={source} onChange={(e) => setSource(e.target.value as PurchaseSource)} className={selectCls}>
                                {SOURCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-100 rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3 flex flex-col gap-2 shadow-xs">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">Vendor <span className="text-[#A27B3A]">*</span></p>
                    {selectedVendor ? (
                        <div className="flex items-center justify-between rounded-[6px] border border-[#E5E7EB] bg-[#FAF6F0] px-3 py-1.5">
                            <div>
                                <p className="text-[12px] font-semibold text-[#1E293B]">{selectedVendor.name}</p>
                                <p className="text-[11px] text-[#6B7280]">{selectedVendor.vendorNo} · NTN: {selectedVendor.ntn} · {selectedVendor.province}</p>
                            </div>
                            <button onClick={() => setShowVendorModal(true)} className="text-[12px] text-[#A27B3A] hover:underline font-medium cursor-pointer">Change</button>
                        </div>
                    ) : (
                        <div className="flex justify-center w-full">
                            <button type="button" onClick={() => setShowVendorModal(true)}
                                className="w-full h-9 rounded-[6px] border border-dashed border-[#C69B56] bg-[#C69A52]/4 px-6 text-[12px] font-medium text-[#C69B56] hover:bg-[#C69A52]/8 transition-colors flex items-center justify-center cursor-pointer">
                                Select vendor
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Line Items section ── */}
            <div className="rounded-[16px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-2.5 shadow-xs space-y-2">
                <div className="flex items-center justify-between px-1">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">Line Items</p>
                    <button type="button" onClick={addItem} className="flex items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 py-1 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                        <Plus className="h-3.5 w-3.5 text-[#A27B3A]" /> Add line
                    </button>
                </div>

                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                    <table className="w-full text-[12px] min-w-300 border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                <th className="w-10 py-0.5 px-1 text-center font-bold whitespace-nowrap">#</th>
                                <th className="w-40 py-0.5 px-1 text-left font-bold whitespace-nowrap">Item / Description</th>
                                <th className="w-20 py-0.5 px-1 text-left font-bold whitespace-nowrap">HS Code</th>
                                <th className="w-20 py-0.5 px-1 text-left font-bold whitespace-nowrap">UOM</th>
                                <th className="w-14 py-0.5 px-1 text-center font-bold whitespace-nowrap">Qty</th>
                                <th className="w-20 py-0.5 px-1 text-center font-bold whitespace-nowrap">Unit Price</th>
                                <th className="w-16 py-0.5 px-1 text-center font-bold whitespace-nowrap">Disc %</th>
                                <th className="w-20 py-0.5 px-1 text-center font-bold whitespace-nowrap">Assessed/U</th>
                                <th className="w-24 py-0.5 px-1 text-center font-bold whitespace-nowrap">Assessed value</th>
                                <th className="w-20 py-0.5 px-1 text-center font-bold whitespace-nowrap">Retail Price</th>
                                <th className="w-16 py-0.5 px-1 text-center font-bold whitespace-nowrap">Tax %</th>
                                <th className="w-24 py-0.5 px-1 text-right font-bold whitespace-nowrap">Value Excl. ST</th>
                                <th className="w-20 py-0.5 px-1 text-right font-bold whitespace-nowrap">Sales Tax</th>
                                <th className="w-24 py-1 px-1.5 text-right font-bold pr-2.5">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#2e2e2e] bg-white dark:bg-[#242424]">
                            {items.map((item, index) => {
                                const assessed = item.qty * item.assessedPerUnit;
                                const valueExclST = assessed * (1 - item.discount / 100);
                                const salesTax = valueExclST * (item.tax / 100);
                                const total = valueExclST + salesTax;
                                return (
                                    <tr key={item.id} className="hover:bg-[#FAF6F0]/40 dark:hover:bg-[#2a2a2a] transition-colors">
                                        <td className="py-1 px-1.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button type="button" onClick={addItem} className="text-[#A27B3A] hover:text-[#b58b44] transition-colors cursor-pointer" title="Add Line">
                                                    <Plus className="h-3.5 w-3.5" />
                                                </button>
                                                <button type="button" onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors cursor-pointer" title="Remove Line">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                                <span className="ml-0.5 text-[#9CA3AF] text-[11px] font-medium">{index + 1}</span>
                                            </div>
                                        </td>
                                        <td className="py-1 px-1.5">
                                            <select
                                                className="w-38 h-7 rounded-[6px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-[#F9FAFB] dark:bg-[#2a2a2a] px-2 text-[12px] text-[#1E293B] dark:text-[#f0f0f0] focus:outline-none focus:border-[#C69A52] focus:bg-white dark:focus:bg-[#333] transition-colors cursor-pointer"
                                                value={item.productId ?? ""}
                                                onChange={(e) => {
                                                    const p = products.find((p) => p.id === parseInt(e.target.value));
                                                    if (p) updateItem(item.id, { productId: p.id, productName: p.name, hsCode: p.hsCode ?? "", uom: p.uom, unitPrice: p.unitPrice });
                                                    else updateItem(item.id, { productId: null, productName: "", hsCode: "", uom: "" });
                                                }}
                                            >
                                                <option value="">Select Item</option>
                                                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="py-1 px-1.5 font-mono text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{item.hsCode || "—"}</td>
                                        <td className="py-1 px-1.5 text-[#4F5967] dark:text-[#9ca3af] whitespace-nowrap">{item.uom || "—"}</td>
                                        <td className="py-1 px-1.5 text-center">
                                            <input type="number" min={1} value={item.qty} onChange={(e) => updateItem(item.id, { qty: +e.target.value || 1 })}
                                                className="w-12 h-7 rounded-[6px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-[#F9FAFB] dark:bg-[#2a2a2a] px-1.5 text-[12px] text-center text-[#1E293B] dark:text-[#f0f0f0] focus:outline-none focus:border-[#C69A52] focus:bg-white dark:focus:bg-[#333]" />
                                        </td>
                                        <td className="py-1 px-1.5 text-center">
                                            <input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(item.id, { unitPrice: +e.target.value || 0 })}
                                                className="w-18 h-7 rounded-[6px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-[#F9FAFB] dark:bg-[#2a2a2a] px-1.5 text-[12px] text-center text-[#1E293B] dark:text-[#f0f0f0] focus:outline-none focus:border-[#C69A52] focus:bg-white dark:focus:bg-[#333]" />
                                        </td>
                                        <td className="py-1 px-1.5 text-center">
                                            <input type="number" min={0} max={100} value={item.discount} onChange={(e) => updateItem(item.id, { discount: +e.target.value || 0 })}
                                                className="w-14 h-7 rounded-[6px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-[#F9FAFB] dark:bg-[#2a2a2a] px-1.5 text-[12px] text-center text-[#1E293B] dark:text-[#f0f0f0] focus:outline-none focus:border-[#C69A52] focus:bg-white dark:focus:bg-[#333]" />
                                        </td>
                                        <td className="py-1 px-1.5 text-center">
                                            <input type="number" min={0} value={item.assessedPerUnit} onChange={(e) => updateItem(item.id, { assessedPerUnit: +e.target.value || 0 })}
                                                className="w-18 h-7 rounded-[6px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-[#F9FAFB] dark:bg-[#2a2a2a] px-1.5 text-[12px] text-center text-[#1E293B] dark:text-[#f0f0f0] focus:outline-none focus:border-[#C69A52] focus:bg-white dark:focus:bg-[#333]" />
                                        </td>
                                        <td className="py-1 px-1.5 text-center font-mono text-[#1E293B] dark:text-[#f0f0f0] font-medium">{assessed.toFixed(2)}</td>
                                        <td className="py-1 px-1.5 text-center">
                                            <input type="number" min={0} value={item.retailPrice} onChange={(e) => updateItem(item.id, { retailPrice: +e.target.value || 0 })}
                                                className="w-18 h-7 rounded-[6px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-[#F9FAFB] dark:bg-[#2a2a2a] px-1.5 text-[12px] text-center text-[#1E293B] dark:text-[#f0f0f0] focus:outline-none focus:border-[#C69A52] focus:bg-white dark:focus:bg-[#333]" />
                                        </td>
                                        <td className="py-1 px-1.5 text-center">
                                            <input type="number" min={0} max={100} value={item.tax} onChange={(e) => updateItem(item.id, { tax: +e.target.value || 0 })}
                                                className="w-14 h-7 rounded-[6px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-[#F9FAFB] dark:bg-[#2a2a2a] px-1.5 text-[12px] text-center text-[#1E293B] dark:text-[#f0f0f0] focus:outline-none focus:border-[#C69A52] focus:bg-white dark:focus:bg-[#333]" />
                                        </td>
                                        <td className="py-1 px-1.5 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0] font-medium">{valueExclST.toFixed(2)}</td>
                                        <td className="py-1 px-1.5 text-right font-mono text-[#4F5967] dark:text-[#9ca3af]">{salesTax.toFixed(2)}</td>
                                        <td className="py-1 px-2.5 text-right font-mono font-semibold text-[#A27B3A]">{total.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <SelectVendorModal isOpen={showVendorModal} onClose={() => setShowVendorModal(false)} onSelect={(v) => { setSelectedVendor(v); setShowVendorModal(false); }} />

            <ConfirmDialog
                isOpen={showResetConfirm}
                onConfirm={() => { resetForm(); setShowResetConfirm(false); }}
                onClose={() => setShowResetConfirm(false)}
                title="Reset purchase invoice?"
                message="Are you sure you want to reset the purchase invoice? Header, vendor, lines, and all entered values on this page will be cleared."
            />
        </div>
    );
}



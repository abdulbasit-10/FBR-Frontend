"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Plus, Trash2, RotateCcw, Save } from "lucide-react";
import Image from "next/image";
import { SelectVendorModal, type Vendor } from "@/components/dashboard/select-vendor-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "react-toastify";

interface PurchaseItem {
    id: string;
    productId: number | null;
    productName: string;
    qty: number;
    assessedPerUnit: number;
    unitPrice: number;
    retailPrice: number;
    discount: number;
    tax: number;
}

const mockProducts = [
    { id: 1, name: "Product A", price: 100 },
    { id: 2, name: "Product B", price: 250 },
    { id: 3, name: "Service X", price: 75 },
];

const inputCls =
    "h-[48px] rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] !bg-white dark:!bg-[#2a2a2a] text-[13px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] pt-[12px] pb-[12px] pl-[15px] pr-[10px] focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none [color-scheme:light]";

export default function CreatePurchaseInvoicePage() {
    const router = useRouter();
    const [documentDate, setDocumentDate] = useState("");
    const [postingDate, setPostingDate] = useState("");
    const [poDate, setPoDate] = useState("");
    const [poNumber, setPoNumber] = useState("");
    const [advanceTax, setAdvanceTax] = useState(0);
    const [notes, setNotes] = useState("");
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [items, setItems] = useState<PurchaseItem[]>([{
        id: "1", productId: null, productName: "", qty: 1,
        assessedPerUnit: 0, unitPrice: 0, retailPrice: 0, discount: 0, tax: 0,
    }]);

    const addItem = () => setItems((prev) => [...prev, {
        id: Math.random().toString(36).slice(2), productId: null, productName: "", qty: 1,
        assessedPerUnit: 0, unitPrice: 0, retailPrice: 0, discount: 0, tax: 0,
    }]);

    const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
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
        setAdvanceTax(0); setNotes(""); setSelectedVendor(null);
        setItems([{ id: "1", productId: null, productName: "", qty: 1, assessedPerUnit: 0, unitPrice: 0, retailPrice: 0, discount: 0, tax: 0 }]);
        toast.info("Form has been reset.");
    };

    const handleSave = () => {
        if (!documentDate || !postingDate || !selectedVendor) {
            toast.error("Please fill all required fields.");
            return;
        }
        toast.success("Purchase invoice saved successfully!");
    };


    return (
        <div className="min-h-full space-y-4 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-1">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[20px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75 transition-opacity">
                    <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                    New Purchase Invoice
                </button>
                <div className="flex items-center gap-2.5">
                    <button type="button" onClick={() => setShowResetConfirm(true)} className="flex h-9 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-4 text-[13px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <RotateCcw className="h-3.5 w-3.5 text-[#A27B3A]" /> Reset
                    </button>
                    <button type="button" onClick={handleSave} className="flex h-9 items-center gap-1.5 rounded-[5px] bg-[#C69A52] px-5 text-[13px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                        <Save className="h-3.5 w-3.5" /> Save
                    </button>
                </div>
            </div>

            {/* ── Purchase Header card ── */}
            <div className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4.5 shadow-xs">
                <p className="mb-4 text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">Purchase Header</p>

                <div className="grid gap-6 lg:grid-cols-[1fr_265px] items-stretch">
                    {/* Left inputs */}
                    <div className="flex flex-col gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="text-[12px] font-medium text-[#4F5967]">Document Date <span className="text-[#A27B3A]">*</span></Label>
                                <Input type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[12px] font-medium text-[#4F5967]">Posting Date <span className="text-[#A27B3A]">*</span></Label>
                                <Input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="text-[12px] font-medium text-[#4F5967]">PO Date <span className="text-[#A27B3A]">*</span></Label>
                                <Input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[12px] font-medium text-[#4F5967]">PO Number <span className="text-[#A27B3A]">*</span></Label>
                                <Input type="text" placeholder="Optional" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[12px] font-medium text-[#4F5967]">Advance tax ({advanceTax.toFixed(2)}%) <span className="text-[#A27B3A]">*</span></Label>
                            <Input type="number" value={advanceTax === 0 ? "" : advanceTax} placeholder="0" onChange={(e) => setAdvanceTax(parseFloat(e.target.value) || 0)} className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[12px] font-medium text-[#4F5967]">Note <span className="text-[#A27B3A]">*</span></Label>
                            <Textarea placeholder="Add note" value={notes} onChange={(e) => setNotes(e.target.value)}
                                className="h-28.75 min-h-28.75 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[13px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] pt-3.25 pb-3 pl-3.75 pr-2.5 resize-none focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none" />
                        </div>
                    </div>

                    {/* Right preview card — reused from create-invoice */}
                    <div className="w-66.25 rounded-[14px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] px-4.75 py-3 flex flex-col justify-between gap-4">
                        <div className="flex flex-col items-center border-b border-[#F3F4F6] dark:border-[#3a3a3a] pb-2.5">
                            <Image src="/brand/Digital.svg" alt="Encova Solution" width={48} height={48} className="h-12 w-auto mb-1.5 object-contain" priority />
                            <h3 className="text-[14px] font-bold text-[#1E293B] dark:text-[#f0f0f0] leading-tight">Encova Solution</h3>
                            <span className="text-[11px] text-[#9CA3AF] font-normal mt-0.5">Sales invoice preview</span>
                        </div>
                        <div className="flex flex-col gap-1.75">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A] mb-1">Sales Total</span>
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
                        <div className="w-full h-9.75 rounded-[7px] bg-[#FAF6EE] dark:bg-[#2a1e0a] border border-[#F3EAD8] dark:border-[#4a3a20] px-3.5 py-2 flex items-center justify-between mt-auto">
                            <span className="text-[11px] font-bold uppercase text-[#A27B3A] tracking-wider">Grand Total</span>
                            <span className="text-[13px] font-bold text-[#A27B3A]">{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Vendor section ── */}
            <div className="h-[118.5px] rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5.25 flex flex-col justify-between shadow-xs">
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">Vendor <span className="text-[#A27B3A]">*</span></p>
                {selectedVendor ? (
                    <div className="flex items-center justify-between rounded-[7px] border border-[#E5E7EB] bg-[#FAF6F0] px-4 py-2">
                        <div>
                            <p className="text-[13px] font-semibold text-[#1E293B]">{selectedVendor.name}</p>
                            <p className="text-[11px] text-[#6B7280]">{selectedVendor.vendorNo} · NTN: {selectedVendor.ntn} · {selectedVendor.province}</p>
                        </div>
                        <button onClick={() => setShowVendorModal(true)} className="text-[12px] text-[#A27B3A] hover:underline font-medium">Change</button>
                    </div>
                ) : (
                    <div className="flex justify-center w-full">
                        <button type="button" onClick={() => setShowVendorModal(true)}
                            className="max-w-98 w-full h-[40.5px] rounded-[7px] border border-dashed border-[#C69B56] bg-[#C69A52]/4 px-7 text-[13px] font-medium text-[#C69B56] hover:bg-[#C69A52]/8 transition-colors flex items-center justify-center">
                            Select vendor
                        </button>
                    </div>
                )}
            </div>

            {/* ── Customer / Items section ── */}
            <div className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5 py-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">Customer</p>
                    <button type="button" onClick={addItem} className="flex items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 py-1 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <Plus className="h-3.5 w-3.5 text-[#A27B3A]" /> Add line
                    </button>
                </div>

                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                    <table className="w-full text-[12px] min-w-212.5 border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                <th className="w-12 py-3 px-3 text-center font-bold">#</th>
                                <th className="w-20 py-3 px-3 text-left font-bold">Item no</th>
                                <th className="w-42.5 py-3 px-3 text-left font-bold">Item name</th>
                                <th className="w-16 py-3 px-3 text-center font-bold">Qty</th>
                                <th className="w-24 py-3 px-3 text-center font-bold">Assessed/U</th>
                                <th className="w-28 py-3 px-3 text-center font-bold">Assessed value</th>
                                <th className="w-24 py-3 px-3 text-center font-bold">Unit price</th>
                                <th className="w-24 py-3 px-3 text-center font-bold">Retail price</th>
                                <th className="w-28 py-3 px-3 text-right font-bold pr-4">Amt excl. disc</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#2e2e2e] bg-white dark:bg-[#242424]">
                            {items.map((item, index) => {
                                const assessed = item.qty * item.assessedPerUnit;
                                const amtExclDisc = assessed * (1 - item.discount / 100);
                                return (
                                    <tr key={item.id} className="hover:bg-[#FAF6F0]/40 dark:hover:bg-[#2a2a2a] transition-colors">
                                        <td className="py-2 px-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button type="button" onClick={addItem} className="text-[#A27B3A] hover:text-[#b58b44] transition-colors" title="Add Line">
                                                    <Plus className="h-3.5 w-3.5" />
                                                </button>
                                                <button type="button" onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Remove Line">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                                <span className="ml-0.5 text-[#9CA3AF] text-[11px] font-medium">{index + 1}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 text-[#9CA3AF]">—</td>
                                        <td className="py-2 px-3">
                                            <select
                                                className="w-40 h-[39.5px] rounded-[6px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-[#F9FAFB] dark:bg-[#2a2a2a] px-2.5 text-[12px] text-[#1E293B] dark:text-[#f0f0f0] focus:outline-none focus:border-[#C69A52] focus:bg-white dark:focus:bg-[#333] transition-colors"
                                                value={item.productId ?? ""}
                                                onChange={(e) => {
                                                    const p = mockProducts.find((p) => p.id === parseInt(e.target.value));
                                                    if (p) updateItem(item.id, { productId: p.id, productName: p.name, unitPrice: p.price });
                                                    else updateItem(item.id, { productId: null, productName: "" });
                                                }}
                                            >
                                                <option value="">Select Item</option>
                                                {mockProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <input type="number" min={1} value={item.qty} onChange={(e) => updateItem(item.id, { qty: +e.target.value || 1 })}
                                                className="w-14 h-8.5 rounded-[6px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-[#F9FAFB] dark:bg-[#2a2a2a] px-2 text-[12px] text-center text-[#1E293B] dark:text-[#f0f0f0] focus:outline-none focus:border-[#C69A52] focus:bg-white dark:focus:bg-[#333]" />
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <input type="number" min={0} value={item.assessedPerUnit} onChange={(e) => updateItem(item.id, { assessedPerUnit: +e.target.value || 0 })}
                                                className="w-20 h-8.5 rounded-[6px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-[#F9FAFB] dark:bg-[#2a2a2a] px-2 text-[12px] text-center text-[#1E293B] dark:text-[#f0f0f0] focus:outline-none focus:border-[#C69A52] focus:bg-white dark:focus:bg-[#333]" />
                                        </td>
                                        <td className="py-2 px-3 text-center font-mono text-[#1E293B] dark:text-[#f0f0f0] font-medium">{assessed.toFixed(2)}</td>
                                        <td className="py-2 px-3 text-center">
                                            <input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(item.id, { unitPrice: +e.target.value || 0 })}
                                                className="w-20 h-8.5 rounded-[6px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-[#F9FAFB] dark:bg-[#2a2a2a] px-2 text-[12px] text-center text-[#1E293B] dark:text-[#f0f0f0] focus:outline-none focus:border-[#C69A52] focus:bg-white dark:focus:bg-[#333]" />
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <input type="number" min={0} value={item.retailPrice} onChange={(e) => updateItem(item.id, { retailPrice: +e.target.value || 0 })}
                                                className="w-20 h-8.5 rounded-[6px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-[#F9FAFB] dark:bg-[#2a2a2a] px-2 text-[12px] text-center text-[#1E293B] dark:text-[#f0f0f0] focus:outline-none focus:border-[#C69A52] focus:bg-white dark:focus:bg-[#333]" />
                                        </td>
                                        <td className="py-2 px-4 text-right font-mono text-[#1E293B] dark:text-[#f0f0f0] font-medium">{amtExclDisc.toFixed(2)}</td>
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
                title="Reset sales invoice?"
                message="Are you sure you want to reset the sales invoice? Header, customer, lines, and all entered values on this page will be cleared."
            />
        </div>
    );
}

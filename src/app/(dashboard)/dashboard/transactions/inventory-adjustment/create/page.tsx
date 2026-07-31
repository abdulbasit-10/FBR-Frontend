"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, RotateCcw, Save, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SelectItemModal, type Item } from "@/components/dashboard/select-item-modal";
import { cn } from "@/lib/utils";

interface LineItem {
    id: string;
    itemNo: string;
    itemName: string;
    qty: number;
    unitCost: number;
}

const fmt = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const inputCls =
    "h-10 rounded-[6px] border border-[#D1D5DB] bg-white! text-[12px] text-[#1E293B] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none scheme-light";

const emptyLine = (): LineItem => ({ id: crypto.randomUUID(), itemNo: "", itemName: "", qty: 1, unitCost: 0 });

export default function NewInventoryAdjustmentPage() {
    const router = useRouter();
    const [documentDate, setDocumentDate] = useState("");
    const [postingDate, setPostingDate] = useState("");
    const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [activeLineId, setActiveLineId] = useState<string | null>(null);

    const linesWithItem = lines.filter((l) => l.itemNo !== "");
    const totalAbsQty = lines.reduce((sum, l) => sum + Math.abs(l.qty), 0);

    const handleItemSelect = useCallback((item: Item) => {
        setLines((prev) =>
            prev.map((l) =>
                l.id === activeLineId
                    ? { ...l, itemNo: item.itemNo, itemName: item.name, unitCost: item.unitPrice }
                    : l
            )
        );
        setActiveLineId(null);
    }, [activeLineId]);

    const openItemModal = (lineId: string) => {
        setActiveLineId(lineId);
        setShowItemModal(true);
    };

    const addLine = () => setLines((prev) => [...prev, emptyLine()]);

    const removeLine = (id: string) =>
        setLines((prev) => prev.length > 1 ? prev.filter((l) => l.id !== id) : prev);

    const updateLine = (id: string, field: keyof LineItem, value: string | number) =>
        setLines((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));

    const handleReset = () => {
        setDocumentDate(""); setPostingDate("");
        setLines([emptyLine()]);
        setShowResetConfirm(false);
    };

    return (
        <>
            <div className="min-h-full space-y-4 text-[#4f5967]" style={{ fontFamily: "'Inter', sans-serif" }}>

                {/* ── Header ── */}
                <div className="flex items-center justify-between pb-1">
                    <button onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-[20px] font-bold text-[#1E293B] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                        New Inventory Adjustment
                    </button>
                    <div className="flex items-center gap-2.5">
                        <button type="button" onClick={() => setShowResetConfirm(true)}
                            className="flex h-9 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] bg-white px-4 text-[13px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors">
                            <RotateCcw className="h-3.5 w-3.5 text-[#A27B3A]" /> Reset
                        </button>
                        <button type="button"
                            className="flex h-9 items-center gap-1.5 rounded-[5px] bg-[#C69A52] px-5 text-[13px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                            <Save className="h-3.5 w-3.5" /> Save
                        </button>
                    </div>
                </div>

                {/* ── Adjustment Header card ── */}
                <div className="rounded-[11px] border border-[#E5E7EB] bg-white p-5 shadow-xs">
                    <p className="mb-4 text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">Adjustment Header</p>

                    <div className="grid gap-6 lg:grid-cols-[1fr_260px] items-start">
                        {/* Date inputs */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="text-[12px] font-medium text-[#4F5967]">
                                    Document Date <span className="text-[#A27B3A]">*</span>
                                </Label>
                                <Input type="date" value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[12px] font-medium text-[#4F5967]">
                                    Posting Date <span className="text-[#A27B3A]">*</span>
                                </Label>
                                <Input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} className={inputCls} />
                            </div>
                        </div>

                        {/* Summary panel */}
                        <div className="rounded-[10px] border border-[#E3D2BA] bg-[#FAF6F0] px-5 py-4">
                            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Summary</p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-[#4F5967]">Lines with item</span>
                                    <span className="text-[13px] font-semibold text-[#1E293B]">{linesWithItem.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-[#4F5967]">Total absolute qty</span>
                                    <span className="text-[13px] font-semibold text-[#1E293B]">{fmt(totalAbsQty)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Items section ── */}
                <div className="rounded-[11px] border border-[#E5E7EB] bg-white p-5 shadow-xs space-y-4">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">Items</p>

                    {/* Select Items button */}
                    <div className="flex justify-center">
                        <button type="button" onClick={() => { setActiveLineId(lines[lines.length - 1].id); setShowItemModal(true); }}
                            className="rounded-[8px] border border-[#C69A52] px-10 py-2.5 text-[13px] font-medium text-[#C69A52] hover:bg-[#FAF6F0] transition-colors">
                            Select Items
                        </button>
                    </div>

                    {/* Items table */}
                    <div className="rounded-[11px] border border-[#E5E7EB] overflow-hidden">
                        <div className="flex items-center justify-between bg-[#C69A52] px-3 py-2.5">
                            <div className="flex items-center gap-8 text-[12px] font-semibold text-white">
                                <span className="w-5" /> {/* checkbox col */}
                                <span className="w-6">#</span>
                                <span className="w-52">Item No</span>
                                <span className="w-20 text-right">Qty</span>
                                <span className="w-24 text-right">Unit Cost</span>
                                <span className="w-24 text-right">Line Total</span>
                            </div>
                            <button type="button" onClick={addLine}
                                className="flex items-center gap-1 rounded-[5px] border border-white/60 bg-transparent px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/10 transition-colors">
                                <Plus className="h-3 w-3" /> Add line
                            </button>
                        </div>

                        <div className="divide-y divide-[#F3F4F6]">
                            {lines.map((line, i) => {
                                const lineTotal = line.qty * line.unitCost;
                                return (
                                    <div key={line.id} className={cn("flex items-center gap-4 px-3 py-2", i % 2 === 0 ? "bg-white" : "bg-[#FAF6F0]/30")}>
                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button type="button" onClick={addLine}
                                                className="flex h-6 w-6 items-center justify-center rounded text-[#C69A52] hover:bg-[#FAF6F0] transition-colors">
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                            <button type="button" onClick={() => removeLine(line.id)}
                                                className="flex h-6 w-6 items-center justify-center rounded text-red-400 hover:bg-red-50 transition-colors">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>

                                        {/* Row number */}
                                        <span className="w-6 text-[12px] text-[#9CA3AF] shrink-0">{i + 1}</span>

                                        {/* Item No (clickable to open modal) */}
                                        <button type="button" onClick={() => openItemModal(line.id)}
                                            className={cn(
                                                "w-52 h-8 rounded-[5px] border px-2.5 text-left text-[12px] transition-colors shrink-0",
                                                line.itemNo
                                                    ? "border-[#D1D5DB] text-[#1E293B] font-medium hover:border-[#C69A52]"
                                                    : "border-dashed border-[#D1D5DB] text-[#9CA3AF] hover:border-[#C69A52]"
                                            )}>
                                            {line.itemNo || "— select item —"}
                                        </button>

                                        {/* Qty */}
                                        <input type="number" min={0} value={line.qty}
                                            onChange={(e) => updateLine(line.id, "qty", Number(e.target.value))}
                                            className="w-20 h-8 rounded-[5px] border border-[#D1D5DB] bg-white px-2 text-right text-[12px] text-[#1E293B] focus:outline-none focus:border-[#C69A52] shrink-0" />

                                        {/* Unit Cost (read-only) */}
                                        <span className="w-24 text-right text-[12px] font-mono text-[#4F5967] shrink-0">{fmt(line.unitCost)}</span>

                                        {/* Line Total */}
                                        <span className="w-24 text-right text-[12px] font-mono font-semibold text-[#A27B3A] shrink-0">{fmt(lineTotal)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={handleReset}
                title="Reset Inventory Adjustment?"
                message="Are you sure you want to reset this adjustment form? All unsaved changes will be lost."
                confirmLabel="Reset"
            />

            <SelectItemModal
                isOpen={showItemModal}
                onClose={() => setShowItemModal(false)}
                onSelect={handleItemSelect}
            />
        </>
    );
}

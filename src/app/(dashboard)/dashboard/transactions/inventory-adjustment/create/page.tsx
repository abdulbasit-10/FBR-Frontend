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
    "h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] !bg-white dark:!bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] dark:placeholder:text-[#555] focus:outline-none focus:ring-0 focus:border-[#C69A52] shadow-none [color-scheme:light] dark:[color-scheme:dark]";

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
        setDocumentDate("");
        setPostingDate("");
        setLines([emptyLine()]);
        setShowResetConfirm(false);
    };

    return (
        <>
            <div className="min-h-full space-y-4 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

                {/* ── Top Navigation / Header ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75 transition-opacity"
                    >
                        <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                        <span>New Inventory Adjustment</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowResetConfirm(true)}
                            className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3.5 text-[12px] font-medium text-[#424B56] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                            <RotateCcw className="h-3.5 w-3.5 text-[#A27B3A]" /> Reset
                        </button>
                        <button
                            type="button"
                            className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-5 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs"
                        >
                            <Save className="h-3.5 w-3.5" /> Save
                        </button>
                    </div>
                </div>

                {/* ── CARD 1: ADJUSTMENT HEADER ── */}
                <div className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e] p-4 sm:p-5 shadow-xs space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">
                        Adjustment Header
                    </p>

                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_260px] items-start">
                        {/* Date Inputs */}
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af]">
                                    Document Date <span className="text-[#A27B3A]">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={documentDate}
                                    onChange={(e) => setDocumentDate(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af]">
                                    Posting Date <span className="text-[#A27B3A]">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={postingDate}
                                    onChange={(e) => setPostingDate(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Summary Box */}
                        <div className="rounded-[10px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-[#FAF6F0]/60 dark:bg-[#2a2a2a] p-4">
                            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">
                                Summary
                            </p>
                            <div className="space-y-2 text-[12px]">
                                <div className="flex items-center justify-between">
                                    <span className="text-[#4F5967] dark:text-[#9ca3af]">Lines with item</span>
                                    <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{linesWithItem.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#4F5967] dark:text-[#9ca3af]">Total absolute qty</span>
                                    <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{fmt(totalAbsQty)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── CARD 2: STANDALONE SELECT ITEMS CARD ── */}
                <div className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e] p-6 shadow-xs flex justify-center items-center">
                    <button
                        type="button"
                        onClick={() => { setActiveLineId(lines[lines.length - 1].id); setShowItemModal(true); }}
                        className="rounded-[6px] border border-[#C69A52] px-12 py-2 text-[12px] font-medium text-[#C69A52] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors"
                    >
                        Select Items
                    </button>
                </div>

                {/* ── CARD 3: ITEMS TABLE CARD (Figma: Frame 2147223902) ── */}
                <div className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e] p-4 sm:p-5 shadow-xs space-y-3">

                    {/* Card Header: ITEMS title on left + Add Line button on right */}
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">
                            Items
                        </p>
                        <button
                            type="button"
                            onClick={addLine}
                            className="flex items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3 py-1 text-[11px] font-medium text-[#424B56] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                            <Plus className="h-3 w-3 text-[#A27B3A]" /> Add line
                        </button>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-[#FAF6F0] dark:[&::-webkit-scrollbar-track]:bg-[#2a2a2a] [&::-webkit-scrollbar-thumb]:bg-[#D1B88A] [&::-webkit-scrollbar-thumb]:rounded-full">
                        <div className="min-w-[650px]">

                            {/* Figma Yellow/Gold Table Header */}
                            <div className="flex items-center bg-[#C69A52] px-3 py-2.5 gap-2 text-white text-[12px] font-semibold">
                                <div className="w-12 shrink-0" />
                                <span className="w-8 shrink-0">#</span>
                                <span className="flex-1 min-w-0">Item no</span>
                                <span className="w-24 shrink-0 text-right">Qty</span>
                                <span className="w-28 shrink-0 text-right">Unit cost</span>
                                <span className="w-28 shrink-0 text-right">Line total</span>
                            </div>

                            {/* Table Rows */}
                            <div className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                                {lines.map((line, i) => {
                                    const lineTotal = line.qty * line.unitCost;
                                    return (
                                        <div
                                            key={line.id}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 text-[12px]",
                                                i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]"
                                            )}
                                        >
                                            {/* + and Delete icons */}
                                            <div className="flex items-center gap-1 w-12 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={addLine}
                                                    className="flex h-6 w-6 items-center justify-center rounded text-[#C69A52] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(line.id)}
                                                    className="flex h-6 w-6 items-center justify-center rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>

                                            {/* Index Number */}
                                            <span className="w-8 shrink-0 text-[#1E293B] dark:text-[#f0f0f0] font-medium">{i + 1}</span>

                                            {/* Item No Picker or Dash */}
                                            <div className="flex-1 min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => openItemModal(line.id)}
                                                    className={cn(
                                                        "text-left text-[12px] transition-colors truncate",
                                                        line.itemNo
                                                            ? "text-[#1E293B] dark:text-[#f0f0f0] font-medium hover:text-[#C69A52]"
                                                            : "text-[#9CA3AF] dark:text-[#555] hover:text-[#C69A52]"
                                                    )}
                                                >
                                                    {line.itemNo || "—"}
                                                </button>
                                            </div>

                                            {/* Qty Input Box */}
                                            <div className="w-24 shrink-0 text-right">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={line.qty}
                                                    onChange={(e) => updateLine(line.id, "qty", Number(e.target.value))}
                                                    className="w-16 h-8 rounded-[5px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] px-2 text-center text-[12px] text-[#1E293B] dark:text-[#f0f0f0] focus:outline-none focus:border-[#C69A52]"
                                                />
                                            </div>

                                            {/* Unit Cost */}
                                            <span className="w-28 shrink-0 text-right font-mono text-[#1E293B] dark:text-[#9ca3af]">
                                                {fmt(line.unitCost)}
                                            </span>

                                            {/* Line Total */}
                                            <span className="w-28 shrink-0 text-right font-mono font-semibold text-[#1E293B] dark:text-[#f0f0f0]">
                                                {fmt(lineTotal)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    </div>

                </div>

            </div>

            {/* Reset Modal */}
            <ConfirmDialog
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={handleReset}
                title="Reset Inventory Adjustment?"
                message="Are you sure you want to reset this adjustment form? All unsaved changes will be lost."
                confirmLabel="Reset"
            />

            {/* Select Item Modal */}
            <SelectItemModal
                isOpen={showItemModal}
                onClose={() => setShowItemModal(false)}
                onSelect={handleItemSelect}
            />
        </>
    );
}
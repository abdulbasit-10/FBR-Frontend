"use client";

import React, { useState, useMemo, useCallback, useEffect, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, RefreshCw, Save, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { productsService, type ProductUpdateInput } from "@/lib/services";

const ITEM_TYPES = ["Select", "Goods", "Service", "Digital", "Raw Material", "Finished Goods"];
const SALE_TYPES = ["Select", "Taxable", "Exempt", "Zero-Rated"];

const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};
const selectCls = "h-9 w-full rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";
const inputCls = "h-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none";
const readonlyCls = "h-9 rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-[#F9FAFB] dark:bg-[#1e1e1e] px-3 text-[12px] text-[#4F5967] dark:text-[#9ca3af] flex items-center select-none";
const labelCls = "text-[12px] font-medium text-[#374151] dark:text-[#9ca3af]";
const sectionTitleCls = "text-[11px] font-bold text-[#C69A52] tracking-wider uppercase mb-3";
const cardCls = "rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3.5";

const initials = (name: string) =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

export default function EditItemPage({ params }: { params: Promise<{ uuid: string }> }) {
    const { uuid } = usePromise(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [itemNo, setItemNo] = useState("");

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [itemType, setItemType] = useState("Select");
    const [itemCategory, setItemCategory] = useState("");
    const [hsCode, setHsCode] = useState("");
    const [uom, setUom] = useState("");
    const [printUom, setPrintUom] = useState("");
    const [saleType, setSaleType] = useState("Select");
    const [rateId, setRateId] = useState("");
    const [rateValue, setRateValue] = useState(0);
    const [taxDescription, setTaxDescription] = useState("");
    const [sroScheduleNo, setSroScheduleNo] = useState("");
    const [sroItemSerialNo, setSroItemSerialNo] = useState("");
    const [unitPrice, setUnitPrice] = useState(0);
    const [assessedUnitCost, setAssessedUnitCost] = useState(0);
    const [retailPrice, setRetailPrice] = useState(0);
    const [salesPrice, setSalesPrice] = useState(0);
    const [mappingId, setMappingId] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await productsService.getOne(uuid);
            const p = res.data;
            setItemNo(`I-${String(p.id).padStart(6, "0")}`);
            setName(p.name);
            setDescription(p.description ?? "");
            setItemType(p.itemType ?? "Select");
            setItemCategory(p.itemCategory ?? "");
            setHsCode(p.hsCode);
            setUom(p.uom);
            setPrintUom(p.printUom ?? "");
            setSaleType(p.saleType || "Select");
            setRateId(p.rateId ?? "");
            setRateValue(Number(p.rateValue ?? 0));
            setTaxDescription(p.taxDescription ?? "");
            setSroScheduleNo(p.sroScheduleNo ?? "");
            setSroItemSerialNo(p.sroItemSerialNo ?? "");
            setUnitPrice(Number(p.unitPrice ?? 0));
            setAssessedUnitCost(Number(p.assessedUnitCost ?? 0));
            setRetailPrice(Number(p.fixedNotifiedValueOrRetailPrice ?? 0));
            setSalesPrice(Number(p.salesPrice ?? 0));
            setMappingId(p.mappingId ?? "");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to load item.");
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => { load(); }, [load]);

    const requiredChecks = useMemo(() => [
        { label: "Item type", done: itemType !== "Select" },
        { label: "HS Code", done: hsCode.trim() !== "" },
        { label: "FBR UOM", done: uom.trim() !== "" },
        { label: "Sale type", done: saleType !== "Select" },
        { label: "Item category", done: itemCategory.trim() !== "" },
        { label: "Unit price", done: unitPrice > 0 },
    ], [itemType, hsCode, uom, saleType, itemCategory, unitPrice]);

    const progressPct = Math.round((requiredChecks.filter((r) => r.done).length / requiredChecks.length) * 100);

    const handleSave = async () => {
        if (!name.trim() || !hsCode.trim() || !uom.trim()) {
            toast.error("Item Name, HS Code and FBR UOM are required.");
            return;
        }
        const payload: ProductUpdateInput = {
            name: name.trim(),
            description: description.trim() || null,
            itemType: itemType === "Select" ? null : itemType,
            itemCategory: itemCategory.trim() || null,
            hsCode: hsCode.trim(),
            uom: uom.trim(),
            printUom: printUom.trim() || null,
            saleType: saleType === "Select" ? "Exempt" : saleType,
            rate: `${rateValue}%`,
            rateId: rateId.trim() || null,
            rateValue,
            taxDescription: taxDescription.trim() || null,
            sroScheduleNo: sroScheduleNo.trim() || null,
            sroItemSerialNo: sroItemSerialNo.trim() || null,
            unitPrice,
            assessedUnitCost,
            fixedNotifiedValueOrRetailPrice: retailPrice,
            salesPrice,
            mappingId: mappingId.trim() || null,
        };
        setIsSaving(true);
        try {
            await productsService.update(uuid, payload);
            toast.success("Item updated.");
            router.push("/dashboard/items");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update item.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <LogoSpinner label="Loading item..." />
            </div>
        );
    }

    return (
        <div className="min-h-full text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()} className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-4.5 w-4.5" />
                    </button>
                    <div>
                        <h1 className="text-[16px] font-bold text-[#1E293B] dark:text-[#f0f0f0] leading-tight">Item</h1>
                        <p className="text-[11px] text-[#9CA3AF] leading-tight">Item no. {itemNo}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={load}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                        <RefreshCw className="h-3 w-3 text-[#A27B3A]" /> Refresh
                    </button>
                    <button type="button" onClick={handleSave} disabled={isSaving}
                        className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs disabled:opacity-60 cursor-pointer">
                        <Save className="h-3 w-3" /> {isSaving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-3 items-start">

                {/* ── Left: form sections ── */}
                <div className="space-y-3">

                    {/* ITEM DETAILS */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Item Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className={labelCls}>Item no.</Label>
                                <div className={readonlyCls}>{itemNo}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Item Name <span className="text-red-500">*</span></Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Item Type <span className="text-red-500">*</span></Label>
                                <select value={itemType} onChange={(e) => setItemType(e.target.value)} className={selectCls} style={selectArrow}>
                                    {ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Item Category <span className="text-red-500">*</span></Label>
                                <Input value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <Label className={labelCls}>Mapping ID</Label>
                                <Input value={mappingId} onChange={(e) => setMappingId(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <Label className={labelCls}>Description</Label>
                                <Input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                    </div>

                    {/* FBR / TAX DETAILS */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>FBR &amp; Tax Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className={labelCls}>HS Code <span className="text-red-500">*</span></Label>
                                <Input value={hsCode} onChange={(e) => setHsCode(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>FBR UOM <span className="text-red-500">*</span></Label>
                                <Input value={uom} onChange={(e) => setUom(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Print UOM</Label>
                                <Input value={printUom} onChange={(e) => setPrintUom(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Sale Type <span className="text-red-500">*</span></Label>
                                <select value={saleType} onChange={(e) => setSaleType(e.target.value)} className={selectCls} style={selectArrow}>
                                    {SALE_TYPES.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Tax Rate (%)</Label>
                                <Input type="number" value={rateValue} onChange={(e) => setRateValue(Number(e.target.value) || 0)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Rate ID</Label>
                                <Input value={rateId} onChange={(e) => setRateId(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Tax Description</Label>
                                <Input value={taxDescription} onChange={(e) => setTaxDescription(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>SRO Schedule No</Label>
                                <Input value={sroScheduleNo} onChange={(e) => setSroScheduleNo(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>SRO Item Serial No</Label>
                                <Input value={sroItemSerialNo} onChange={(e) => setSroItemSerialNo(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                    </div>

                    {/* PRICING */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Pricing</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className={labelCls}>Unit Cost</Label>
                                <Input type="number" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value) || 0)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Assessed Unit Cost</Label>
                                <Input type="number" value={assessedUnitCost} onChange={(e) => setAssessedUnitCost(Number(e.target.value) || 0)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Sales Price</Label>
                                <Input type="number" value={salesPrice} onChange={(e) => setSalesPrice(Number(e.target.value) || 0)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Retail Price</Label>
                                <Input type="number" value={retailPrice} onChange={(e) => setRetailPrice(Number(e.target.value) || 0)} className={inputCls} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: summary panel ── */}
                <div className={cn(cardCls, "sticky top-3")}>
                    <div className="flex flex-col items-center mb-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5EDD8] dark:bg-[#2a2a2a] text-[#C69A52] mb-2">
                            <Package className="h-5 w-5" />
                        </div>
                        <p className="text-[13px] font-bold text-[#1E293B] dark:text-[#f0f0f0] text-center">{name || initials(name)}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#F3F4F6] dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] border border-[#E5E7EB] dark:border-[#3a3a3a]">
                                {itemType === "Select" ? "Type not set" : itemType}
                            </span>
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase bg-[#FAF6EE] text-[#A27B3A] border border-[#F3EAD8] dark:bg-[#2a1e0a] dark:border-[#4a3a20]">
                                {saleType === "Select" ? "—" : saleType}
                            </span>
                        </div>
                    </div>

                    <div className="mb-3">
                        <div className="flex justify-between items-center text-[11px] font-medium text-[#6B7280] dark:text-[#9ca3af] mb-1">
                            <span>REQUIRED FIELDS</span>
                            <span className="text-[#C69A52] font-bold">{progressPct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#F3F4F6] dark:bg-[#333]">
                            <div className="h-full rounded-full bg-[#C69A52] transition-all duration-500" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] border-t border-[#F3F4F6] dark:border-[#2e2e2e] pt-2.5">
                        {[
                            ["Item no", itemNo],
                            ["HS Code", hsCode || "—"],
                            ["FBR UOM", uom || "—"],
                            ["Sale type", saleType === "Select" ? "—" : saleType],
                            ["Tax rate", `${rateValue}%`],
                            ["Mapping ID", mappingId || "—"],
                            ["Unit cost", unitPrice.toFixed(2)],
                            ["Retail price", retailPrice.toFixed(2)],
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between gap-2">
                                <span className="text-[#9CA3AF]">{label}</span>
                                <span className="text-[#1E293B] dark:text-[#f0f0f0] font-medium text-right truncate max-w-36">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

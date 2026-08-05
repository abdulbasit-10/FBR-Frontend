"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft, ChevronRight, RotateCcw, Save,
    Search, RefreshCw, X, Package, Hash, Tag,
    Layers, Zap, Calculator, DollarSign,
} from "lucide-react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";

// ─── Static Options ────────────────────────────────────────────────────────────
const ITEMS_TYPE_OPTIONS = ["Select", "Goods", "Service", "Digital", "Raw Material", "Finished Goods"];
const FBR_ITEMS_TYPE_OPTIONS = ["Select", "Local Supply", "Export", "Import", "In-House Use", "Sample"];
const COSTING_METHOD = "FIFO";

// ─── Mock Lookup Data ──────────────────────────────────────────────────────────
interface Category { code: string; name: string; }
interface HsCode { code: string; description: string; }
interface SaleType { id: string; saleType: string; }
interface TaxRate { id: string; name: string; rate: string; }
interface SroSchedule { id: string; name: string; }
interface Uom { code: string; name: string; }

const MOCK_CATEGORIES: Category[] = [
    { code: "CAT-001", name: "Pharmaceuticals" },
    { code: "CAT-002", name: "Surgical Supplies" },
    { code: "CAT-003", name: "Diabetics" },
    { code: "CAT-004", name: "OTC Medicines" },
    { code: "CAT-005", name: "Supplements" },
    { code: "CAT-006", name: "Lab Reagents" },
];

const MOCK_HS_CODES: HsCode[] = [
    { code: "3004.2010", description: "Antibiotics — penicillin / streptomycin group" },
    { code: "3004.2030", description: "Antibiotics — amoxicillin / ampicillin group" },
    { code: "3004.2090", description: "Antibiotics — other" },
    { code: "3004.3010", description: "Insulin-based medicaments" },
    { code: "3004.9010", description: "Analgesics — paracetamol / aspirin group" },
    { code: "3004.9020", description: "Antacids / PPI group" },
    { code: "3004.9090", description: "Other medicaments — mixed" },
    { code: "2936.2100", description: "Vitamins — ascorbic acid (Vitamin C)" },
    { code: "4015.1100", description: "Surgical gloves — latex" },
];

const MOCK_SALE_TYPES: SaleType[] = [
    { id: "ST-001", saleType: "Exempt" },
    { id: "ST-002", saleType: "Standard Rate (17%)" },
    { id: "ST-003", saleType: "Reduced Rate (5%)" },
    { id: "ST-004", saleType: "Zero Rated" },
    { id: "ST-005", saleType: "Further Tax (3%)" },
];

const MOCK_TAX_RATES: TaxRate[] = [
    { id: "TR-001", name: "Zero Rate", rate: "0%" },
    { id: "TR-002", name: "Standard Rate", rate: "17%" },
    { id: "TR-003", name: "Reduced Rate", rate: "5%" },
    { id: "TR-004", name: "Further Tax", rate: "3%" },
];

const MOCK_SRO_SCHEDULES: SroSchedule[] = [
    { id: "SRO-001", name: "SRO 678(I)/2004 — Medicines" },
    { id: "SRO-002", name: "SRO 550(I)/2006 — Stationery" },
    { id: "SRO-003", name: "SRO 1125(I)/2011 — Textiles" },
    { id: "SRO-004", name: "N/A — Not Applicable" },
];

const MOCK_UOM: Uom[] = [
    { code: "PCS", name: "Pieces" },
    { code: "KG", name: "Kilograms" },
    { code: "LTR", name: "Litres" },
    { code: "BOX", name: "Box" },
    { code: "TAB", name: "Tablets" },
    { code: "CAP", name: "Capsules" },
    { code: "ML", name: "Millilitres" },
];

// ─── Shared Styles ─────────────────────────────────────────────────────────────
const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};
const selectCls = "h-10 w-full rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";
const inputCls = "h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none";
const labelCls = "text-[12px] font-medium text-[#374151] dark:text-[#9ca3af]";
const sectionTitleCls = "text-[11px] font-bold text-[#C69A52] tracking-wider uppercase mb-4";
const cardCls = "rounded-[12px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5";

// ─── SelectButton Component ────────────────────────────────────────────────────
function SelectButton({
    icon: Icon,
    label,
    helperText,
    selectedLabel,
    selectedSub,
    onClick,
    disabled = false,
}: {
    icon: React.ElementType;
    label: string;
    helperText: string;
    selectedLabel?: string;
    selectedSub?: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    const hasValue = !!selectedLabel;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-[8px] border transition-colors text-left",
                disabled
                    ? "border-[#E5E7EB] dark:border-[#2e2e2e] bg-[#F9FAFB] dark:bg-[#1e1e1e] opacity-50 cursor-not-allowed"
                    : hasValue
                        ? "border-[#C69A52] bg-[#FEF9EF] dark:bg-[#2d2510] hover:bg-[#FEF3DA] dark:hover:bg-[#332a12]"
                        : "border-dashed border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] hover:border-[#C69A52] hover:bg-[#FEF9EF] dark:hover:bg-[#2d2510]"
            )}
        >
            <div className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full",
                hasValue ? "bg-[#C69A52]" : "bg-[#FAF6EE] dark:bg-[#2a2a2a]"
            )}>
                <Icon className={cn("h-4 w-4", hasValue ? "text-white" : "text-[#C69A52]")} />
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "text-[12px] font-medium truncate",
                    hasValue ? "text-[#C69A52]" : "text-[#1E293B] dark:text-[#f0f0f0]"
                )}>
                    {hasValue ? selectedLabel : label}
                </p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5 truncate">
                    {hasValue ? (selectedSub ?? "") : helperText}
                </p>
            </div>
            <ChevronRight className={cn("h-4 w-4 flex-shrink-0", hasValue ? "text-[#C69A52]" : "text-[#9CA3AF]")} />
        </button>
    );
}

// ─── Search Modal ──────────────────────────────────────────────────────────────
type ModalCol = { key: string; label: string; };

function SearchModal<T extends object>({
    isOpen,
    title,
    subtitle,
    columns,
    rows,
    filterFn,
    onSelect,
    onClose,
}: {
    isOpen: boolean;
    title: string;
    subtitle: string;
    columns: ModalCol[];
    rows: T[];
    filterFn: (row: T, q: string) => boolean;
    onSelect: (row: T) => void;
    onClose: () => void;
}) {
    const [query, setQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 8;

    const filtered = useMemo(() =>
        query.trim() ? rows.filter((r) => filterFn(r, query.toLowerCase())) : rows
        , [rows, query, filterFn]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 800);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[2px]"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative w-full max-w-[560px] rounded-[12px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] shadow-2xl overflow-hidden">
                {/* Modal header */}
                <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-[#F3F4F6] dark:border-[#2e2e2e]">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF6EE] dark:bg-[#2a2a2a]">
                            <Search className="h-4 w-4 text-[#C69A52]" />
                        </div>
                        <div>
                            <h3 className="text-[13px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">{title}</h3>
                            <p className="text-[11px] text-[#9CA3AF] mt-0.5">{subtitle}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[#6B7280] hover:bg-[#F9FAFB] dark:hover:bg-[#333] transition-colors">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Search row */}
                <div className="flex items-center gap-2 px-5 py-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
                        <input
                            type="text"
                            placeholder="Search…"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                            className="h-9 w-full rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] pl-8 pr-3 text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C69A52]"
                        />
                    </div>
                    <button type="button" onClick={() => setPage(1)}
                        className="h-9 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors">
                        Search
                    </button>
                    <button type="button" onClick={handleRefresh}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#C69A52] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} /> Refresh
                    </button>
                </div>

                {/* Table */}
                <div className="mx-5 mb-2 rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e] overflow-hidden">
                    <table className="w-full text-[12px] border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                <th className="px-3 py-2 text-left font-semibold w-16">Select</th>
                                {columns.map((c) => (
                                    <th key={c.key} className="px-3 py-2 text-left font-semibold">{c.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                            {isRefreshing ? (
                                <tr>
                                    <td colSpan={columns.length + 1} className="py-8 text-center bg-white dark:bg-[#242424]">
                                        <LogoSpinner className="mx-auto" size={40} />
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 1} className="py-8 text-center text-[12px] text-[#9CA3AF] italic bg-white dark:bg-[#242424]">
                                        No options match your search.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((row, i) => (
                                    <tr key={i}
                                        onClick={() => { onSelect(row); onClose(); }}
                                        className="bg-white dark:bg-[#242424] hover:bg-[#FEF9EF] dark:hover:bg-[#2d2510] cursor-pointer transition-colors">
                                        <td className="px-3 py-2.5">
                                            <button type="button"
                                                className="rounded-[5px] bg-[#C69A52] px-2.5 py-0.5 text-[11px] font-semibold text-white hover:bg-[#b58b44] transition-colors">
                                                Select
                                            </button>
                                        </td>
                                        {columns.map((c) => (
                                            <td key={c.key} className="px-3 py-2.5 text-[#1E293B] dark:text-[#f0f0f0]">
                                                {String((row as Record<string, unknown>)[c.key] ?? "")}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-5 py-3 text-[11px] text-[#9CA3AF]">
                    <span>Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                            className="flex h-6 w-6 items-center justify-center rounded border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] hover:bg-[#F9FAFB] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="h-3 w-3 text-[#6B7280]" />
                        </button>
                        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="flex h-6 w-6 items-center justify-center rounded border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] hover:bg-[#F9FAFB] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="h-3 w-3 text-[#6B7280]" />
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NewItemPage() {
    const router = useRouter();

    // ITEMS DETAILS
    const [itemName, setItemName] = useState("");
    const [itemsType, setItemsType] = useState("Select");
    const [category, setCategory] = useState<Category | null>(null);

    // FBR INVOICING
    const [hsCode, setHsCode] = useState<HsCode | null>(null);
    const [fbrUom, setFbrUom] = useState<Uom | null>(null);
    const [saleType, setSaleType] = useState<SaleType | null>(null);
    const [taxRate, setTaxRate] = useState<TaxRate | null>(null);
    const [sroSchedule, setSroSchedule] = useState<SroSchedule | null>(null);
    const [printUom, setPrintUom] = useState("");
    const [itemSerial, setItemSerial] = useState<SroSchedule | null>(null);
    const [fbrItemsType, setFbrItemsType] = useState("Select");

    // PRICING
    const [unitCost, setUnitCost] = useState("");
    const [assessedUnit, setAssessedUnit] = useState("");
    const [unitPrice, setUnitPrice] = useState("");
    const [retailPrice, setRetailPrice] = useState("");

    // Modal states
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showHsCodeModal, setShowHsCodeModal] = useState(false);
    const [showUomModal, setShowUomModal] = useState(false);
    const [showSaleTypeModal, setShowSaleTypeModal] = useState(false);
    const [showTaxRateModal, setShowTaxRateModal] = useState(false);
    const [showSroModal, setShowSroModal] = useState(false);
    const [showItemSerialModal, setShowItemSerialModal] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // ── Required field checks ──────────────────────────────────────────────────
    const requiredChecks = useMemo(() => [
        { label: "Category", done: !!category },
        { label: "HS code", done: !!hsCode },
        { label: "FBR UOM", done: !!fbrUom },
        { label: "Print UOM", done: printUom.trim() !== "" },
        { label: "Sale Type", done: !!saleType },
        { label: "SRO Schedule", done: !!sroSchedule },
        { label: "Item Serial", done: !!itemSerial },
        { label: "Costing Method", done: false, fixed: COSTING_METHOD },
        { label: "Unit Cost", done: unitCost.trim() !== "" },
        { label: "Assessed/Unit", done: assessedUnit.trim() !== "" },
        { label: "Retail Price", done: retailPrice.trim() !== "" },
    ], [category, hsCode, fbrUom, printUom, saleType, sroSchedule, itemSerial, unitCost, assessedUnit, retailPrice]);

    const progressPct = Math.round((requiredChecks.filter((r) => r.done).length / requiredChecks.length) * 100);

    const handleReset = useCallback(() => {
        setItemName(""); setItemsType("Select"); setCategory(null);
        setHsCode(null); setFbrUom(null); setSaleType(null); setTaxRate(null);
        setSroSchedule(null); setPrintUom(""); setItemSerial(null); setFbrItemsType("Select");
        setUnitCost(""); setAssessedUnit(""); setUnitPrice(""); setRetailPrice("");
        setShowResetConfirm(false);
    }, []);

    return (
        <div className="min-h-full text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()}
                        className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">New Items</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setShowResetConfirm(true)}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-4 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <RotateCcw className="h-3.5 w-3.5 text-[#A27B3A]" /> Reset
                    </button>
                    <button type="button"
                        className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                        <Save className="h-3.5 w-3.5" /> Save
                    </button>
                </div>
            </div>

            {/* ── Two-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_264px] gap-4 items-start">

                {/* ── LEFT: form ── */}
                <div className="space-y-4">

                    {/* ITEMS DETAILS */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Items Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Items Name <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder="Legal or trading name"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Items Type <span className="text-red-500">*</span></Label>
                                <select value={itemsType} onChange={(e) => setItemsType(e.target.value)}
                                    className={selectCls} style={selectArrow}>
                                    {ITEMS_TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className={labelCls}>Item category <span className="text-red-500">*</span></Label>
                                <SelectButton
                                    icon={Tag}
                                    label="Select Item category"
                                    helperText="Optional — classifies this item for reporting"
                                    selectedLabel={category ? `${category.name}` : undefined}
                                    selectedSub={category ? category.code : undefined}
                                    onClick={() => setShowCategoryModal(true)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* FBR INVOICING */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>FBR Invoicing</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            {/* HS Code */}
                            <div className="space-y-1.5">
                                <Label className={labelCls}>HS Code <span className="text-red-500">*</span></Label>
                                <SelectButton
                                    icon={Hash}
                                    label="Select HS code"
                                    helperText="Required for FBR digital invoicing"
                                    selectedLabel={hsCode ? hsCode.code : undefined}
                                    selectedSub={hsCode ? hsCode.description : undefined}
                                    onClick={() => setShowHsCodeModal(true)}
                                />
                            </div>

                            {/* FBR UOM */}
                            <div className="space-y-1.5">
                                <Label className={cn(labelCls, !hsCode && "opacity-50")}>
                                    FBR UOM <span className="text-red-500">*</span>
                                </Label>
                                <SelectButton
                                    icon={Layers}
                                    label="Select UOM"
                                    helperText={hsCode ? "Select unit of measure" : "Select HS code first"}
                                    selectedLabel={fbrUom ? `${fbrUom.code} — ${fbrUom.name}` : undefined}
                                    selectedSub={fbrUom ? fbrUom.code : undefined}
                                    onClick={() => setShowUomModal(true)}
                                    disabled={!hsCode}
                                />
                            </div>

                            {/* Sale Type */}
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Sale Type <span className="text-red-500">*</span></Label>
                                <SelectButton
                                    icon={Zap}
                                    label="Select sale type"
                                    helperText="Determines applicable tax rates"
                                    selectedLabel={saleType ? saleType.saleType : undefined}
                                    selectedSub={saleType ? saleType.id : undefined}
                                    onClick={() => setShowSaleTypeModal(true)}
                                />
                            </div>

                            {/* Tax Rate */}
                            <div className="space-y-1.5">
                                <Label className={cn(labelCls, !saleType && "opacity-50")}>
                                    Tax Rate <span className="text-red-500">*</span>
                                </Label>
                                <SelectButton
                                    icon={Calculator}
                                    label="Select tax rate"
                                    helperText={saleType ? "Select applicable tax rate" : "Select sale type first"}
                                    selectedLabel={taxRate ? `${taxRate.name} (${taxRate.rate})` : undefined}
                                    selectedSub={taxRate ? taxRate.id : undefined}
                                    onClick={() => setShowTaxRateModal(true)}
                                    disabled={!saleType}
                                />
                            </div>

                            {/* SRO Schedule */}
                            <div className="space-y-1.5">
                                <Label className={cn(labelCls, !taxRate && "opacity-50")}>
                                    SRO Schedule Type <span className="text-red-500">*</span>
                                </Label>
                                <SelectButton
                                    icon={Layers}
                                    label="Select SRO schedule"
                                    helperText={taxRate ? "Select SRO schedule" : "Select tax rate first"}
                                    selectedLabel={sroSchedule ? sroSchedule.name : undefined}
                                    selectedSub={sroSchedule ? sroSchedule.id : undefined}
                                    onClick={() => setShowSroModal(true)}
                                    disabled={!taxRate}
                                />
                            </div>

                            {/* Print UOM */}
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Print UOM <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder="e.g. PCS, KG"
                                    value={printUom}
                                    onChange={(e) => setPrintUom(e.target.value)}
                                    className={inputCls}
                                />
                            </div>

                            {/* Item Serial */}
                            <div className="space-y-1.5">
                                <Label className={cn(labelCls, !taxRate && "opacity-50")}>
                                    Item Serial No <span className="text-red-500">*</span>
                                </Label>
                                <SelectButton
                                    icon={Package}
                                    label="Select SRO schedule"
                                    helperText={taxRate ? "Select item serial" : "Select tax rate first"}
                                    selectedLabel={itemSerial ? itemSerial.name : undefined}
                                    selectedSub={itemSerial ? itemSerial.id : undefined}
                                    onClick={() => setShowItemSerialModal(true)}
                                    disabled={!taxRate}
                                />
                            </div>

                            {/* FBR Items Type */}
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Items Type <span className="text-red-500">*</span></Label>
                                <select value={fbrItemsType} onChange={(e) => setFbrItemsType(e.target.value)}
                                    className={selectCls} style={selectArrow}>
                                    {FBR_ITEMS_TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* PRICING */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Pricing</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Unit Cost <span className="text-red-500">*</span></Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={unitCost}
                                    onChange={(e) => setUnitCost(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Assessed/Unit <span className="text-red-500">*</span></Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={assessedUnit}
                                    onChange={(e) => setAssessedUnit(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Unit Price <span className="text-red-500">*</span></Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={unitPrice}
                                    onChange={(e) => setUnitPrice(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Retail Price <span className="text-red-500">*</span></Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={retailPrice}
                                    onChange={(e) => setRetailPrice(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: progress panel ── */}
                <div className="space-y-3 sticky top-4">
                    <div className="rounded-[12px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4">

                        {/* Item avatar */}
                        <div className="flex flex-col items-center pb-4 border-b border-[#F3F4F6] dark:border-[#2e2e2e]">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF6EE] dark:bg-[#2a2a2a] mb-2">
                                <Package className="h-7 w-7 text-[#C69A52]" />
                            </div>
                            <p className="text-[13px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">New Items</p>
                            <span className={cn(
                                "mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                                itemsType !== "Select"
                                    ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                    : "bg-[#F3F4F6] text-[#9CA3AF] border border-[#E5E7EB] dark:bg-[#2a2a2a] dark:text-[#6B7280] dark:border-[#3a3a3a]"
                            )}>
                                {itemsType !== "Select" ? `Type set — ${itemsType}` : "Type not set"}
                            </span>
                        </div>

                        {/* Progress */}
                        <div className="pt-4 pb-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-[#C69A52] tracking-wider uppercase">Required Fields</span>
                                <span className="text-[11px] font-bold text-[#C69A52]">{progressPct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[#F3F4F6] dark:bg-[#2a2a2a] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[#C69A52] transition-all duration-500"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Checklist */}
                        <ul className="space-y-1.5 border-t border-[#F3F4F6] dark:border-[#2e2e2e] pt-3">
                            {requiredChecks.map((check) => (
                                <li key={check.label} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "h-3.5 w-3.5 flex-shrink-0 rounded-full border transition-colors",
                                            check.done
                                                ? "border-[#C69A52] bg-[#C69A52]"
                                                : "border-[#D1D5DB] dark:border-[#3a3a3a] bg-transparent"
                                        )}>
                                            {check.done && (
                                                <svg viewBox="0 0 12 12" fill="none" className="w-full h-full p-[2px]">
                                                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-[11px]",
                                            check.done ? "text-[#1E293B] dark:text-[#f0f0f0]" : "text-[#9CA3AF]"
                                        )}>{check.label}</span>
                                    </div>
                                    <span className="text-[10px] text-[#9CA3AF] flex-shrink-0">
                                        {check.fixed ?? (check.done ? "" : "—")}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {/* TAX RATE summary */}
                        <div className={cn(
                            "mt-4 rounded-[8px] p-3",
                            taxRate ? "bg-[#FEF9EF] dark:bg-[#2d2510]" : "bg-[#F9FAFB] dark:bg-[#1e1e1e]"
                        )}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-[#C69A52] tracking-wider uppercase">Tax Rate</span>
                                <span className="text-[10px] font-bold text-[#C69A52]">{taxRate ? taxRate.rate : "Not set"}</span>
                            </div>
                            {taxRate && (
                                <p className="text-[11px] text-[#6B7280] dark:text-[#9ca3af]">{taxRate.name}</p>
                            )}
                        </div>

                        {/* UNIT PRICE summary */}
                        <div className={cn(
                            "mt-2 rounded-[8px] p-3",
                            unitPrice ? "bg-[#FEF9EF] dark:bg-[#2d2510]" : "bg-[#F9FAFB] dark:bg-[#1e1e1e]"
                        )}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-[#C69A52] tracking-wider uppercase">Unit Price</span>
                                <span className="text-[10px] font-bold text-[#C69A52]">
                                    {unitPrice ? `PKR ${parseFloat(unitPrice || "0").toFixed(2)}` : "Not set"}
                                </span>
                            </div>
                            {retailPrice && (
                                <p className="text-[11px] text-[#6B7280] dark:text-[#9ca3af]">Retail: PKR {parseFloat(retailPrice).toFixed(2)}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}

            {/* Item Category */}
            <SearchModal<Category>
                isOpen={showCategoryModal}
                title="Select item category"
                subtitle="Search by category code or name."
                columns={[
                    { key: "code", label: "Code" },
                    { key: "name", label: "Name" },
                ]}
                rows={MOCK_CATEGORIES}
                filterFn={(r, q) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)}
                onSelect={(r) => setCategory(r)}
                onClose={() => setShowCategoryModal(false)}
            />

            {/* HS Code */}
            <SearchModal<HsCode>
                isOpen={showHsCodeModal}
                title="Select HS code"
                subtitle="Search full harmonised system codes for this item."
                columns={[
                    { key: "code", label: "HS Code" },
                    { key: "description", label: "Description" },
                ]}
                rows={MOCK_HS_CODES}
                filterFn={(r, q) => r.code.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)}
                onSelect={(r) => { setHsCode(r); setFbrUom(null); }}
                onClose={() => setShowHsCodeModal(false)}
            />

            {/* FBR UOM */}
            <SearchModal<Uom>
                isOpen={showUomModal}
                title="Select UOM"
                subtitle="Select the unit of measure for FBR invoicing."
                columns={[
                    { key: "code", label: "Code" },
                    { key: "name", label: "Unit Name" },
                ]}
                rows={MOCK_UOM}
                filterFn={(r, q) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)}
                onSelect={(r) => setFbrUom(r)}
                onClose={() => setShowUomModal(false)}
            />

            {/* Sale Type */}
            <SearchModal<SaleType>
                isOpen={showSaleTypeModal}
                title="Select Sale Type"
                subtitle="FBR transaction type for sales of this item."
                columns={[
                    { key: "id", label: "ID" },
                    { key: "saleType", label: "Sale type" },
                ]}
                rows={MOCK_SALE_TYPES}
                filterFn={(r, q) => r.id.toLowerCase().includes(q) || r.saleType.toLowerCase().includes(q)}
                onSelect={(r) => { setSaleType(r); setTaxRate(null); setSroSchedule(null); setItemSerial(null); }}
                onClose={() => setShowSaleTypeModal(false)}
            />

            {/* Tax Rate */}
            <SearchModal<TaxRate>
                isOpen={showTaxRateModal}
                title="Select Tax Rate"
                subtitle="Select the applicable tax rate for this sale type."
                columns={[
                    { key: "id", label: "ID" },
                    { key: "name", label: "Rate Name" },
                    { key: "rate", label: "Rate" },
                ]}
                rows={MOCK_TAX_RATES}
                filterFn={(r, q) => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.rate.toLowerCase().includes(q)}
                onSelect={(r) => { setTaxRate(r); setSroSchedule(null); setItemSerial(null); }}
                onClose={() => setShowTaxRateModal(false)}
            />

            {/* SRO Schedule */}
            <SearchModal<SroSchedule>
                isOpen={showSroModal}
                title="Select SRO Schedule"
                subtitle="Select the SRO schedule applicable to this item."
                columns={[
                    { key: "id", label: "ID" },
                    { key: "name", label: "Schedule Name" },
                ]}
                rows={MOCK_SRO_SCHEDULES}
                filterFn={(r, q) => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)}
                onSelect={(r) => setSroSchedule(r)}
                onClose={() => setShowSroModal(false)}
            />

            {/* Item Serial */}
            <SearchModal<SroSchedule>
                isOpen={showItemSerialModal}
                title="Select Item Serial"
                subtitle="Select the serial number schedule for this item."
                columns={[
                    { key: "id", label: "ID" },
                    { key: "name", label: "Serial Name" },
                ]}
                rows={MOCK_SRO_SCHEDULES}
                filterFn={(r, q) => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)}
                onSelect={(r) => setItemSerial(r)}
                onClose={() => setShowItemSerialModal(false)}
            />

            {/* Reset Confirm */}
            <ConfirmDialog
                isOpen={showResetConfirm}
                title="Reset form?"
                message="All entered item details will be cleared."
                confirmLabel="Reset"
                cancelLabel="Cancel"
                onConfirm={handleReset}
                onClose={() => setShowResetConfirm(false)}
            />
        </div>
    );
}

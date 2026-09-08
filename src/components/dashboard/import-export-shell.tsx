"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Download, Upload, FileSpreadsheet, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import * as XLSX from "@e965/xlsx";
import { auth } from "@/lib/auth";

interface ImportExportShellProps {
    title: string;
    saveLabel: string;
    note: string;
    /** Column headers expected in (and shown in) the preview grid. */
    columns: string[];
    /** If provided, "Export Template" downloads this static file instead of generating one. */
    templateUrl?: string;
    /** Called with parsed rows when the user clicks Save. */
    onSave?: (rows: Record<string, string>[]) => void | Promise<void>;
}

export function ImportExportShell({
    title,
    saveLabel,
    note,
    columns,
    templateUrl,
    onSave,
}: ImportExportShellProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [rows, setRows] = useState<Record<string, string>[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    // Read the company's FBR environment from the backend on mount.
    const [fbrEnv, setFbrEnv] = useState<"sandbox" | "production" | null>(null);

    // Strip the leading "Row" column from the display-column list for mapping.
    // We auto-generate the row numbers ourselves.
    const dataColumns = columns.filter((c) => c !== "Row");

    // Fetch company's FBR environment from /companies/:uuid so the banner is accurate.
    useEffect(() => {
        const user = auth.getUser();
        if (!user?.companyId) return;
        import("@/lib/services").then(({ companiesService }) => {
            // We can't query by numeric id — fetch the list and read fbrEnvironment from the first.
            companiesService.list({ limit: 1 }).then((res) => {
                const env = res.data.rows[0]?.fbrEnvironment;
                if (env === "production" || env === "sandbox") setFbrEnv(env);
                else setFbrEnv("sandbox"); // safe default
            }).catch(() => setFbrEnv("sandbox"));
        });
    }, []);

    const handleImport = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            // sheetToJson with header:1 → array of arrays (first row = headers)
            const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
            if (raw.length < 2) {
                toast.error("The file appears to be empty or has no data rows.");
                return;
            }

            // First non-empty row = headers
            const headers: string[] = (raw[0] as string[]).map((h) => String(h ?? "").trim());

            const parsed: Record<string, string>[] = [];
            for (let i = 1; i < raw.length; i++) {
                const rowArr = raw[i] as (string | number | Date)[];
                // Skip completely empty rows
                if (rowArr.every((cell) => cell === "" || cell == null)) continue;

                const obj: Record<string, string> = {};
                headers.forEach((h, idx) => {
                    const cell = rowArr[idx];
                    if (cell instanceof Date) {
                        // Format date as MM/DD/YYYY to match import template expectation
                        const m = String(cell.getMonth() + 1).padStart(2, "0");
                        const d = String(cell.getDate()).padStart(2, "0");
                        const y = cell.getFullYear();
                        obj[h] = `${m}/${d}/${y}`;
                    } else {
                        obj[h] = String(cell ?? "");
                    }
                });
                parsed.push(obj);
            }

            if (parsed.length === 0) {
                toast.error("No data rows found in the file.");
                return;
            }

            setRows(parsed);
            setFileName(file.name);
            toast.success(`${parsed.length} row(s) loaded from "${file.name}". Review below, then click ${saveLabel}.`);
        } catch {
            toast.error("Failed to read the file. Make sure it is a valid Excel or CSV file.");
        }
    };

    const handleSave = async () => {
        if (rows.length === 0) {
            toast.error("No rows to save. Import a file first.");
            return;
        }
        if (!onSave) {
            toast.info("Save handler not configured for this page.");
            return;
        }
        setIsSaving(true);
        try {
            await onSave(rows);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = () => {
        setRows([]);
        setFileName(null);
    };

    const handleExportTemplate = () => {
        if (templateUrl) {
            const a = document.createElement("a");
            a.href = templateUrl;
            a.download = templateUrl.split("/").pop() ?? "template.xlsx";
            a.click();
            toast.success("Template downloaded.");
            return;
        }
        // Fallback: generate a blank template from the column headers
        const ws = XLSX.utils.aoa_to_sheet([dataColumns]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `${title.replace(/\s+/g, "_")}_template.xlsx`);
        toast.success("Template downloaded.");
    };

    return (
        <div className="h-full flex flex-col gap-2.5 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex shrink-0 items-center justify-between pb-0.5">
                <button onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-[16px] font-bold text-[#1E293B] dark:text-white hover:opacity-75 transition-opacity cursor-pointer">
                    <ChevronLeft className="h-4.5 w-4.5 text-[#A27B3A]" />
                    {title}
                </button>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={handleSave} disabled={isSaving || rows.length === 0}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white dark:bg-[#1e1e1e] dark:border-[#3a3a3a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                        <Download className="h-3 w-3 text-[#A27B3A]" /> {isSaving ? "Saving…" : saveLabel}
                    </button>
                    <button type="button" onClick={handleImport}
                        className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs cursor-pointer">
                        <FileSpreadsheet className="h-3 w-3" /> Import Excel
                    </button>
                    <button type="button" onClick={handleExportTemplate}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white dark:bg-[#1e1e1e] dark:border-[#3a3a3a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                        <Upload className="h-3 w-3 text-[#A27B3A]" /> Export Template
                    </button>
                </div>
            </div>

            {/* ── FBR environment banner ── */}
            {fbrEnv && (
                <div className={cn(
                    "flex shrink-0 items-center gap-2 rounded-[8px] border px-3 py-2 text-[12px]",
                    fbrEnv === "sandbox"
                        ? "border-[#93C5FD] dark:border-[#1d4a8a] bg-[#EFF6FF] dark:bg-[#0d1f3c] text-[#1E40AF] dark:text-[#93C5FD]"
                        : "border-[#FCA5A5] dark:border-[#7f1d1d] bg-[#FEF2F2] dark:bg-[#2a0a0a] text-[#B91C1C] dark:text-[#FCA5A5]",
                )}>
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>
                        <strong>FBR environment: {fbrEnv === "sandbox" ? "Sandbox (Testing)" : "Production (Live)"}</strong>
                        {" — "}
                        {fbrEnv === "sandbox"
                            ? "Saved invoices are created as drafts and will be submitted to the FBR Sandbox when you post them. No real tax data is transmitted until you switch to Production."
                            : "Saved invoices are created as drafts. When you post them they will be submitted to the LIVE FBR production endpoint. Real tax records will be created."}
                    </span>
                </div>
            )}

            {/* ── Loaded file banner ── */}
            {fileName && (
                <div className="flex shrink-0 items-center justify-between rounded-[8px] border border-[#B8E0C5] dark:border-[#2a4a35] bg-[#F0FDF4] dark:bg-[#0d1f14] px-3 py-2">
                    <span className="text-[12px] text-[#166534] dark:text-[#4ade80]">
                        <span className="font-semibold">{fileName}</span> — {rows.length} row(s) ready to review
                    </span>
                    <button type="button" onClick={handleClear}
                        className="ml-4 flex h-6 w-6 items-center justify-center rounded-full text-[#166534] hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer"
                        title="Clear preview">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* ── Preview & Edit card ── */}
            <div className="flex min-h-0 flex-col gap-2 rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] p-3 shadow-xs">
                <p className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Preview &amp; Edit</p>
                <p className="shrink-0 text-[12px] text-[#9CA3AF]">{note}</p>

                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#FAF6F0] dark:[&::-webkit-scrollbar-track]:bg-[#1a1a1a] [&::-webkit-scrollbar-thumb]:bg-[#D1B88A] [&::-webkit-scrollbar-thumb]:rounded-full">
                    <table className="w-full text-[12px] border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[#C69A52] text-white">
                                {columns.map((col) => (
                                    <th key={col} className="px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length}
                                        className="py-8 text-center text-[12px] text-[#9CA3AF] italic bg-white dark:bg-[#1a1a1a]">
                                        No rows. Import an Excel template to preview here.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row, rowIdx) => (
                                    <tr key={rowIdx}
                                        className={cn("hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors",
                                            rowIdx % 2 === 0 ? "bg-white dark:bg-[#1a1a1a]" : "bg-[#FAF6F0]/40 dark:bg-[#1e1e1e]")}>
                                        {/* Row number */}
                                        <td className="px-2.5 py-1.5 text-[#9CA3AF] font-mono text-center whitespace-nowrap">
                                            {rowIdx + 1}
                                        </td>
                                        {/* Data columns — match by header name; fall back to positional index */}
                                        {dataColumns.map((col, colIdx) => {
                                            // Try to find by exact header match first, then by position
                                            const value = Object.prototype.hasOwnProperty.call(row, col)
                                                ? row[col]
                                                : Object.values(row)[colIdx] ?? "";
                                            return (
                                                <td key={col} className="px-2.5 py-1.5 text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap max-w-[200px] truncate" title={value}>
                                                    {value || <span className="text-[#9CA3AF]">—</span>}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {rows.length > 0 && (
                    <p className="shrink-0 text-[11px] text-[#9CA3AF] text-right">{rows.length} row(s) loaded</p>
                )}
            </div>

            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
        </div>
    );
}


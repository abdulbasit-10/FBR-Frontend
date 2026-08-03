"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, FileSpreadsheet, Download, Upload, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const IMPORT_TYPES = [
    "Sales Invoices Import",
    "Customers Import",
    "Vendors Import",
    "Items Import",
];

const COLUMNS = [
    "Row",
    "Sequence No",
    "Document Date (MM/DD/YYYY)",
    "Posting Date (MM/DD/YYYY)",
    "Client ID",
    "Client Name",
    "Client Category",
    "Tax ID",
    "Tax Region",
    "Product ID",
    "Product Name",
    "Amount",
];

export default function MasterImportPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importType, setImportType] = useState(IMPORT_TYPES[0]);
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) setFile(f);
        e.target.value = "";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) setFile(f);
    };

    return (
        <div className="min-h-full space-y-4 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Page Header Controls ── */}
            <div className="flex items-center justify-between pb-1">
                <button onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-[18px] font-bold text-[#1E293B] dark:text-white hover:opacity-75 transition-opacity">
                    <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                    Master Import
                </button>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={!file}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3.5 text-[12px] font-medium text-[#424B56] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Play className="h-3.5 w-3.5 text-[#A27B3A]" /> Run Import
                    </button>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs"
                    >
                        <FileSpreadsheet className="h-3.5 w-3.5" /> Choose Excel
                    </button>
                    <button
                        type="button"
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#3a3a3a] bg-white dark:bg-[#1e1e1e] px-3.5 text-[12px] font-medium text-[#424B56] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors"
                    >
                        <Download className="h-3.5 w-3.5 text-[#A27B3A]" /> Download Template
                    </button>
                </div>
            </div>

            {/* ── SECTION 1: UPLOAD CARD ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] p-5 space-y-4 shadow-xs">

                {/* Active Import Chip */}
                <div className="flex items-center justify-center">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF6EE] border border-[#E3D2BA] px-3.5 py-1 text-[11px] font-medium text-[#A27B3A]">
                        <Upload className="h-3 w-3" />
                        <span>{importType}</span>
                    </div>
                </div>

                {/* Drop Zone */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                        "flex flex-col items-center justify-center gap-2.5 rounded-[8px] border-2 border-dashed py-8 px-4 transition-colors cursor-pointer",
                        isDragging
                            ? "border-[#C69A52] bg-[#FAF6F0] dark:bg-[#2a2a2a]"
                            : "border-[#E3D2BA] bg-[#FAF6F0]/30 dark:bg-transparent hover:border-[#C69A52] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]"
                    )}
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FAF6EE] border border-[#E3D2BA]">
                        <Upload className="h-5 w-5 text-[#A27B3A]" />
                    </div>

                    {file ? (
                        <div className="flex items-center gap-2">
                            <p className="text-[13px] font-medium text-[#1E293B] dark:text-white">{file.name}</p>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                className="text-[#9CA3AF] hover:text-red-500 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-[13px] text-[#4F5967] dark:text-[#9ca3af]">
                                Drag &amp; drop your Excel file here, or{" "}
                                <span className="text-[#C69A52] font-semibold underline underline-offset-2">choose a file</span>
                            </p>
                            <p className="text-[11px] text-[#9CA3AF] text-center max-w-2xl">
                                Supports .xlsx files - Required columns: Row, Seq No, Invoice Date, Posting Date, Client ID, Client Name, Client Category, Tax ID, Tax Region, Product ID, Product Name, Amount
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* ── SECTION 2: PREVIEW & EDIT CARD ── */}
            <div className="rounded-[16px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] p-4 shadow-xs space-y-3">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Preview &amp; Edit</p>
                    <p className="text-[12px] text-[#9CA3AF] pt-0.5">
                        Review imported rows before committing to the ledger. Click any cell to edit inline.
                    </p>
                </div>

                {/* Table Container with Custom Scrollbar */}
                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-[#FAF6F0] [&::-webkit-scrollbar-thumb]:bg-[#D1B88A] [&::-webkit-scrollbar-thumb]:rounded-full">
                    <table className="w-full text-[12px] border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                {COLUMNS.map((col) => (
                                    <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td
                                    colSpan={COLUMNS.length}
                                    className="py-12 text-center text-[12px] text-[#9CA3AF] italic bg-white dark:bg-[#1a1a1a]"
                                >
                                    No rows. Import an Excel template to preview here.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hidden Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}
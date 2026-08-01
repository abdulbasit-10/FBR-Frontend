"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Download, Upload, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportExportShellProps {
    title: string;
    saveLabel: string;
    note: string;
    columns: string[];
    hasRows: boolean;
    onSave?: () => void;
    onFileChange?: (file: File) => void;
    children?: React.ReactNode; // <tr> rows when hasRows is true
}

export function ImportExportShell({
    title,
    saveLabel,
    note,
    columns,
    hasRows,
    onSave,
    onFileChange,
    children,
}: ImportExportShellProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImport = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) onFileChange?.(f);
        e.target.value = "";
    };

    return (
        <div className="min-h-full space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-1">
                <button onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-[18px] font-bold text-[#1E293B] dark:text-white hover:opacity-75 transition-opacity">
                    <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                    {title}
                </button>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={onSave}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] bg-white dark:bg-[#1e1e1e] dark:border-[#3a3a3a] px-3.5 text-[12px] font-medium text-[#424B56] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors">
                        <Download className="h-3.5 w-3.5 text-[#A27B3A]" /> {saveLabel}
                    </button>
                    <button type="button" onClick={handleImport}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                        <FileSpreadsheet className="h-3.5 w-3.5" /> Import Excel
                    </button>
                    <button type="button"
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] bg-white dark:bg-[#1e1e1e] dark:border-[#3a3a3a] px-3.5 text-[12px] font-medium text-[#424B56] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors">
                        <Upload className="h-3.5 w-3.5 text-[#A27B3A]" /> Export Template
                    </button>
                </div>
            </div>

            {/* ── Preview & Edit card ── */}
            <div className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] p-5 shadow-xs space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Preview &amp; Edit</p>
                <p className="text-[12px] text-[#9CA3AF]">{note}</p>

                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-[#FAF6F0] [&::-webkit-scrollbar-thumb]:bg-[#D1B88A] [&::-webkit-scrollbar-thumb]:rounded-full">
                    <table className="w-full text-[12px] border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                {columns.map((col) => (
                                    <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {!hasRows ? (
                                <tr>
                                    <td colSpan={columns.length}
                                        className="py-10 text-center text-[12px] text-[#9CA3AF] italic bg-white dark:bg-[#1a1a1a]">
                                        No rows. Import an Excel template to preview here.
                                    </td>
                                </tr>
                            ) : children}
                        </tbody>
                    </table>
                </div>
            </div>

            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
        </div>
    );
}

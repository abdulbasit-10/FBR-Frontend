"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";

interface PrintReportPayload {
    title: string;
    filtersSummary: string;
    columns: string[];
    rows: (string | number)[][];
}

const STORAGE_KEY = "printReportPayload";

const fmtCell = (v: string | number) =>
    typeof v === "number"
        ? v.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : v;

/** Standalone print template for the Reports section — reads its data from sessionStorage
 * (set by the report page's Print button) instead of printing the dashboard layout itself. */
export default function PrintReportPage() {
    const router = useRouter();
    const [payload, setPayload] = useState<PrintReportPayload | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) {
                setError("No report data found. Go back and click Print again.");
                return;
            }
            setPayload(JSON.parse(raw));
        } catch {
            setError("Failed to read report data.");
        }
    }, []);

    if (error) {
        return <div className="p-8 text-center text-sm font-medium text-red-600">{error}</div>;
    }
    if (!payload) {
        return <div className="p-8 text-center text-sm text-neutral-500">Loading report…</div>;
    }

    const generatedAt = new Date().toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });

    return (
        <div className="min-h-screen bg-white text-neutral-900 print:p-0">
            <style>{`
                @page { size: A4 landscape; margin: 12mm; }
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="mx-auto max-w-297 p-8 print:p-0">
                <div className="no-print mb-5 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 rounded bg-[#C69A52] px-4 py-2 text-xs font-medium text-white hover:bg-[#b58b44] cursor-pointer"
                    >
                        <Printer className="h-3.5 w-3.5" /> Print
                    </button>
                </div>

                <header className="flex items-start justify-between border-b-2 border-[#C69A52] pb-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-[#1E293B]">{payload.title}</h1>
                        {payload.filtersSummary && (
                            <p className="mt-1 text-[11px] text-neutral-600">{payload.filtersSummary}</p>
                        )}
                    </div>
                    <p className="text-[11px] text-neutral-500">Generated {generatedAt}</p>
                </header>

                <table className="mt-4 w-full border-collapse text-[11px]">
                    <thead>
                        <tr className="bg-[#C69A52] text-white">
                            {payload.columns.map((col) => (
                                <th key={col} className="border border-[#b58b44] px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {payload.rows.length === 0 ? (
                            <tr>
                                <td colSpan={payload.columns.length} className="border border-neutral-200 py-6 text-center text-neutral-400 italic">
                                    No rows to display.
                                </td>
                            </tr>
                        ) : (
                            payload.rows.map((row, i) => (
                                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FAF6F0]"}>
                                    {row.map((cell, j) => (
                                        <td
                                            key={j}
                                            className={`border border-neutral-200 px-2 py-1 whitespace-nowrap ${typeof cell === "number" ? "text-right font-mono" : "text-left"}`}
                                        >
                                            {fmtCell(cell)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <p className="mt-6 text-[10px] text-neutral-400">
                    {payload.rows.length} row{payload.rows.length === 1 ? "" : "s"} · Encova Solutions FBR Digital Invoicing
                </p>
            </div>
        </div>
    );
}

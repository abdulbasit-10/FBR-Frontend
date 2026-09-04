import * as XLSX from "@e965/xlsx";

/**
 * Build and download an .xlsx file from a header row + array-of-arrays data,
 * matching the same XLSX.js pattern used by import-export-shell.tsx.
 */
export function exportRowsToExcel(
    fileBaseName: string,
    columns: string[],
    rows: (string | number)[][],
): void {
    const ws = XLSX.utils.aoa_to_sheet([columns, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${fileBaseName.replace(/\s+/g, "_")}_${stamp}.xlsx`);
}

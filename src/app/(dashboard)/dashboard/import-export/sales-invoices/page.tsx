"use client";

import { ImportExportShell } from "@/components/dashboard/import-export-shell";

const COLUMNS = [
    "Row", "Sequence No", "Posting Date (MM/DD/YYYY)", "Document Date (MM/DD/YYYY)",
    "Customer No", "Item No", "Item Name", "Qty",
];

const NOTE = "Excel dates are accepted as numbers or text — we normalize them to MM/DD/YYYY. When ready, save to upload the Excel file.";

export default function SalesInvoicesImportExportPage() {
    return (
        <ImportExportShell
            title="Sales Invoices Import/Export"
            saveLabel="Save Invoices"
            note={NOTE}
            columns={COLUMNS}
            hasRows={false}
        />
    );
}

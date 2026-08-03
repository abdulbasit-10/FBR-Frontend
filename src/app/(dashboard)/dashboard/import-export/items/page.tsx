"use client";

import { ImportExportShell } from "@/components/dashboard/import-export-shell";

const COLUMNS = [
    "Row", "Item Name", "Item Type", "Costing Method",
    "Item Category", "HS Code", "FBR UOM", "Sale Type", "Tax Rate", "Province",
];

const NOTE = "Item category must match an existing code (e.g., Cat-01). Import the template, review the grid, then save.";

export default function ItemsImportExportPage() {
    return (
        <ImportExportShell
            title="Items Import/Export"
            saveLabel="Save Items"
            note={NOTE}
            columns={COLUMNS}
            hasRows={false}
        />
    );
}

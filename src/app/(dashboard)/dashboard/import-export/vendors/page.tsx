"use client";

import { ImportExportShell } from "@/components/dashboard/import-export-shell";

const COLUMNS = [
    "Row", "Vendor Name", "Vendor Type", "Address", "City",
    "Post Code", "NTN", "STRN", "Registration Status", "Province", "Email",
];

const NOTE = "Import the Excel template, review the grid, then save. Failed rows are kept so you can fix and retry.";

export default function VendorsImportExportPage() {
    return (
        <ImportExportShell
            title="Vendors Import/Export"
            saveLabel="Save Vendors"
            note={NOTE}
            columns={COLUMNS}
            hasRows={false}
        />
    );
}

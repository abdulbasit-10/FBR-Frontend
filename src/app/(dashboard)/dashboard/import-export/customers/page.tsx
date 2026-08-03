"use client";

import { ImportExportShell } from "@/components/dashboard/import-export-shell";

const COLUMNS = [
    "Row", "Customer Name", "Customer Type", "Address", "City",
    "Post Code", "NTN/CNIC", "STRN", "Registration Status", "Province",
];

const NOTE = "Import the Excel template, review the grid, then save. Failed rows are kept so you can fix and retry.";

export default function CustomersImportExportPage() {
    return (
        <ImportExportShell
            title="Customers Import/Export"
            saveLabel="Save Customer"
            note={NOTE}
            columns={COLUMNS}
            hasRows={false}
        />
    );
}

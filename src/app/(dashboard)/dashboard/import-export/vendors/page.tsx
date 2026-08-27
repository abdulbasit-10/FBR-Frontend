"use client";

import { useRouter } from "next/navigation";
import { ImportExportShell } from "@/components/dashboard/import-export-shell";
import { vendorsService, type VendorCreateInput } from "@/lib/services";
import { toast } from "react-toastify";

const COLUMNS = [
    "Row", "Vendor Name", "Vendor Type", "Address", "City", "Post Code",
    "NTN", "STRN", "Registration Status", "Province",
    "Contact Person", "Phone Number", "WhatsApp", "Email", "Website",
];

const NOTE = "Import the Excel template, review the grid, then save. Failed rows are kept so you can fix and retry.";

export default function VendorsImportExportPage() {
    const router = useRouter();

    const handleSave = async (rows: Record<string, string>[]) => {
        let created = 0;
        let failed = 0;

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const name = r["Vendor Name"] || r["vendor name"] || "";
            const province = r["Province"] || r["province"] || "";
            const address = [r["Address"] || "", r["City"] || "", r["Post Code"] || ""]
                .filter(Boolean).join(", ");

            if (!name || !province) {
                failed++;
                toast.error(`Row ${i + 1}: "Vendor Name" and "Province" are required — skipped.`);
                continue;
            }

            const regRaw = (r["Registration Status"] || "").toLowerCase();
            const registrationType: VendorCreateInput["registrationType"] =
                regRaw === "registered" ? "Registered" : "Unregistered";

            const typeRaw = (r["Vendor Type"] || "").toLowerCase();
            const vendorType: VendorCreateInput["vendorType"] =
                typeRaw === "individual" ? "Individual" : "Company";

            const payload: VendorCreateInput = {
                businessName: name,
                registrationType,
                vendorType,
                province,
                address: address || province,
                ntnCnic: r["NTN"] || null,
                strn: r["STRN"] || null,
                contactPerson: r["Contact Person"] || null,
                phone: r["Phone Number"] || null,
                whatsapp: r["WhatsApp"] || null,
                email: r["Email"] || null,
                website: r["Website"] || null,
                isActive: true,
            };

            try {
                await vendorsService.create(payload);
                created++;
            } catch (err) {
                failed++;
                toast.error(`Row ${i + 1} (${name}): ${err instanceof Error ? err.message : "Failed"}`);
            }
        }

        if (created > 0) {
            toast.success(`${created} vendor(s) imported successfully.`, { autoClose: 6000 });
            setTimeout(() => router.push("/dashboard/vendors"), 1500);
        }
        if (failed > 0 && created === 0) {
            toast.error(`All ${failed} row(s) failed to import. Fix the errors and try again.`);
        }
    };

    return (
        <ImportExportShell
            title="Vendors Import/Export"
            saveLabel="Save Vendors"
            note={NOTE}
            columns={COLUMNS}
            templateUrl="/templates/Vendors_Template.xlsx"
            onSave={handleSave}
        />
    );
}

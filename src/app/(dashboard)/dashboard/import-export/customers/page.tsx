"use client";

import { useRouter } from "next/navigation";
import { ImportExportShell } from "@/components/dashboard/import-export-shell";
import { customersService, type CustomerCreateInput } from "@/lib/services";
import { toast } from "react-toastify";

const COLUMNS = [
    "Row", "Customer Name", "Customer Type", "Address", "City", "Post Code",
    "NTN/CNIC", "STRN", "Registration Status", "Province",
    "Contact", "Contact Person", "Phone Number", "WhatsApp Number", "Email", "Website", "Mapping ID",
];

const NOTE = "Import the Excel template, review the grid, then save. Failed rows are kept so you can fix and retry.";

export default function CustomersImportExportPage() {
    const router = useRouter();

    const handleSave = async (rows: Record<string, string>[]) => {
        let created = 0;
        let failed = 0;

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const name = r["Customer Name"] || r["customer name"] || "";
            const province = r["Province"] || r["province"] || "";
            const address = [r["Address"] || "", r["City"] || "", r["Post Code"] || ""]
                .filter(Boolean).join(", ");

            if (!name || !province) {
                failed++;
                toast.error(`Row ${i + 1}: "Customer Name" and "Province" are required — skipped.`);
                continue;
            }

            const regRaw = (r["Registration Status"] || "").toLowerCase();
            const registrationType: CustomerCreateInput["registrationType"] =
                regRaw === "registered" ? "Registered" : "Unregistered";

            const typeRaw = (r["Customer Type"] || "").toLowerCase();
            const customerType: CustomerCreateInput["customerType"] =
                typeRaw === "company" ? "Company" : "Individual";

            const payload: CustomerCreateInput = {
                businessName: name,
                registrationType,
                customerType,
                province,
                address: address || province,
                ntnCnic: r["NTN/CNIC"] || null,
                strn: r["STRN"] || null,
                contact: r["Contact"] || null,
                contactPerson: r["Contact Person"] || null,
                phone: r["Phone Number"] || null,
                whatsapp: r["WhatsApp Number"] || null,
                email: r["Email"] || null,
                website: r["Website"] || null,
                mappingId: r["Mapping ID"] || null,
                isActive: true,
            };

            try {
                await customersService.create(payload);
                created++;
            } catch (err) {
                failed++;
                toast.error(`Row ${i + 1} (${name}): ${err instanceof Error ? err.message : "Failed"}`);
            }
        }

        if (created > 0) {
            toast.success(`${created} customer(s) imported successfully.`, { autoClose: 6000 });
            setTimeout(() => router.push("/dashboard/customers"), 1500);
        }
        if (failed > 0 && created === 0) {
            toast.error(`All ${failed} row(s) failed to import. Fix the errors and try again.`);
        }
    };

    return (
        <ImportExportShell
            title="Customers Import/Export"
            saveLabel="Save Customers"
            note={NOTE}
            columns={COLUMNS}
            templateUrl="/templates/Customers_Template.xlsx"
            onSave={handleSave}
        />
    );
}

"use client";

import { useRouter } from "next/navigation";
import { ImportExportShell } from "@/components/dashboard/import-export-shell";
import { productsService, type ProductCreateInput } from "@/lib/services";
import { toast } from "react-toastify";

const COLUMNS = [
    "Row", "Item Name", "Item Type", "Item Category", "HS Code", "FBR UOM",
    "Sale Type", "Tax Rate", "Tax Description",
    "SRO Schedule No", "SRO Item Serial No",
    "Unit Cost", "Assessed Unit", "Sales Price", "Retail Price", "Print UOM", "Mapping ID",
];

const NOTE =
    "HS Code and FBR UOM must match FBR reference data. " +
    "Tax Rate should be a numeric percentage e.g. 17 or 0. " +
    "Item category must match an existing code (e.g., Cat-01). Import the template, review the grid, then save.";

export default function ItemsImportExportPage() {
    const router = useRouter();

    const handleSave = async (rows: Record<string, string>[]) => {
        let created = 0;
        let failed = 0;

        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const name = r["Item Name"] || r["item name"] || "";
            const hsCode = r["HS Code"] || r["hs code"] || r["Hs Code"] || "";
            const uom = r["FBR UOM"] || r["fbr uom"] || r["UOM"] || "";
            const saleType = r["Sale Type"] || r["sale type"] || "Exempt";
            const taxRateRaw = parseFloat(r["Tax Rate"] || r["tax rate"] || "0") || 0;
            const rate = `${taxRateRaw}%`;

            if (!name || !hsCode || !uom) {
                failed++;
                toast.error(`Row ${i + 1}: "Item Name", "HS Code", and "FBR UOM" are required — skipped.`);
                continue;
            }

            const payload: ProductCreateInput = {
                name,
                itemType: r["Item Type"] || null,
                itemCategory: r["Item Category"] || null,
                hsCode,
                uom,
                saleType,
                rate,
                rateValue: taxRateRaw,
                taxDescription: r["Tax Description"] || null,
                sroScheduleNo: r["SRO Schedule No"] || null,
                sroItemSerialNo: r["SRO Item Serial No"] || null,
                unitPrice: parseFloat(r["Unit Cost"] || "0") || 0,
                assessedUnitCost: parseFloat(r["Assessed Unit"] || "") || null,
                salesPrice: parseFloat(r["Sales Price"] || "") || null,
                fixedNotifiedValueOrRetailPrice: parseFloat(r["Retail Price"] || "0") || 0,
                printUom: r["Print UOM"] || null,
                mappingId: r["Mapping ID"] || null,
                isActive: true,
            };

            try {
                await productsService.create(payload);
                created++;
            } catch (err) {
                failed++;
                toast.error(`Row ${i + 1} (${name}): ${err instanceof Error ? err.message : "Failed"}`);
            }
        }

        if (created > 0) {
            toast.success(`${created} item(s) imported successfully.`, { autoClose: 6000 });
            setTimeout(() => router.push("/dashboard/items"), 1500);
        }
        if (failed > 0 && created === 0) {
            toast.error(`All ${failed} row(s) failed to import. Fix the errors and try again.`);
        }
    };

    return (
        <ImportExportShell
            title="Items Import/Export"
            saveLabel="Save Items"
            note={NOTE}
            columns={COLUMNS}
            templateUrl="/templates/Items_Template.xlsx"
            onSave={handleSave}
        />
    );
}

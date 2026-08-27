"use client";

import { useRouter } from "next/navigation";
import { ImportExportShell } from "@/components/dashboard/import-export-shell";
import { customersService, productsService, invoicesService } from "@/lib/services";
import type { Product } from "@/lib/services/products.service";
import { toast } from "react-toastify";

const COLUMNS = [
    "Row",
    "Sequence No", "Document Date", "Posting Date", "Advance Tax %", "Invoice Mapping ID",
    "Customer No", "Customer Name", "Customer NTN", "NTN Province", "Customer STRN",
    "Customer Type", "Customer Registered", "Customer Email", "Customer Phone", "Customer Address",
    "Item No", "Item Name", "HS Code", "Sale Type", "Rate ID", "Rate Description", "Tax Rate Value",
    "FBR UOM", "Print UOM", "SRO Schedule No", "SRO Item Serial No",
    "Unit Cost", "Assessed Unit", "Retail Price", "Quantity", "Disc %", "FED %", "Further Tax %",
];

const NOTE =
    "Each unique Sequence No becomes one draft invoice. Customers and items are looked up first; " +
    "if not found they are created automatically. Invoices are NOT sent to FBR until you post them.";

function toIso(date: string): string {
    if (!date) return new Date().toISOString().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parts = date.split("/");
    if (parts.length === 3) return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
    return date;
}

/** Lookup or create customer. Returns numeric customer id or null on failure. */
async function ensureCustomer(r: Record<string, string>): Promise<number | null> {
    const customerNo = r["Customer No"] || "";
    const name = r["Customer Name"] || "";
    if (!name) return null;

    try {
        const res = await customersService.list({ search: customerNo || name, limit: 10 });
        const match = res.data.rows.find(
            (c) =>
                (customerNo && c.customerNo?.toLowerCase() === customerNo.toLowerCase()) ||
                c.businessName?.toLowerCase() === name.toLowerCase(),
        );
        if (match) return match.id;
    } catch { /* fall through to create */ }

    const province = r["NTN Province"] || "Islamabad";
    const address = r["Customer Address"]?.trim() || province;
    const regRaw = (r["Customer Registered"] || "").toLowerCase();

    try {
        const created = await customersService.create({
            businessName: name,
            registrationType: regRaw === "registered" ? "Registered" : "Unregistered",
            customerType: (r["Customer Type"] || "").toLowerCase() === "individual" ? "Individual" : "Company",
            province,
            address: address.length >= 2 ? address : province,
            ntnCnic: r["Customer NTN"] || null,
            strn: r["Customer STRN"] || null,
            email: r["Customer Email"] || null,
            phone: r["Customer Phone"] || null,
            isActive: true,
        });
        return created.data.id;
    } catch {
        return null;
    }
}

/** Lookup or create product. Returns Product or null on failure. */
async function ensureProduct(r: Record<string, string>): Promise<Product | null> {
    const itemNo = r["Item No"] || "";
    const itemName = r["Item Name"] || "";
    const hsCode = r["HS Code"] || "";
    if (!itemName) return null;

    try {
        const res = await productsService.list({ search: itemNo || itemName, limit: 10 });
        const rows = res.data.rows;
        const byMapping = rows.find((p) => itemNo && p.mappingId?.toLowerCase() === itemNo.toLowerCase());
        if (byMapping) return byMapping;
        const byName = rows.find((p) => p.name?.toLowerCase() === itemName.toLowerCase());
        if (byName) return byName;
    } catch { /* fall through to create */ }

    if (!hsCode) return null; // hsCode required by backend

    const taxRateVal = parseFloat(r["Tax Rate Value"] || "0") || 0;

    try {
        const created = await productsService.create({
            name: itemName,
            hsCode,
            uom: r["FBR UOM"] || "PCS",
            saleType: r["Sale Type"] || "Exempt",
            rate: r["Rate Description"] || `${taxRateVal}%`,
            rateId: r["Rate ID"] || null,
            rateValue: taxRateVal,
            printUom: r["Print UOM"] || null,
            sroScheduleNo: r["SRO Schedule No"] || null,
            sroItemSerialNo: r["SRO Item Serial No"] || null,
            mappingId: itemNo || null,
            unitPrice: 0,
            isActive: true,
        });
        return created.data;
    } catch {
        return null;
    }
}

export default function MasterImportPage() {
    const router = useRouter();

    const handleSave = async (rows: Record<string, string>[]) => {
        // Group rows by Sequence No
        const groups = new Map<string, Record<string, string>[]>();
        for (const row of rows) {
            const seq = row["Sequence No"] || "0";
            if (!groups.has(seq)) groups.set(seq, []);
            groups.get(seq)!.push(row);
        }

        let created = 0;
        let failed = 0;

        for (const [seq, groupRows] of groups) {
            const firstRow = groupRows[0];
            const docDate = toIso(firstRow["Document Date"] || "");
            const postingDate = toIso(firstRow["Posting Date"] || "");
            const advanceTaxPct = parseFloat(firstRow["Advance Tax %"] || "0") || 0;
            const invoiceMappingId = firstRow["Invoice Mapping ID"] || null;

            // Ensure customer exists
            const customerId = await ensureCustomer(firstRow);
            if (!customerId) {
                failed++;
                toast.error(`Seq ${seq}: customer "${firstRow["Customer Name"] || firstRow["Customer No"]}" could not be found or created — skipped.`);
                continue;
            }

            // Build line items, creating products as needed
            let totalValueExclST = 0;
            const items = await Promise.all(groupRows.map(async (r) => {
                const qty         = parseFloat(r["Quantity"] || "1") || 1;
                const unitPrice   = parseFloat(r["Unit Cost"] || "0") || 0;
                const retailPrice = parseFloat(r["Retail Price"] || "0") || 0;
                const assessedUnit = parseFloat(r["Assessed Unit"] || "0") || 0;
                const discPct     = parseFloat(r["Disc %"] || "0") || 0;
                const stPct       = parseFloat(r["Tax Rate Value"] || "0") || 0;
                const fedPct      = parseFloat(r["FED %"] || "0") || 0;
                const ftPct       = parseFloat(r["Further Tax %"] || "0") || 0;
                const itemName    = r["Item Name"] || "Imported Item";

                const discount           = parseFloat((qty * unitPrice * discPct / 100).toFixed(4));
                const valueSalesExclST   = parseFloat((qty * unitPrice - discount).toFixed(4));
                const salesTaxApplicable = parseFloat((valueSalesExclST * stPct / 100).toFixed(4));
                const extraTax           = parseFloat((valueSalesExclST * fedPct / 100).toFixed(4));
                const furtherTax         = parseFloat((valueSalesExclST * ftPct / 100).toFixed(4));
                totalValueExclST += valueSalesExclST;

                const product = await ensureProduct(r);

                return {
                    productId: product?.id ?? null,
                    hsCode: product?.hsCode ?? r["HS Code"] ?? "0000.0000",
                    productDescription: itemName,
                    rate: product?.rate ?? `${stPct}%`,
                    uom: product?.uom ?? r["FBR UOM"] ?? "PCS",
                    quantity: qty,
                    unitPrice,
                    fixedNotifiedValueOrRetailPrice: retailPrice || assessedUnit,
                    discountPercent: discPct,
                    discount,
                    valueSalesExcludingST: valueSalesExclST,
                    salesTaxApplicable,
                    extraTax,
                    furtherTax,
                    saleType: product?.saleType ?? r["Sale Type"] ?? "Exempt",
                    sroScheduleNo: product?.sroScheduleNo ?? r["SRO Schedule No"] ?? null,
                    sroItemSerialNo: product?.sroItemSerialNo ?? r["SRO Item Serial No"] ?? null,
                };
            }));

            const advanceTax = parseFloat((totalValueExclST * advanceTaxPct / 100).toFixed(4));

            try {
                await invoicesService.create({
                    customerId,
                    invoiceDate: docDate,
                    postingDate,
                    advanceTax,
                    mappingId: invoiceMappingId,
                    notes: `Imported via Master Import — Sequence No: ${seq}`,
                    items,
                });
                created++;
            } catch (err) {
                failed++;
                toast.error(`Seq ${seq}: ${err instanceof Error ? err.message : "Failed to create invoice"}`);
            }
        }

        if (created > 0) {
            toast.success(
                `${created} draft invoice(s) created. Go to Transactions → Sales to review and post them to FBR.`,
                { autoClose: 8000 },
            );
            setTimeout(() => router.push("/dashboard/transactions/sales"), 2000);
        }
        if (failed > 0 && created === 0) {
            toast.error(`All ${failed} invoice group(s) failed. Fix the errors and try again.`);
        }
    };

    return (
        <ImportExportShell
            title="Master Import"
            saveLabel="Save as Draft"
            note={NOTE}
            columns={COLUMNS}
            templateUrl="/templates/sales-invoice-import-with-masters-template.xlsx"
            onSave={handleSave}
        />
    );
}
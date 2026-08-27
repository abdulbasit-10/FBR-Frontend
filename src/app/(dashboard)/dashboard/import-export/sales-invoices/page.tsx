"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImportExportShell } from "@/components/dashboard/import-export-shell";
import { customersService, invoicesService, productsService } from "@/lib/services";
import type { Product } from "@/lib/services/products.service";
import { toast } from "react-toastify";

const COLUMNS = [
    "Row", "Sequence No", "Posting Date", "Document Date",
    "Customer No", "Item No", "Item Name", "Qty",
    "Unit Price", "Retail Price", "Disc %", "Sales Tax %",
    "Further Tax %", "Advance Tax %", "Mapping ID",
];

const NOTE =
    "Each unique Sequence No becomes one draft invoice. Invoices are saved to the database only — " +
    "they are NOT sent to FBR until you open them in Transactions → Sales and click Post. " +
    "Excel dates are accepted as numbers or text (MM/DD/YYYY).";

/** Convert MM/DD/YYYY or YYYY-MM-DD to YYYY-MM-DD */
function toIso(date: string): string {
    if (!date) return new Date().toISOString().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parts = date.split("/");
    if (parts.length === 3) return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
    return date;
}

/** Look up a product by mappingId or name. Returns null if not found. */
async function lookupProduct(itemNo: string, itemName: string): Promise<Product | null> {
    try {
        const term = itemNo || itemName;
        if (!term) return null;
        const res = await productsService.list({ search: term, limit: 5 });
        const rows = res.data.rows;
        const byMapping = rows.find((p) => p.mappingId?.toLowerCase() === itemNo.toLowerCase());
        if (byMapping) return byMapping;
        const byName = rows.find((p) => p.name?.toLowerCase() === itemName.toLowerCase());
        return byName ?? rows[0] ?? null;
    } catch {
        return null;
    }
}

export default function SalesInvoicesImportExportPage() {
    const router = useRouter();
    const [_state] = useState(null); // keeps client component boundary

    const handleSave = async (rows: Record<string, string>[]) => {
        // Group rows by Sequence No — each unique seq becomes one invoice
        const groups = new Map<string, Record<string, string>[]>();
        for (const row of rows) {
            const seq = row["Sequence No"] || row["Sequence no"] || row["sequence no"] || "0";
            if (!groups.has(seq)) groups.set(seq, []);
            groups.get(seq)!.push(row);
        }

        let created = 0;
        let failed = 0;

        for (const [seq, groupRows] of groups) {
            const firstRow = groupRows[0];
            const customerNo = firstRow["Customer No"] || firstRow["Customer no"] || "";
            const docDate = toIso(firstRow["Document Date"] || firstRow["Document Date (MM/DD/YYYY)"] || "");
            const postingDate = toIso(firstRow["Posting Date"] || firstRow["Posting Date (MM/DD/YYYY)"] || "");
            const advanceTaxPct = parseFloat(firstRow["Advance Tax %"] || "0") || 0;
            const mappingId = firstRow["Mapping ID"] || null;

            // Look up customer
            let customerId: number | null = null;
            try {
                const res = await customersService.list({ search: customerNo, limit: 5 });
                const match = res.data.rows.find(
                    (c) => c.customerNo?.toLowerCase() === customerNo.toLowerCase() ||
                           c.businessName?.toLowerCase() === customerNo.toLowerCase(),
                );
                if (match) customerId = match.id;
            } catch { /* skip */ }

            if (!customerId) {
                failed++;
                toast.error(`Seq ${seq}: customer "${customerNo}" not found — skipped.`);
                continue;
            }

            // Build line items
            let totalValueExclST = 0;
            const items = await Promise.all(groupRows.map(async (r) => {
                const qty         = parseFloat(r["Qty"] || "1") || 1;
                const unitPrice   = parseFloat(r["Unit Price"] || "0") || 0;
                const retailPrice = parseFloat(r["Retail Price"] || "0") || 0;
                const discPct     = parseFloat(r["Disc %"] || "0") || 0;
                const stPct       = parseFloat(r["Sales Tax %"] || "0") || 0;
                const ftPct       = parseFloat(r["Further Tax %"] || "0") || 0;
                const itemNo      = r["Item No"] || r["Item no"] || "";
                const itemName    = r["Item Name"] || r["Item name"] || "Imported Item";

                const discount           = parseFloat((qty * unitPrice * discPct / 100).toFixed(4));
                const valueSalesExclST   = parseFloat((qty * unitPrice - discount).toFixed(4));
                const salesTaxApplicable = parseFloat((valueSalesExclST * stPct / 100).toFixed(4));
                const furtherTax         = parseFloat((valueSalesExclST * ftPct / 100).toFixed(4));
                totalValueExclST += valueSalesExclST;

                const product = await lookupProduct(itemNo, itemName);

                return {
                    productId: product?.id ?? null,
                    hsCode: product?.hsCode ?? "0000.0000",
                    productDescription: itemName,
                    rate: product?.rate ?? `${stPct}%`,
                    uom: product?.uom ?? "PCS",
                    quantity: qty,
                    unitPrice,
                    fixedNotifiedValueOrRetailPrice: retailPrice,
                    discountPercent: discPct,
                    discount,
                    valueSalesExcludingST: valueSalesExclST,
                    salesTaxApplicable,
                    furtherTax,
                    saleType: product?.saleType ?? "Exempt",
                    sroScheduleNo: product?.sroScheduleNo ?? null,
                    sroItemSerialNo: product?.sroItemSerialNo ?? null,
                };
            }));

            const advanceTax = parseFloat((totalValueExclST * advanceTaxPct / 100).toFixed(4));

            try {
                await invoicesService.create({
                    customerId,
                    invoiceDate: docDate,
                    postingDate,
                    advanceTax,
                    mappingId,
                    notes: `Imported from Excel — Sequence No: ${seq}`,
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
            toast.error(`All ${failed} invoice group(s) failed to import.`);
        }
    };

    return (
        <ImportExportShell
            title="Sales Invoices Import/Export"
            saveLabel="Save as Draft"
            note={NOTE}
            columns={COLUMNS}
            templateUrl="/templates/Invoices_Template.xlsx"
            onSave={handleSave}
        />
    );
}
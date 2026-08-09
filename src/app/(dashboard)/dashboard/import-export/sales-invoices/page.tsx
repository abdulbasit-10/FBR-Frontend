"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImportExportShell } from "@/components/dashboard/import-export-shell";
import { customersService, invoicesService } from "@/lib/services";
import { toast } from "react-toastify";

const COLUMNS = [
    "Row", "Sequence No", "Posting Date (MM/DD/YYYY)", "Document Date (MM/DD/YYYY)",
    "Customer No", "Item No", "Item Name", "Qty",
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

export default function SalesInvoicesImportExportPage() {
    const router = useRouter();

    const handleSave = async (rows: Record<string, string>[]) => {
        // Group rows by "Sequence No" — each unique seq = one invoice
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
            const docDate = toIso(firstRow["Document Date (MM/DD/YYYY)"] || firstRow["Document Date"] || "");
            const postingDate = toIso(firstRow["Posting Date (MM/DD/YYYY)"] || firstRow["Posting Date"] || "");

            // Look up customer by customerNo via search
            let customerId: number | null = null;
            try {
                const res = await customersService.list({ search: customerNo, limit: 5 });
                const match = res.data.rows.find(
                    (c) => c.customerNo?.toLowerCase() === customerNo.toLowerCase() ||
                           c.businessName?.toLowerCase() === customerNo.toLowerCase(),
                );
                if (match) customerId = match.id;
            } catch {
                // customer lookup failed — skip this group
            }

            if (!customerId) {
                failed++;
                toast.error(`Seq ${seq}: customer "${customerNo}" not found — skipped.`);
                continue;
            }

            // Build line items from the group rows
            const items = groupRows.map((r) => {
                const qty = parseFloat(r["Qty"] || r["qty"] || "1") || 1;
                const description = r["Item Name"] || r["Item name"] || r["item name"] || "Imported Item";
                return {
                    productDescription: description,
                    hsCode: "0000.0000",   // placeholder — user should update before posting
                    rate: "0%",
                    uom: "PCS",
                    quantity: qty,
                    valueSalesExcludingST: 0, // placeholder
                    salesTaxApplicable: 0,
                    saleType: "Exempt",
                };
            });

            try {
                await invoicesService.create({
                    customerId,
                    invoiceDate: docDate,
                    postingDate,
                    // environment not passed → inherits company's fbrEnvironment (default: sandbox)
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
                { autoClose: 8000 }
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
            onSave={handleSave}
        />
    );
}

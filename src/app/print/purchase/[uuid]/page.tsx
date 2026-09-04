"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { purchasesService, type Purchase } from "@/lib/services/purchases.service";

/** Standalone read-only view of a Purchase Invoice, reached via the "View" row action. */
export default function PrintPurchasePage(
    { params }: { params: Promise<{ uuid: string }> },
) {
    const { uuid } = usePromise(params);
    const router = useRouter();
    const [purchase, setPurchase] = useState<Purchase | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        purchasesService
            .getOne(uuid)
            .then((res) => setPurchase(res.data))
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load purchase invoice"));
    }, [uuid]);

    if (error) {
        return <div className="p-8 text-center text-red-600 text-sm font-medium">{error}</div>;
    }
    if (!purchase) {
        return <div className="p-8 text-center text-sm text-neutral-500">Loading purchase invoice…</div>;
    }

    const fmt = (n: number) =>
        (Number(n) || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="min-h-screen bg-white text-neutral-900 print:p-0">
            <style>{`
                @page { size: A4; margin: 12mm; }
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="mx-auto max-w-205 p-8 print:p-0">
                <div className="no-print mb-5 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
                    >
                        <ArrowLeft className="h-4 w-4" /> View Purchase Invoice
                    </button>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                        <Printer className="h-3.5 w-3.5" /> Print
                    </button>
                </div>

                {/* HEADER */}
                <header className="flex items-start justify-between border-b-2 border-neutral-800 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{purchase.vendorBusinessName}</h1>
                        <p className="mt-1 text-xs text-neutral-600">
                            {purchase.vendorAddress}, {purchase.vendorProvince}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-600">
                            NTN/CNIC: <span className="font-medium">{purchase.vendorNtnCnic ?? "—"}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-semibold uppercase tracking-wide">{purchase.purchaseType}</h2>
                        <p className="mt-1 text-[11px] text-neutral-500 uppercase tracking-wider">Invoice No</p>
                        <p className="font-mono text-sm font-bold">
                            {purchase.purchaseNo ?? `PI-${String(purchase.id).padStart(4, "0")}`}
                        </p>
                    </div>
                </header>

                {/* DETAILS */}
                <section className="mt-4 grid grid-cols-2 gap-8 text-xs">
                    <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Vendor Details</p>
                        <p className="text-neutral-700">Vendor Invoice No: {purchase.vendorInvoiceNo ?? "—"}</p>
                        <p className="text-neutral-700">Registration: {purchase.vendorRegistrationType ?? "—"}</p>
                    </div>
                    <div className="text-right">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Invoice Details</p>
                        <p><span className="text-neutral-500">Doc Date: </span><span className="font-medium">{purchase.docDate?.slice(0, 10)}</span></p>
                        <p><span className="text-neutral-500">Posting Date: </span><span className="font-medium">{(purchase.postingDate ?? "—")?.slice(0, 10)}</span></p>
                        {purchase.poNumber && <p><span className="text-neutral-500">PO Number: </span><span className="font-medium">{purchase.poNumber}</span></p>}
                        <p><span className="text-neutral-500">Status: </span><span className="font-medium uppercase">{purchase.status}</span></p>
                    </div>
                </section>

                {/* ITEMS */}
                <section className="mt-5">
                    <table className="w-full border-collapse text-[11px]">
                        <thead>
                            <tr className="border-b-2 border-neutral-800 bg-neutral-50 text-left">
                                <th className="py-2 px-2 font-semibold">#</th>
                                <th className="py-2 px-2 font-semibold">Description</th>
                                <th className="py-2 px-2 font-semibold">HS Code</th>
                                <th className="py-2 px-2 font-semibold">UOM</th>
                                <th className="py-2 px-2 text-right font-semibold">Qty</th>
                                <th className="py-2 px-2 text-right font-semibold">Unit Price</th>
                                <th className="py-2 px-2 text-right font-semibold">Value Excl. ST</th>
                                <th className="py-2 px-2 text-right font-semibold">Sales Tax</th>
                                <th className="py-2 px-2 text-right font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(purchase.items ?? []).map((it) => (
                                <tr key={it.id} className="border-b border-neutral-200 align-top">
                                    <td className="py-2 px-2">{it.itemSrNo}</td>
                                    <td className="py-2 px-2 font-medium">{it.productDescription}</td>
                                    <td className="py-2 px-2 font-mono">{it.hsCode ?? "—"}</td>
                                    <td className="py-2 px-2">{it.uom}</td>
                                    <td className="py-2 px-2 text-right">{Number(it.quantity)}</td>
                                    <td className="py-2 px-2 text-right">{fmt(it.unitPrice)}</td>
                                    <td className="py-2 px-2 text-right">{fmt(it.valueExcludingST)}</td>
                                    <td className="py-2 px-2 text-right">{fmt(it.salesTaxApplicable)}</td>
                                    <td className="py-2 px-2 text-right font-medium">{fmt(it.valueIncludingST)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* TOTALS */}
                <section className="mt-5 flex justify-end">
                    <div className="min-w-60 rounded border border-neutral-300 p-3 text-[11px]">
                        {[
                            ["Assessed value", purchase.assessedValue],
                            ["Discount", purchase.totalDiscount],
                            ["Value excl. sales tax", purchase.totalValueExcludingST],
                            ["Sales tax", purchase.totalSalesTax],
                            ["Further tax", purchase.totalFurtherTax],
                            ["Extra tax", purchase.totalExtraTax],
                            ["FED payable", purchase.totalFedPayable],
                            ["Advance tax", purchase.advanceTax],
                        ].map(([label, value]) => (
                            <div key={label as string} className="flex justify-between py-0.5">
                                <span className="text-neutral-600">{label}</span>
                                <span className="font-medium">{fmt(value as number)}</span>
                            </div>
                        ))}
                        <div className="mt-2 flex justify-between border-t-2 border-neutral-800 pt-2 font-bold">
                            <span>Grand Total</span>
                            <span>{fmt(Number(purchase.totalValueIncludingST) + Number(purchase.advanceTax))}</span>
                        </div>
                    </div>
                </section>

                {purchase.notes && (
                    <section className="mt-4 text-[11px]">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Notes</p>
                        <p className="text-neutral-700 whitespace-pre-line">{purchase.notes}</p>
                    </section>
                )}

                <footer className="mt-6 border-t border-neutral-300 pt-3 text-[10px] text-neutral-500 flex justify-between">
                    <span>Purchase UUID: {purchase.uuid}</span>
                    <span>Status: <span className="font-semibold uppercase">{purchase.status}</span></span>
                </footer>
            </div>
        </div>
    );
}

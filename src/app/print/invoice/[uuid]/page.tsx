"use client";

import { useEffect, useState, use as usePromise } from "react";
import Image from "next/image";
import { QRCodeCanvas } from "qrcode.react";
import { invoicesService, type Invoice } from "@/lib/services/invoices.service";

/**
 * Standalone printable invoice page (spec §6).
 * Includes the mandatory FBR Digital Invoicing System logo and a
 * QR Code (Version 2 / 25×25, 1.0 × 1.0 inch) encoding the FBR
 * invoice number. Auto-invokes window.print() on load.
 */
export default function PrintInvoicePage(
    { params }: { params: Promise<{ uuid: string }> },
) {
    const { uuid } = usePromise(params);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        invoicesService
            .getOne(uuid)
            .then((res) => setInvoice(res.data))
            .catch((e) => setError(e instanceof Error ? e.message : "Failed to load invoice"));
    }, [uuid]);

    useEffect(() => {
        if (invoice) {
            const t = setTimeout(() => window.print(), 400);
            return () => clearTimeout(t);
        }
    }, [invoice]);

    if (error) {
        return (
            <div className="p-8 text-center text-red-600 text-sm font-medium">{error}</div>
        );
    }
    if (!invoice) {
        return <div className="p-8 text-center text-sm text-neutral-500">Loading invoice…</div>;
    }

    const fmt = (n: number) =>
        (Number(n) || 0).toLocaleString("en-PK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const qrValue = invoice.fbrInvoiceNumber ?? invoice.uuid;

    return (
        <div className="min-h-screen bg-white text-neutral-900 print:p-0">
            <style>{`
                @page { size: A4; margin: 12mm; }
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="mx-auto max-w-[820px] p-8 print:p-0">
                {/* ── HEADER ── */}
                <header className="flex items-start justify-between border-b-2 border-neutral-800 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {invoice.sellerBusinessName}
                        </h1>
                        <p className="mt-1 text-xs text-neutral-600">
                            {invoice.sellerAddress}, {invoice.sellerProvince}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-600">
                            NTN: <span className="font-medium">{invoice.sellerNtnCnic}</span>
                        </p>
                    </div>

                    {/* FBR Digital Invoicing System logo (mandatory, spec §6). */}
                    <div className="flex flex-col items-end gap-1.5">
                        <Image
                            src="/brand/fbr-di-logo.svg"
                            alt="FBR Digital Invoicing System"
                            width={140}
                            height={56}
                            priority
                        />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                            {invoice.environment === "production" ? "Live" : "Sandbox"}
                        </span>
                    </div>
                </header>

                {/* ── TITLE STRIP ── */}
                <div className="mt-5 flex items-center justify-between">
                    <h2 className="text-lg font-semibold uppercase tracking-wide">
                        {invoice.invoiceType}
                    </h2>
                    <div className="text-right">
                        <p className="text-[11px] text-neutral-500 uppercase tracking-wider">
                            FBR Invoice Number
                        </p>
                        <p className="font-mono text-sm font-bold">
                            {invoice.fbrInvoiceNumber ?? "— Not posted —"}
                        </p>
                    </div>
                </div>

                {/* ── PARTIES ── */}
                <section className="mt-4 grid grid-cols-2 gap-8 text-xs">
                    <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                            Buyer
                        </p>
                        <p className="font-semibold text-neutral-900">
                            {invoice.buyerBusinessName}
                        </p>
                        <p className="text-neutral-700">{invoice.buyerAddress}</p>
                        <p className="text-neutral-700">Province: {invoice.buyerProvince}</p>
                        <p className="text-neutral-700">
                            NTN/CNIC: {invoice.buyerNtnCnic ?? "—"} ·{" "}
                            <span className="font-medium">{invoice.buyerRegistrationType}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                            Invoice Details
                        </p>
                        <p>
                            <span className="text-neutral-500">Date: </span>
                            <span className="font-medium">{invoice.invoiceDate}</span>
                        </p>
                        {invoice.invoiceRefNo && (
                            <p>
                                <span className="text-neutral-500">Ref Invoice: </span>
                                <span className="font-mono font-medium">{invoice.invoiceRefNo}</span>
                            </p>
                        )}
                        {invoice.scenarioId && (
                            <p>
                                <span className="text-neutral-500">Scenario: </span>
                                <span className="font-medium">{invoice.scenarioId}</span>
                            </p>
                        )}
                        {invoice.fbrDated && (
                            <p>
                                <span className="text-neutral-500">Posted: </span>
                                <span className="font-medium">
                                    {new Date(invoice.fbrDated).toLocaleString()}
                                </span>
                            </p>
                        )}
                    </div>
                </section>

                {/* ── ITEMS TABLE ── */}
                <section className="mt-5">
                    <table className="w-full border-collapse text-[11px]">
                        <thead>
                            <tr className="border-b-2 border-neutral-800 bg-neutral-50 text-left">
                                <th className="py-2 px-2 font-semibold">#</th>
                                <th className="py-2 px-2 font-semibold">Description</th>
                                <th className="py-2 px-2 font-semibold">HS Code</th>
                                <th className="py-2 px-2 font-semibold">UOM</th>
                                <th className="py-2 px-2 text-right font-semibold">Qty</th>
                                <th className="py-2 px-2 text-right font-semibold">Value Excl. ST</th>
                                <th className="py-2 px-2 text-right font-semibold">Rate</th>
                                <th className="py-2 px-2 text-right font-semibold">Sales Tax</th>
                                <th className="py-2 px-2 text-right font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(invoice.items ?? []).map((it) => (
                                <tr key={it.id} className="border-b border-neutral-200 align-top">
                                    <td className="py-2 px-2">{it.itemSrNo}</td>
                                    <td className="py-2 px-2">
                                        <div className="font-medium">{it.productDescription}</div>
                                        <div className="text-neutral-500 text-[10px]">{it.saleType}</div>
                                    </td>
                                    <td className="py-2 px-2 font-mono">{it.hsCode}</td>
                                    <td className="py-2 px-2">{it.uom}</td>
                                    <td className="py-2 px-2 text-right">{Number(it.quantity)}</td>
                                    <td className="py-2 px-2 text-right">{fmt(it.valueSalesExcludingST)}</td>
                                    <td className="py-2 px-2 text-right">{it.rate}</td>
                                    <td className="py-2 px-2 text-right">{fmt(it.salesTaxApplicable)}</td>
                                    <td className="py-2 px-2 text-right font-medium">
                                        {fmt(
                                            Number(it.valueSalesExcludingST) +
                                                Number(it.salesTaxApplicable) +
                                                Number(it.furtherTax) +
                                                Number(it.extraTax) +
                                                Number(it.fedPayable),
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* ── TOTALS + QR ── */}
                <section className="mt-5 grid grid-cols-[1fr_auto] gap-6">
                    <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                            Notes
                        </p>
                        <p className="text-[11px] text-neutral-700 whitespace-pre-line">
                            {invoice.notes ?? "—"}
                        </p>

                        {/* QR Code — spec §6: Version 2 (25×25), 1.0 × 1.0 inch. */}
                        <div className="mt-4 flex items-start gap-3">
                            <div className="border border-neutral-300 p-1 bg-white" style={{ width: "1in", height: "1in" }}>
                                <QRCodeCanvas
                                    value={qrValue}
                                    size={94}
                                    level="M"
                                    marginSize={0}
                                    bgColor="#FFFFFF"
                                    fgColor="#000000"
                                />
                            </div>
                            <div className="text-[10px] text-neutral-500 pt-1 max-w-[140px]">
                                Scan to verify this invoice on the FBR portal.
                            </div>
                        </div>
                    </div>

                    <div className="min-w-[240px] rounded border border-neutral-300 p-3 text-[11px]">
                        {[
                            ["Value excl. sales tax", invoice.totalValueExcludingST],
                            ["Discount", invoice.totalDiscount],
                            ["Sales tax", invoice.totalSalesTax],
                            ["Further tax", invoice.totalFurtherTax],
                            ["Extra tax", invoice.totalExtraTax],
                            ["FED payable", invoice.totalFedPayable],
                            ["Advance tax", invoice.advanceTax],
                        ].map(([label, value]) => (
                            <div key={label as string} className="flex justify-between py-0.5">
                                <span className="text-neutral-600">{label}</span>
                                <span className="font-medium">{fmt(value as number)}</span>
                            </div>
                        ))}
                        <div className="mt-2 flex justify-between border-t-2 border-neutral-800 pt-2 font-bold">
                            <span>Grand Total</span>
                            <span>
                                {fmt(
                                    Number(invoice.totalValueIncludingST) + Number(invoice.advanceTax),
                                )}
                            </span>
                        </div>
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <footer className="mt-6 border-t border-neutral-300 pt-3 text-[10px] text-neutral-500 flex justify-between">
                    <span>
                        Generated via FBR Digital Invoicing System · Invoice UUID: {invoice.uuid}
                    </span>
                    <span>
                        Status: <span className="font-semibold uppercase">{invoice.status}</span>
                    </span>
                </footer>

                <div className="no-print mt-6 flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded bg-neutral-900 px-5 py-2 text-xs font-medium text-white hover:bg-neutral-700"
                    >
                        Print
                    </button>
                    <button
                        type="button"
                        onClick={() => window.close()}
                        className="rounded border border-neutral-300 px-5 py-2 text-xs font-medium hover:bg-neutral-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

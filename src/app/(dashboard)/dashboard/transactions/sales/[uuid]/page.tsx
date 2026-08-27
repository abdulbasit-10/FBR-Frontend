"use client";

import { useCallback, useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import {
    ChevronLeft,
    Printer,
    Send,
    ShieldCheck,
    RefreshCw,
    ExternalLink,
} from "lucide-react";

import { LogoSpinner } from "@/components/ui/logo-spinner";
import { invoicesService, type Invoice } from "@/lib/services/invoices.service";
import { resolveFbrError } from "@/lib/constants/fbrErrorCodes";
import { cn } from "@/lib/utils";

const fmt = (n: number) =>
    (Number(n) || 0).toLocaleString("en-PK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const statusBadge: Record<string, string> = {
    draft: "bg-[#E5E7EB] dark:bg-[#3a3a3a] text-[#4F5967] dark:text-[#c9c9c9]",
    validated: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
    posted: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300",
    failed: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300",
    cancelled: "bg-[#E5E7EB] dark:bg-[#3a3a3a] text-[#6B7280] dark:text-[#9CA3AF]",
};

export default function InvoiceDetailPage(
    { params }: { params: Promise<{ uuid: string }> },
) {
    const { uuid } = usePromise(params);
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<null | "validate" | "post" | "reload">(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await invoicesService.getOne(uuid);
            setInvoice(res.data);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load invoice.");
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => {
        load();
    }, [load]);

    const submit = async (mode: "validate" | "post") => {
        setBusy(mode);
        try {
            const res = await invoicesService.submit(uuid, mode);
            setInvoice(res.data);
            if (res.data.status === "posted") {
                toast.success(`Posted: ${res.data.fbrInvoiceNumber}`);
            } else if (res.data.status === "validated") {
                toast.success("Invoice validated by FBR.");
            } else {
                const entry = resolveFbrError(res.data.fbrErrorCode);
                const msg =
                    entry?.briefMsgDesc ??
                    res.data.fbrError ??
                    `FBR ${res.data.fbrStatus ?? "rejected"} the invoice.`;
                toast.error(
                    res.data.fbrErrorCode ? `[${res.data.fbrErrorCode}] ${msg}` : msg,
                );
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "FBR submission failed.");
        } finally {
            setBusy(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <LogoSpinner />
            </div>
        );
    }
    if (!invoice) return null;

    const canSubmit = invoice.status === "draft" || invoice.status === "failed";

    return (
        <div className="space-y-4 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Page header */}
            <div className="flex items-center justify-between pb-1">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-[20px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75"
                >
                    <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                    Invoice {invoice.fbrInvoiceNumber ?? `SI-${String(invoice.id).padStart(4, "0")}`}
                </button>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={load}
                        disabled={busy !== null}
                        className="flex h-9 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-4 text-[13px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-60"
                    >
                        <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Reload
                    </button>
                    <Link
                        href={`/print/invoice/${uuid}`}
                        target="_blank"
                        className="flex h-9 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-4 text-[13px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333]"
                    >
                        <Printer className="h-3.5 w-3.5 text-[#A27B3A]" /> Print
                    </Link>
                    {canSubmit && (
                        <>
                            <button
                                type="button"
                                onClick={() => submit("validate")}
                                disabled={busy !== null}
                                className="flex h-9 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-4 text-[13px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] disabled:opacity-60"
                            >
                                <ShieldCheck className="h-3.5 w-3.5 text-[#A27B3A]" />
                                {busy === "validate" ? "Validating…" : "Validate"}
                            </button>
                            <button
                                type="button"
                                onClick={() => submit("post")}
                                disabled={busy !== null}
                                className="flex h-9 items-center gap-1.5 rounded-[5px] bg-[#C69A52] px-5 text-[13px] font-medium text-white hover:bg-[#b58b44] disabled:opacity-60"
                            >
                                <Send className="h-3.5 w-3.5" />
                                {busy === "post" ? "Posting…" : "Post to FBR"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Status strip */}
            <div className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 shadow-xs flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px]">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">Status</span>
                    <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase ${statusBadge[invoice.status] ?? "bg-[#E5E7EB] dark:bg-[#3a3a3a] text-[#4F5967] dark:text-[#c9c9c9]"}`}
                    >
                        {invoice.status}
                    </span>
                </div>
                <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">Environment</span>{" "}
                    <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{invoice.environment}</span>
                </div>
                <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">Type</span>{" "}
                    <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{invoice.invoiceType}</span>
                </div>
                {invoice.scenarioId && (
                    <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">Scenario</span>{" "}
                        <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{invoice.scenarioId}</span>
                    </div>
                )}
                {invoice.fbrInvoiceNumber && (
                    <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">FBR IRN</span>{" "}
                        <span className="font-mono font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{invoice.fbrInvoiceNumber}</span>
                    </div>
                )}
                {invoice.fbrError && (
                    <div className="w-full mt-1 rounded-[6px] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-[11px] px-3 py-2">
                        <span className="font-semibold">FBR error{invoice.fbrErrorCode ? ` (${invoice.fbrErrorCode})` : ""}:</span>{" "}
                        {invoice.fbrError}
                        {(() => {
                            const entry = resolveFbrError(invoice.fbrErrorCode);
                            return entry ? (
                                <div className="mt-1 text-red-600 dark:text-red-400">
                                    <span className="font-medium">Hint:</span> {entry.briefMsgDesc}
                                </div>
                            ) : null;
                        })()}
                    </div>
                )}
            </div>

            {/* Header cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5 shadow-xs">
                    <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">Seller</p>
                    <p className="text-[13px] font-semibold text-[#1E293B] dark:text-[#f0f0f0]">
                        {invoice.sellerBusinessName}
                    </p>
                    <p className="text-[12px]">NTN: {invoice.sellerNtnCnic}</p>
                    <p className="text-[12px]">{invoice.sellerAddress}</p>
                    <p className="text-[12px]">Province: {invoice.sellerProvince}</p>
                </section>

                <section className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5 shadow-xs">
                    <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">Buyer</p>
                    <p className="text-[13px] font-semibold text-[#1E293B] dark:text-[#f0f0f0]">
                        {invoice.buyerBusinessName}
                    </p>
                    <p className="text-[12px]">
                        NTN/CNIC: {invoice.buyerNtnCnic ?? "—"} ·{" "}
                        <span className="font-medium">{invoice.buyerRegistrationType}</span>
                    </p>
                    <p className="text-[12px]">{invoice.buyerAddress}</p>
                    <p className="text-[12px]">Province: {invoice.buyerProvince}</p>
                </section>
            </div>

            {/* Dates + refs */}
            <section className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px]">
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">Invoice Date</p>
                    <p className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{invoice.invoiceDate}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">Posting Date</p>
                    <p className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{invoice.postingDate ?? "—"}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">PO Number</p>
                    <p className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{invoice.poNumber ?? "—"}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">Ref Invoice</p>
                    <p className="font-mono font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{invoice.invoiceRefNo ?? "—"}</p>
                </div>
            </section>

            {/* Line items */}
            <section className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5 shadow-xs">
                <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">Line Items</p>
                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                    <table className="w-full text-[12px] min-w-[1100px] border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white text-left">
                                <th className="py-2 px-2 font-bold">#</th>
                                <th className="py-2 px-2 font-bold">Description</th>
                                <th className="py-2 px-2 font-bold">HS Code</th>
                                <th className="py-2 px-2 font-bold">UOM</th>
                                <th className="py-2 px-2 text-right font-bold">Qty</th>
                                <th className="py-2 px-2 text-right font-bold">Value Excl. ST</th>
                                <th className="py-2 px-2 text-center font-bold">Rate</th>
                                <th className="py-2 px-2 text-right font-bold">Sales Tax</th>
                                <th className="py-2 px-2 text-right font-bold">Further</th>
                                <th className="py-2 px-2 text-right font-bold">FED</th>
                                <th className="py-2 px-2 font-bold">FBR Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#2e2e2e]">
                            {(invoice.items ?? []).map((it, i) => (
                                <tr
                                    key={it.id}
                                    className={cn(
                                        i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]",
                                        "hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors",
                                    )}
                                >
                                    <td className="py-2 px-2">{it.itemSrNo}</td>
                                    <td className="py-2 px-2">
                                        <div className="font-medium text-[#1E293B] dark:text-[#f0f0f0]">
                                            {it.productDescription}
                                        </div>
                                        <div className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">{it.saleType}</div>
                                    </td>
                                    <td className="py-2 px-2 font-mono">{it.hsCode}</td>
                                    <td className="py-2 px-2">{it.uom}</td>
                                    <td className="py-2 px-2 text-right">{Number(it.quantity)}</td>
                                    <td className="py-2 px-2 text-right">{fmt(it.valueSalesExcludingST)}</td>
                                    <td className="py-2 px-2 text-center">{it.rate}</td>
                                    <td className="py-2 px-2 text-right">{fmt(it.salesTaxApplicable)}</td>
                                    <td className="py-2 px-2 text-right">{fmt(it.furtherTax)}</td>
                                    <td className="py-2 px-2 text-right">{fmt(it.fedPayable)}</td>
                                    <td className="py-2 px-2 text-[10px]">
                                        {it.fbrStatus ? (
                                            <span
                                                className={`px-1.5 py-0.5 rounded font-semibold ${it.fbrStatusCode === "00" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300" : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300"}`}
                                            >
                                                {it.fbrStatus}
                                                {it.fbrErrorCode && ` · ${it.fbrErrorCode}`}
                                            </span>
                                        ) : (
                                            <span className="text-[#9CA3AF]">—</span>
                                        )}
                                        {it.fbrError && (
                                            <div className="mt-0.5 text-red-600 dark:text-red-400">{it.fbrError}</div>
                                        )}
                                        {(() => {
                                            const entry = resolveFbrError(it.fbrErrorCode);
                                            return entry ? (
                                                <div className="mt-0.5 text-red-500 dark:text-red-400/80 italic">
                                                    {entry.briefMsgDesc}
                                                </div>
                                            ) : null;
                                        })()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Totals */}
            <section className="rounded-[11px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                {[
                    ["Value Excl. ST", invoice.totalValueExcludingST],
                    ["Sales Tax", invoice.totalSalesTax],
                    ["Further Tax", invoice.totalFurtherTax],
                    ["Extra Tax", invoice.totalExtraTax],
                    ["FED Payable", invoice.totalFedPayable],
                    ["Discount", invoice.totalDiscount],
                    ["Advance Tax", invoice.advanceTax],
                    ["Total Incl. ST", invoice.totalValueIncludingST],
                ].map(([label, value]) => (
                    <div key={label as string} className="flex justify-between border-b border-[#F3F4F6] dark:border-[#2e2e2e] pb-1">
                        <span className="text-[#6B7280] dark:text-[#9CA3AF]">{label}</span>
                        <span className="font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{fmt(value as number)}</span>
                    </div>
                ))}
                <div className="col-span-2 md:col-span-4 mt-1 flex justify-between rounded-[6px] bg-[#FAF6EE] dark:bg-[#2a1e0a] px-4 py-2 border border-[#F3EAD8] dark:border-[#4a3a20]">
                    <span className="font-bold uppercase text-[#A27B3A]">Grand Total</span>
                    <span className="font-bold text-[#A27B3A]">
                        {fmt(Number(invoice.totalValueIncludingST) + Number(invoice.advanceTax))}
                    </span>
                </div>
            </section>

            {invoice.fbrInvoiceNumber && (
                <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1.5">
                    <ExternalLink className="h-3 w-3 text-[#A27B3A]" />
                    QR verification available on the printable version.
                </div>
            )}
        </div>
    );
}

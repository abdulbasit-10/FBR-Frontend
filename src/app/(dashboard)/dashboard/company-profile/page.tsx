"use client";

import { ArrowLeft, Building2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { companiesService, type Company } from "@/lib/services";
import { LogoSpinner } from "@/components/ui/logo-spinner";

export default function CompanyProfilePage() {
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (showToast = false) => {
        try {
            const res = await companiesService.list({ limit: 1 });
            // Backend returns `rows` for non-SuperAdmin, `data` for SuperAdmin
            const payload = res.data as unknown as Record<string, unknown>;
            const list = (payload.data ?? payload.rows) as Company[] | undefined;
            setCompany(list?.[0] ?? null);
            if (showToast) toast.success("Refreshed.");
        } catch {
            toast.error("Failed to load company profile.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleRefresh = () => { if (!refreshing) { setRefreshing(true); load(true); } };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <LogoSpinner label="Loading company profile..." size={120} />
            </div>
        );
    }

    const strn = company?.salesTaxRegNo ?? company?.strn;
    const isSandbox = !company?.fbrEnvironment || company.fbrEnvironment === "sandbox";
    const envLabel = company?.fbrEnvironment?.toUpperCase() ?? "--";

    return (
        <div>
            {/* Hero banner — full-width, outside the max-width container */}
            <div className="bg-[linear-gradient(110deg,#c99d54,#a6782d)] px-8 py-6 text-white">
                <div className="flex items-center gap-5">
                    <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-xl bg-white/20">
                        <Building2 className="h-9 w-9 text-white" />
                    </div>
                    <div>
                        <h2 className="text-[22px] font-bold leading-tight tracking-tight">
                            {company?.businessName ?? "--"}
                        </h2>
                        <p className="mt-0.5 text-[13px] text-white/75">{company?.province ?? "--"}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            <HeroBadge active>{company?.isActive ? "Active" : "Inactive"}</HeroBadge>
                            <HeroBadge>{envLabel}</HeroBadge>
                            <HeroBadge>ID {String(company?.id ?? "--").padStart(5, "0")}</HeroBadge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content below banner — full width with consistent padding */}
            <div className="px-4 py-4">

                {/* Page header row */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8e9eb] dark:border-[#3a3a3a] bg-white dark:bg-[#242424] hover:bg-[#f3f4f6] dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 text-[#6b7280] dark:text-[#9ca3af]" />
                        </Link>
                        <div>
                            <h1 className="text-[15px] font-bold text-[#1f2937] dark:text-[#f0f0f0]">Company profile</h1>
                            <p className="text-[11px] text-[#9ca3af]">Update your company photo and details here.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e8e9eb] dark:border-[#3a3a3a] bg-white dark:bg-[#242424] px-3 text-[12px] font-medium text-[#374151] dark:text-[#d1d5db] hover:bg-[#f3f4f6] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {/* Detail card */}
                <div className="overflow-hidden rounded-xl border border-[#e8e9eb] dark:border-[#3a3a3a] bg-white dark:bg-[#242424] divide-y divide-[#e8e9eb] dark:divide-[#3a3a3a]">

                    {/* Company logo */}
                    <ProfileSection
                        title="Company logo (optional)"
                        subtitle="Not required. Upload only if you want your logo on invoices, reports, and customer-facing documents."
                    >
                        <div className="flex items-start gap-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#d1d5db] dark:border-[#3a3a3a] bg-[#f9fafb] dark:bg-[#1c1c1c] text-[#9ca3af]">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                <Field label="Company name" value={company?.businessName ?? "--"} />
                                <Field label="System company ID" value={String(company?.id ?? "--").padStart(5, "0")} />
                                <Field label="Logo" value="Not set" />
                            </div>
                        </div>
                    </ProfileSection>

                    {/* Tax & registration */}
                    <ProfileSection
                        title="Tax & registration"
                        subtitle="Legal identifiers used on FBR and tax documents."
                    >
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <Field label="NTN" value={company?.ntn ?? "--"} />
                            <Field label="STRN" value={strn ?? "--"} />
                            <Field label="Business Activity" value={company?.businessActivity ?? "--"} />
                            <Field label="Sector" value={company?.sector ?? "--"} />
                        </div>
                    </ProfileSection>

                    {/* Address */}
                    <ProfileSection
                        title="Address"
                        subtitle="Registered business address shown on invoices and compliance forms."
                    >
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <Field label="Province" value={company?.province ?? "--"} />
                            <Field label="City" value="--" />
                            <Field label="Postal code" value="--" />
                            <Field label="Street address" value={company?.address ?? "--"} />
                        </div>
                    </ProfileSection>

                    {/* Contact */}
                    <ProfileSection
                        title="Contact"
                        subtitle="How customers and partners can reach your business."
                    >
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <Field label="Phone" value={company?.phone ?? "--"} />
                            <Field label="Email" value={company?.email ?? "--"} />
                        </div>
                    </ProfileSection>

                    {/* Invoice branding */}
                    <ProfileSection
                        title="Invoice branding"
                        subtitle="Control FED on printed and digital invoices."
                    >
                        <Field label="FED mode" value={isSandbox ? "Disabled" : "Enabled"} />
                    </ProfileSection>

                </div>{/* end detail card */}
            </div>{/* end constrained content */}
        </div>
    );
}

function HeroBadge({ children, active }: { children: React.ReactNode; active?: boolean }) {
    return (
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${active
                ? "border-green-400/60 bg-green-400/20 text-green-300"
                : "border-white/40 bg-white/10 text-white"
            }`}>
            {children}
        </span>
    );
}

function ProfileSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[220px_1fr] gap-8 px-6 py-6">
            <div>
                <p className="text-[14px] font-bold text-[#1f2937] dark:text-[#f0f0f0]">{title}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b7280] dark:text-[#9ca3af]">{subtitle}</p>
            </div>
            <div>{children}</div>
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[12px] font-medium text-[#6b7280] dark:text-[#9ca3af]">{label}</p>
            <p className="mt-0.5 text-[14px] font-semibold text-[#111827] dark:text-[#f0f0f0]">{value}</p>
        </div>
    );
}

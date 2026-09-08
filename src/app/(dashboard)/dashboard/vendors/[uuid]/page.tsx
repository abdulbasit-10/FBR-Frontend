"use client";

import React, { useState, useMemo, useCallback, useEffect, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { vendorsService, lookupService, type VendorUpdateInput } from "@/lib/services";

const PROVINCES = ["Select", "Khyber Pakhtunkhwa", "Punjab", "Sindh", "Balochistan", "Gilgit-Baltistan", "Azad Kashmir", "Islamabad"];
const VENDOR_TYPES = ["Select", "Individual", "Company", "AOP"];
const REGISTRATION_STATUS = ["Unregistered", "Registered", "Exempt"];

const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};
const selectCls = "h-9 w-full rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";
const inputCls = "h-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none";
const readonlyCls = "h-9 rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-[#F9FAFB] dark:bg-[#1e1e1e] px-3 text-[12px] text-[#4F5967] dark:text-[#9ca3af] flex items-center select-none";
const labelCls = "text-[12px] font-medium text-[#374151] dark:text-[#9ca3af]";
const sectionTitleCls = "text-[11px] font-bold text-[#C69A52] tracking-wider uppercase mb-3";
const cardCls = "rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3.5";

const initials = (name: string) =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

export default function EditVendorPage({ params }: { params: Promise<{ uuid: string }> }) {
    const { uuid } = usePromise(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [vendorNo, setVendorNo] = useState("");

    const [vendorName, setVendorName] = useState("");
    const [vendorType, setVendorType] = useState("Select");
    const [ntn, setNtn] = useState("");
    const [strn, setStrn] = useState("");
    const [registrationStatus, setRegistrationStatus] = useState("Unregistered");
    const [ntnProvince, setNtnProvince] = useState("Select");
    const [city, setCity] = useState("");
    const [postcode, setPostcode] = useState("");
    const [address, setAddress] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [email, setEmail] = useState("");
    const [website, setWebsite] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await vendorsService.getOne(uuid);
            const v = res.data;
            setVendorNo(v.vendorNo ?? "—");
            setVendorName(v.businessName);
            setVendorType(v.vendorType);
            setNtn(v.ntnCnic ?? "");
            setStrn(v.strn ?? "");
            setRegistrationStatus(v.registrationType);
            setNtnProvince(v.province);
            setAddress(v.address);
            setCity("");
            setPostcode("");
            setContactPerson(v.contactPerson ?? "");
            setPhoneNumber(v.phone ?? "");
            setWhatsapp(v.whatsapp ?? "");
            setEmail(v.email ?? "");
            setWebsite(v.website ?? "");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to load vendor.");
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => { load(); }, [load]);

    const requiredChecks = useMemo(() => [
        { label: "Vendor type", done: vendorType !== "Select" },
        { label: "NTN / CNIC", done: ntn.trim() !== "" },
        { label: "STRN", done: strn.trim() !== "" },
        { label: "Province", done: ntnProvince !== "Select" },
        { label: "Address", done: address.trim() !== "" },
        { label: "Contact person", done: contactPerson.trim() !== "" },
        { label: "Phone / WhatsApp", done: phoneNumber.trim() !== "" || whatsapp.trim() !== "" },
        { label: "Email", done: email.trim() !== "" },
        { label: "Website", done: website.trim() !== "" },
    ], [vendorType, ntn, strn, ntnProvince, address, contactPerson, phoneNumber, whatsapp, email, website]);

    const progressPct = Math.round((requiredChecks.filter((r) => r.done).length / requiredChecks.length) * 100);

    const handleVerifyFbr = async () => {
        if (!ntn.trim()) {
            toast.error("Enter NTN/CNIC first.");
            return;
        }
        if (ntn.trim().length !== 7 && ntn.trim().length !== 13) {
            toast.error("NTN/CNIC must be 7 digits (NTN) or 13 digits (CNIC).");
            return;
        }
        setVerifying(true);
        try {
            const res = await lookupService.verifyRegistration(ntn.trim());
            const regType = res.data.registrationType?.REGISTRATION_TYPE;
            const taxStatus = res.data.taxpayerStatus?.status;
            if (regType) {
                setRegistrationStatus(regType.toLowerCase() === "registered" ? "Registered" : "Unregistered");
            }
            toast.success(`FBR: ${regType ?? "Unknown"} \u00b7 ${taxStatus ?? "status unavailable"}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "FBR verification failed.");
        } finally {
            setVerifying(false);
        }
    };

    const handleSave = async () => {
        if (!vendorName.trim() || ntnProvince === "Select" || !address.trim()) {
            toast.error("Vendor Name, Province and Address are required.");
            return;
        }
        const apiVendorType: VendorUpdateInput["vendorType"] =
            vendorType === "Individual" ? "Individual" : "Company";
        const registrationType: VendorUpdateInput["registrationType"] =
            registrationStatus === "Registered" ? "Registered" : "Unregistered";
        const payload: VendorUpdateInput = {
            businessName: vendorName.trim(),
            ntnCnic: ntn.trim() || null,
            strn: strn.trim() || null,
            registrationType,
            province: ntnProvince,
            address: [address, city, postcode].filter(Boolean).join(", "),
            phone: (phoneNumber || whatsapp).trim() || null,
            email: email.trim() || null,
            contactPerson: contactPerson.trim() || null,
            whatsapp: whatsapp.trim() || null,
            website: website.trim() || null,
            vendorType: apiVendorType,
        };
        setIsSaving(true);
        try {
            await vendorsService.update(uuid, payload);
            toast.success("Vendor updated.");
            router.push("/dashboard/vendors");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update vendor.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <LogoSpinner label="Loading vendor..." />
            </div>
        );
    }

    return (
        <div className="min-h-full text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()} className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-4.5 w-4.5" />
                    </button>
                    <div>
                        <h1 className="text-[16px] font-bold text-[#1E293B] dark:text-[#f0f0f0] leading-tight">Vendor</h1>
                        <p className="text-[11px] text-[#9CA3AF] leading-tight">Vendor no. {vendorNo}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={load}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                        <RefreshCw className="h-3 w-3 text-[#A27B3A]" /> Refresh
                    </button>
                    <button type="button" onClick={handleSave} disabled={isSaving}
                        className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs disabled:opacity-60 cursor-pointer">
                        <Save className="h-3 w-3" /> {isSaving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-3 items-start">

                {/* ── Left: form sections ── */}
                <div className="space-y-3">

                    {/* VENDOR DETAILS */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Vendor Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className={labelCls}>Vendor no.</Label>
                                <div className={readonlyCls}>{vendorNo}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Vendor Name <span className="text-red-500">*</span></Label>
                                <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <Label className={labelCls}>Vendor Type <span className="text-red-500">*</span></Label>
                                <select value={vendorType} onChange={(e) => setVendorType(e.target.value)} className={selectCls} style={selectArrow}>
                                    {VENDOR_TYPES.map((t) => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* TAX DETAILS */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Tax Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className={labelCls}>NTN / CNIC {registrationStatus === "Registered" && <span className="text-red-500">*</span>}</Label>
                                <div className="flex items-center gap-1.5">
                                    <Input value={ntn} onChange={(e) => setNtn(e.target.value.replace(/\D/g, "").slice(0, 13))} maxLength={13} placeholder="7 or 13 digit NTN/CNIC" className={inputCls} />
                                    <button type="button" onClick={handleVerifyFbr} disabled={verifying}
                                        title="Verify NTN/CNIC with FBR"
                                        className="flex h-9 shrink-0 items-center gap-1 rounded-[6px] border border-[#D4B88A] dark:border-[#4a3a20] bg-[#FBF7F0] dark:bg-[#1e1a10] px-2.5 text-[11px] font-medium text-[#A27B3A] hover:bg-[#F5EDD8] dark:hover:bg-[#2a2010] transition-colors disabled:opacity-60 cursor-pointer">
                                        <ShieldCheck className="h-3.5 w-3.5" /> {verifying ? "…" : "Verify"}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>STRN</Label>
                                <Input value={strn} onChange={(e) => setStrn(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Registration Status <span className="text-red-500">*</span></Label>
                                <select value={registrationStatus} onChange={(e) => setRegistrationStatus(e.target.value)} className={selectCls} style={selectArrow}>
                                    {REGISTRATION_STATUS.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>NTN/CNIC province <span className="text-red-500">*</span></Label>
                                <select value={ntnProvince} onChange={(e) => setNtnProvince(e.target.value)} className={selectCls} style={selectArrow}>
                                    {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ADDRESS */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Address</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className={labelCls}>City</Label>
                                <Input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Postcode</Label>
                                <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <Label className={labelCls}>Address <span className="text-red-500">*</span></Label>
                                <Input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                    </div>

                    {/* CONTACT */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Contact</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className={labelCls}>Contact Person</Label>
                                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Phone Number</Label>
                                <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>WhatsApp / Mobile</Label>
                                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Email</Label>
                                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <Label className={labelCls}>Website</Label>
                                <Input placeholder="https://" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: summary panel ── */}
                <div className={cn(cardCls, "sticky top-3")}>
                    <div className="flex flex-col items-center mb-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5EDD8] dark:bg-[#2a2a2a] text-[#C69A52] font-bold text-[14px] mb-2">
                            {initials(vendorName)}
                        </div>
                        <p className="text-[13px] font-bold text-[#1E293B] dark:text-[#f0f0f0] text-center">{vendorName || "Unnamed Vendor"}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#F3F4F6] dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] border border-[#E5E7EB] dark:border-[#3a3a3a]">
                                {vendorType === "Select" ? "Type not set" : vendorType}
                            </span>
                            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                                registrationStatus === "Registered"
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] dark:bg-[#2a2a2a] dark:text-[#9ca3af] dark:border-[#3a3a3a]")}>
                                {registrationStatus}
                            </span>
                        </div>
                    </div>

                    <div className="mb-3">
                        <div className="flex justify-between items-center text-[11px] font-medium text-[#6B7280] dark:text-[#9ca3af] mb-1">
                            <span>REQUIRED FIELDS</span>
                            <span className="text-[#C69A52] font-bold">{progressPct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#F3F4F6] dark:bg-[#333]">
                            <div className="h-full rounded-full bg-[#C69A52] transition-all duration-500" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] border-t border-[#F3F4F6] dark:border-[#2e2e2e] pt-2.5">
                        {[
                            ["Vendor no", vendorNo],
                            ["Vendor type", vendorType === "Select" ? "—" : vendorType],
                            ["NTN / CNIC", ntn || "—"],
                            ["STRN", strn || "—"],
                            ["Province", ntnProvince === "Select" ? "—" : ntnProvince],
                            ["Address", address || "—"],
                            ["Contact person", contactPerson || "—"],
                            ["Phone / WhatsApp", phoneNumber || whatsapp || "—"],
                            ["Email", email || "—"],
                            ["Website", website || "—"],
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between gap-2">
                                <span className="text-[#9CA3AF]">{label}</span>
                                <span className="text-[#1E293B] dark:text-[#f0f0f0] font-medium text-right truncate max-w-36">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

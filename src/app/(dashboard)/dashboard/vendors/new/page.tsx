"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, RotateCcw, Save, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";

const PROVINCES = ["Select", "Khyber Pakhtunkhwa", "Punjab", "Sindh", "Balochistan", "Gilgit-Baltistan", "Azad Kashmir", "Islamabad"];
const VENDOR_TYPES = ["Select", "Individual", "Company", "AOP"];
const REGISTRATION_STATUS = ["Select", "Unregistered", "Registered", "Exempt"];

const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};
const selectCls = "h-10 w-full rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";
const inputCls = "h-10 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none";
const labelCls = "text-[12px] font-medium text-[#374151] dark:text-[#9ca3af]";
const sectionTitleCls = "text-[11px] font-bold text-[#C69A52] tracking-wider uppercase mb-4";
const cardCls = "rounded-[12px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-5";

export default function NewVendorPage() {
    const router = useRouter();

    const [vendorName, setVendorName] = useState("");
    const [vendorType, setVendorType] = useState("Select");
    const [ntn, setNtn] = useState("");
    const [strn, setStrn] = useState("");
    const [registrationStatus, setRegistrationStatus] = useState("Select");
    const [ntnProvince, setNtnProvince] = useState("Select");
    const [city, setCity] = useState("");
    const [postcode, setPostcode] = useState("");
    const [address, setAddress] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [email, setEmail] = useState("");
    const [website, setWebsite] = useState("");
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const requiredChecks = useMemo(() => [
        { label: "Vendors type", done: vendorType !== "Select" },
        { label: "NTN / CNIC", done: ntn.trim() !== "" },
        { label: "STRN", done: strn.trim() !== "" },
        { label: "Province", done: ntnProvince !== "Select" },
        { label: "City", done: city.trim() !== "" },
        { label: "Address", done: address.trim() !== "" },
        { label: "Contact person", done: contactPerson.trim() !== "" },
        { label: "Phone / WhatsApp", done: phoneNumber.trim() !== "" || whatsapp.trim() !== "" },
        { label: "Email", done: email.trim() !== "" },
        { label: "Website", done: website.trim() !== "" },
    ], [vendorType, ntn, strn, ntnProvince, city, address, contactPerson, phoneNumber, whatsapp, email, website]);

    const progressPct = Math.round((requiredChecks.filter((r) => r.done).length / requiredChecks.length) * 100);

    const handleReset = () => {
        setVendorName(""); setVendorType("Select");
        setNtn(""); setStrn(""); setRegistrationStatus("Select"); setNtnProvince("Select");
        setCity(""); setPostcode(""); setAddress("");
        setContactPerson(""); setPhoneNumber(""); setWhatsapp(""); setEmail(""); setWebsite("");
        setShowResetConfirm(false);
        toast.info("Form reset.");
    };

    return (
        <div className="min-h-full text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()} className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Vendors</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setShowResetConfirm(true)}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-4 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <RotateCcw className="h-3.5 w-3.5 text-[#A27B3A]" /> Reset
                    </button>
                    <button type="button"
                        onClick={() => {
                            const missing = requiredChecks.filter((r) => !r.done);
                            if (missing.length > 0) toast.error(`Fill required fields: ${missing.map((r) => r.label).join(", ")}.`);
                            else toast.success("Vendor saved successfully.");
                        }}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                        <Save className="h-3.5 w-3.5" /> Save
                    </button>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-4 items-start">

                {/* ── Left: form sections ── */}
                <div className="space-y-4">

                    {/* VENDOR DETAILS */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Vendor Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Vendor Name <span className="text-[#C69A52]">*</span></Label>
                                <Input placeholder="Legal or trading name" value={vendorName} onChange={(e) => setVendorName(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Vendor Type <span className="text-[#C69A52]">*</span></Label>
                                <select value={vendorType} onChange={(e) => setVendorType(e.target.value)} className={selectCls} style={selectArrow}>
                                    {VENDOR_TYPES.map((t) => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* TAX DETAILS */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Tax Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>NTN / CNIC <span className="text-[#C69A52]">*</span> <Info className="inline h-3 w-3 text-[#C69A52] mb-0.5" /></Label>
                                <Input value={ntn} onChange={(e) => setNtn(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>STRN <span className="text-[#C69A52]">*</span> <Info className="inline h-3 w-3 text-[#C69A52] mb-0.5" /></Label>
                                <Input value={strn} onChange={(e) => setStrn(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Registration Status <span className="text-[#C69A52]">*</span> <Info className="inline h-3 w-3 text-[#C69A52] mb-0.5" /></Label>
                                <select value={registrationStatus} onChange={(e) => setRegistrationStatus(e.target.value)} className={selectCls} style={selectArrow}>
                                    {REGISTRATION_STATUS.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>NTN/CNIC province <span className="text-[#C69A52]">*</span> <Info className="inline h-3 w-3 text-[#C69A52] mb-0.5" /></Label>
                                <select value={ntnProvince} onChange={(e) => setNtnProvince(e.target.value)} className={selectCls} style={selectArrow}>
                                    {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ADDRESS */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Address</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>City <span className="text-[#C69A52]">*</span></Label>
                                <Input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Postcode <span className="text-[#C69A52]">*</span> <Info className="inline h-3 w-3 text-[#C69A52] mb-0.5" /></Label>
                                <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className={labelCls}>Adress <span className="text-[#C69A52]">*</span></Label>
                                <Textarea value={address} onChange={(e) => setAddress(e.target.value)}
                                    className="min-h-[80px] rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 py-2.5 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-none" />
                            </div>
                        </div>
                    </div>

                    {/* CONTACT */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Contact</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Contact Person <span className="text-[#C69A52]">*</span></Label>
                                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Phone Number <span className="text-[#C69A52]">*</span></Label>
                                <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>WhatsApp / Mobile <span className="text-[#C69A52]">*</span></Label>
                                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Email <span className="text-[#C69A52]">*</span></Label>
                                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className={labelCls}>Website <span className="text-[#C69A52]">*</span></Label>
                                <Input placeholder="https://" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: progress panel ── */}
                <div className="sticky top-4 rounded-[12px] border border-[#D4B88A] dark:border-[#4a3a20] bg-white dark:bg-[#242424] p-5">
                    <div className="flex flex-col items-center mb-5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C69A52] text-white mb-3 text-[22px] font-bold shadow-sm">
                            ?
                        </div>
                        <p className="text-[15px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">New Vendor</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-[#9CA3AF]">
                                {vendorType === "Select" ? "Type not set" : vendorType}
                            </span>
                            {registrationStatus !== "Select" && (
                                <span className="rounded-full border border-[#F5C9A0] bg-[#FEF3E8] dark:bg-[#2a1a08] dark:border-[#6a3a10] px-2 py-0.5 text-[10px] font-medium text-[#C69A52]">
                                    {registrationStatus}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mb-5">
                        <div className="flex justify-between items-center text-[11px] font-bold text-[#C69A52] tracking-wider uppercase mb-2">
                            <span>Required Fields</span>
                            <span>{progressPct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#F5EDD8] dark:bg-[#2a1a08]">
                            <div className="h-full rounded-full bg-[#C69A52] transition-all duration-500" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {requiredChecks.map(({ label, done }) => (
                            <div key={label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className={cn("h-4 w-4 rounded-full border-2 shrink-0 transition-colors",
                                        done ? "border-[#C69A52] bg-[#C69A52]" : "border-[#D1D5DB] dark:border-[#4a4a4a]"
                                    )} />
                                    <span className={cn("text-[12px] transition-colors",
                                        done ? "text-[#1E293B] dark:text-[#f0f0f0] font-medium" : "text-[#9CA3AF]"
                                    )}>
                                        {label}
                                    </span>
                                </div>
                                <span className={cn("text-[12px]", done ? "text-[#C69A52] font-semibold" : "text-[#C0C0C0] dark:text-[#4a4a4a]")}>
                                    {done ? "✓" : "—"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reset confirmation */}
            <ConfirmDialog
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={handleReset}
                title="Reset form?"
                message="All entered vendor details will be cleared."
                confirmLabel="Reset"
                cancelLabel="Cancel"
            />
        </div>
    );
}

"use client";

import React, { useState, useMemo, useCallback, useEffect, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, RefreshCw, Save, Search, X, ShieldCheck } from "lucide-react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { customersService, lookupService, type CustomerUpdateInput } from "@/lib/services";

interface TaxSlab { id: number; slabName: string; rate: number; }

const PROVINCES = ["Select", "Khyber Pakhtunkhwa", "Punjab", "Sindh", "Balochistan", "Gilgit-Baltistan", "Azad Kashmir", "Islamabad"];
const CUSTOMER_TYPES = ["Select", "Individual", "Company", "AOP"];
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

export default function EditCustomerPage({ params }: { params: Promise<{ uuid: string }> }) {
    const { uuid } = usePromise(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [customerNo, setCustomerNo] = useState("");
    const [mappingId, setMappingId] = useState("");

    const [customerName, setCustomerName] = useState("");
    const [customerType, setCustomerType] = useState("Select");
    const [note, setNote] = useState("");
    const [ntn, setNtn] = useState("");
    const [strn, setStrn] = useState("");
    const [registrationStatus, setRegistrationStatus] = useState("Unregistered");
    const [ntnProvince, setNtnProvince] = useState("Select");
    const [selectedSlab, setSelectedSlab] = useState<TaxSlab | null>(null);
    const [city, setCity] = useState("");
    const [postcode, setPostcode] = useState("");
    const [address, setAddress] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [contact, setContact] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [email, setEmail] = useState("");
    const [website, setWebsite] = useState("");
    const [showTaxSlabModal, setShowTaxSlabModal] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await customersService.getOne(uuid);
            const c = res.data;
            setCustomerNo(c.customerNo ?? "—");
            setMappingId(c.mappingId ?? "");
            setCustomerName(c.businessName);
            setCustomerType(c.customerType);
            setNote("");
            setNtn(c.ntnCnic ?? "");
            setStrn(c.strn ?? "");
            setRegistrationStatus(c.registrationType);
            setNtnProvince(c.province);
            setAddress(c.address);
            setCity("");
            setPostcode("");
            setContactPerson(c.contactPerson ?? "");
            setContact(c.contact ?? "");
            setPhoneNumber(c.phone ?? "");
            setWhatsapp(c.whatsapp ?? "");
            setEmail(c.email ?? "");
            setWebsite(c.website ?? "");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to load customer.");
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => { load(); }, [load]);

    const requiredChecks = useMemo(() => [
        { label: "Customer type", done: customerType !== "Select" },
        { label: "NTN / CNIC", done: ntn.trim() !== "" },
        { label: "STRN", done: strn.trim() !== "" },
        { label: "Province", done: ntnProvince !== "Select" },
        { label: "Address", done: address.trim() !== "" },
        { label: "Contact person", done: contactPerson.trim() !== "" },
        { label: "Phone / WhatsApp", done: phoneNumber.trim() !== "" || whatsapp.trim() !== "" },
        { label: "Email", done: email.trim() !== "" },
        { label: "Website", done: website.trim() !== "" },
    ], [customerType, ntn, strn, ntnProvince, address, contactPerson, phoneNumber, whatsapp, email, website]);

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
        if (!customerName.trim() || ntnProvince === "Select" || !address.trim()) {
            toast.error("Customer Name, Province and Address are required.");
            return;
        }
        const apiCustomerType: CustomerUpdateInput["customerType"] =
            customerType === "Company" || customerType === "AOP" ? "Company" : "Individual";
        const registrationType: CustomerUpdateInput["registrationType"] =
            registrationStatus === "Registered" ? "Registered" : "Unregistered";
        const payload: CustomerUpdateInput = {
            businessName: customerName.trim(),
            ntnCnic: ntn.trim() || null,
            strn: strn.trim() || null,
            registrationType,
            province: ntnProvince,
            address: [address, city, postcode].filter(Boolean).join(", "),
            phone: (phoneNumber || whatsapp).trim() || null,
            email: email.trim() || null,
            contactPerson: contactPerson.trim() || null,
            contact: contact.trim() || null,
            whatsapp: whatsapp.trim() || null,
            website: website.trim() || null,
            customerType: apiCustomerType,
        };
        setIsSaving(true);
        try {
            await customersService.update(uuid, payload);
            toast.success("Customer updated.");
            router.push("/dashboard/customers");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update customer.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <LogoSpinner label="Loading customer..." />
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
                        <h1 className="text-[16px] font-bold text-[#1E293B] dark:text-[#f0f0f0] leading-tight">Customer</h1>
                        <p className="text-[11px] text-[#9CA3AF] leading-tight">Customer no. {customerNo}</p>
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

                    {/* CUSTOMER DETAILS */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Customer Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className={labelCls}>Customer no.</Label>
                                <div className={readonlyCls}>{customerNo}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Customer Name <span className="text-red-500">*</span></Label>
                                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Customer Type <span className="text-red-500">*</span></Label>
                                <select value={customerType} onChange={(e) => setCustomerType(e.target.value)} className={selectCls} style={selectArrow}>
                                    {CUSTOMER_TYPES.map((t) => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className={labelCls}>Customer Mapping</Label>
                                <div className={readonlyCls}>{mappingId || customerNo}</div>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <Label className={labelCls}>Notes</Label>
                                <Textarea placeholder="Internal notes about this customer" value={note} onChange={(e) => setNote(e.target.value)}
                                    className="min-h-16 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 py-2 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-none" />
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
                            <div className="sm:col-span-2">
                                <button type="button" onClick={() => setShowTaxSlabModal(true)}
                                    className="w-full flex items-center justify-between rounded-[8px] border border-dashed border-[#D4B88A] dark:border-[#4a3a20] bg-[#FBF7F0] dark:bg-[#1e1a10] px-3 py-2.5 hover:bg-[#F5EDD8] dark:hover:bg-[#2a2010] transition-colors cursor-pointer">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-[#C69A52]/15 text-[#C69A52] font-bold text-[12px]">%</div>
                                        <div className="text-left">
                                            <p className="text-[12px] font-semibold text-[#1E293B] dark:text-[#f0f0f0]">Select advance tax slab</p>
                                            <p className="text-[10px] text-[#9CA3AF]">Optional — sets the advance tax % on sales invoices for this customer</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] text-[#9CA3AF]">
                                        {selectedSlab ? `${selectedSlab.slabName} (${selectedSlab.rate}%)` : "Not selected"}
                                    </span>
                                </button>
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
                                <Textarea value={address} onChange={(e) => setAddress(e.target.value)}
                                    className="min-h-16 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 py-2 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-none" />
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
                                <Label className={labelCls}>Contact</Label>
                                <Input value={contact} onChange={(e) => setContact(e.target.value)} className={inputCls} />
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
                            {initials(customerName)}
                        </div>
                        <p className="text-[13px] font-bold text-[#1E293B] dark:text-[#f0f0f0] text-center">{customerName || "Unnamed Customer"}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#F3F4F6] dark:bg-[#2a2a2a] text-[#4F5967] dark:text-[#9ca3af] border border-[#E5E7EB] dark:border-[#3a3a3a]">
                                {customerType === "Select" ? "Type not set" : customerType}
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
                            ["Customer no", customerNo],
                            ["Customer type", customerType === "Select" ? "—" : customerType],
                            ["NTN / CNIC", ntn || "—"],
                            ["STRN", strn || "—"],
                            ["Province", ntnProvince === "Select" ? "—" : ntnProvince],
                            ["Mapping ID", mappingId || "—"],
                            ["Address", address || "—"],
                            ["Contact person", contactPerson || "—"],
                            ["Contact", contact || "—"],
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

                    <div className="mt-3 pt-2.5 border-t border-[#F3F4F6] dark:border-[#2e2e2e]">
                        <div className="flex items-center justify-between rounded-[6px] bg-[#FAF6EE] dark:bg-[#2a1e0a] border border-[#F3EAD8] dark:border-[#4a3a20] px-2.5 py-2">
                            <span className="text-[10px] font-bold uppercase text-[#A27B3A]">Tax Slab</span>
                            <span className="text-[11px] font-semibold text-[#A27B3A]">
                                {selectedSlab ? `${selectedSlab.slabName} (${selectedSlab.rate}%)` : "Not selected"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tax Slab Modal */}
            {showTaxSlabModal && (
                <TaxSlabModal
                    onClose={() => setShowTaxSlabModal(false)}
                    onSelect={(slab) => { setSelectedSlab(slab); setShowTaxSlabModal(false); }}
                />
            )}
        </div>
    );
}

// ─── Tax Slab Modal ───────────────────────────────────────────────────────────

function TaxSlabModal({ onClose, onSelect }: { onClose: () => void; onSelect: (s: TaxSlab) => void }) {
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [slabs, setSlabs] = useState<TaxSlab[]>([]);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    const load = useCallback(() => {
        setIsLoading(true);
        lookupService.rates()
            .then((res) => {
                setSlabs(res.data.map((r) => ({
                    id: r.rateId,
                    slabName: r.rateDesc,
                    rate: Number(r.rateValue),
                })));
            })
            .catch(() => setSlabs([]))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = slabs.filter((s) => !search || s.slabName.toLowerCase().includes(search.toLowerCase()));
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const modal = (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-[2px]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative w-full max-w-xl rounded-[14px] bg-white dark:bg-[#1e1e1e] shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-[#F3F4F6] dark:border-[#2e2e2e]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5EDD8] dark:bg-[#2a2a2a] text-[#C69A52] font-bold text-[14px]">%</div>
                        <div>
                            <h3 className="text-[14px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Select Advance Tax Slab</h3>
                            <p className="text-[11px] text-[#9CA3AF]">Search by slab name and pick the rate to apply on this customer.</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="flex items-center gap-1 rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] px-3 py-1.5 text-[11px] font-medium text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                        <X className="h-3.5 w-3.5" /> Close
                    </button>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 px-5 py-3">
                    <div className="flex-1">
                        <Input type="text" placeholder="Search slab name…"
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="h-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] shadow-none" />
                    </div>
                    <button type="button" onClick={() => setPage(1)} className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors cursor-pointer">
                        <Search className="h-3.5 w-3.5" /> Search
                    </button>
                    <button type="button" onClick={load} className="flex h-9 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                        <RefreshCw className="h-3.5 w-3.5 text-[#A27B3A]" /> Refresh
                    </button>
                </div>

                {/* Table */}
                <div className="px-5 pb-2 overflow-x-auto">
                    <div className="rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e] overflow-hidden">
                        <table className="w-full text-[12px] border-collapse">
                            <thead>
                                <tr className="bg-[#C69A52] text-white">
                                    <th className="px-4 py-2.5 text-left font-semibold">Select</th>
                                    <th className="px-4 py-2.5 text-left font-semibold">Slab Name</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Rate %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={3} className="py-10 text-center bg-white dark:bg-[#1e1e1e]">
                                            <LogoSpinner label="Loading Advance Tax Slab..." className="mx-auto" />
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-[12px] text-[#9CA3AF] italic bg-white dark:bg-[#1e1e1e]">
                                            No slabs match the current search.
                                        </td>
                                    </tr>
                                ) : paginated.map((slab, i) => (
                                    <tr key={slab.id} className={cn("transition-colors hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a]", i % 2 === 0 ? "bg-white dark:bg-[#1e1e1e]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]")}>
                                        <td className="px-4 py-2.5">
                                            <button type="button" onClick={() => onSelect(slab)}
                                                className="rounded-[5px] border border-[#C69A52] px-3 py-1 text-[11px] font-semibold text-[#C69A52] hover:bg-[#C69A52] hover:text-white transition-colors cursor-pointer">
                                                Select
                                            </button>
                                        </td>
                                        <td className="px-4 py-2.5 font-medium text-[#1E293B] dark:text-[#f0f0f0]">{slab.slabName}</td>
                                        <td className="px-4 py-2.5 text-right text-[#4F5967] dark:text-[#9ca3af]">{slab.rate}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-[#F3F4F6] dark:border-[#2e2e2e]">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                        className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
                        <ChevronLeft className="h-3.5 w-3.5 text-[#4F5967] dark:text-[#9ca3af]" />
                    </button>
                    <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">
                        Page <b className="text-[#1E293B] dark:text-[#f0f0f0]">{page}</b> of{" "}
                        <b className="text-[#1E293B] dark:text-[#f0f0f0]">{totalPages}</b>
                    </span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
                        <ChevronRight className="h-3.5 w-3.5 text-[#4F5967] dark:text-[#9ca3af]" />
                    </button>
                </div>
            </div>
        </div>
    );

    return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}


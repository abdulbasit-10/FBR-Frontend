"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, RotateCcw, Save, Search, RefreshCw, X, User } from "lucide-react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaxSlab { id: number; slabName: string; rate: number; }

const MOCK_SLABS: TaxSlab[] = []; // populated from API

const PROVINCES = ["Select", "Khyber Pakhtunkhwa", "Punjab", "Sindh", "Balochistan", "Gilgit-Baltistan", "Azad Kashmir", "Islamabad"];
const CUSTOMER_TYPES = ["Select", "Individual", "Company", "AOP"];
const REGISTRATION_STATUS = ["Unregistered", "Registered", "Exempt"];

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewCustomerPage() {
    const router = useRouter();

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
    const [phoneNumber, setPhoneNumber] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [email, setEmail] = useState("");
    const [website, setWebsite] = useState("");
    const [showTaxSlabModal, setShowTaxSlabModal] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const requiredChecks = useMemo(() => [
        { label: "Customer type", done: customerType !== "Select" },
        { label: "NTN / CNIC", done: ntn.trim() !== "" },
        { label: "STRN", done: strn.trim() !== "" },
        { label: "Province", done: ntnProvince !== "Select" },
        { label: "City", done: city.trim() !== "" },
        { label: "Address", done: address.trim() !== "" },
        { label: "Contact person", done: contactPerson.trim() !== "" },
        { label: "Phone / WhatsApp", done: phoneNumber.trim() !== "" || whatsapp.trim() !== "" },
        { label: "Email", done: email.trim() !== "" },
        { label: "Website", done: website.trim() !== "" },
    ], [customerType, ntn, strn, ntnProvince, city, address, contactPerson, phoneNumber, whatsapp, email, website]);

    const progressPct = Math.round((requiredChecks.filter((r) => r.done).length / requiredChecks.length) * 100);

    const handleReset = () => {
        setCustomerName(""); setCustomerType("Select"); setNote("");
        setNtn(""); setStrn(""); setRegistrationStatus("Unregistered"); setNtnProvince("Select");
        setSelectedSlab(null); setCity(""); setPostcode(""); setAddress("");
        setContactPerson(""); setPhoneNumber(""); setWhatsapp(""); setEmail(""); setWebsite("");
        setShowResetConfirm(false);
    };

    return (
        <div className="min-h-full text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()} className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Customers</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setShowResetConfirm(true)}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-4 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
                        <RotateCcw className="h-3.5 w-3.5 text-[#A27B3A]" /> Reset
                    </button>
                    <button type="button"
                        className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                        <Save className="h-3.5 w-3.5" /> Save
                    </button>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-4 items-start">

                {/* ── Left: form sections ── */}
                <div className="space-y-4">

                    {/* CUSTOMER DETAILS */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Customer Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Customer Name <span className="text-red-500">*</span></Label>
                                <Input placeholder="Legal or trading name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Customer Type <span className="text-red-500">*</span></Label>
                                <select value={customerType} onChange={(e) => setCustomerType(e.target.value)} className={selectCls} style={selectArrow}>
                                    {CUSTOMER_TYPES.map((t) => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className={labelCls}>Note <span className="text-red-500">*</span></Label>
                                <Textarea placeholder="Add note" value={note} onChange={(e) => setNote(e.target.value)}
                                    className="min-h-[80px] rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 py-2.5 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-none" />
                            </div>
                        </div>
                    </div>

                    {/* TAX DETAILS */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Tax Details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>NTN / CNIC <span className="text-red-500">*</span></Label>
                                <Input value={ntn} onChange={(e) => setNtn(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>STRN <span className="text-red-500">*</span></Label>
                                <Input value={strn} onChange={(e) => setStrn(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Registration Status <span className="text-red-500">*</span></Label>
                                <select value={registrationStatus} onChange={(e) => setRegistrationStatus(e.target.value)} className={selectCls} style={selectArrow}>
                                    {REGISTRATION_STATUS.map((s) => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>NTN/CNIC province <span className="text-red-500">*</span></Label>
                                <select value={ntnProvince} onChange={(e) => setNtnProvince(e.target.value)} className={selectCls} style={selectArrow}>
                                    {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                                </select>
                            </div>
                            {/* Advance tax slab selector */}
                            <div className="sm:col-span-2">
                                <button type="button" onClick={() => setShowTaxSlabModal(true)}
                                    className="w-full flex items-center justify-between rounded-[8px] border border-dashed border-[#D4B88A] dark:border-[#4a3a20] bg-[#FBF7F0] dark:bg-[#1e1a10] px-4 py-3 hover:bg-[#F5EDD8] dark:hover:bg-[#2a2010] transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C69A52]/15 text-[#C69A52] font-bold text-[13px]">%</div>
                                        <div className="text-left">
                                            <p className="text-[12px] font-semibold text-[#1E293B] dark:text-[#f0f0f0]">Select advance tax slab</p>
                                            <p className="text-[10px] text-[#9CA3AF]">Optional — sets the advance tax % on sales invoices for this customer</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-[#9CA3AF]">
                                            {selectedSlab ? `${selectedSlab.slabName} (${selectedSlab.rate}%)` : "Not selected"}
                                        </span>
                                        <ChevronRight className="h-4 w-4 text-[#C69A52]" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ADDRESS */}
                    <div className={cardCls}>
                        <p className={sectionTitleCls}>Address</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>City <span className="text-red-500">*</span></Label>
                                <Input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Postcode <span className="text-red-500">*</span></Label>
                                <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                {/* "Adress" matches Figma spelling */}
                                <Label className={labelCls}>Adress <span className="text-red-500">*</span></Label>
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
                                <Label className={labelCls}>Contact Person <span className="text-red-500">*</span></Label>
                                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Phone Number <span className="text-red-500">*</span></Label>
                                <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>WhatsApp / Mobile <span className="text-red-500">*</span></Label>
                                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Email <span className="text-red-500">*</span></Label>
                                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className={labelCls}>Website <span className="text-red-500">*</span></Label>
                                <Input placeholder="https://" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: progress panel ── */}
                <div className={cn(cardCls, "sticky top-4")}>
                    <div className="flex flex-col items-center mb-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5EDD8] dark:bg-[#2a2a2a] text-[#C69A52] mb-3">
                            <User className="h-6 w-6" />
                        </div>
                        <p className="text-[14px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">New Customer</p>
                        <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                            {customerType === "Select" ? "Type not set" : customerType} ·{" "}
                            {progressPct === 100 ? "Complete" : progressPct === 0 ? "Incomplete" : "In progress"}
                        </p>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between items-center text-[11px] font-medium text-[#6B7280] dark:text-[#9ca3af] mb-1.5">
                            <span>REQUIRED FIELDS</span>
                            <span className="text-[#C69A52] font-bold">{progressPct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#F3F4F6] dark:bg-[#333]">
                            <div className="h-full rounded-full bg-[#C69A52] transition-all duration-500" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        {requiredChecks.map(({ label, done }) => (
                            <div key={label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn("h-3 w-3 rounded-full border-2 flex-shrink-0 transition-colors",
                                        done ? "border-[#C69A52] bg-[#C69A52]" : "border-[#D1D5DB] dark:border-[#3a3a3a]"
                                    )} />
                                    <span className={cn("text-[12px] transition-colors", done ? "text-[#1E293B] dark:text-[#f0f0f0] font-medium" : "text-[#9CA3AF]")}>
                                        {label}
                                    </span>
                                </div>
                                <span className={cn("text-[11px]", done ? "text-[#C69A52] font-semibold" : "text-[#D1D5DB] dark:text-[#3a3a3a]")}>
                                    {done ? "✓" : "—"}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#F3F4F6] dark:border-[#2e2e2e] space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] text-[#9CA3AF]">TAX SLAB</span>
                            <span className="text-[11px] text-[#9CA3AF]">{selectedSlab ? selectedSlab.slabName : "Not selected"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] text-[#9CA3AF]">NTN province</span>
                            <span className="text-[11px] text-[#9CA3AF]">{ntnProvince === "Select" ? "Not selected" : ntnProvince}</span>
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

            {/* Reset confirmation */}
            <ConfirmDialog
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={handleReset}
                title="Reset form?"
                message="All entered customer details will be cleared."
                confirmLabel="Reset"
                cancelLabel="Cancel"
            />
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
        setIsLoading(true); setSlabs([]);
        const t = setTimeout(() => { setSlabs(MOCK_SLABS); setIsLoading(false); }, 800);
        return () => clearTimeout(t);
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
                    <button type="button" onClick={onClose} className="flex items-center gap-1 rounded-[6px] border border-[#E5E7EB] dark:border-[#2e2e2e] px-3 py-1.5 text-[11px] font-medium text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#2a2a2a] transition-colors">
                        <X className="h-3.5 w-3.5" /> Close
                    </button>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 px-5 py-3">
                    <div className="flex-1">
                        <Input type="text" placeholder="Name, customer no, mapping id, NTN, STRN,"
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="h-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] shadow-none" />
                    </div>
                    <button type="button" onClick={() => setPage(1)} className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-semibold text-white hover:bg-[#b58b44] transition-colors">
                        <Search className="h-3.5 w-3.5" /> Search
                    </button>
                    <button type="button" onClick={load} className="flex h-9 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors">
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
                                                className="rounded-[5px] border border-[#C69A52] px-3 py-1 text-[11px] font-semibold text-[#C69A52] hover:bg-[#C69A52] hover:text-white transition-colors">
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
                        className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <ChevronLeft className="h-3.5 w-3.5 text-[#4F5967] dark:text-[#9ca3af]" />
                    </button>
                    <span className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">
                        Page <b className="text-[#1E293B] dark:text-[#f0f0f0]">{page}</b> of{" "}
                        <b className="text-[#1E293B] dark:text-[#f0f0f0]">{totalPages}</b>
                    </span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#2a2a2a] hover:bg-[#FAF6F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <ChevronRight className="h-3.5 w-3.5 text-[#4F5967] dark:text-[#9ca3af]" />
                    </button>
                </div>
            </div>
        </div>
    );

    return typeof window !== "undefined" ? createPortal(modal, document.body) : null;
}

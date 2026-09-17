"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, RefreshCw, ShieldAlert, X, Save, Power, UserPlus, Download, Eye, KeyRound } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { companiesService, usersService, type Company, type CompanyCreateInput, type Role, type CreateUserInput, type AdminUser } from "@/lib/services";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { FBR_BUSINESS_ACTIVITIES, FBR_SECTORS } from "@/lib/constants/fbr";

const PROVINCES = ["Khyber Pakhtunkhwa", "Punjab", "Sindh", "Balochistan", "Gilgit-Baltistan", "Azad Kashmir", "Islamabad"];
const ENVIRONMENTS = ["sandbox", "production"] as const;

const inputCls = "h-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52]";
const labelCls = "text-[12px] font-medium text-[#374151] dark:text-[#9ca3af] block mb-1";

const emptyForm: CompanyCreateInput = {
    name: "",
    businessName: "",
    ntn: "",
    province: "",
    address: "",
    phone: "",
    email: "",
    salesTaxRegNo: "",
    businessActivity: null,
    sector: null,
    fbrEnvironment: "sandbox",
};

const emptyUserForm = { name: "", email: "", password: "", roleId: 0 };

export default function CompaniesPage() {
    const [canManage, setCanManage] = useState(false);
    const [checkedAccess, setCheckedAccess] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<CompanyCreateInput>(emptyForm);
    const [roles, setRoles] = useState<Role[]>([]);
    const [userTargetCompany, setUserTargetCompany] = useState<Company | null>(null);
    const [userForm, setUserForm] = useState(emptyUserForm);
    const [creatingUser, setCreatingUser] = useState(false);

    const [viewTargetCompany, setViewTargetCompany] = useState<Company | null>(null);
    const [companyAdmins, setCompanyAdmins] = useState<AdminUser[]>([]);
    const [adminsLoading, setAdminsLoading] = useState(false);
    const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [resetting, setResetting] = useState(false);

    const load = useCallback((showToast = false) => {
        if (!canManage) { setIsLoading(false); return; }
        setIsLoading(true);
        companiesService.list({ limit: 200 })
            .then((res) => setCompanies(res.data.rows))
            .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load companies."))
            .finally(() => setIsLoading(false));
        if (showToast) toast.success("Companies refreshed.");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canManage]);

    useEffect(() => {
        const manage = auth.getUser()?.role.name === "SuperAdmin";
        setCanManage(manage);
        setCheckedAccess(true);
    }, []);

    useEffect(() => { if (checkedAccess) load(); }, [checkedAccess, load]);

    useEffect(() => {
        if (!canManage) return;
        usersService.listRoles({ limit: 100 })
            .then((res) => setRoles(res.data.filter((r) => r.name !== "SuperAdmin")))
            .catch(() => { /* role picker just stays empty — company create flow doesn't depend on it */ });
    }, [canManage]);

    const handleChange = (field: keyof CompanyCreateInput, value: string) =>
        setForm((prev: CompanyCreateInput) => ({ ...prev, [field]: value }));

    const handleCreate = async () => {
        if (!form.name.trim() || !form.businessName.trim() || !form.ntn.trim() || !form.province.trim() || !form.address.trim()) {
            toast.error("Name, business name, NTN, province, and address are required.");
            return;
        }
        setSaving(true);
        try {
            await companiesService.create({
                ...form,
                salesTaxRegNo: form.salesTaxRegNo || null,
                businessActivity: form.businessActivity || null,
                sector: form.sector || null,
                phone: form.phone || null,
                email: form.email || null,
            });
            toast.success("Company created.");
            setForm(emptyForm);
            setShowForm(false);
            load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create company.");
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (c: Company) => {
        try {
            await companiesService.update(c.uuid, { isActive: !c.isActive });
            toast.success(`${c.businessName} ${c.isActive ? "deactivated" : "activated"}.`);
            load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update company.");
        }
    };

    const [exportingId, setExportingId] = useState<number | null>(null);
    const handleExport = async (c: Company) => {
        setExportingId(c.id);
        try {
            await companiesService.exportSql(c.uuid);
            toast.success(`SQL export downloaded for ${c.businessName}.`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to export company data.");
        } finally {
            setExportingId(null);
        }
    };

    const handleViewAdmins = async (c: Company) => {
        setViewTargetCompany(c);
        setCompanyAdmins([]);
        setAdminsLoading(true);
        try {
            const query = { companyId: c.id, limit: 100 };
            const res = await usersService.listUsers(query);
            const all = res.data.rows;
            const admins = all.filter((u) => u.role?.name === "CompanyAdmin");
            setCompanyAdmins(admins.length > 0 ? admins : all);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to load company admins.");
        } finally {
            setAdminsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetTarget) return;
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters.");
            return;
        }
        setResetting(true);
        try {
            await usersService.resetPassword(resetTarget.uuid, newPassword);
            toast.success(`Password reset for ${resetTarget.name}.`);
            setResetTarget(null);
            setNewPassword("");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to reset password.");
        } finally {
            setResetting(false);
        }
    };

    const handleUserFieldChange = (field: keyof typeof emptyUserForm, value: string) =>
        setUserForm((prev) => ({ ...prev, [field]: field === "roleId" ? Number(value) : value }));

    const handleCreateUser = async () => {
        if (!userTargetCompany) return;
        if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim() || !userForm.roleId) {
            toast.error("Name, email, password, and role are required.");
            return;
        }
        if (userForm.password.length < 8) {
            toast.error("Password must be at least 8 characters.");
            return;
        }
        setCreatingUser(true);
        try {
            const payload: CreateUserInput = {
                name: userForm.name.trim(),
                email: userForm.email.trim(),
                password: userForm.password,
                roleId: userForm.roleId,
                companyId: userTargetCompany.id,
            };
            await usersService.createUser(payload);
            toast.success(`User created for ${userTargetCompany.businessName}.`);
            setUserTargetCompany(null);
            setUserForm(emptyUserForm);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create user.");
        } finally {
            setCreatingUser(false);
        }
    };

    if (!checkedAccess) {
        return (
            <div className="flex h-64 items-center justify-center">
                <LogoSpinner label="Loading..." />
            </div>
        );
    }

    if (!canManage) {
        return (
            <div className="flex flex-col gap-2.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                <div className="flex items-center gap-1.5 pb-0.5">
                    <Link href="/dashboard" className="text-[#A27B3A] hover:opacity-75 transition-opacity"><ChevronLeft className="h-5 w-5" /></Link>
                    <h1 className="text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Companies</h1>
                </div>
                <div className="flex items-center gap-2 rounded-[8px] border border-[#FCA5A5] dark:border-[#7f1d1d] bg-[#FEF2F2] dark:bg-[#2a0a0a] px-3 py-2 text-[12px] text-[#B91C1C] dark:text-[#FCA5A5]">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Only the platform SuperAdmin can manage companies.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2.5" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center gap-1.5">
                    <Link href="/dashboard" className="text-[#A27B3A] hover:opacity-75 transition-opacity"><ChevronLeft className="h-5 w-5" /></Link>
                    <h1 className="text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Companies</h1>
                </div>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => load(true)} className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer">
                        <RefreshCw className="h-3 w-3 text-[#A27B3A]" /> Refresh
                    </button>
                    <button type="button" onClick={() => setShowForm((v) => !v)} className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors cursor-pointer">
                        {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />} {showForm ? "Cancel" : "New Company"}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">New Company</p>
                    <div className="grid grid-cols-3 gap-3">
                        <div><label className={labelCls}>Company Name *</label><input className={cn(inputCls, "w-full")} value={form.name} onChange={(e) => handleChange("name", e.target.value)} /></div>
                        <div><label className={labelCls}>Legal Business Name *</label><input className={cn(inputCls, "w-full")} value={form.businessName} onChange={(e) => handleChange("businessName", e.target.value)} /></div>
                        <div><label className={labelCls}>NTN / CNIC *</label><input className={cn(inputCls, "w-full")} value={form.ntn} onChange={(e) => handleChange("ntn", e.target.value)} placeholder="7 or 13 digits" /></div>
                        <div>
                            <label className={labelCls}>Province *</label>
                            <select className={cn(inputCls, "w-full")} value={form.province} onChange={(e) => handleChange("province", e.target.value)}>
                                <option value="">-- Select --</option>
                                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2"><label className={labelCls}>Address *</label><input className={cn(inputCls, "w-full")} value={form.address} onChange={(e) => handleChange("address", e.target.value)} /></div>
                        <div><label className={labelCls}>Phone</label><input className={cn(inputCls, "w-full")} value={form.phone ?? ""} onChange={(e) => handleChange("phone", e.target.value)} /></div>
                        <div><label className={labelCls}>Email</label><input className={cn(inputCls, "w-full")} value={form.email ?? ""} onChange={(e) => handleChange("email", e.target.value)} /></div>
                        <div><label className={labelCls}>STRN</label><input className={cn(inputCls, "w-full")} value={form.salesTaxRegNo ?? ""} onChange={(e) => handleChange("salesTaxRegNo", e.target.value)} /></div>
                        <div>
                            <label className={labelCls}>Business Activity</label>
                            <select className={cn(inputCls, "w-full")} value={form.businessActivity ?? ""} onChange={(e) => handleChange("businessActivity", e.target.value)}>
                                <option value="">-- Select --</option>
                                {FBR_BUSINESS_ACTIVITIES.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Sector</label>
                            <select className={cn(inputCls, "w-full")} value={form.sector ?? ""} onChange={(e) => handleChange("sector", e.target.value)}>
                                <option value="">-- Select --</option>
                                {FBR_SECTORS.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>FBR Environment</label>
                            <select className={cn(inputCls, "w-full")} value={form.fbrEnvironment} onChange={(e) => handleChange("fbrEnvironment", e.target.value)}>
                                {ENVIRONMENTS.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="button" onClick={handleCreate} disabled={saving} className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors cursor-pointer disabled:opacity-50">
                            <Save className="h-3.5 w-3.5" /> {saving ? "Creating..." : "Create Company"}
                        </button>
                    </div>
                </div>
            )}

            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3">
                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                    <table className="w-full text-[12px] border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                {["S.No", "Company Name", "Business Name", "NTN", "Province", "Environment", "Status", "Actions"].map((c) => (
                                    <th key={c} className="px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">{c}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                            {isLoading ? (
                                <tr><td colSpan={8} className="py-10 text-center bg-white dark:bg-[#242424]"><LogoSpinner label="Loading companies..." className="mx-auto" /></td></tr>
                            ) : companies.length === 0 ? (
                                <tr><td colSpan={8} className="py-10 text-center text-[12px] text-[#9CA3AF] italic bg-white dark:bg-[#242424]">No companies yet.</td></tr>
                            ) : companies.map((c, i) => (
                                <tr key={c.id} className={i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]"}>
                                    <td className="px-2.5 py-1.5 whitespace-nowrap">{i + 1}</td>
                                    <td className="px-2.5 py-1.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{c.name}</td>
                                    <td className="px-2.5 py-1.5 whitespace-nowrap">{c.businessName}</td>
                                    <td className="px-2.5 py-1.5 whitespace-nowrap">{c.ntn}</td>
                                    <td className="px-2.5 py-1.5 whitespace-nowrap">{c.province}</td>
                                    <td className="px-2.5 py-1.5 whitespace-nowrap uppercase">{c.fbrEnvironment}</td>
                                    <td className="px-2.5 py-1.5 whitespace-nowrap">
                                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", c.isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200")}>
                                            {c.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-2.5 py-1.5">
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                title={c.isActive ? "Deactivate" : "Activate"}
                                                onClick={() => toggleActive(c)}
                                                className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] hover:text-[#A27B3A] transition-colors cursor-pointer"
                                            >
                                                <Power className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                title="Add user to this company"
                                                onClick={() => { setUserTargetCompany(c); setUserForm(emptyUserForm); }}
                                                className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] hover:text-[#A27B3A] transition-colors cursor-pointer"
                                            >
                                                <UserPlus className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                title="Export this company's data as a SQL dump (offboarding)"
                                                onClick={() => handleExport(c)}
                                                disabled={exportingId === c.id}
                                                className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] hover:text-[#A27B3A] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                title="View this company's admin(s)"
                                                onClick={() => handleViewAdmins(c)}
                                                className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] hover:text-[#A27B3A] transition-colors cursor-pointer"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {userTargetCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setUserTargetCompany(null)}>
                    <div className="w-full max-w-md rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <p className="text-[13px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Add user — {userTargetCompany.businessName}</p>
                            <button type="button" onClick={() => setUserTargetCompany(null)} className="text-[#9CA3AF] hover:text-[#4F5967] cursor-pointer"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="space-y-3">
                            <div><label className={labelCls}>Full Name *</label><input className={cn(inputCls, "w-full")} value={userForm.name} onChange={(e) => handleUserFieldChange("name", e.target.value)} /></div>
                            <div><label className={labelCls}>Email *</label><input type="email" className={cn(inputCls, "w-full")} value={userForm.email} onChange={(e) => handleUserFieldChange("email", e.target.value)} /></div>
                            <div><label className={labelCls}>Temporary Password *</label><input type="text" className={cn(inputCls, "w-full")} value={userForm.password} onChange={(e) => handleUserFieldChange("password", e.target.value)} placeholder="Min. 8 characters" /></div>
                            <div>
                                <label className={labelCls}>Role *</label>
                                <select className={cn(inputCls, "w-full")} value={userForm.roleId || ""} onChange={(e) => handleUserFieldChange("roleId", e.target.value)}>
                                    <option value="">-- Select --</option>
                                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <button type="button" onClick={() => setUserTargetCompany(null)} className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                                Cancel
                            </button>
                            <button type="button" onClick={handleCreateUser} disabled={creatingUser} className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors cursor-pointer disabled:opacity-50">
                                <Save className="h-3.5 w-3.5" /> {creatingUser ? "Creating..." : "Create User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewTargetCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setViewTargetCompany(null)}>
                    <div className="w-full max-w-lg rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <p className="text-[13px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Admin(s) — {viewTargetCompany.businessName}</p>
                            <button type="button" onClick={() => setViewTargetCompany(null)} className="text-[#9CA3AF] hover:text-[#4F5967] cursor-pointer"><X className="h-4 w-4" /></button>
                        </div>
                        <p className="text-[11px] text-[#9CA3AF] italic">
                            Passwords are one-way hashed and can never be retrieved. Use &quot;Reset&quot; to set a new one you can hand over.
                        </p>
                        {adminsLoading ? (
                            <div className="py-6"><LogoSpinner label="Loading..." className="mx-auto" /></div>
                        ) : companyAdmins.length === 0 ? (
                            <p className="py-4 text-center text-[12px] text-[#9CA3AF] italic">No users found for this company.</p>
                        ) : (
                            <div className="space-y-2">
                                {companyAdmins.map((u) => (
                                    <div key={u.id} className="flex items-center justify-between rounded-[8px] border border-[#E5E7EB] dark:border-[#3a3a3a] px-3 py-2">
                                        <div>
                                            <p className="text-[13px] font-semibold text-[#1E293B] dark:text-[#f0f0f0]">{u.name} <span className="ml-1 text-[10px] font-normal text-[#A27B3A]">{u.role?.name}</span></p>
                                            <p className="text-[12px] text-[#4F5967] dark:text-[#9ca3af]">{u.email}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setResetTarget(u); setNewPassword(""); }}
                                            className="flex h-8 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer"
                                        >
                                            <KeyRound className="h-3.5 w-3.5 text-[#A27B3A]" /> Reset
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {resetTarget && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4" onClick={() => setResetTarget(null)}>
                    <div className="w-full max-w-sm rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <p className="text-[13px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Reset password — {resetTarget.name}</p>
                            <button type="button" onClick={() => setResetTarget(null)} className="text-[#9CA3AF] hover:text-[#4F5967] cursor-pointer"><X className="h-4 w-4" /></button>
                        </div>
                        <div>
                            <label className={labelCls}>New Password *</label>
                            <input type="text" className={cn(inputCls, "w-full")} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <button type="button" onClick={() => setResetTarget(null)} className="flex h-9 items-center gap-1.5 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                                Cancel
                            </button>
                            <button type="button" onClick={handleResetPassword} disabled={resetting} className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors cursor-pointer disabled:opacity-50">
                                <KeyRound className="h-3.5 w-3.5" /> {resetting ? "Resetting..." : "Reset Password"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

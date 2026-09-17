"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, RefreshCw, ShieldAlert, X, Save, Power, KeyRound, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { usersService, type AdminUser, type Role, type CreateUserInput } from "@/lib/services";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const inputCls = "h-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52]";
const labelCls = "text-[12px] font-medium text-[#374151] dark:text-[#9ca3af] block mb-1";

const emptyUserForm = { name: "", email: "", password: "", roleId: 0 };

export default function TeamPage() {
    const [canView, setCanView] = useState(false);
    const [canCreate, setCanCreate] = useState(false);
    const [checkedAccess, setCheckedAccess] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyUserForm);
    const [saving, setSaving] = useState(false);

    const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [resetting, setResetting] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        setCurrentUserId(auth.getUser()?.id ?? null);
        setCanView(auth.hasPermission("user.read"));
        setCanCreate(auth.hasPermission("user.create"));
        setCheckedAccess(true);
    }, []);

    const load = useCallback((showToast = false) => {
        setIsLoading(true);
        usersService.listUsers({ limit: 200 })
            .then((res) => setUsers(res.data.rows))
            .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load team."))
            .finally(() => setIsLoading(false));
        if (showToast) toast.success("Team refreshed.");
    }, []);

    useEffect(() => {
        if (!checkedAccess || !canView) return;
        load();
        usersService.listRoles({ limit: 100 })
            .then((res) => setRoles(res.data.filter((r) => r.name !== "SuperAdmin")))
            .catch(() => { /* role picker just stays empty */ });
    }, [checkedAccess, canView, load]);

    const handleFieldChange = (field: keyof typeof emptyUserForm, value: string) =>
        setForm((prev) => ({ ...prev, [field]: field === "roleId" ? Number(value) : value }));

    const handleCreate = async () => {
        if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.roleId) {
            toast.error("Name, email, password, and role are required.");
            return;
        }
        if (form.password.length < 8) {
            toast.error("Password must be at least 8 characters.");
            return;
        }
        setSaving(true);
        try {
            // companyId is intentionally omitted — the backend forces it to the caller's own
            // company for any non-SuperAdmin, so a Company Admin can only ever grow their own team.
            const payload: CreateUserInput = {
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                roleId: form.roleId,
            };
            await usersService.createUser(payload);
            toast.success("User created.");
            setForm(emptyUserForm);
            setShowForm(false);
            load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create user.");
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (u: AdminUser) => {
        try {
            await usersService.updateUser(u.uuid, { isActive: !u.isActive });
            toast.success(`${u.name} ${u.isActive ? "deactivated" : "activated"}.`);
            load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update user.");
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

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await usersService.deleteUser(deleteTarget.uuid);
            toast.success(`${deleteTarget.name} removed.`);
            setDeleteTarget(null);
            load();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to remove user.");
        } finally {
            setDeleting(false);
        }
    };

    if (!checkedAccess) {
        return (
            <div className="flex h-64 items-center justify-center">
                <LogoSpinner label="Loading..." />
            </div>
        );
    }

    if (!canView) {
        return (
            <div className="flex flex-col gap-2.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                <div className="flex items-center gap-1.5 pb-0.5">
                    <Link href="/dashboard" className="text-[#A27B3A] hover:opacity-75 transition-opacity"><ChevronLeft className="h-5 w-5" /></Link>
                    <h1 className="text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Team</h1>
                </div>
                <div className="flex items-center gap-2 rounded-[8px] border border-[#FCA5A5] dark:border-[#7f1d1d] bg-[#FEF2F2] dark:bg-[#2a0a0a] px-3 py-2 text-[12px] text-[#B91C1C] dark:text-[#FCA5A5]">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>You don&apos;t have permission to view team members.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2.5" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center gap-1.5">
                    <Link href="/dashboard" className="text-[#A27B3A] hover:opacity-75 transition-opacity"><ChevronLeft className="h-5 w-5" /></Link>
                    <h1 className="text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Team</h1>
                </div>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => load(true)} className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-2.5 text-[12px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors cursor-pointer">
                        <RefreshCw className="h-3 w-3 text-[#A27B3A]" /> Refresh
                    </button>
                    {canCreate && (
                        <button type="button" onClick={() => setShowForm((v) => !v)} className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors cursor-pointer">
                            {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />} {showForm ? "Cancel" : "Add User"}
                        </button>
                    )}
                </div>
            </div>

            {showForm && (
                <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">New Team Member</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelCls}>Full Name *</label><input className={cn(inputCls, "w-full")} value={form.name} onChange={(e) => handleFieldChange("name", e.target.value)} /></div>
                        <div><label className={labelCls}>Email *</label><input type="email" className={cn(inputCls, "w-full")} value={form.email} onChange={(e) => handleFieldChange("email", e.target.value)} /></div>
                        <div><label className={labelCls}>Temporary Password *</label><input type="text" className={cn(inputCls, "w-full")} value={form.password} onChange={(e) => handleFieldChange("password", e.target.value)} placeholder="Min. 8 characters" /></div>
                        <div>
                            <label className={labelCls}>Role *</label>
                            <select className={cn(inputCls, "w-full")} value={form.roleId || ""} onChange={(e) => handleFieldChange("roleId", e.target.value)}>
                                <option value="">-- Select --</option>
                                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="button" onClick={handleCreate} disabled={saving} className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors cursor-pointer disabled:opacity-50">
                            <Save className="h-3.5 w-3.5" /> {saving ? "Creating..." : "Create User"}
                        </button>
                    </div>
                </div>
            )}

            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3">
                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                    <table className="w-full text-[12px] border-collapse">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                {["Name", "Email", "Role", "Status", "Last Login", "Actions"].map((c) => (
                                    <th key={c} className="px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">{c}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6] dark:divide-[#2e2e2e]">
                            {isLoading ? (
                                <tr><td colSpan={6} className="py-10 text-center bg-white dark:bg-[#242424]"><LogoSpinner label="Loading team..." className="mx-auto" /></td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={6} className="py-10 text-center text-[12px] text-[#9CA3AF] italic bg-white dark:bg-[#242424]">No team members yet.</td></tr>
                            ) : users.map((u, i) => (
                                <tr key={u.id} className={i % 2 === 0 ? "bg-white dark:bg-[#242424]" : "bg-[#FAF6F0]/30 dark:bg-[#282828]"}>
                                    <td className="px-2.5 py-1.5 font-medium text-[#1E293B] dark:text-[#f0f0f0] whitespace-nowrap">{u.name}{u.id === currentUserId && <span className="ml-1.5 text-[10px] font-normal text-[#9CA3AF]">(you)</span>}</td>
                                    <td className="px-2.5 py-1.5 whitespace-nowrap">{u.email}</td>
                                    <td className="px-2.5 py-1.5 whitespace-nowrap">{u.role?.name ?? "—"}</td>
                                    <td className="px-2.5 py-1.5 whitespace-nowrap">
                                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", u.isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200")}>
                                            {u.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-2.5 py-1.5 whitespace-nowrap text-[#4F5967] dark:text-[#9ca3af]">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}</td>
                                    <td className="px-2.5 py-1.5">
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                title={u.id === currentUserId ? "You cannot deactivate your own account" : u.isActive ? "Deactivate" : "Activate"}
                                                onClick={() => toggleActive(u)}
                                                disabled={u.id === currentUserId}
                                                className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] hover:text-[#A27B3A] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#1a1a1a] disabled:hover:text-[#4F5967]"
                                            >
                                                <Power className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                title="Reset password"
                                                onClick={() => { setResetTarget(u); setNewPassword(""); }}
                                                className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FAF6F0] dark:hover:bg-[#333] hover:text-[#A27B3A] transition-colors cursor-pointer"
                                            >
                                                <KeyRound className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                title={u.id === currentUserId ? "You cannot remove your own account" : "Remove user"}
                                                onClick={() => setDeleteTarget(u)}
                                                disabled={u.id === currentUserId}
                                                className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#4F5967] dark:text-[#9ca3af] hover:bg-[#FEF2F2] dark:hover:bg-[#2a0a0a] hover:text-[#B91C1C] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-[#1a1a1a] disabled:hover:text-[#4F5967]"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {resetTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setResetTarget(null)}>
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

            <ConfirmDialog
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Remove this user?"
                message={`${deleteTarget?.name ?? "This user"} will permanently lose access to the account.`}
                confirmLabel="Remove"
                isLoading={deleting}
                loadingLabel="Removing..."
            />
        </div>
    );
}

"use client";

import React, { useState, useEffect, useCallback, useRef, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Trash2, Upload, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LogoSpinner } from "@/components/ui/logo-spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { supportService, type SupportStatus, type SupportPriority } from "@/lib/services";

const STATUSES: SupportStatus[] = ["Open", "In Progress", "Resolved", "Closed"];
const PRIORITIES: SupportPriority[] = ["Low", "Normal", "High", "Urgent"];

const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};
const selectCls = "h-9 w-full rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";
const inputCls = "h-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] px-3 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none";
const labelCls = "text-[12px] font-medium text-[#374151] dark:text-[#9ca3af]";
const sectionTitleCls = "text-[11px] font-bold text-[#C69A52] tracking-wider uppercase mb-3";
const cardCls = "rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3.5";

const STATUS_BADGE: Record<SupportStatus, string> = {
    "Open": "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
    "In Progress": "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
    "Resolved": "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
    "Closed": "bg-[#F3F4F6] dark:bg-[#2a2a2a] text-[#6B7280] dark:text-[#9ca3af] border border-[#E5E7EB] dark:border-[#3a3a3a]",
};

// Attachments are served from the API's origin (not the /api/v1 prefixed base), e.g.
// http://localhost:5000/uploads/support/xyz.png
const fileOrigin = new URL(process.env.NEXT_PUBLIC_API_BASE_URL!).origin;

export default function SupportTicketDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
    const { uuid } = usePromise(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [ticketNo, setTicketNo] = useState("");
    const [createdAt, setCreatedAt] = useState("");
    const [resolvedAt, setResolvedAt] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [priority, setPriority] = useState<SupportPriority>("Normal");
    const [status, setStatus] = useState<SupportStatus>("Open");
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await supportService.getOne(uuid);
            const t = res.data;
            setTicketNo(t.ticketNo ?? `SR-${String(t.id).padStart(4, "0")}`);
            setCreatedAt(t.createdAt.replace("T", " ").replace(/\.\d+Z?$/, ""));
            setResolvedAt(t.resolvedAt ? t.resolvedAt.replace("T", " ").replace(/\.\d+Z?$/, "") : null);
            setTitle(t.title);
            setDescription(t.description ?? "");
            setCategory(t.category ?? "");
            setPriority(t.priority);
            setStatus(t.status);
            setAttachmentUrl(t.attachmentUrl);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to load ticket.");
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Title is required.");
            return;
        }
        setIsSaving(true);
        try {
            await supportService.update(uuid, {
                title: title.trim(),
                description: description.trim() || null,
                category: category.trim() || null,
                priority,
                status,
            });
            toast.success("Ticket updated.");
            router.push("/dashboard/support");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update ticket.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        try {
            await supportService.remove(uuid);
            toast.success("Ticket deleted.");
            router.push("/dashboard/support");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete ticket.");
        }
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0];
        e.target.value = "";
        if (!picked) return;
        setIsUploading(true);
        try {
            const updated = await supportService.uploadAttachment(uuid, picked);
            setAttachmentUrl(updated.attachmentUrl);
            toast.success("Attachment uploaded.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to upload attachment.");
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-full items-center justify-center">
                <LogoSpinner label="Loading ticket..." />
            </div>
        );
    }

    return (
        <div className="min-h-full space-y-3 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()} className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-4.5 w-4.5" />
                    </button>
                    <div>
                        <h1 className="text-[16px] font-bold text-[#1E293B] dark:text-[#f0f0f0] leading-tight">{ticketNo}</h1>
                        <p className="text-[11px] text-[#9CA3AF] leading-tight">Created {createdAt}{resolvedAt ? ` · Resolved ${resolvedAt}` : ""}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", STATUS_BADGE[status])}>
                        {status}
                    </span>
                    <button type="button" onClick={() => setShowDeleteConfirm(true)}
                        className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                        <Trash2 className="h-3 w-3 text-[#A27B3A]" /> Delete
                    </button>
                    <button type="button" onClick={handleSave} disabled={isSaving}
                        className="flex h-8 items-center gap-1 rounded-[6px] bg-[#C69A52] px-3 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs disabled:opacity-60 cursor-pointer">
                        <Save className="h-3 w-3" /> {isSaving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>

            {/* DETAIL */}
            <div className={`${cardCls} space-y-3`}>
                <p className={sectionTitleCls}>Detail</p>
                <div className="space-y-1">
                    <Label className={labelCls}>Title <span className="text-red-500">*</span></Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1">
                    <Label className={labelCls}>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                        className="min-h-32 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white! dark:bg-[#2a2a2a]! text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 py-2 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-none" />
                </div>
            </div>

            {/* TRIAGE */}
            <div className={cardCls}>
                <p className={sectionTitleCls}>Triage</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className={labelCls}>Category</Label>
                        <Input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1">
                        <Label className={labelCls}>Priority</Label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value as SupportPriority)} className={selectCls} style={selectArrow}>
                            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label className={labelCls}>Status</Label>
                        <select value={status} onChange={(e) => setStatus(e.target.value as SupportStatus)} className={selectCls} style={selectArrow}>
                            {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ATTACHMENT */}
            <div className={`${cardCls} space-y-2`}>
                <p className={sectionTitleCls}>Attachment</p>
                {attachmentUrl ? (
                    <a href={`${fileOrigin}${attachmentUrl}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[12px] font-medium text-[#A27B3A] hover:underline w-fit">
                        <Paperclip className="h-3.5 w-3.5" /> View attachment
                    </a>
                ) : (
                    <p className="text-[12px] text-[#9CA3AF] italic">No attachment uploaded.</p>
                )}
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                    className="flex h-8 items-center gap-1 rounded-[6px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-2.5 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-50">
                    <Upload className="h-3 w-3 text-[#A27B3A]" /> {isUploading ? "Uploading…" : attachmentUrl ? "Replace file" : "Upload file"}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileSelected} />
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete this ticket?"
                message="This support ticket will be permanently removed."
                confirmLabel="Delete"
            />
        </div>
    );
}

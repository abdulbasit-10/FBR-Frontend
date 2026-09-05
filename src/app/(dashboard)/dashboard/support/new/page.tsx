"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { supportService, type SupportPriority } from "@/lib/services";

const PRIORITIES: SupportPriority[] = ["Low", "Normal", "High", "Urgent"];

const selectArrow = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const,
    backgroundPosition: "right 10px center" as const,
    paddingRight: "28px",
};
const selectCls = "h-10 w-full rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] px-3 focus:outline-none focus:border-[#C69A52] appearance-none cursor-pointer";

const inputCls =
    "h-9 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] !bg-white dark:!bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none";

const textareaCls =
    "min-h-32 rounded-[6px] border border-[#D1D5DB] dark:border-[#3a3a3a] !bg-white dark:!bg-[#2a2a2a] text-[12px] text-[#1E293B] dark:text-[#f0f0f0] placeholder:text-[#9CA3AF] resize-none focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none";

export default function NewSupportRequestPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [priority, setPriority] = useState<SupportPriority>("Normal");
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0];
        if (picked) setFile(picked);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) setFile(dropped);
    };

    const canSubmit = title.trim() !== "" && description.trim() !== "";
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setIsSaving(true);
        try {
            const created = await supportService.create({
                title: title.trim(),
                description: description.trim(),
                category: category.trim() || null,
                priority,
            });
            if (file) {
                try {
                    await supportService.uploadAttachment(created.data.uuid, file);
                } catch (uploadErr) {
                    toast.error(uploadErr instanceof Error ? uploadErr.message : "Ticket created, but attachment upload failed.");
                }
            }
            toast.success("Support request submitted.");
            router.back();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to submit ticket.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-full space-y-2.5 text-[#4f5967]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-0.5">
                <button onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-[16px] font-bold text-[#1E293B] dark:text-[#f0f0f0] hover:opacity-75 transition-opacity cursor-pointer">
                    <ChevronLeft className="h-4.5 w-4.5 text-[#A27B3A]" />
                    New support request
                </button>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()}
                        className="flex h-8 items-center gap-1 rounded-[5px] border border-[#E3D2BA] dark:border-[#4a3a20] bg-white dark:bg-[#2a2a2a] px-3 text-[12px] font-medium text-[#424B56] dark:text-[#c99d54] hover:bg-[#FAF6F0] dark:hover:bg-[#333] transition-colors cursor-pointer">
                        Cancel
                    </button>
                    <button type="button" disabled={!canSubmit || isSaving}
                        onClick={handleSubmit}
                        className="flex h-8 items-center gap-1 rounded-[5px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                        {isSaving ? "Submitting…" : "Submit"}
                    </button>
                </div>
            </div>

            {/* ── DETAIL card ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3.5 shadow-xs space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Detail</p>

                <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af]">
                        Title <span className="text-[#A27B3A]">*</span>
                    </Label>
                    <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="Brief summary of the issue"
                        className={inputCls} />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af]">
                        Description <span className="text-[#A27B3A]">*</span>
                    </Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your issue in detail..."
                        className={textareaCls} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af]">Category</Label>
                        <Input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g. Billing, Technical, FBR Integration"
                            className={inputCls} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[12px] font-medium text-[#4F5967] dark:text-[#9ca3af]">Priority</Label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value as SupportPriority)}
                            className={selectCls} style={selectArrow}>
                            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── ATTACHMENT card ── */}
            <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-3.5 shadow-xs space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">
                    Attachment <span className="normal-case font-normal text-[#9CA3AF]">(optional)</span>
                </p>
                <p className="text-[12px] text-[#9CA3AF]">Image or PDF, max 10 MB. Uploaded when you submit.</p>

                {/* Drop zone */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1.5 rounded-[8px] border-2 border-dashed cursor-pointer py-8 transition-colors",
                        isDragging
                            ? "border-[#C69A52] bg-[#FAF6F0] dark:bg-[#2a1e0a]"
                            : "border-[#D1D5DB] dark:border-[#3a3a3a] bg-[#FAFAFA] dark:bg-[#1e1e1e] hover:border-[#C69A52] hover:bg-[#FAF6F0] dark:hover:bg-[#2a1e0a]"
                    )}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF6EE] dark:bg-[#2a2a2a] border border-[#E3D2BA] dark:border-[#4a3a20]">
                        <Upload className="h-4.5 w-4.5 text-[#A27B3A]" />
                    </div>
                    {file ? (
                        <p className="text-[12px] font-medium text-[#1E293B] dark:text-[#f0f0f0]">{file.name}</p>
                    ) : (
                        <p className="text-[12px] text-[#9CA3AF]">Upload File</p>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
                </div>
            </div>
        </div>
    );
}

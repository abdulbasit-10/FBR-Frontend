"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const inputCls =
    "h-10 rounded-[6px] border border-[#D1D5DB] bg-white! text-[12px] text-[#1E293B] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none";

const textareaCls =
    "min-h-[160px] rounded-[6px] border border-[#D1D5DB] bg-white! text-[12px] text-[#1E293B] placeholder:text-[#9CA3AF] resize-none focus:outline-none focus:ring-0 focus:border-[#C69A52] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#C69A52] shadow-none";

export default function NewSupportRequestPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
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

    return (
        <div className="min-h-full space-y-4 text-[#4f5967]" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex items-center justify-between pb-1">
                <button onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-[20px] font-bold text-[#1E293B] hover:opacity-75 transition-opacity">
                    <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
                    New support request
                </button>
                <div className="flex items-center gap-2.5">
                    <button type="button" onClick={() => router.back()}
                        className="flex h-9 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] bg-white px-5 text-[13px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors">
                        Cancel
                    </button>
                    <button type="button" disabled={!canSubmit}
                        className="flex h-9 items-center gap-1.5 rounded-[5px] bg-[#C69A52] px-6 text-[13px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed">
                        Submit
                    </button>
                </div>
            </div>

            {/* ── DETAIL card ── */}
            <div className="rounded-[11px] border border-[#E5E7EB] bg-white p-5 shadow-xs space-y-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A]">Detail</p>

                <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-[#4F5967]">
                        Title <span className="text-[#A27B3A]">*</span>
                    </Label>
                    <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="Brief summary of the issue"
                        className={inputCls} />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-[#4F5967]">
                        Description <span className="text-[#A27B3A]">*</span>
                    </Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your issue in detail..."
                        className={textareaCls} />
                </div>
            </div>

            {/* ── ATTACHMENT card ── */}
            <div className="rounded-[11px] border border-[#E5E7EB] bg-white p-5 shadow-xs space-y-3">
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
                        "flex flex-col items-center justify-center gap-2 rounded-[8px] border-2 border-dashed cursor-pointer py-12 transition-colors",
                        isDragging
                            ? "border-[#C69A52] bg-[#FAF6F0]"
                            : "border-[#D1D5DB] bg-[#FAFAFA] hover:border-[#C69A52] hover:bg-[#FAF6F0]"
                    )}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF6EE] border border-[#E3D2BA]">
                        <Upload className="h-5 w-5 text-[#A27B3A]" />
                    </div>
                    {file ? (
                        <p className="text-[12px] font-medium text-[#1E293B]">{file.name}</p>
                    ) : (
                        <p className="text-[12px] text-[#9CA3AF]">Upload File</p>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
                </div>
            </div>
        </div>
    );
}

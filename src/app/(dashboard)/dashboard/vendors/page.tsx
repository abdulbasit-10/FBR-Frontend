"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronLeft, Building2 } from "lucide-react";

const TABLE_COLS = ["Vendor No", "Name", "Province", "Type", "Registration", "NTN", "STRN", "Actions"];

export default function VendorsPage() {
    const router = useRouter();

    return (
        <div className="min-h-full space-y-4 text-[#4f5967] dark:text-[#9ca3af]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => router.back()} className="cursor-pointer text-[#A27B3A] hover:opacity-75 transition-opacity">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-[18px] font-bold text-[#1E293B] dark:text-[#f0f0f0]">Vendors</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => router.push("/dashboard/vendors/new")}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] bg-[#C69A52] px-4 text-[12px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs">
                        <Plus className="h-3.5 w-3.5" /> New
                    </button>
                </div>
            </div>

            <div className="rounded-[8px] border border-[#F3D89A] dark:border-[#4a3010] bg-[#FFFBEB] dark:bg-[#1e1a08] px-4 py-3">
                <p className="text-[12px] text-[#92590A]">
                    The Vendor module is not yet available in the backend API. Vendor data will appear here once the server-side vendor management endpoints are deployed.
                </p>
            </div>

            <div className="rounded-[16px] border border-[#E5E7EB] dark:border-[#2e2e2e] bg-white dark:bg-[#242424] p-4 shadow-xs">
                <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB] dark:border-[#2e2e2e]">
                    <table className="w-full text-[12px] border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-[#C69A52] text-white">
                                {TABLE_COLS.map((col) => (
                                    <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colSpan={TABLE_COLS.length} className="py-14 text-center bg-white dark:bg-[#242424]">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FAF6EE] dark:bg-[#2a2a2a]">
                                            <Building2 className="h-5 w-5 text-[#C69A52]" />
                                        </div>
                                        <p className="text-[12px] text-[#9CA3AF] italic">No vendors — backend module not yet available.</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Plus, Trash2, RotateCcw, Save } from "lucide-react";
import Image from "next/image";

// Mock customer data
const mockCustomers = [
  {
    id: 1,
    name: "ABC Corporation",
    phone: "123-456-7890",
    email: "info@abccorp.com",
    address: "123 Main St, City",
    taxId: "TAX123456",
  },
  {
    id: 2,
    name: "XYZ Ltd",
    phone: "987-654-3210",
    email: "contact@xyzltd.com",
    address: "456 Oak Ave, Town",
    taxId: "TAX987654",
  },
];

// Mock products
const mockProducts = [
  { id: 1, name: "Product A", price: 100 },
  { id: 2, name: "Product B", price: 250 },
  { id: 3, name: "Service X", price: 75 },
];

interface InvoiceItem {
  id: string;
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
}

export default function CreateSalesInvoicePage() {
  const router = useRouter();
  const [documentDate, setDocumentDate] = useState("");
  const [postingDate, setPostingDate] = useState("");
  const [poDate, setPoDate] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [advanceTax, setAdvanceTax] = useState(0);
  const [notes, setNotes] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      productId: null,
      productName: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      tax: 0,
    },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(36).substr(2, 9),
        productId: null,
        productName: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        tax: 10,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<InvoiceItem>) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Calculations
  const assessedValue = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const totalDiscount = items.reduce(
    (sum, item) =>
      sum + (item.quantity * item.unitPrice * item.discount) / 100,
    0
  );
  const amountExclTax = items.reduce(
    (sum, item) =>
      sum + (item.quantity * item.unitPrice * (100 - item.discount)) / 100,
    0
  );
  const totalTax = items.reduce(
    (sum, item) =>
      sum +
      (((item.quantity * item.unitPrice * (100 - item.discount)) / 100) *
        item.tax) /
      100,
    0
  );
  const amountInclTax = amountExclTax + totalTax;
  const grandTotal = amountInclTax + advanceTax;

  const resetForm = () => {
    setDocumentDate("");
    setPostingDate("");
    setPoDate("");
    setPoNumber("");
    setAdvanceTax(0);
    setNotes("");
    setSelectedCustomer(null);
    setItems([
      {
        id: "1",
        productId: null,
        productName: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        tax: 0,
      },
    ]);
  };

  const handleSave = () => {
    if (!documentDate || !postingDate || !selectedCustomer || items.length === 0) {
      alert("Please fill all required fields and add at least one item.");
      return;
    }
    alert("Invoice saved successfully!");
  };

  // Common Input Style variable to ensure perfect 1:1 match across all inputs
  const inputStyleClass =
    "h-[48px] rounded-[6px] border border-[#D1D5DB] !bg-white text-[13px] text-[#1E293B] placeholder:text-[#9CA3AF] pt-[12px] pb-[12px] pl-[15px] pr-[10px] focus:outline-none focus:ring-0 focus:border-[#D1D5DB] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none [color-scheme:light]";

  return (
    <div
      className="min-h-full space-y-4 text-[#4f5967]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Page Header Controls ── */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[20px] font-bold text-[#1E293B] hover:opacity-75 transition-opacity"
        >
          <ChevronLeft className="h-5 w-5 text-[#A27B3A]" />
          New Sales Invoice
        </button>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={resetForm}
            className="flex h-9 items-center gap-1.5 rounded-[5px] border border-[#E3D2BA] bg-white px-4 text-[13px] font-medium text-[#424B56] hover:bg-[#FAF6F0] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#A27B3A]" /> Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex h-9 items-center gap-1.5 rounded-[5px] bg-[#C69A52] px-5 text-[13px] font-medium text-white hover:bg-[#b58b44] transition-colors shadow-xs"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* ── SALES HEADER OUTER SECTION ── */}
        <div className="rounded-[11px] border border-[#E5E7EB] bg-white p-[18px] shadow-xs">
          <p className="mb-4 text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">
            Sales Header
          </p>

          <div className="grid gap-6 lg:grid-cols-[1fr_265px] items-stretch">
            {/* Left Inputs Block */}
            <div className="flex flex-col gap-4">
              {/* Row 1: Document Date + Posting Date */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-[#4F5967]">
                    Document Date <span className="text-[#A27B3A]">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                    className={inputStyleClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium bg-white text-[#4F5967]">
                    Posting Date <span className="text-[#A27B3A]">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={postingDate}
                    onChange={(e) => setPostingDate(e.target.value)}
                    className={inputStyleClass}
                  />
                </div>
              </div>

              {/* Row 2: PO Date + PO Number */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-[#4F5967]">
                    PO Date <span className="text-[#A27B3A]">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    className={inputStyleClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-[#4F5967]">
                    PO Number <span className="text-[#A27B3A]">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="Optional"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className={inputStyleClass}
                  />
                </div>
              </div>

              {/* Advance Tax */}
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-[#4F5967]">
                  Advance tax ({advanceTax.toFixed(2)}%) <span className="text-[#A27B3A]">*</span>
                </Label>
                <Input
                  type="number"
                  value={advanceTax === 0 ? "" : advanceTax}
                  placeholder="0"
                  onChange={(e) => setAdvanceTax(parseFloat(e.target.value) || 0)}
                  className={inputStyleClass}
                />
              </div>

              {/* Note Textarea */}
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-[#4F5967]">
                  Note <span className="text-[#A27B3A]">*</span>
                </Label>
                <Textarea
                  placeholder="Add note"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-[115px] min-h-[115px] rounded-[6px] border border-[#D1D5DB] bg-white text-[13px] text-[#1E293B] placeholder:text-[#9CA3AF] pt-[13px] pb-[12px] pl-[15px] pr-[10px] resize-none focus:outline-none focus:ring-0 focus:border-[#D1D5DB] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                />
              </div>
            </div>

            {/* ── RIGHT FIGMA PREVIEW CARD ── */}
            <div className="w-[265px] rounded-[14px] border border-[#E5E7EB] bg-white px-[19px] py-[12px] flex flex-col justify-between gap-[16px]">
              {/* Brand Header */}
              <div className="flex flex-col items-center border-b border-[#F3F4F6] pb-[10px]">
                <Image
                  src="/brand/Digital.svg"
                  alt="Encova Solution"
                  width={48}
                  height={48}
                  className="h-12 w-auto mb-1.5 object-contain"
                  priority
                />
                <h3 className="text-[14px] font-bold text-[#1E293B] leading-tight">
                  Encova Solution
                </h3>
                <span className="text-[11px] text-[#9CA3AF] font-normal mt-0.5">
                  Sales invoice preview
                </span>
              </div>

              {/* Sales Total Items List */}
              <div className="flex flex-col gap-[7px]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A27B3A] mb-1">
                  Sales Total
                </span>

                {[
                  ["Assessed value", assessedValue.toFixed(2)],
                  ["Amount excl. discount", assessedValue.toFixed(2)],
                  ["Discount", totalDiscount.toFixed(2)],
                  ["Amount excl. sales tax", amountExclTax.toFixed(2)],
                  ["Sales tax", totalTax.toFixed(2)],
                  ["Amount incl. sales tax", amountInclTax.toFixed(2)],
                  ["Further tax", "0.00"],
                  ["Amount incl. further tax", amountInclTax.toFixed(2)],
                  ["Advance tax", advanceTax.toFixed(2)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center text-[11px]">
                    <span className="text-[#6B7280] font-normal">{label}</span>
                    <span className="text-[#1E293B] font-bold">{value}</span>
                  </div>
                ))}
              </div>

              {/* Grand Total Footer Highlight */}
              <div className="w-full h-[39px] rounded-[7px] bg-[#FAF6EE] border border-[#F3EAD8] px-[14px] py-[8px] flex items-center justify-between mt-auto">
                <span className="text-[11px] font-bold uppercase text-[#A27B3A] tracking-wider">
                  Grand Total
                </span>
                <span className="text-[13px] font-bold text-[#A27B3A]">
                  {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* ── CUSTOMER SECTION ── */}
        <div className="h-[118.5px] rounded-[11px] border border-[#E5E7EB] bg-white p-[21px] flex flex-col justify-between shadow-xs">
          <p className="text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">
            Customer
          </p>

          {selectedCustomer ? (
            <div className="flex items-center justify-between rounded-[7px] border border-[#E5E7EB] bg-[#FAF6F0] px-4 py-2">
              <div>
                <p className="text-[13px] font-semibold text-[#1E293B]">{selectedCustomer.name}</p>
                <p className="text-[11px] text-[#6B7280]">
                  {selectedCustomer.phone} · {selectedCustomer.email} · Tax ID: {selectedCustomer.taxId}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-[12px] text-[#A27B3A] hover:underline font-medium"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <button
                type="button"
                onClick={() => setShowCustomerPicker(!showCustomerPicker)}
                className="max-w-[392px] w-full h-[40.5px] rounded-[7px] border border-dashed border-[#C69B56] bg-[#C69A52]/[0.04] px-[28px] text-[13px] font-medium text-[#C69B56] hover:bg-[#C69A52]/[0.08] transition-colors flex items-center justify-center"
              >
                Select customer
              </button>
            </div>
          )}

          {showCustomerPicker && !selectedCustomer && (
            <div className="absolute z-10 mt-12 max-w-[392px] w-full rounded-lg border border-[#E5E7EB] overflow-hidden shadow-md bg-white">
              {mockCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setShowCustomerPicker(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-[#FAF6F0] border-b border-[#E5E7EB] last:border-0"
                >
                  <span className="font-semibold text-[#1E293B]">{c.name}</span>
                  <span className="ml-2 text-[11px] text-[#9CA3AF]">{c.taxId}</span>
                </button>
              ))}
            </div>
          )}
        </div>


        {/* ── CUSTOMER LINE ITEMS TABLE SECTION ── */}
        <div className="rounded-[11px] border border-[#E5E7EB] bg-white p-[20px] py-[16px] shadow-xs space-y-[10px]">

          {/* Header Title + Action Controls */}
          <div className="flex items-center justify-between pb-1">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#A27B3A]">
              Customer
            </p>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 rounded-[6px] border border-[#E3D2BA] bg-white px-3 py-1 text-[12px] font-medium text-[#A27B3A] hover:bg-[#FAF6F0] transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-[#A27B3A]" /> Add line
            </button>
          </div>

          {/* Table Scroll Wrapper */}
          <div className="overflow-x-auto rounded-[8px] border border-[#E5E7EB]">
            <table className="w-full text-[12px] min-w-[850px] border-collapse">
              <thead>
                <tr className="bg-[#C69A52] text-white">
                  <th className="w-12 py-3 px-3 text-center font-bold">#</th>
                  <th className="w-20 py-3 px-3 text-left font-bold">Item no</th>
                  <th className="w-[170px] py-3 px-3 text-left font-bold">Item name</th>
                  <th className="w-16 py-3 px-3 text-center font-bold">Qty</th>
                  <th className="w-24 py-3 px-3 text-center font-bold">Assessed/U</th>
                  <th className="w-28 py-3 px-3 text-center font-bold">Assessed value</th>
                  <th className="w-24 py-3 px-3 text-center font-bold">Unit price</th>
                  <th className="w-24 py-3 px-3 text-center font-bold">Retail price</th>
                  <th className="w-28 py-3 px-3 text-right font-bold pr-4">Amt excl. disc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] bg-white">
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#FAF6F0]/40 transition-colors"
                  >
                    {/* Action Buttons & Index */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={addItem}
                          className="text-[#A27B3A] hover:text-[#b58b44] transition-colors"
                          title="Add Line"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Remove Line"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <span className="ml-0.5 text-[#9CA3AF] text-[11px] font-medium">{index + 1}</span>
                      </div>
                    </td>

                    {/* Item No */}
                    <td className="py-2 px-3 text-[#9CA3AF]">—</td>

                    {/* Item Name Dropdown (Figma Spec: 160px x 39.5px) */}
                    <td className="py-2 px-3">
                      <select
                        className="w-[160px] h-[39.5px] rounded-[6px] border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 text-[12px] text-[#1E293B] focus:outline-none focus:border-[#C69A52] focus:bg-white transition-colors"
                        value={item.productId || ""}
                        onChange={(e) => {
                          const product = mockProducts.find(
                            (p) => p.id === parseInt(e.target.value)
                          );
                          if (product) {
                            updateItem(item.id, {
                              productId: product.id,
                              productName: product.name,
                              unitPrice: product.price,
                            });
                          } else {
                            updateItem(item.id, { productId: null, productName: "" });
                          }
                        }}
                      >
                        <option value="">Select Item</option>
                        {mockProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Qty Input */}
                    <td className="py-2 px-3 text-center">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, {
                            quantity: parseInt(e.target.value) || 0,
                          })
                        }
                        className="h-[39.5px] w-[50px] mx-auto rounded-[6px] border border-[#E5E7EB] bg-[#F9FAFB] text-center text-[12px] px-1 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus:bg-white shadow-none"
                      />
                    </td>

                    {/* Assessed / U */}
                    <td className="py-2 px-3 text-center text-[#9CA3AF]">—</td>

                    {/* Assessed Value */}
                    <td className="py-2 px-3 text-center text-[#9CA3AF]">—</td>

                    {/* Unit Price Input */}
                    <td className="py-2 px-3 text-center">
                      <Input
                        type="number"
                        value={item.unitPrice === 0 ? "" : item.unitPrice}
                        placeholder="0"
                        onChange={(e) =>
                          updateItem(item.id, {
                            unitPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-[39.5px] w-[75px] mx-auto rounded-[6px] border border-[#E5E7EB] bg-[#F9FAFB] text-center text-[12px] px-2 focus:outline-none focus:ring-0 focus:border-[#C69A52] focus:bg-white shadow-none"
                      />
                    </td>

                    {/* Retail Price */}
                    <td className="py-2 px-3 text-center text-[#9CA3AF]">—</td>

                    {/* Amount Excl. Discount */}
                    <td className="py-2 px-3 text-right pr-4 font-bold text-[#1E293B]">
                      {(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
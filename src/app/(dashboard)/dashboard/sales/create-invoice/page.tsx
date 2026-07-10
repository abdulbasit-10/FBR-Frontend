"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ChevronRight,
  Plus,
  Trash2,
  RefreshCw,
  FileText,
  Building2,
} from "lucide-react";

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
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
  const [poDate, setPoDate] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [advanceTax, setAdvanceTax] = useState(0);
  const [notes, setNotes] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);

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
        tax: 10, // 10% default
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<InvoiceItem>) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Calculations
  const calculateItemTotal = (item: InvoiceItem) => {
    const lineTotal = item.quantity * item.unitPrice;
    const discountAmount = (lineTotal * item.discount) / 100;
    const afterDiscount = lineTotal - discountAmount;
    const taxAmount = (afterDiscount * item.tax) / 100;
    return afterDiscount + taxAmount;
  };

  const assessedValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalDiscount = items.reduce((sum, item) => sum + ((item.quantity * item.unitPrice * item.discount) / 100), 0);
  const amountExclTax = items.reduce((sum, item) => sum + ((item.quantity * item.unitPrice * (100 - item.discount)) / 100), 0);
  const totalTax = items.reduce((sum, item) => sum + (((item.quantity * item.unitPrice * (100 - item.discount)) / 100) * item.tax / 100), 0);
  const amountInclTax = amountExclTax + totalTax;
  const grandTotal = amountInclTax + advanceTax;

  const resetForm = () => {
    setDocumentDate(new Date().toISOString().split('T')[0]);
    setPostingDate(new Date().toISOString().split('T')[0]);
    setPoDate("");
    setPoNumber("");
    setAdvanceTax(0);
    setNotes("");
    setSelectedCustomer(null);
    setItems([]);
  };

  const handleSave = () => {
    // Add validation
    if (!documentDate || !postingDate || !selectedCustomer || items.length === 0) {
      alert("Please fill all required fields and add at least one item.");
      return;
    }

    // Mock save
    console.log("Saving invoice...", {
      documentDate,
      postingDate,
      poDate,
      poNumber,
      advanceTax,
      notes,
      selectedCustomer,
      items,
      totals: {
        assessedValue,
        totalDiscount,
        amountExclTax,
        totalTax,
        amountInclTax,
        grandTotal,
      },
    });
    alert("Invoice saved successfully!");
  };

  return (
    <div className="min-h-full space-y-6">
      {/* Breadcrumb + Title + Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Dashboard</span>
            <ChevronRight className="h-4 w-4" />
            <span>Sales</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Create Invoice</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Sales Invoice</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={resetForm}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
            <FileText className="h-4 w-4 mr-2" />
            Save Invoice
          </Button>
        </div>
      </div>

      {/* Main Layout: Two Column (Left Form, Right Summary) */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Sales Header Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Sales Header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Row 1: Dates */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Document Date <span className="text-red-500">*</span></Label>
                  <Input 
                    type="date" 
                    value={documentDate} 
                    onChange={(e) => setDocumentDate(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Posting Date <span className="text-red-500">*</span></Label>
                  <Input 
                    type="date" 
                    value={postingDate} 
                    onChange={(e) => setPostingDate(e.target.value)} 
                  />
                </div>
              </div>

              {/* Row 2: PO Date + PO Number */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>PO Date</Label>
                  <Input 
                    type="date" 
                    value={poDate} 
                    onChange={(e) => setPoDate(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>PO Number</Label>
                  <Input 
                    type="text" 
                    placeholder="Enter PO number" 
                    value={poNumber} 
                    onChange={(e) => setPoNumber(e.target.value)} 
                  />
                </div>
              </div>

              {/* Row 3: Advance Tax */}
              <div className="space-y-2">
                <Label>Advance Tax (%)</Label>
                <Input 
                  type="number" 
                  value={advanceTax} 
                  onChange={(e) => setAdvanceTax(parseFloat(e.target.value) || 0)} 
                  placeholder="0"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Add notes for this invoice..." 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Selection Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Customer <span className="text-red-500">*</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Customer</Label>
                <select 
                  className="w-full rounded-lg border border-input bg-background px-3 py-2"
                  value={selectedCustomer?.id || ""}
                  onChange={(e) => {
                    const customer = mockCustomers.find(c => c.id === parseInt(e.target.value));
                    setSelectedCustomer(customer || null);
                  }}
                >
                  <option value="">-- Select a customer --</option>
                  {mockCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-4 space-y-2">
                  <h3 className="font-semibold text-foreground">{selectedCustomer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone} • {selectedCustomer.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.address}</p>
                  <p className="text-sm text-muted-foreground">Tax ID: {selectedCustomer.taxId}</p>
                </div>
              )}

              <Button variant="outline" size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add New Customer
              </Button>
            </CardContent>
          </Card>

          {/* Invoice Items Table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Line
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Product / Service</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Quantity</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Unit Price</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Discount (%)</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Tax (%)</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Total</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No items added. Click "Add Line" to start.
                        </td>
                      </tr>
                    ) : (
                      items.map(item => (
                        <tr key={item.id} className="border-b">
                          <td className="py-3 px-2">
                            <select 
                              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                              value={item.productId || ""}
                              onChange={(e) => {
                                const product = mockProducts.find(p => p.id === parseInt(e.target.value));
                                if (product) {
                                  updateItem(item.id, { productId: product.id, productName: product.name, unitPrice: product.price });
                                } else {
                                  updateItem(item.id, { productId: null, productName: "" });
                                }
                              }}
                            >
                              <option value="">-- Select product --</option>
                              {mockProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-2">
                            <Input 
                              type="number" 
                              className="w-24"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <Input 
                              type="number" 
                              className="w-32"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <Input 
                              type="number" 
                              className="w-24"
                              value={item.discount}
                              onChange={(e) => updateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <Input 
                              type="number" 
                              className="w-24"
                              value={item.tax}
                              onChange={(e) => updateItem(item.id, { tax: parseFloat(e.target.value) || 0 })}
                            />
                          </td>
                          <td className="py-3 px-2 font-medium">
                            {calculateItemTotal(item).toFixed(2)}
                          </td>
                          <td className="py-3 px-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary Panel */}
        <div className="lg:sticky lg:top-24">
          <Card className="shadow-sm border-l-4 border-l-emerald-600">
            <CardHeader className="pb-4 text-center border-b">
              <div className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">ABDUL ALI TRADERS</h3>
                <p className="text-sm text-muted-foreground">Sales Invoice Preview</p>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                {/* Assessed Value */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Assessed Value</span>
                  <span className="font-medium">{assessedValue.toFixed(2)}</span>
                </div>

                {/* Amount Excluding Discount */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount Excl. Discount</span>
                  <span className="font-medium">{(assessedValue - totalDiscount).toFixed(2)}</span>
                </div>

                {/* Discount */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Discount</span>
                  <span className="font-medium text-red-500">- {totalDiscount.toFixed(2)}</span>
                </div>

                {/* Amount Excluding Sales Tax */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount Excl. Sales Tax</span>
                  <span className="font-medium">{amountExclTax.toFixed(2)}</span>
                </div>

                {/* Sales Tax */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sales Tax</span>
                  <span className="font-medium text-emerald-600">{totalTax.toFixed(2)}</span>
                </div>

                {/* Amount Including Sales Tax */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount Incl. Sales Tax</span>
                  <span className="font-medium">{amountInclTax.toFixed(2)}</span>
                </div>

                {/* Further Tax (placeholder) */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Further Tax</span>
                  <span className="font-medium">0.00</span>
                </div>

                {/* Amount Including Further Tax */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount Incl. Further Tax</span>
                  <span className="font-medium">{amountInclTax.toFixed(2)}</span>
                </div>

                {/* Advance Tax */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Advance Tax</span>
                  <span className="font-medium">{advanceTax.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-foreground">GRAND TOTAL</span>
                  <span className="text-2xl font-bold text-emerald-600">{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

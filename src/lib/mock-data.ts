const BASE_DATE = new Date("2026-07-07T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

export type DashboardFilter =
  | "Today"
  | "Yesterday"
  | "Last 7 Days"
  | "Last 30 Days"
  | "Monthly"
  | "Quarterly"
  | "Yearly"
  | "Custom Date Range";

export type TaxpayerStatus = "Active" | "Inactive";
export type InvoiceType = "Sales" | "Purchase";
export type InvoiceStatus = "Submitted" | "Processing" | "Verified" | "Rejected";
export type PaymentStatus = "Paid" | "Pending" | "Partially Paid" | "Unpaid";
export type IntegrationStatus = "Not Integrated" | "Sandbox Testing" | "Live";
export type ProductionStatus = "Production" | "Sandbox" | "Not Moved";
export type ApplicationStatus = "Pending" | "Under Review" | "Approved" | "Rejected";
export type ApiTestingStatus =
  | "Not Started"
  | "Queued"
  | "In Progress"
  | "Passed"
  | "Failed";
export type ProvinceName =
  | "Punjab"
  | "Sindh"
  | "KPK"
  | "Balochistan"
  | "Islamabad"
  | "AJK"
  | "Gilgit Baltistan";

export interface DashboardCard {
  key: string;
  title: string;
  value: number;
  unit?: "count" | "currency" | "percent";
  description: string;
  trend: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  taxpayerName: string;
  taxpayerNTN: string;
  invoiceType: InvoiceType;
  invoiceAmount: number;
  taxAmount: number;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  submissionDate: string;
  province: ProvinceName;
  city: string;
  businessSector: BusinessSector;
  apiSource: string;
  integrationType: "Portal" | "Sandbox" | "Production";
  validationStatus: "Validated" | "Queued" | "Pending Review" | "Failed Validation";
}

export interface TaxpayerRecord {
  id: string;
  companyName: string;
  NTN: string;
  STRN: string;
  businessSector: BusinessSector;
  registrationDate: string;
  status: TaxpayerStatus;
  apiIntegrated: boolean;
  integrationStatus: IntegrationStatus;
  productionStatus: ProductionStatus;
  totalInvoices: number;
  totalSales: number;
  totalTaxPaid: number;
  province: ProvinceName;
  city: string;
}

export interface LicenseApplication {
  applicationId: string;
  taxpayerName: string;
  companyName: string;
  submissionDate: string;
  reviewDate: string | null;
  status: ApplicationStatus;
  reviewer: string | null;
  remarks: string;
  apiTestingStatus: ApiTestingStatus;
  productionReady: boolean;
  productionDate: string | null;
}

export interface ApiLog {
  id: string;
  taxpayer: string;
  endpoint: ApiEndpoint;
  method: "GET" | "POST";
  responseTime: number;
  statusCode: number;
  success: boolean;
  timestamp: string;
}

export interface RevenueRecord {
  date: string;
  invoiceCount: number;
  taxableAmount: number;
  taxCollected: number;
  refunds: number;
  adjustments: number;
  netTax: number;
}

export interface ChartDatum {
  label: string;
  value: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category:
    | "registration"
    | "invoice"
    | "application"
    | "integration"
    | "rejection"
    | "deployment";
}

export interface ProvinceAnalytics {
  province: ProvinceName;
  taxpayers: number;
  invoices: number;
  taxCollected: number;
  revenue: number;
}

export interface InvoiceAnalyticsBucket {
  period: string;
  invoiceCount: number;
  taxableAmount: number;
  taxCollected: number;
  verifiedInvoices: number;
  rejectedInvoices: number;
}

type BusinessSector =
  | "Retail"
  | "Wholesale"
  | "Electronics"
  | "Pharmacy"
  | "Manufacturing"
  | "Textile"
  | "Food"
  | "Automotive"
  | "IT Services"
  | "Construction";

type ApiEndpoint =
  | "/invoice/create"
  | "/invoice/update"
  | "/invoice/list"
  | "/invoice/details"
  | "/taxpayer/register"
  | "/api/token";

const dashboardFilters: DashboardFilter[] = [
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "Monthly",
  "Quarterly",
  "Yearly",
  "Custom Date Range",
];

const businessSectors: BusinessSector[] = [
  "Retail",
  "Wholesale",
  "Electronics",
  "Pharmacy",
  "Manufacturing",
  "Textile",
  "Food",
  "Automotive",
  "IT Services",
  "Construction",
];

const provinceCities: Record<ProvinceName, string[]> = {
  Punjab: ["Lahore", "Rawalpindi", "Faisalabad", "Multan", "Gujranwala"],
  Sindh: ["Karachi", "Hyderabad", "Sukkur", "Larkana", "Mirpur Khas"],
  KPK: ["Peshawar", "Mardan", "Abbottabad", "Swat", "Kohat"],
  Balochistan: ["Quetta", "Gwadar", "Khuzdar", "Turbat", "Sibi"],
  Islamabad: ["Islamabad"],
  AJK: ["Muzaffarabad", "Mirpur", "Kotli"],
  "Gilgit Baltistan": ["Gilgit", "Skardu", "Hunza"],
};

const reviewerNames = [
  "Ayesha Nawaz",
  "Hamza Farooq",
  "Usman Tariq",
  "Maham Qureshi",
  "Sana Javed",
  "Bilal Khattak",
  "Kiran Shafiq",
  "Waleed Iqbal",
];

const companyPrefixes = [
  "Al",
  "Pak",
  "National",
  "Prime",
  "Metro",
  "Crescent",
  "United",
  "Secure",
  "Vertex",
  "Crystal",
  "Northern",
  "Royal",
  "Summit",
  "Future",
  "BlueLine",
];

const companySuffixes: Record<BusinessSector, string[]> = {
  Retail: ["Retail Mart", "Traders", "Store Chain", "Lifestyle Mart"],
  Wholesale: ["Distributors", "Supply House", "Wholesale Hub", "Bulk Traders"],
  Electronics: ["Electronics", "Digital Systems", "Tech World", "Appliances"],
  Pharmacy: ["Pharma Care", "MediPoint", "Health Supplies", "Life Sciences"],
  Manufacturing: ["Industries", "Manufacturing", "Engineering Works", "Industrial Solutions"],
  Textile: ["Textiles", "Garments", "Fabrics", "Weaving Mills"],
  Food: ["Foods", "Agro Foods", "Bakers", "Cold Chain Foods"],
  Automotive: ["Motors", "Auto Parts", "Mobility Solutions", "Vehicle Systems"],
  "IT Services": ["Tech Solutions", "Software House", "Digital Services", "Cloud Systems"],
  Construction: ["Builders", "Developers", "Infrastructure", "Construction Co."],
};

const sectorBaseAmount: Record<BusinessSector, number> = {
  Retail: 85000,
  Wholesale: 290000,
  Electronics: 410000,
  Pharmacy: 235000,
  Manufacturing: 760000,
  Textile: 620000,
  Food: 175000,
  Automotive: 540000,
  "IT Services": 320000,
  Construction: 950000,
};

const sectorTaxRate: Record<BusinessSector, number> = {
  Retail: 0.11,
  Wholesale: 0.07,
  Electronics: 0.16,
  Pharmacy: 0.08,
  Manufacturing: 0.14,
  Textile: 0.09,
  Food: 0.06,
  Automotive: 0.17,
  "IT Services": 0.13,
  Construction: 0.12,
};

function roundCurrency(value: number) {
  return Math.round(value);
}

function pad(value: number, size = 4) {
  return String(value).padStart(size, "0");
}

function iso(date: Date) {
  return date.toISOString();
}

function dateShift(daysAgo: number, hour: number, minute: number) {
  return new Date(BASE_DATE.getTime() - daysAgo * DAY_MS - hour * 3600000 - minute * 60000);
}

function monthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

function quarterLabel(date: Date) {
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `Q${quarter} ${date.getUTCFullYear()}`;
}

function yearLabel(date: Date) {
  return String(date.getUTCFullYear());
}

function dayLabel(date: Date) {
  return date.toISOString().slice(0, 10);
}

function modulo(index: number, multiplier: number, mod: number, offset = 0) {
  return (index * multiplier + offset) % mod;
}

type DraftTaxpayer = Omit<TaxpayerRecord, "totalInvoices" | "totalSales" | "totalTaxPaid">;

const taxpayerDrafts: DraftTaxpayer[] = Array.from({ length: 150 }, (_, index) => {
  const sector = businessSectors[index % businessSectors.length];
  const provinceList = Object.keys(provinceCities) as ProvinceName[];
  const province = provinceList[modulo(index, 5, provinceList.length, 2)];
  const cityList = provinceCities[province];
  const city = cityList[modulo(index, 3, cityList.length, 1)];
  const prefix = companyPrefixes[modulo(index, 7, companyPrefixes.length, 3)];
  const suffix = companySuffixes[sector][modulo(index, 5, companySuffixes[sector].length, 1)];
  const companyName = `${prefix} ${city} ${suffix} (Pvt.) Ltd.`;
  const status: TaxpayerStatus = index < 112 ? "Active" : "Inactive";

  let apiIntegrated = false;
  let integrationStatus: IntegrationStatus = "Not Integrated";
  let productionStatus: ProductionStatus = "Not Moved";

  if (index < 40) {
    apiIntegrated = true;
    integrationStatus = "Live";
    productionStatus = "Production";
  } else if (index < 68) {
    apiIntegrated = true;
    integrationStatus = "Sandbox Testing";
    productionStatus = "Sandbox";
  }

  const registrationDate = dateShift(680 - modulo(index, 29, 620), 2 + (index % 6), 15).toISOString();

  return {
    id: `taxpayer-${pad(index + 1, 3)}`,
    companyName,
    NTN: `10${pad(1200000 + index * 37, 7)}`,
    STRN: `32${pad(780000000000 + index * 9871, 12)}`,
    businessSector: sector,
    registrationDate,
    status,
    apiIntegrated,
    integrationStatus,
    productionStatus,
    province,
    city,
  };
});

const invoiceStatusForIndex = (index: number): InvoiceStatus => {
  if (index % 17 === 0) return "Rejected";
  if (index % 9 === 0) return "Processing";
  if (index % 7 === 0) return "Submitted";
  return "Verified";
};

const activeTaxpayerDrafts = taxpayerDrafts.filter((taxpayer) => taxpayer.status === "Active");

const invoices: InvoiceRecord[] = Array.from({ length: 520 }, (_, index) => {
  const taxpayer = activeTaxpayerDrafts[modulo(index, 7, activeTaxpayerDrafts.length, Math.floor(index / 4))];
  const sector = taxpayer.businessSector;
  const invoiceType: InvoiceType = index % 4 === 0 ? "Purchase" : "Sales";
  const status = invoiceStatusForIndex(index);
  const taxRate =
    sectorTaxRate[sector] + (invoiceType === "Sales" ? 0.004 : -0.006);
  const baseAmount = sectorBaseAmount[sector];
  const invoiceAmount = roundCurrency(
    baseAmount +
      ((index % 11) - 4) * 18500 +
      modulo(index, 913, 240000) +
      (invoiceType === "Purchase" ? baseAmount * 0.12 : baseAmount * 0.18),
  );
  const taxAmount = roundCurrency(invoiceAmount * Math.max(taxRate, 0.05));

  let paymentStatus: PaymentStatus = "Paid";
  let validationStatus: InvoiceRecord["validationStatus"] = "Validated";

  if (status === "Submitted") {
    paymentStatus = "Pending";
    validationStatus = "Queued";
  } else if (status === "Processing") {
    paymentStatus = "Partially Paid";
    validationStatus = "Pending Review";
  } else if (status === "Rejected") {
    paymentStatus = "Unpaid";
    validationStatus = "Failed Validation";
  }

  let daysAgo = 0;
  if (index < 24) {
    daysAgo = index % 2;
  } else if (index < 164) {
    daysAgo = 2 + modulo(index, 3, 28);
  } else if (index < 344) {
    daysAgo = 30 + modulo(index, 7, 150);
  } else {
    daysAgo = 180 + modulo(index, 11, 640);
  }

  const submissionDate = dateShift(daysAgo, 1 + (index % 9), modulo(index, 13, 60));
  const integrationType: InvoiceRecord["integrationType"] =
    taxpayer.productionStatus === "Production"
      ? "Production"
      : taxpayer.productionStatus === "Sandbox"
        ? "Sandbox"
        : "Portal";

  const apiSource =
    integrationType === "Production"
      ? index % 2 === 0
        ? "ERP API"
        : "POS API"
      : integrationType === "Sandbox"
        ? "Sandbox API"
        : "Taxpayer Portal";

  return {
    id: `invoice-${pad(index + 1, 4)}`,
    invoiceNumber: `FBR-${invoiceType === "Sales" ? "S" : "P"}-${dayLabel(submissionDate).replaceAll("-", "")}-${pad(index + 1, 4)}`,
    taxpayerName: taxpayer.companyName,
    taxpayerNTN: taxpayer.NTN,
    invoiceType,
    invoiceAmount,
    taxAmount,
    status,
    paymentStatus,
    submissionDate: submissionDate.toISOString(),
    province: taxpayer.province,
    city: taxpayer.city,
    businessSector: sector,
    apiSource,
    integrationType,
    validationStatus,
  };
});

const taxpayerInvoiceSummary = new Map<
  string,
  { totalInvoices: number; totalSales: number; totalTaxPaid: number }
>();

for (const invoice of invoices) {
  const existing = taxpayerInvoiceSummary.get(invoice.taxpayerNTN) ?? {
    totalInvoices: 0,
    totalSales: 0,
    totalTaxPaid: 0,
  };

  existing.totalInvoices += 1;
  if (invoice.invoiceType === "Sales" && invoice.status !== "Rejected") {
    existing.totalSales += invoice.invoiceAmount;
  }
  if (invoice.status === "Verified") {
    existing.totalTaxPaid += invoice.taxAmount;
  }

  taxpayerInvoiceSummary.set(invoice.taxpayerNTN, existing);
}

const taxpayers: TaxpayerRecord[] = taxpayerDrafts.map((taxpayer) => {
  const summary = taxpayerInvoiceSummary.get(taxpayer.NTN);
  return {
    ...taxpayer,
    totalInvoices: summary?.totalInvoices ?? 0,
    totalSales: summary?.totalSales ?? 0,
    totalTaxPaid: summary?.totalTaxPaid ?? 0,
  };
});

const applications: LicenseApplication[] = taxpayers.slice(0, 100).map((taxpayer, index) => {
  let status: ApplicationStatus;
  if (index < 40) status = "Approved";
  else if (index < 68) status = "Under Review";
  else if (index < 88) status = "Pending";
  else status = "Rejected";

  const submissionDate = dateShift(240 - modulo(index, 9, 180), 3 + (index % 4), 20);
  const reviewDate =
    status === "Pending"
      ? null
      : dateShift(200 - modulo(index, 7, 160), 6 + (index % 5), 10);
  const reviewer = status === "Pending" ? null : reviewerNames[index % reviewerNames.length];

  let apiTestingStatus: ApiTestingStatus = "Queued";
  let remarks = "Application queued for technical and compliance review.";
  let productionReady = false;
  let productionDate: string | null = null;

  if (status === "Approved") {
    apiTestingStatus = "Passed";
    productionReady = true;
    remarks = "Connectivity, schema validation, and invoice acknowledgement tests passed.";
    productionDate = reviewDate
      ? new Date(new Date(reviewDate).getTime() + (2 + (index % 5)) * DAY_MS).toISOString()
      : null;
  } else if (status === "Under Review") {
    apiTestingStatus = index % 3 === 0 ? "Passed" : "In Progress";
    remarks =
      apiTestingStatus === "Passed"
        ? "Sandbox certification cleared; waiting for compliance approval."
        : "Integrator logs are under functional and performance review.";
  } else if (status === "Rejected") {
    apiTestingStatus = "Failed";
    remarks = "Payload signature or invoice schema mismatched the FBR validation rules.";
  }

  return {
    applicationId: `APP-${pad(1001 + index, 4)}`,
    taxpayerName: taxpayer.companyName.split(" ")[0] + " Holdings",
    companyName: taxpayer.companyName,
    submissionDate: submissionDate.toISOString(),
    reviewDate: reviewDate?.toISOString() ?? null,
    status,
    reviewer,
    remarks,
    apiTestingStatus,
    productionReady,
    productionDate,
  };
});

const integratedTaxpayers = taxpayers.filter((taxpayer) => taxpayer.apiIntegrated);
const endpointOrder: ApiEndpoint[] = [
  "/invoice/create",
  "/invoice/list",
  "/invoice/details",
  "/invoice/update",
  "/api/token",
  "/taxpayer/register",
];

const apiLogs: ApiLog[] = Array.from({ length: 500 }, (_, index) => {
  const endpoint = endpointOrder[modulo(index, 5, endpointOrder.length, Math.floor(index / 17))];
  const taxpayer = integratedTaxpayers[modulo(index, 9, integratedTaxpayers.length, 4)].companyName;
  const success = index % 23 !== 0 && index % 41 !== 0;
  const statusCode = success
    ? endpoint === "/invoice/create"
      ? 201
      : 200
    : [400, 401, 422, 500][index % 4];
  const responseTime = success
    ? 145 + modulo(index, 37, 420)
    : 280 + modulo(index, 41, 900);
  const method: ApiLog["method"] =
    endpoint === "/invoice/list" || endpoint === "/invoice/details" ? "GET" : "POST";
  const timestamp = dateShift(modulo(index, 5, 21), index % 24, modulo(index, 17, 60));

  return {
    id: `api-${pad(index + 1, 4)}`,
    taxpayer,
    endpoint,
    method,
    responseTime,
    statusCode,
    success,
    timestamp: timestamp.toISOString(),
  };
});

function aggregateRevenue(records: InvoiceRecord[], granularity: "daily" | "monthly" | "quarterly" | "yearly") {
  const groups = new Map<string, RevenueRecord>();

  for (const invoice of records) {
    if (invoice.status === "Rejected") continue;

    const date = new Date(invoice.submissionDate);
    const key =
      granularity === "daily"
        ? dayLabel(date)
        : granularity === "monthly"
          ? monthLabel(date)
          : granularity === "quarterly"
            ? quarterLabel(date)
            : yearLabel(date);

    const existing = groups.get(key) ?? {
      date: key,
      invoiceCount: 0,
      taxableAmount: 0,
      taxCollected: 0,
      refunds: 0,
      adjustments: 0,
      netTax: 0,
    };

    existing.invoiceCount += 1;
    existing.taxableAmount += invoice.invoiceAmount;
    existing.taxCollected += invoice.taxAmount;
    groups.set(key, existing);
  }

  return Array.from(groups.values())
    .map((record, index) => {
      const refunds = roundCurrency(record.taxCollected * (0.008 + (index % 4) * 0.002));
      const adjustments = roundCurrency(record.taxCollected * (0.003 + (index % 3) * 0.0015));
      return {
        ...record,
        taxableAmount: roundCurrency(record.taxableAmount),
        taxCollected: roundCurrency(record.taxCollected),
        refunds,
        adjustments,
        netTax: roundCurrency(record.taxCollected - refunds + adjustments),
      };
    })
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

function aggregateInvoiceBuckets(
  records: InvoiceRecord[],
  granularity: "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
): InvoiceAnalyticsBucket[] {
  const groups = new Map<string, InvoiceAnalyticsBucket>();

  for (const invoice of records) {
    const date = new Date(invoice.submissionDate);
    let key = "";

    if (granularity === "daily") key = dayLabel(date);
    if (granularity === "monthly") key = monthLabel(date);
    if (granularity === "quarterly") key = quarterLabel(date);
    if (granularity === "yearly") key = yearLabel(date);
    if (granularity === "weekly") {
      const diff = Math.floor((BASE_DATE.getTime() - date.getTime()) / DAY_MS);
      key = `Week ${Math.floor(diff / 7) + 1}`;
    }

    const existing = groups.get(key) ?? {
      period: key,
      invoiceCount: 0,
      taxableAmount: 0,
      taxCollected: 0,
      verifiedInvoices: 0,
      rejectedInvoices: 0,
    };

    existing.invoiceCount += 1;
    existing.taxableAmount += invoice.invoiceAmount;
    existing.taxCollected += invoice.taxAmount;
    if (invoice.status === "Verified") existing.verifiedInvoices += 1;
    if (invoice.status === "Rejected") existing.rejectedInvoices += 1;
    groups.set(key, existing);
  }

  return Array.from(groups.values())
    .map((record) => ({
      ...record,
      taxableAmount: roundCurrency(record.taxableAmount),
      taxCollected: roundCurrency(record.taxCollected),
    }))
    .sort((a, b) => (a.period > b.period ? 1 : -1));
}

const dailyRevenue = aggregateRevenue(invoices, "daily");
const monthlyRevenue = aggregateRevenue(invoices, "monthly");
const quarterlyRevenue = aggregateRevenue(invoices, "quarterly");
const yearlyRevenue = aggregateRevenue(invoices, "yearly");

const invoiceAnalytics = {
  daily: aggregateInvoiceBuckets(invoices, "daily"),
  weekly: aggregateInvoiceBuckets(invoices, "weekly"),
  monthly: aggregateInvoiceBuckets(invoices, "monthly"),
  quarterly: aggregateInvoiceBuckets(invoices, "quarterly"),
  yearly: aggregateInvoiceBuckets(invoices, "yearly"),
};

const applicationCounts = applications.reduce(
  (acc, application) => {
    acc[application.status] += 1;
    return acc;
  },
  { Pending: 0, "Under Review": 0, Approved: 0, Rejected: 0 } as Record<ApplicationStatus, number>,
);

const totalTaxCollected = dailyRevenue.reduce((sum, item) => sum + item.netTax, 0);
const monthlyTaxCollection = monthlyRevenue[monthlyRevenue.length - 1]?.netTax ?? 0;
const todayKey = dayLabel(BASE_DATE);
const yesterdayKey = dayLabel(new Date(BASE_DATE.getTime() - DAY_MS));
const todaysSubmittedInvoices = invoices.filter((invoice) => dayLabel(new Date(invoice.submissionDate)) === todayKey).length;
const yesterdaysSubmittedInvoices = invoices.filter((invoice) => dayLabel(new Date(invoice.submissionDate)) === yesterdayKey).length;
const verifiedInvoices = invoices.filter((invoice) => invoice.status === "Verified").length;
const failedApiRequests = apiLogs.filter((log) => !log.success).length;
const apiSuccessRate = Number(((apiLogs.length - failedApiRequests) / apiLogs.length * 100).toFixed(2));

const dashboardCards: DashboardCard[] = [
  {
    key: "totalRegisteredTaxpayers",
    title: "Total Registered Taxpayers",
    value: taxpayers.length,
    unit: "count",
    description: "Registered on the digital invoicing registry",
    trend: 8.7,
  },
  {
    key: "activeTaxpayers",
    title: "Active Taxpayers",
    value: taxpayers.filter((taxpayer) => taxpayer.status === "Active").length,
    unit: "count",
    description: "Currently filing or connected through portal/API",
    trend: 6.1,
  },
  {
    key: "inactiveTaxpayers",
    title: "Inactive Taxpayers",
    value: taxpayers.filter((taxpayer) => taxpayer.status === "Inactive").length,
    unit: "count",
    description: "Registered but dormant in the recent cycle",
    trend: -2.8,
  },
  {
    key: "pendingApplications",
    title: "Pending Applications",
    value: applicationCounts.Pending,
    unit: "count",
    description: "Awaiting license integrator review",
    trend: -4.5,
  },
  {
    key: "approvedApplications",
    title: "Approved Applications",
    value: applicationCounts.Approved,
    unit: "count",
    description: "Passed certification and production onboarding",
    trend: 12.2,
  },
  {
    key: "rejectedApplications",
    title: "Rejected Applications",
    value: applicationCounts.Rejected,
    unit: "count",
    description: "Rejected after compliance or API validation checks",
    trend: -1.9,
  },
  {
    key: "totalDigitalInvoices",
    title: "Total Digital Invoices",
    value: invoices.length,
    unit: "count",
    description: "Invoices issued across sales and purchase streams",
    trend: 15.4,
  },
  {
    key: "totalTaxCollected",
    title: "Total Tax Collected",
    value: totalTaxCollected,
    unit: "currency",
    description: "Net tax realized after refunds and adjustments",
    trend: 11.3,
  },
  {
    key: "monthlyTaxCollection",
    title: "Monthly Tax Collection",
    value: monthlyTaxCollection,
    unit: "currency",
    description: "Net collection for the current month",
    trend: Number(
      (
        ((monthlyRevenue[monthlyRevenue.length - 1]?.netTax ?? 0) -
          (monthlyRevenue[monthlyRevenue.length - 2]?.netTax ?? 1)) /
        (monthlyRevenue[monthlyRevenue.length - 2]?.netTax ?? 1) *
        100
      ).toFixed(1),
    ),
  },
  {
    key: "todaysSubmittedInvoices",
    title: "Today's Submitted Invoices",
    value: todaysSubmittedInvoices,
    unit: "count",
    description: "Invoices received since the start of the day",
    trend: Number((((todaysSubmittedInvoices - yesterdaysSubmittedInvoices) / Math.max(yesterdaysSubmittedInvoices, 1)) * 100).toFixed(1)),
  },
  {
    key: "apiSuccessRate",
    title: "API Success Rate",
    value: apiSuccessRate,
    unit: "percent",
    description: "Successful calls across invoice and auth endpoints",
    trend: 1.6,
  },
  {
    key: "failedApiRequests",
    title: "Failed API Requests",
    value: failedApiRequests,
    unit: "count",
    description: "Requests rejected by validation, auth, or server errors",
    trend: -3.4,
  },
  {
    key: "productionIntegrations",
    title: "Production Integrations",
    value: taxpayers.filter((taxpayer) => taxpayer.productionStatus === "Production").length,
    unit: "count",
    description: "Taxpayers moved to production after approval",
    trend: 9.1,
  },
  {
    key: "sandboxIntegrations",
    title: "Sandbox Integrations",
    value: taxpayers.filter((taxpayer) => taxpayer.productionStatus === "Sandbox").length,
    unit: "count",
    description: "Taxpayers still testing in the sandbox environment",
    trend: 4.8,
  },
];

const provinceAnalytics: ProvinceAnalytics[] = (Object.keys(provinceCities) as ProvinceName[]).map((province) => {
  const provinceTaxpayers = taxpayers.filter((taxpayer) => taxpayer.province === province);
  const provinceInvoices = invoices.filter((invoice) => invoice.province === province && invoice.status !== "Rejected");
  const revenue = provinceInvoices.reduce((sum, invoice) => sum + invoice.invoiceAmount, 0);
  const taxCollected = provinceInvoices.reduce((sum, invoice) => sum + invoice.taxAmount, 0);

  return {
    province,
    taxpayers: provinceTaxpayers.length,
    invoices: provinceInvoices.length,
    taxCollected: roundCurrency(taxCollected),
    revenue: roundCurrency(revenue),
  };
});

const notifications: NotificationItem[] = [
  {
    id: "notice-001",
    title: "New taxpayer registered",
    description: "Prime Lahore Retail Mart (Pvt.) Ltd. completed portal onboarding.",
    timestamp: "5 minutes ago",
    category: "registration",
  },
  {
    id: "notice-002",
    title: "Invoice submitted",
    description: "Pak Karachi Electronics (Pvt.) Ltd. submitted invoice FBR-S-20260707-0003.",
    timestamp: "18 minutes ago",
    category: "invoice",
  },
  {
    id: "notice-003",
    title: "Application approved",
    description: "Metro Islamabad Tech Solutions (Pvt.) Ltd. moved from review to approved.",
    timestamp: "1 hour ago",
    category: "application",
  },
  {
    id: "notice-004",
    title: "API integration completed",
    description: "United Faisalabad Textiles (Pvt.) Ltd. passed sandbox connectivity checks.",
    timestamp: "3 hours ago",
    category: "integration",
  },
  {
    id: "notice-005",
    title: "Invoice rejected",
    description: "A purchase invoice from Royal Quetta Pharma Care (Pvt.) Ltd. failed schema validation.",
    timestamp: "Yesterday",
    category: "rejection",
  },
  {
    id: "notice-006",
    title: "Production deployment completed",
    description: "Crescent Rawalpindi Distributors (Pvt.) Ltd. was promoted to production successfully.",
    timestamp: "Yesterday",
    category: "deployment",
  },
];

const recentInvoices = [...invoices]
  .sort((a, b) => (a.submissionDate < b.submissionDate ? 1 : -1))
  .slice(0, 8);

const topTaxpayersByTaxPaid = [...taxpayers]
  .sort((a, b) => b.totalTaxPaid - a.totalTaxPaid)
  .slice(0, 10);

const dailyInvoiceSubmission = dailyRevenue.slice(-14).map((entry) => ({
  label: entry.date.slice(5),
  value: entry.invoiceCount,
}));

const monthlyInvoiceTrend = monthlyRevenue.slice(-12).map((entry) => ({
  label: entry.date,
  value: entry.invoiceCount,
  taxableAmount: entry.taxableAmount,
}));

const revenueGrowth = monthlyRevenue.slice(-6).map((entry, index, arr) => {
  const previous = arr[index - 1]?.netTax ?? entry.netTax;
  const value = previous === 0 ? 0 : Number((((entry.netTax - previous) / previous) * 100).toFixed(1));
  return {
    label: entry.date,
    value,
  };
});

const monthlyActiveTaxpayers = monthlyRevenue.slice(-12).map((entry) => {
  const monthInvoices = invoices.filter((invoice) => monthLabel(new Date(invoice.submissionDate)) === entry.date);
  return {
    label: entry.date,
    value: new Set(monthInvoices.map((invoice) => invoice.taxpayerNTN)).size,
  };
});

const invoiceStatusDistribution: ChartDatum[] = [
  { label: "Verified", value: verifiedInvoices },
  { label: "Submitted", value: invoices.filter((invoice) => invoice.status === "Submitted").length },
  { label: "Processing", value: invoices.filter((invoice) => invoice.status === "Processing").length },
  { label: "Rejected", value: invoices.filter((invoice) => invoice.status === "Rejected").length },
];

const applicationStatusDistribution: ChartDatum[] = [
  { label: "Pending", value: applicationCounts.Pending },
  { label: "Under Review", value: applicationCounts["Under Review"] },
  { label: "Approved", value: applicationCounts.Approved },
  { label: "Rejected", value: applicationCounts.Rejected },
];

const taxpayerBusinessSectorDistribution: ChartDatum[] = businessSectors.map((sector) => ({
  label: sector,
  value: taxpayers.filter((taxpayer) => taxpayer.businessSector === sector).length,
}));

const provinceWiseTaxCollection = provinceAnalytics.map((province) => ({
  label: province.province,
  value: province.taxCollected,
}));

const apiSuccessVsFailure: ChartDatum[] = [
  { label: "Success", value: apiLogs.filter((log) => log.success).length },
  { label: "Failure", value: failedApiRequests },
];

const productionVsSandboxIntegrations: ChartDatum[] = [
  { label: "Production", value: dashboardCards.find((card) => card.key === "productionIntegrations")?.value ?? 0 },
  { label: "Sandbox", value: dashboardCards.find((card) => card.key === "sandboxIntegrations")?.value ?? 0 },
];

const invoiceTypesDistribution: ChartDatum[] = [
  { label: "Sales", value: invoices.filter((invoice) => invoice.invoiceType === "Sales").length },
  { label: "Purchase", value: invoices.filter((invoice) => invoice.invoiceType === "Purchase").length },
];

const taxCollectionByBusinessSector: ChartDatum[] = businessSectors.map((sector) => ({
  label: sector,
  value: roundCurrency(
    invoices
      .filter((invoice) => invoice.businessSector === sector && invoice.status !== "Rejected")
      .reduce((sum, invoice) => sum + invoice.taxAmount, 0),
  ),
}));

const endpointFrequency = endpointOrder.map((endpoint) => ({
  label: endpoint,
  value: apiLogs.filter((log) => log.endpoint === endpoint).length,
}));

const requestsPerHour = Array.from({ length: 24 }, (_, hour) => ({
  label: `${String(hour).padStart(2, "0")}:00`,
  value: apiLogs.filter((log) => new Date(log.timestamp).getUTCHours() === hour).length,
}));

const requestsPerDay = Array.from({ length: 7 }, (_, offset) => {
  const date = new Date(BASE_DATE.getTime() - offset * DAY_MS);
  const label = dayLabel(date);
  return {
    label,
    value: apiLogs.filter((log) => dayLabel(new Date(log.timestamp)) === label).length,
  };
}).reverse();

const charts = {
  dailyInvoiceSubmission,
  monthlyInvoiceTrend,
  quarterlyRevenue: quarterlyRevenue.map((entry) => ({ label: entry.date, value: entry.netTax })),
  yearlyTaxCollection: yearlyRevenue.map((entry) => ({ label: entry.date, value: entry.netTax })),
  invoiceStatusDistribution,
  applicationStatusDistribution,
  taxpayerBusinessSectorDistribution,
  provinceWiseTaxCollection,
  apiSuccessVsFailure,
  top10TaxpayersByTaxPaid: topTaxpayersByTaxPaid.map((taxpayer) => ({
    label: taxpayer.companyName,
    value: taxpayer.totalTaxPaid,
  })),
  monthlyActiveTaxpayers,
  productionVsSandboxIntegrations,
  invoiceTypesDistribution,
  revenueGrowth,
  taxCollectionByBusinessSector,
};

const apiAnalytics = {
  averageResponseTime: roundCurrency(
    apiLogs.reduce((sum, log) => sum + log.responseTime, 0) / apiLogs.length,
  ),
  successRate: apiSuccessRate,
  failureRate: Number((100 - apiSuccessRate).toFixed(2)),
  requestsPerHour,
  requestsPerDay,
  topEndpoints: endpointFrequency.sort((a, b) => b.value - a.value),
};

const recentApplications = [...applications]
  .sort((a, b) => (a.submissionDate < b.submissionDate ? 1 : -1))
  .slice(0, 8);

const recentApiLogs = [...apiLogs]
  .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
  .slice(0, 10);

export {
  apiAnalytics,
  apiLogs,
  applications,
  businessSectors,
  charts,
  dailyRevenue,
  dashboardCards,
  dashboardFilters,
  invoiceAnalytics,
  invoices,
  monthlyRevenue,
  notifications,
  provinceAnalytics,
  quarterlyRevenue,
  recentApiLogs,
  recentApplications,
  recentInvoices,
  taxpayers,
  topTaxpayersByTaxPaid,
  yearlyRevenue,
};

export const mockDashboard = {
  transactionSummary: {
    salesInvoices: { total: 830, posted: 821, unposted: 9, trend: 5.2 },
    purchaseInvoices: { total: 90, posted: 85, unposted: 5, trend: -1.4 },
    salesReturns: { total: 24, posted: 18, pending: 6, trend: 2.1 },
    purchaseReturns: { total: 12, posted: 9, pending: 3, trend: -0.8 },
  },
  inventory: {
    totalItems: 237,
    stockAvailable: 189,
    lowStockItems: 48,
    inventoryAdjustments: { unposted: 15, posted: 42 },
  },
  masterData: {
    customers: 209,
    vendors: 13,
    items: 237,
  },
  companyProfile: {
    name: "ABDUL ALI TRADERS",
    companyId: "00019",
    ntn: "A721804",
    province: "KHYBER PAKHTUNKHWA",
    city: "SWAT",
    licenseExpiry: "2025-12-31",
  },
  quickTips: [
    "Use bulk actions to post multiple documents.",
    "Run reports from Reports section.",
    "Keep company information updated.",
    "Import customers/items using templates.",
  ],
};

export const fbrMockData = {
  dashboardFilters,
  dashboardCards,
  taxpayers,
  invoices,
  applications,
  apiLogs,
  apiAnalytics,
  invoiceAnalytics,
  revenue: {
    daily: dailyRevenue,
    monthly: monthlyRevenue,
    quarterly: quarterlyRevenue,
    yearly: yearlyRevenue,
  },
  charts,
  provinceAnalytics,
  notifications,
  recentInvoices,
  recentApplications,
  recentApiLogs,
  topTaxpayersByTaxPaid,
  mockDashboard,
};

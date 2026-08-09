/**
 * Central export for all backend service wrappers.
 *
 * Each service mirrors a route module in FBR-Backend/src/routes/. Import from
 * "@/lib/services" and get a typed client that already handles auth, JWT
 * refresh and the `{ success, message, data }` envelope (see lib/api.ts).
 *
 *   import { customersService, invoicesService } from "@/lib/services";
 *   const { data } = await customersService.list({ page: 1, limit: 50 });
 */

export * from "./_types";

export { authService } from "./auth.service";
export { companiesService } from "./companies.service";
export { customersService } from "./customers.service";
export { productsService } from "./products.service";
export { invoicesService } from "./invoices.service";
export { dashboardService } from "./dashboard.service";
export { reportsService } from "./reports.service";
export { lookupService } from "./lookup.service";
export { usersService } from "./users.service";
export { settingsService } from "./settings.service";
export { notificationsService } from "./notifications.service";
export { apiLogsService } from "./apiLogs.service";
export { fbrTokensService } from "./fbrTokens.service";

export type {
    Customer,
    CustomerCreateInput,
    CustomerUpdateInput,
    CustomerListQuery,
    CustomerRegistrationType,
} from "./customers.service";
export type {
    Product,
    ProductCreateInput,
    ProductUpdateInput,
} from "./products.service";
export type {
    Invoice,
    InvoiceItem,
    InvoiceStatus,
    InvoiceType,
    InvoiceEnvironment,
    CreateInvoiceInput,
    CreateInvoiceItemInput,
    InvoiceListQuery,
} from "./invoices.service";
export type { DashboardResponse } from "./dashboard.service";
export type { ApiLog, ApiLogListQuery } from "./apiLogs.service";
export type { Notification, NotificationListQuery } from "./notifications.service";
export type { Setting, UpsertSettingInput } from "./settings.service";
export type { FbrToken, UpsertFbrTokenInput } from "./fbrTokens.service";
export type { AdminUser, Role, Permission } from "./users.service";
export type { Company } from "./companies.service";
export type {
    Province,
    DocType,
    HsCode,
    Uom,
    TransactionType,
    Sro,
    Rate,
    LookupKind,
} from "./lookup.service";
export type {
    DateRangeQuery,
    DailyReportRow,
    MonthlyReportRow,
    TaxReportRow,
    SalesReportRow,
    SalesReportQuery,
} from "./reports.service";

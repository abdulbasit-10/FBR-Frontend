/**
 * FBR Digital Invoicing error-code catalogue.
 *
 * Sourced verbatim from PRAL Technical Specification for DI API v1.12
 * (§7 Sales Error Codes and §8 Purchase Error Codes).
 *
 * `messageDesc`  — the exact short message FBR returns.
 * `briefMsgDesc` — the extended friendly guidance from the spec, safe to show to end users.
 */

export interface FbrErrorEntry {
    code: string;
    scope: "sales" | "purchase" | "auth";
    messageDesc: string;
    briefMsgDesc: string;
}

const catalogue: Record<string, FbrErrorEntry> = {
    // ── Sales (§7) ────────────────────────────────────────────────────────────
    "0001": { code: "0001", scope: "sales", messageDesc: "Seller not registered for sales tax, please provide valid registration/NTN.", briefMsgDesc: "Seller is not registered for sales tax, please provide valid seller registration/NTN." },
    "0002": { code: "0002", scope: "sales", messageDesc: "Invalid Buyer Registration No or NTN.", briefMsgDesc: "Buyer Registration Number or NTN is not in proper format. Provide 13-digit CNIC or 7-digit NTN." },
    "0003": { code: "0003", scope: "sales", messageDesc: "Provide proper invoice type.", briefMsgDesc: "Invoice type is not valid or empty. Please provide a valid invoice type." },
    "0005": { code: "0005", scope: "sales", messageDesc: "Please provide date in valid format.", briefMsgDesc: "Invoice date is not in proper format. Use YYYY-MM-DD (e.g. 2025-05-25)." },
    "0006": { code: "0006", scope: "sales", messageDesc: "Sale invoice not exist.", briefMsgDesc: "Sales invoice does not exist against STWH." },
    "0007": { code: "0007", scope: "sales", messageDesc: "Wrong Sale type is selected with invoice no.", briefMsgDesc: "Selected invoice type is not associated with the registration number. Select the actual invoice type." },
    "0008": { code: "0008", scope: "sales", messageDesc: "ST withheld at source should either be zero or same as sales tax/FED in ST mode.", briefMsgDesc: "ST withheld at source must equal 0 or equal Sales Tax." },
    "0009": { code: "0009", scope: "sales", messageDesc: "Provide Buyer registration No.", briefMsgDesc: "Buyer Registration Number cannot be empty. Provide a valid buyer registration number." },
    "0010": { code: "0010", scope: "sales", messageDesc: "Provide Buyer Name.", briefMsgDesc: "Buyer Name cannot be empty. Provide a valid buyer name." },
    "0011": { code: "0011", scope: "sales", messageDesc: "Provide invoice type.", briefMsgDesc: "Invoice type cannot be empty. Please provide a valid invoice type." },
    "0012": { code: "0012", scope: "sales", messageDesc: "Provide Buyer Registration Type.", briefMsgDesc: "Buyer Registration type cannot be empty. Provide a valid Buyer Registration type." },
    "0013": { code: "0013", scope: "sales", messageDesc: "Provide valid Sale type.", briefMsgDesc: "Sale type cannot be empty/null. Please provide a valid sale type." },
    "0018": { code: "0018", scope: "sales", messageDesc: "Please provide Sales Tax/FED in ST Mode.", briefMsgDesc: "Sales Tax/FED cannot be empty. Please provide a valid amount." },
    "0019": { code: "0019", scope: "sales", messageDesc: "Please provide HSCode.", briefMsgDesc: "HS Code cannot be empty. Please provide a valid HS Code." },
    "0020": { code: "0020", scope: "sales", messageDesc: "Please provide Rate.", briefMsgDesc: "Rate field cannot be empty. Please provide a rate." },
    "0021": { code: "0021", scope: "sales", messageDesc: "Please provide Value of Sales Excl. ST / Quantity.", briefMsgDesc: "Value of Sales Excl. ST / Quantity cannot be empty. Provide a valid value." },
    "0022": { code: "0022", scope: "sales", messageDesc: "Please provide ST withheld at Source or STS Withheld.", briefMsgDesc: "ST withheld at Source cannot be empty. Please provide a valid amount." },
    "0023": { code: "0023", scope: "sales", messageDesc: "Please provide Sales Tax.", briefMsgDesc: "Sales Tax cannot be empty. Please provide a valid Sales Tax amount." },
    "0024": { code: "0024", scope: "sales", messageDesc: "Please provide ST withheld.", briefMsgDesc: "Sales Tax withheld cannot be empty. Please provide a valid amount." },
    "0026": { code: "0026", scope: "sales", messageDesc: "Invoice Reference No. is required.", briefMsgDesc: "Invoice Reference No. is mandatory for debit/credit notes. Provide a valid Invoice Reference No." },
    "0027": { code: "0027", scope: "sales", messageDesc: "Reason is required.", briefMsgDesc: "Reason is mandatory for debit/credit notes. Provide a valid reason." },
    "0028": { code: "0028", scope: "sales", messageDesc: "Reason Remarks are required.", briefMsgDesc: "Reason 'Others' selected. Provide valid remarks for this reason." },
    "0029": { code: "0029", scope: "sales", messageDesc: "Invoice date must be greater or equal to original invoice no.", briefMsgDesc: "Debit/Credit note date must be equal to or greater than the original invoice date." },
    "0030": { code: "0030", scope: "sales", messageDesc: "Unregistered distributor type not allowed before date.", briefMsgDesc: "Unregistered distributor type is not allowed before the system cutoff date." },
    "0031": { code: "0031", scope: "sales", messageDesc: "Provide Sales Tax.", briefMsgDesc: "Sales Tax is not mentioned. Please provide Sales Tax." },
    "0032": { code: "0032", scope: "sales", messageDesc: "STWH can only be created for GOV/FTN Holders.", briefMsgDesc: "User is not an FTN holder. STWH can only be created for GOV/FTN Holders without a sales invoice." },
    "0034": { code: "0034", scope: "sales", messageDesc: "Only allowed within {N} days of invoice date of the original invoice.", briefMsgDesc: "Debit/Credit note can only be added within 180 days of the original invoice date." },
    "0035": { code: "0035", scope: "sales", messageDesc: "Note date must be greater or equal to original invoice date.", briefMsgDesc: "Note date must be greater than or equal to the original invoice date." },
    "0036": { code: "0036", scope: "sales", messageDesc: "Total Value of Sales of invoices greater than original.", briefMsgDesc: "Credit Note Value of Sale must be less than or equal to the value of Sale in the original invoice." },
    "0037": { code: "0037", scope: "sales", messageDesc: "Total ST Withheld as WH Agent greater than original.", briefMsgDesc: "Credit Note Value of ST Withheld must be less than or equal to the ST Withheld in the original invoice." },
    "0039": { code: "0039", scope: "sales", messageDesc: "Sale invoice not exist.", briefMsgDesc: "For registered users, STWH invoice fields must match the sale invoice." },
    "0041": { code: "0041", scope: "sales", messageDesc: "Provide invoice No.", briefMsgDesc: "Invoice number cannot be empty. Please provide an invoice number." },
    "0042": { code: "0042", scope: "sales", messageDesc: "Provide invoice date.", briefMsgDesc: "Invoice date cannot be empty. Please provide an invoice date." },
    "0043": { code: "0043", scope: "sales", messageDesc: "Provide valid Date.", briefMsgDesc: "Invoice date is not valid. Please provide a valid invoice date." },
    "0044": { code: "0044", scope: "sales", messageDesc: "Provide HS Code.", briefMsgDesc: "HS Code cannot be empty. Please provide an HS Code." },
    "0046": { code: "0046", scope: "sales", messageDesc: "Provide rate.", briefMsgDesc: "Rate cannot be empty. Please provide a valid rate for the selected Sale Type." },
    "0050": { code: "0050", scope: "sales", messageDesc: "Please provide valid Sales Tax withheld (Cotton ginners).", briefMsgDesc: "For sale type 'Cotton ginners', Sales Tax Withheld must equal Sales Tax or zero." },
    "0052": { code: "0052", scope: "sales", messageDesc: "Please provide valid HS Code against invoice no.", briefMsgDesc: "The HS Code does not match the provided sale type. Provide a valid HS Code for the sale type." },
    "0053": { code: "0053", scope: "sales", messageDesc: "Provided buyer registration type is invalid.", briefMsgDesc: "Buyer Registration Type is invalid. Please provide a valid Buyer Registration Type." },
    "0055": { code: "0055", scope: "sales", messageDesc: "Please provide ST Withheld as WH Agent.", briefMsgDesc: "Sales tax withheld cannot be empty or in invalid format. Please provide a valid value." },
    "0056": { code: "0056", scope: "sales", messageDesc: "Buyer not exists in steel sector.", briefMsgDesc: "Buyer does not exist in the steel sector." },
    "0057": { code: "0057", scope: "sales", messageDesc: "Reference Invoice does not exist.", briefMsgDesc: "The reference invoice for the debit/credit note does not exist. Provide a valid Invoice Reference No." },
    "0058": { code: "0058", scope: "sales", messageDesc: "Self-invoicing not allowed.", briefMsgDesc: "Buyer and Seller Registration numbers are the same. Self-invoicing is not allowed." },
    "0064": { code: "0064", scope: "sales", messageDesc: "Reference invoice already exist.", briefMsgDesc: "A credit note is already added to this invoice." },
    "0067": { code: "0067", scope: "sales", messageDesc: "Sales Tax of Debit Note greater than original invoice.", briefMsgDesc: "Sales Tax value of Debit Note exceeds the original invoice's sales tax." },
    "0068": { code: "0068", scope: "sales", messageDesc: "Sales Tax of Credit Note less than original invoice.", briefMsgDesc: "Sales Tax value of Credit Note is less than the original invoice's sales tax according to the rate." },
    "0070": { code: "0070", scope: "sales", messageDesc: "STWH cannot be created for unregistered buyers.", briefMsgDesc: "Buyer is unregistered. STWH is allowed only for registered users." },
    "0071": { code: "0071", scope: "sales", messageDesc: "Entry of note against the declared invoice is not allowed.", briefMsgDesc: "Credit note is allowed only for specific users." },
    "0073": { code: "0073", scope: "sales", messageDesc: "Provide Sale Origination Province of Supplier.", briefMsgDesc: "Sale Origination Province of Supplier cannot be empty. Provide a valid province." },
    "0074": { code: "0074", scope: "sales", messageDesc: "Provide Destination of Supply.", briefMsgDesc: "Destination of Supply cannot be empty. Provide a valid destination." },
    "0077": { code: "0077", scope: "sales", messageDesc: "Provide SRO/Schedule No.", briefMsgDesc: "SRO/Schedule Number cannot be empty. Provide a valid SRO/Schedule Number." },
    "0078": { code: "0078", scope: "sales", messageDesc: "Provide Item Sr. No.", briefMsgDesc: "Item serial number cannot be empty. Provide a valid item serial number." },
    "0079": { code: "0079", scope: "sales", messageDesc: "Rate not allowed above Value threshold.", briefMsgDesc: "If Value of Sales Excl. ST is greater than 20,000, the 5% rate is not allowed." },
    "0080": { code: "0080", scope: "sales", messageDesc: "Please provide Further Tax.", briefMsgDesc: "Further Tax cannot be empty. Please provide a valid Further Tax." },
    "0081": { code: "0081", scope: "sales", messageDesc: "Please provide Input Credit not Allowed.", briefMsgDesc: "'Input Credit not Allowed' cannot be empty. Please provide a value." },
    "0082": { code: "0082", scope: "sales", messageDesc: "Seller is not registered for sales tax.", briefMsgDesc: "The Seller is not registered for sales tax. Please provide a valid registration/NTN." },
    "0083": { code: "0083", scope: "sales", messageDesc: "Mismatch Seller Registration No.", briefMsgDesc: "Seller Reg No. doesn't match. Provide a valid Seller Registration Number." },
    "0085": { code: "0085", scope: "sales", messageDesc: "Please provide Total Value of Sales (PFAD).", briefMsgDesc: "Total Value of Sales is not provided (required for PFAD)." },
    "0086": { code: "0086", scope: "sales", messageDesc: "Not an EFS Compressor Scrap importer.", briefMsgDesc: "You are not an EFS license holder who has imported Compressor Scrap in the last 12 months." },
    "0087": { code: "0087", scope: "sales", messageDesc: "Petroleum Levy rates not configured properly.", briefMsgDesc: "Petroleum Levy rates not configured properly. Please update levy rates." },
    "0088": { code: "0088", scope: "sales", messageDesc: "Alphanumeric and (-) contained invoice No. is allowed.", briefMsgDesc: "Invoice number is not valid. Provide an alphanumeric format like Inv-001." },
    "0089": { code: "0089", scope: "sales", messageDesc: "Please provide FED Charged.", briefMsgDesc: "FED Charged cannot be empty. Please provide a valid FED Charged." },
    "0090": { code: "0090", scope: "sales", messageDesc: "Please provide Fixed / notified value or Retail Price.", briefMsgDesc: "Fixed / notified value or Retail Price cannot be empty. Please provide a valid value." },
    "0091": { code: "0091", scope: "sales", messageDesc: "Extra tax must be empty.", briefMsgDesc: "Extra tax must be empty for this sale type." },
    "0092": { code: "0092", scope: "sales", messageDesc: "Provide Valid Sale Type.", briefMsgDesc: "Purchase type cannot be empty. Please provide a valid purchase type." },
    "0093": { code: "0093", scope: "sales", messageDesc: "Selected Sale Type are not allowed to Manufacturer.", briefMsgDesc: "Selected sale type is not allowed for Manufacturer. Select a proper sale type." },
    "0095": { code: "0095", scope: "sales", messageDesc: "Please provide Extra Tax.", briefMsgDesc: "Extra Tax cannot be empty. Please provide a valid Extra Tax." },
    "0096": { code: "0096", scope: "sales", messageDesc: "For selected HSCode only KWH UOM is allowed.", briefMsgDesc: "For the provided HS Code, only KWH UOM is allowed." },
    "0097": { code: "0097", scope: "sales", messageDesc: "Provide UOM KG.", briefMsgDesc: "Please provide UOM in KG." },
    "0098": { code: "0098", scope: "sales", messageDesc: "Please provide Quantity / Electricity Units.", briefMsgDesc: "Quantity / Electricity Unit cannot be empty. Please provide a valid value." },
    "0099": { code: "0099", scope: "sales", messageDesc: "Provide UOM.", briefMsgDesc: "UOM is not valid. UOM must match the given HS Code." },
    "0100": { code: "0100", scope: "sales", messageDesc: "Cotton Ginners allowed against registered buyers only.", briefMsgDesc: "Registered users cannot add sale invoices. Only cotton ginner sale type is allowed for registered users." },
    "0101": { code: "0101", scope: "sales", messageDesc: "Please use Toll Manufacturing Sale Type for Steel Sector.", briefMsgDesc: "Sale type is not selected properly. Use Toll Manufacturing Sale Type for Steel Sector." },
    "0102": { code: "0102", scope: "sales", messageDesc: "Calculated tax not matched in 3rd schedule.", briefMsgDesc: "The calculated sales tax was not computed as per the 3rd Schedule formula." },
    "0103": { code: "0103", scope: "sales", messageDesc: "The calculated tax for Potassium Chlorate does not match.", briefMsgDesc: "Calculated tax does not match Potassium Chlorate rules for sales potassium invoices." },
    "0104": { code: "0104", scope: "sales", messageDesc: "The calculated percentage sales tax does not match.", briefMsgDesc: "Calculated percentage of sales tax does not match the provided rate." },
    "0105": { code: "0105", scope: "sales", messageDesc: "The calculated sales tax for the quantity is incorrect.", briefMsgDesc: "The calculated sales tax for the quantity is incorrect." },
    "0106": { code: "0106", scope: "sales", messageDesc: "Buyer is not registered for sales tax.", briefMsgDesc: "The Buyer is not registered for sales tax. Please provide a valid registration/NTN." },
    "0107": { code: "0107", scope: "sales", messageDesc: "Mismatch Buyer Registration No.", briefMsgDesc: "Buyer Reg No. doesn't match. Provide a valid Buyer Registration Number." },
    "0108": { code: "0108", scope: "sales", messageDesc: "Invalid Seller Registration No or NTN.", briefMsgDesc: "Seller Reg No. is not valid. Provide a valid Seller Registration Number/NTN." },
    "0109": { code: "0109", scope: "sales", messageDesc: "Wrong invoice type is selected in invoice no.", briefMsgDesc: "Invoice type is not selected properly. Select a proper invoice type." },
    "0111": { code: "0111", scope: "sales", messageDesc: "Wrong purchase type is selected with invoice no.", briefMsgDesc: "Purchase type is not selected properly. Provide a proper purchase type." },
    "0113": { code: "0113", scope: "sales", messageDesc: "System is unable to parse date.", briefMsgDesc: "Date is not in proper format. Use YYYY-MM-DD (e.g. 2025-05-25)." },
    "0300": { code: "0300", scope: "sales", messageDesc: "Provided decimal value is not valid at field.", briefMsgDesc: "One of the decimal fields (Discount / Total / FED / Extra Tax / Further Tax / ST Withheld / Quantity) has an invalid value." },
    "0401": { code: "0401", scope: "auth", messageDesc: "The provided seller NTN/CNIC does not have a valid or authorized access token.", briefMsgDesc: "Unauthorized: seller registration number is not 13 (CNIC) or 7 (NTN) digits, or no authorized token exists for it." },
    "0402": { code: "0402", scope: "auth", messageDesc: "The provided buyer NTN/CNIC does not have a valid or authorized access token.", briefMsgDesc: "Unauthorized: buyer registration number is not 13 (CNIC) or 7 (NTN) digits, or no authorized token exists for it." },

    // ── Purchase (§8) ─────────────────────────────────────────────────────────
    "0156": { code: "0156", scope: "purchase", messageDesc: "Invalid NTN / Reg No. provided.", briefMsgDesc: "NTN/Reg. No is invalid or null. Please provide a valid NTN/Reg. No." },
    "0157": { code: "0157", scope: "purchase", messageDesc: "Buyer is not registered for sales tax.", briefMsgDesc: "The Buyer is not registered for sales tax. Please provide a valid Registration/NTN." },
    "0158": { code: "0158", scope: "purchase", messageDesc: "Mismatch Buyer Registration No.", briefMsgDesc: "Buyer Reg No. doesn't match. Provide a valid Buyer Registration Number." },
    "0159": { code: "0159", scope: "purchase", messageDesc: "FTN holder as seller not allowed for purchases.", briefMsgDesc: "FTN Holder as Seller is not allowed for purchases." },
    "0160": { code: "0160", scope: "purchase", messageDesc: "Provide Buyer Name.", briefMsgDesc: "Buyer Name cannot be empty. Please provide a valid buyer name." },
    "0161": { code: "0161", scope: "purchase", messageDesc: "Invoice Date must be greater or equal to original.", briefMsgDesc: "Invoice Date must be greater than or equal to the original sale invoice date." },
    "0162": { code: "0162", scope: "purchase", messageDesc: "Provide Sale Type.", briefMsgDesc: "Sale Type cannot be empty/invalid. Please provide a valid Sale Type." },
    "0163": { code: "0163", scope: "purchase", messageDesc: "Selected Sale Type are not allowed to Manufacturer.", briefMsgDesc: "The provided Sale Type is not allowed for Manufacturer." },
    "0164": { code: "0164", scope: "purchase", messageDesc: "For selected HSCode only KWH UOM is allowed.", briefMsgDesc: "For the provided HS Code, only KWH UOM is allowed." },
    "0165": { code: "0165", scope: "purchase", messageDesc: "Provide UOM KG.", briefMsgDesc: "Please provide UOM in KG." },
    "0166": { code: "0166", scope: "purchase", messageDesc: "Please provide Quantity / Electricity Units.", briefMsgDesc: "Quantity / Electricity Unit cannot be empty. Please provide a valid value." },
    "0167": { code: "0167", scope: "purchase", messageDesc: "Provide Value of Sales Excl. ST.", briefMsgDesc: "Value of Sales Excl. ST cannot be empty/invalid. Please provide a valid value." },
    "0168": { code: "0168", scope: "purchase", messageDesc: "Cotton Ginners allowed against registered buyers only.", briefMsgDesc: "Only cotton ginner purchase type is allowed for registered users." },
    "0169": { code: "0169", scope: "purchase", messageDesc: "STWH can only be created for GOV/FTN Holders.", briefMsgDesc: "User is not an FTN holder. STWH can only be created for GOV/FTN Holders without a purchase invoice." },
    "0170": { code: "0170", scope: "purchase", messageDesc: "Rate not allowed above Value threshold.", briefMsgDesc: "If Value of Sales Excl. ST is greater than 20,000, the 5% rate is not allowed." },
    "0171": { code: "0171", scope: "purchase", messageDesc: "Not an EFS Compressor Scrap importer.", briefMsgDesc: "You are not an EFS license holder who has imported Compressor Scrap in the last 12 months." },
    "0172": { code: "0172", scope: "purchase", messageDesc: "Petroleum Levy rates not configured properly.", briefMsgDesc: "Petroleum Levy rates not configured properly. Please update levy rates." },
    "0173": { code: "0173", scope: "purchase", messageDesc: "Alphanumeric and (-) contained invoice No. is allowed.", briefMsgDesc: "Invoice number is not valid. Provide an alphanumeric format like Inv-001." },
    "0174": { code: "0174", scope: "purchase", messageDesc: "Please provide Sales Tax.", briefMsgDesc: "Sales Tax cannot be empty. Please provide a valid Sales Tax." },
    "0175": { code: "0175", scope: "purchase", messageDesc: "Please provide Fixed / notified value or Retail Price.", briefMsgDesc: "Fixed / notified value or Retail Price cannot be empty. Please provide a valid value." },
    "0176": { code: "0176", scope: "purchase", messageDesc: "Please provide ST withheld at Source.", briefMsgDesc: "ST withheld at Source cannot be empty. Please provide a valid value." },
    "0177": { code: "0177", scope: "purchase", messageDesc: "Please provide Further Tax.", briefMsgDesc: "Further Tax cannot be empty. Please provide a valid Further Tax." },
};

/**
 * Look up an FBR error entry by code. Codes may arrive with or without
 * leading zeros; we normalize to a 4-digit key.
 */
export function resolveFbrError(code: string | null | undefined): FbrErrorEntry | null {
    if (!code) return null;
    const key = code.trim().padStart(4, "0");
    return catalogue[key] ?? null;
}

export const FBR_ERROR_CATALOGUE = catalogue;

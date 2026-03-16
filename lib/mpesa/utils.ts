// lib/mpesa/utils.ts
// ============================================================
// M-Pesa C2B helpers
// ============================================================

export interface MpesaC2BRawPayload {
  TransactionType?: string;
  TransID?: string;
  TransTime?: string;
  TransAmount?: string | number;
  BusinessShortCode?: string | number;
  BillRefNumber?: string;
  BillRefNo?: string;
  InvoiceNumber?: string;
  OrgAccountBalance?: string;
  ThirdPartyTransID?: string;
  MSISDN?: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
  [key: string]: unknown;
}

export interface MpesaC2BNormalized {
  transactionType: string;
  transId: string;
  transTime: string | null;
  transAmount: number;
  businessShortCode: string | null;
  billRefNumber: string | null;
  invoiceNumber: string | null;
  orgAccountBalance: string | null;
  thirdPartyTransId: string | null;
  msisdn: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  raw: MpesaC2BRawPayload;
}

export function parseMpesaTimestamp(value?: string | null): string | null {
  if (!value) {return null;}
  const raw = String(value).trim();
  if (!/^\d{14}$/.test(raw)) {return null;}

  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  const hour = raw.slice(8, 10);
  const minute = raw.slice(10, 12);
  const second = raw.slice(12, 14);

  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {return null;}
  return date.toISOString();
}

export function normalizeC2BPayload(payload: MpesaC2BRawPayload): MpesaC2BNormalized {
  const rawAmount = payload.TransAmount ?? 0;
  const transAmount = typeof rawAmount === "number"
    ? rawAmount
    : parseFloat(String(rawAmount).replace(/,/g, ""));

  const billRef = (payload.BillRefNumber || payload.BillRefNo || "").toString().trim();
  const invoice = (payload.InvoiceNumber || "").toString().trim();

  return {
    transactionType: (payload.TransactionType || "").toString().trim() || "Unknown",
    transId: (payload.TransID || "").toString().trim(),
    transTime: parseMpesaTimestamp(payload.TransTime || undefined),
    transAmount: Number.isFinite(transAmount) ? transAmount : 0,
    businessShortCode:
      payload.BusinessShortCode !== undefined && payload.BusinessShortCode !== null
        ? String(payload.BusinessShortCode)
        : null,
    billRefNumber: billRef || null,
    invoiceNumber: invoice || null,
    orgAccountBalance: payload.OrgAccountBalance
      ? String(payload.OrgAccountBalance)
      : null,
    thirdPartyTransId: payload.ThirdPartyTransID
      ? String(payload.ThirdPartyTransID)
      : null,
    msisdn: payload.MSISDN ? String(payload.MSISDN) : null,
    firstName: payload.FirstName ? String(payload.FirstName) : null,
    middleName: payload.MiddleName ? String(payload.MiddleName) : null,
    lastName: payload.LastName ? String(payload.LastName) : null,
    raw: payload,
  };
}

export function isUuid(value: string | null | undefined): boolean {
  if (!value) {return false;}
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function normalizeReference(value?: string | null): string | null {
  if (!value) {return null;}
  const trimmed = value.toString().trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function splitReference(reference?: string | null) {
  const value = normalizeReference(reference);
  if (!value) {return { raw: null, normalized: null };}
  const normalized = value.replace(/\s+/g, "");
  return { raw: value, normalized };
}

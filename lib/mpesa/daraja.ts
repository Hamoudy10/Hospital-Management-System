// lib/mpesa/daraja.ts
// ============================================================
// Daraja API helpers (access token, C2B register)
// ============================================================

import { Buffer } from "buffer";

export type MpesaEnv = "sandbox" | "production";

export interface MpesaConfig {
  env: MpesaEnv;
  consumerKey: string;
  consumerSecret: string;
  shortCode: string;
  responseType: "Completed" | "Cancelled";
  callbackBaseUrl: string;
}

export function getMpesaConfig(): MpesaConfig {
  const env = (process.env.MPESA_ENV || "sandbox") as MpesaEnv;
  const consumerKey = process.env.MPESA_CONSUMER_KEY || "";
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET || "";
  const shortCode = process.env.MPESA_SHORTCODE || "";
  const responseType = (process.env.MPESA_C2B_RESPONSE_TYPE || "Completed") as
    | "Completed"
    | "Cancelled";
  const callbackBaseUrl =
    process.env.MPESA_CALLBACK_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";

  return {
    env,
    consumerKey,
    consumerSecret,
    shortCode,
    responseType,
    callbackBaseUrl,
  };
}

export function getDarajaBaseUrl(env: MpesaEnv) {
  return env === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

export async function getMpesaAccessToken(config: MpesaConfig): Promise<string> {
  if (!config.consumerKey || !config.consumerSecret) {
    throw new Error("Missing M-Pesa consumer key/secret");
  }

  const auth = Buffer.from(
    `${config.consumerKey}:${config.consumerSecret}`,
    "utf8",
  ).toString("base64");

  const url = `${getDarajaBaseUrl(config.env)}/oauth/v1/generate?grant_type=client_credentials`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get access token: ${response.status} ${text}`);
  }

  const json = await response.json();
  if (!json.access_token) {
    throw new Error("No access token returned by M-Pesa");
  }

  return json.access_token as string;
}

export function buildC2BUrls(config: MpesaConfig) {
  if (!config.callbackBaseUrl) {
    throw new Error("Missing MPESA_CALLBACK_BASE_URL or NEXT_PUBLIC_APP_URL");
  }

  return {
    confirmationUrl: `${config.callbackBaseUrl.replace(/\/$/, "")}/api/mpesa/c2b/confirmation`,
    validationUrl: `${config.callbackBaseUrl.replace(/\/$/, "")}/api/mpesa/c2b/validation`,
  };
}

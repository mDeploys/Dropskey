import { createPrivateKey, createSign } from "crypto";
import type { Tables } from "@/types/supabase";

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_MERCHANT_SCOPE = "https://www.googleapis.com/auth/content";
const GOOGLE_MERCHANT_PRODUCTS_BASE_URL = "https://merchantapi.googleapis.com/products/v1";
const GOOGLE_MERCHANT_DATASOURCES_BASE_URL = "https://merchantapi.googleapis.com/datasources/v1";

let cachedAccessToken: { value: string; expiresAt: number } | null = null;

export type GoogleMerchantProduct = Pick<
  Tables<"products">,
  | "id"
  | "name"
  | "description"
  | "image"
  | "price"
  | "sale_price"
  | "is_on_sale"
  | "sku"
  | "category"
  | "seo_title"
  | "seo_description"
>;

export interface GoogleMerchantConfig {
  merchantAccountId: string | null;
  serviceAccountEmail: string | null;
  privateKey: string | null;
  developerEmail: string | null;
  dataSourceDisplayName: string;
  feedLabel: string;
  contentLanguage: string;
  targetCountries: string[];
  currencyCode: string;
  brand: string;
  googleProductCategory: string;
  baseUrl: string;
  missingEnvVars: string[];
}

export interface GoogleMerchantDataSource {
  name: string;
  dataSourceId?: string;
  displayName: string;
  input?: string;
  primaryProductDataSource?: {
    countries?: string[];
    feedLabel?: string;
    contentLanguage?: string;
  };
}

export interface GoogleMerchantDeveloperRegistration {
  name: string;
  gcpIds?: string[];
}

function base64UrlEncode(input: string | Buffer) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function stripHtml(value?: string | null) {
  if (!value) {
    return "";
  }

  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function toMicros(amount: number) {
  return Math.round(amount * 1_000_000).toString();
}

function toAbsoluteUrl(baseUrl: string, input?: string | null) {
  if (!input) {
    return "";
  }

  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  return new URL(input.startsWith("/") ? input : `/${input}`, baseUrl).toString();
}

function normalizePrivateKey(value: string | null) {
  if (!value) {
    return null;
  }

  let normalized = value.trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }

  normalized = normalized.replace(/\r/g, "").replace(/\\n/g, "\n").trim();

  const hasBeginMarker = normalized.includes("-----BEGIN ");
  const hasEndMarker = normalized.includes("-----END ");

  if (!hasBeginMarker || !hasEndMarker) {
    const keyBody = normalized
      .replace(/-----BEGIN [^-]+-----/g, "")
      .replace(/-----END [^-]+-----/g, "")
      .replace(/\s+/g, "\n")
      .trim();

    if (keyBody) {
      normalized = `-----BEGIN PRIVATE KEY-----\n${keyBody}\n-----END PRIVATE KEY-----`;
    }
  }

  return normalized.endsWith("\n") ? normalized : `${normalized}\n`;
}

function getEnvList(value: string | undefined, fallback: string[]) {
  const items = value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return items && items.length > 0 ? items : fallback;
}

export function getGoogleMerchantConfig(): GoogleMerchantConfig {
  const merchantAccountId = process.env.GOOGLE_MERCHANT_ACCOUNT_ID?.trim() || null;
  const serviceAccountEmail = process.env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL?.trim() || null;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_MERCHANT_PRIVATE_KEY?.trim() || null);
  const developerEmail = process.env.GOOGLE_MERCHANT_DEVELOPER_EMAIL?.trim() || null;
  const dataSourceDisplayName =
    process.env.GOOGLE_MERCHANT_DATA_SOURCE_NAME?.trim() || "Dropskey API Products";
  const feedLabel = (process.env.GOOGLE_MERCHANT_FEED_LABEL?.trim() || "SA").toUpperCase();
  const contentLanguage = (process.env.GOOGLE_MERCHANT_CONTENT_LANGUAGE?.trim() || "en").toLowerCase();
  const targetCountries = getEnvList(process.env.GOOGLE_MERCHANT_TARGET_COUNTRIES, [feedLabel]).map((country) =>
    country.toUpperCase()
  );
  const currencyCode = (process.env.GOOGLE_MERCHANT_CURRENCY?.trim() || "USD").toUpperCase();
  const brand = process.env.GOOGLE_MERCHANT_BRAND?.trim() || "Dropskey";
  const googleProductCategory =
    process.env.GOOGLE_MERCHANT_GOOGLE_PRODUCT_CATEGORY?.trim() || "Software > Computer Software";
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");

  const missingEnvVars: string[] = [];

  if (!merchantAccountId) {
    missingEnvVars.push("GOOGLE_MERCHANT_ACCOUNT_ID");
  }

  if (!serviceAccountEmail) {
    missingEnvVars.push("GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL");
  }

  if (!privateKey) {
    missingEnvVars.push("GOOGLE_MERCHANT_PRIVATE_KEY");
  }

  return {
    merchantAccountId,
    serviceAccountEmail,
    privateKey,
    developerEmail,
    dataSourceDisplayName,
    feedLabel,
    contentLanguage,
    targetCountries,
    currencyCode,
    brand,
    googleProductCategory,
    baseUrl,
    missingEnvVars,
  };
}

async function getAccessToken(config: GoogleMerchantConfig) {
  if (!config.serviceAccountEmail || !config.privateKey) {
    throw new Error("Google Merchant service account credentials are not configured.");
  }

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value;
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;
  const unsignedJwt = `${base64UrlEncode(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  )}.${base64UrlEncode(
    JSON.stringify({
      iss: config.serviceAccountEmail,
      scope: GOOGLE_MERCHANT_SCOPE,
      aud: GOOGLE_OAUTH_TOKEN_URL,
      iat: issuedAt,
      exp: expiresAt,
    })
  )}`;

  let privateKey;

  try {
    privateKey = createPrivateKey({
      key: config.privateKey,
      format: "pem",
    });
  } catch {
    throw new Error(
      "Google Merchant private key could not be decoded. Check GOOGLE_MERCHANT_PRIVATE_KEY formatting in Vercel env."
    );
  }

  const signer = createSign("RSA-SHA256");
  signer.update(unsignedJwt);
  signer.end();

  const signature = signer
    .sign(privateKey)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const assertion = `${unsignedJwt}.${signature}`;
  const tokenResponse = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text();
    throw new Error(`Google OAuth failed: ${body}`);
  }

  const tokenJson = (await tokenResponse.json()) as { access_token: string; expires_in?: number };
  cachedAccessToken = {
    value: tokenJson.access_token,
    expiresAt: Date.now() + (tokenJson.expires_in ?? 3600) * 1000,
  };

  return tokenJson.access_token;
}

async function merchantRequest<T>(
  config: GoogleMerchantConfig,
  url: string,
  init?: RequestInit
): Promise<T> {
  const accessToken = await getAccessToken(config);
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Google Merchant request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function listGoogleMerchantDataSources(config: GoogleMerchantConfig) {
  if (!config.merchantAccountId) {
    throw new Error("Google Merchant account ID is missing.");
  }

  const accountName = `accounts/${config.merchantAccountId}`;
  const response = await merchantRequest<{ dataSources?: GoogleMerchantDataSource[] }>(
    config,
    `${GOOGLE_MERCHANT_DATASOURCES_BASE_URL}/${accountName}/dataSources?pageSize=250`,
    { method: "GET" }
  );

  return response.dataSources ?? [];
}

export async function ensureGoogleMerchantDataSource(config: GoogleMerchantConfig) {
  if (!config.merchantAccountId) {
    throw new Error("Google Merchant account ID is missing.");
  }

  const accountName = `accounts/${config.merchantAccountId}`;
  const dataSources = await listGoogleMerchantDataSources(config);
  const existing = dataSources.find(
    (dataSource) =>
      dataSource.displayName === config.dataSourceDisplayName && Boolean(dataSource.primaryProductDataSource)
  );

  if (existing) {
    return { dataSource: existing, created: false };
  }

  const createdDataSource = await merchantRequest<GoogleMerchantDataSource>(
    config,
    `${GOOGLE_MERCHANT_DATASOURCES_BASE_URL}/${accountName}/dataSources`,
    {
      method: "POST",
      body: JSON.stringify({
        displayName: config.dataSourceDisplayName,
        primaryProductDataSource: {
          countries: config.targetCountries,
          feedLabel: config.feedLabel,
          contentLanguage: config.contentLanguage,
        },
      }),
    }
  );

  return { dataSource: createdDataSource, created: true };
}

export async function registerGoogleMerchantGcpProject(config: GoogleMerchantConfig, developerEmail: string) {
  if (!config.merchantAccountId) {
    throw new Error("Google Merchant account ID is missing.");
  }

  const accountName = `accounts/${config.merchantAccountId}`;

  return merchantRequest<GoogleMerchantDeveloperRegistration>(
    config,
    `https://merchantapi.googleapis.com/accounts/v1/${accountName}/developerRegistration:registerGcp`,
    {
      method: "POST",
      body: JSON.stringify({
        developerEmail,
      }),
    }
  );
}

function buildGoogleMerchantProductInput(product: GoogleMerchantProduct, config: GoogleMerchantConfig) {
  const title = product.name.trim();
  const description =
    stripHtml(product.seo_description) ||
    stripHtml(product.description) ||
    title;
  const offerId = product.sku?.trim() || `dropskey-${product.id}`;
  const productUrl = `${config.baseUrl}/product/${product.id}`;
  const imageUrl = toAbsoluteUrl(config.baseUrl, product.image);
  const regularPrice = Number(product.price);
  const salePrice = product.is_on_sale && product.sale_price != null ? Number(product.sale_price) : null;

  if (!Number.isFinite(regularPrice) || regularPrice <= 0) {
    throw new Error("Product price must be greater than zero.");
  }

  if (!imageUrl) {
    throw new Error("Product image is required for Google Merchant.");
  }

  const shipping = config.targetCountries.map((country) => ({
    country,
    service: "Digital delivery",
    price: {
      amountMicros: "0",
      currencyCode: config.currencyCode,
    },
  }));

  return {
    offerId,
    contentLanguage: config.contentLanguage,
    feedLabel: config.feedLabel,
    productAttributes: {
      title,
      description,
      link: productUrl,
      imageLink: imageUrl,
      availability: "IN_STOCK",
      condition: "NEW",
      brand: config.brand,
      googleProductCategory: config.googleProductCategory,
      mpn: offerId,
      identifierExists: false,
      price: {
        amountMicros: toMicros(regularPrice),
        currencyCode: config.currencyCode,
      },
      ...(salePrice && salePrice > 0 && salePrice < regularPrice
        ? {
            salePrice: {
              amountMicros: toMicros(salePrice),
              currencyCode: config.currencyCode,
            },
          }
        : {}),
      shipping,
    },
  };
}

export async function upsertGoogleMerchantProduct(
  product: GoogleMerchantProduct,
  config: GoogleMerchantConfig,
  dataSourceName: string
) {
  if (!config.merchantAccountId) {
    throw new Error("Google Merchant account ID is missing.");
  }

  const accountName = `accounts/${config.merchantAccountId}`;
  const params = new URLSearchParams({ dataSource: dataSourceName });
  const productInput = buildGoogleMerchantProductInput(product, config);

  return merchantRequest(
    config,
    `${GOOGLE_MERCHANT_PRODUCTS_BASE_URL}/${accountName}/productInputs:insert?${params.toString()}`,
    {
      method: "POST",
      body: JSON.stringify(productInput),
    }
  );
}

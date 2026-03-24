"use server";

import { createAdminClient, createSupabaseServerClientComponent } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";
import {
  ensureGoogleMerchantDataSource,
  getGoogleMerchantConfig,
  listGoogleMerchantDataSources,
  upsertGoogleMerchantProduct,
  type GoogleMerchantProduct,
} from "@/lib/google-merchant";

type GoogleMerchantProductRow = GoogleMerchantProduct;

async function getAdminContext() {
  const supabase = await createSupabaseServerClientComponent();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabaseAdmin: null, error: "User not authenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single() as { data: Pick<Tables<"profiles">, "is_admin"> | null; error: unknown };

  if (profileError || !profile?.is_admin) {
    return { supabaseAdmin: null, error: "Unauthorized: Admin access required" };
  }

  return { supabaseAdmin: await createAdminClient(), error: null };
}

export async function getGoogleMerchantStatus() {
  const { error: adminError } = await getAdminContext();
  if (adminError) {
    return { error: adminError, data: null };
  }

  const config = getGoogleMerchantConfig();
  if (config.missingEnvVars.length > 0) {
    return {
      error: null,
      data: {
        configured: false,
        missingEnvVars: config.missingEnvVars,
        accountId: config.merchantAccountId,
        dataSourceDisplayName: config.dataSourceDisplayName,
        feedLabel: config.feedLabel,
        contentLanguage: config.contentLanguage,
        targetCountries: config.targetCountries,
        currencyCode: config.currencyCode,
        dataSourceFound: false,
        dataSourceName: null,
      },
    };
  }

  try {
    const dataSources = await listGoogleMerchantDataSources(config);
    const dataSource = dataSources.find(
      (entry) =>
        entry.displayName === config.dataSourceDisplayName && Boolean(entry.primaryProductDataSource)
    );

    return {
      error: null,
      data: {
        configured: true,
        missingEnvVars: [],
        accountId: config.merchantAccountId,
        dataSourceDisplayName: config.dataSourceDisplayName,
        feedLabel: config.feedLabel,
        contentLanguage: config.contentLanguage,
        targetCountries: config.targetCountries,
        currencyCode: config.currencyCode,
        dataSourceFound: Boolean(dataSource),
        dataSourceName: dataSource?.name ?? null,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to check Google Merchant status",
      data: null,
    };
  }
}

export async function syncProductsToGoogleMerchant() {
  const { supabaseAdmin, error: adminError } = await getAdminContext();
  if (adminError || !supabaseAdmin) {
    return { error: adminError || "Unauthorized", data: null };
  }

  const config = getGoogleMerchantConfig();
  if (config.missingEnvVars.length > 0) {
    return {
      error: `Missing Google Merchant env vars: ${config.missingEnvVars.join(", ")}`,
      data: null,
    };
  }

  try {
    const { dataSource, created } = await ensureGoogleMerchantDataSource(config);
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, description, image, price, sale_price, is_on_sale, sku, category, seo_title, seo_description")
      .order("id", { ascending: true }) as { data: GoogleMerchantProductRow[] | null; error: unknown };

    if (productsError) {
      throw new Error("Failed to load products from Supabase.");
    }

    const failures: Array<{ productId: number; productName: string; message: string }> = [];
    let syncedCount = 0;

    for (const product of products ?? []) {
      try {
        await upsertGoogleMerchantProduct(product, config, dataSource.name);
        syncedCount += 1;
      } catch (error) {
        failures.push({
          productId: product.id,
          productName: product.name,
          message: error instanceof Error ? error.message : "Unknown Google Merchant sync error",
        });
      }
    }

    return {
      error: null,
      data: {
        syncedCount,
        failedCount: failures.length,
        dataSourceCreated: created,
        dataSourceName: dataSource.name,
        failures,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to sync products to Google Merchant",
      data: null,
    };
  }
}

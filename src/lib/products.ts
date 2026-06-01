import type { Product } from "@/types/product"

const productSelect = [
  "id",
  "name",
  "description",
  "price",
  "image",
  "is_digital",
  "download_url",
  "sale_price",
  "is_on_sale",
  "sale_percent",
  "sku",
  "tag",
  "category",
  "is_most_sold",
  "seo_title",
  "seo_description",
  "seo_keywords",
].join(",")

function normalizeProduct(product: any): Product {
  return {
    ...product,
    price: Number(product.price) || 0,
    sale_price: product.sale_price ? Number(product.sale_price) : null,
    is_on_sale: Boolean(product.is_on_sale),
    is_most_sold: Boolean(product.is_most_sold),
    is_digital: Boolean(product.is_digital),
  }
}

async function fetchProductsFromSupabase(query: string, revalidate = 3600) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return []
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/products?${query}`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    next: { revalidate },
  })

  if (!response.ok) {
    console.error("Failed to fetch products:", response.status, await response.text())
    return []
  }

  const products = await response.json()
  return Array.isArray(products) ? products.map(normalizeProduct) : []
}

export async function getHomeProducts(limit = 8) {
  const mostSoldQuery = new URLSearchParams({
    select: productSelect,
    is_most_sold: "eq.true",
    order: "id.asc",
    limit: String(limit),
  }).toString()

  const mostSoldProducts = await fetchProductsFromSupabase(mostSoldQuery)

  if (mostSoldProducts.length > 0) {
    return mostSoldProducts
  }

  const latestQuery = new URLSearchParams({
    select: productSelect,
    order: "id.desc",
    limit: String(limit),
  }).toString()

  return fetchProductsFromSupabase(latestQuery)
}

export async function getSitemapProducts(limit = 500) {
  const query = new URLSearchParams({
    select: "id",
    order: "id.desc",
    limit: String(limit),
  }).toString()

  return fetchProductsFromSupabase(query, 86400)
}

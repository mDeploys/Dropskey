import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { ProductGrid } from "@/components/product-grid"
import { getHomeProducts } from "@/lib/products"
import { getSiteUrl, siteConfig } from "@/lib/site"

export const revalidate = 3600

function HomeStructuredData() {
  const siteUrl = getSiteUrl()
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: siteConfig.name,
    url: siteUrl,
    logo: `${siteUrl}/panda.png`,
    description: siteConfig.description,
    email: siteConfig.supportEmail,
    telephone: siteConfig.phoneNumbers[0],
    sameAs: ["https://www.facebook.com/dropskeey"],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export default async function Home() {
  const products = await getHomeProducts()

  return (
    <>
      <HomeStructuredData />
      <HeroSection />
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-10">Most Sold Products</h2>
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <p className="text-center text-muted-foreground">Explore our digital software catalog.</p>
          )}
        </div>
      </section>
      <FeaturesSection />
    </>
  )
}

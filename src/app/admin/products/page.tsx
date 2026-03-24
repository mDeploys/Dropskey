import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ProductForm } from "@/components/admin/product-form"
import { GoogleMerchantSyncCard } from "@/components/admin/google-merchant-sync-card"
import { Product } from "@/types/product"
import { createSupabaseServerClientComponent } from "@/lib/supabase/server"
import Image from "next/image"

export default async function ProductsPage() {
  const supabase = await createSupabaseServerClientComponent()
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: true })

  if (error) {
    console.error("Error fetching products:", error)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <ProductForm />
      </div>
      <GoogleMerchantSyncCard />
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Sale Price</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(products as Product[])?.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.id.toString()}</TableCell>
                <TableCell>
                  {product.image && (
                    <div className="relative w-12 h-12">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        style={{ objectFit: "contain" }}
                        unoptimized={true}
                      />
                    </div>
                  )}
                </TableCell>
                <TableCell>{product.sku || "N/A"}</TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>${parseFloat(product.price.toString()).toFixed(2)}</TableCell>
                <TableCell>
                  {product.is_on_sale && product.sale_price !== null && product.sale_price !== undefined
                    ? `$${product.sale_price.toFixed(2)} (${product.sale_percent || 0}%)`
                    : "N/A"}
                </TableCell>
                <TableCell>{product.category || "N/A"}</TableCell>
                <TableCell>{product.tag || "N/A"}</TableCell>
                <TableCell>
                  <ProductForm product={product} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

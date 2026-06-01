"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Minus, Plus, Heart } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"
import { getImagePath } from "@/lib/utils"
import { Product } from "@/types/product"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ProductQuickView } from "./product-quick-view"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isProductInWishlist } = useWishlist()

  const handleAddToCart = () => {
    addToCart(product, quantity)
  }

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(Math.max(1, newQuantity)) // Ensure quantity is at least 1
  }

  const handleWishlistToggle = () => {
    if (isProductInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  const displayPrice = product.is_on_sale && product.sale_price !== null && product.sale_price !== undefined
    ? product.sale_price.toFixed(2)
    : product.price.toFixed(2);

  const originalPrice = product.price.toFixed(2);

  const imagePath = getImagePath(product.image);

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 relative">
      {product.is_on_sale && product.sale_percent !== null && product.sale_percent !== undefined && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-sm z-10">
          SALE {product.sale_percent}%
        </div>
      )}
      <Link href={`/product/${product.id}`} className="relative block h-64 w-full overflow-hidden flex items-center justify-center bg-card">
        <Image
          src={imagePath}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          style={{ objectFit: "contain" }}
          unoptimized={true}
        />
      </Link>
      <CardContent className="flex-grow p-4 text-center">
        <CardTitle className="text-sm font-semibold mb-2 line-clamp-2">
          <Link href={`/product/${product.id}`} className="hover:text-blue-600 transition-colors">
            {product.name}
          </Link>
        </CardTitle>
        <div className="text-foreground font-bold text-xl">
          {product.is_on_sale && product.sale_price !== null && product.sale_price !== undefined ? (
            <>
              <span className="line-through text-muted-foreground text-base mr-2">${originalPrice}</span>
              <span className="text-blue-600">${displayPrice}</span>
            </>
          ) : (
            `$${displayPrice}`
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col items-center space-y-4">
        <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              QUICK VIEW
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl p-0">
            <ProductQuickView product={product} />
          </DialogContent>
        </Dialog>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(quantity - 1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="w-12 h-8 text-center border-x border-y-0 focus-visible:ring-0"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            className="bg-[#1e73be] hover:bg-[#28a645] text-white p-2 rounded-md"
            size="icon"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2"
            onClick={handleWishlistToggle}
          >
            <Heart className={isProductInWishlist(product.id) ? "h-5 w-5 text-red-500 fill-red-500" : "h-5 w-5 text-gray-500"} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { ProductImage } from '@/components/ui/optimized-image'

interface Product {
  id: string
  name: string
  price: number
  sale_price?: number | null
  images?: string[]
  stock_quantity: number
  sku: string
  categories: {
    id: string
    name: string
    slug: string
  }[]
}

interface ProductsByCategoryClientProps {
  products: Product[]
}

export default function ProductsByCategoryClient({ products }: ProductsByCategoryClientProps) {
  const { addToCart, isLoading } = useCart()
  const router = useRouter()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
      {products.map((product) => (
        <div key={product.id} className="group">
          <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-200 hover:border-primary/30 bg-white cursor-pointer transform hover:-translate-y-2 rounded-xl sm:rounded-2xl h-full">
            <Link href={`/products/${product.sku}`}>
              <div className="aspect-square relative overflow-hidden rounded-t-2xl">
                {product.images && product.images.length > 0 ? (
                  <ProductImage
                    src={product.images[0]}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
                    <div className="text-gray-300 text-center">
                      <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
                        📦
                      </div>
                      <span className="text-xs">No Image</span>
                    </div>
                  </div>
                )}
                
                {/* Enhanced Badges */}
                {product.stock_quantity === 0 && (
                  <Badge className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-full shadow-lg text-xs">
                    Out of Stock
                  </Badge>
                )}
                {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                  <Badge className="absolute top-3 right-3 bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded-full shadow-lg text-xs">
                    Low Stock
                  </Badge>
                )}
                {product.sale_price && product.sale_price < product.price && (
                  <Badge className="absolute top-3 left-3 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-full shadow-lg text-xs">
                    Sale
                  </Badge>
                )}
                
                {/* Quick View Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button variant="secondary" className="bg-white/90 hover:bg-white text-black rounded-full px-4 py-2 text-xs">
                    Quick View
                  </Button>
                </div>
              </div>
            </Link>
            
            <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 flex flex-col">
              <Link href={`/products/${product.sku}`}>
                <h4 className="font-bold text-xs sm:text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight">
                  {product.name}
                </h4>
              </Link>
              
              {/* Price */}
              <div className="flex flex-col">
                <span className="text-sm sm:text-lg font-bold text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text">
                  {product.sale_price && product.sale_price < product.price ? (
                    <>৳{product.sale_price.toLocaleString()}</>
                  ) : (
                    <>৳{product.price.toLocaleString()}</>
                  )}
                </span>
                {product.sale_price && product.sale_price < product.price && (
                  <span className="text-xs text-gray-500 line-through">৳{product.price.toLocaleString()}</span>
                )}
              </div>
              
              {/* Stock Status */}
              <div className="flex items-center gap-1 sm:gap-2">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                  product.stock_quantity > 10 ? 'bg-green-500' : 
                  product.stock_quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs text-gray-500">
                  {product.stock_quantity > 0 ? (
                    `${product.stock_quantity} in stock`
                  ) : (
                    'Out of Stock'
                  )}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-1 sm:gap-2 mt-auto pt-2 sm:pt-3">
                <Button 
                  size="sm"
                  className="flex-1 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 hover:shadow-lg text-xs" 
                  disabled={isLoading || product.stock_quantity === 0}
                  variant={product.stock_quantity === 0 ? "secondary" : "default"}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (product.stock_quantity > 0) {
                      const success = await addToCart(product.id, 1);
                      if (success) {
                        console.log('Item added to cart successfully');
                      }
                    }
                  }}
                >
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  {isLoading ? 'Adding...' : (product.stock_quantity === 0 ? 'Out' : 'Add')}
                </Button>
                
                <Button 
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-300 hover:shadow-lg text-xs" 
                  disabled={product.stock_quantity === 0}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (product.stock_quantity > 0) {
                      const success = await addToCart(product.id, 1);
                      if (success) {
                        router.push('/cart');
                      }
                    }
                  }}
                >
                  {product.stock_quantity === 0 ? 'Unavailable' : 'Buy'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
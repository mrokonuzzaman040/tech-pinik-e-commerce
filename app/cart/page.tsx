'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/contexts/cart-context'
import Navbar from '@/components/navbar'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const { 
    cartItems, 
    cartCount, 
    cartTotal, 
    isLoading, 
    updateCartItem, 
    removeFromCart 
  } = useCart()
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const router = useRouter()

  const handleCheckout = () => {
    router.push('/checkout')
  }

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 0) return
    
    setUpdatingItems(prev => new Set(prev).add(cartItemId))
    
    try {
      if (newQuantity === 0) {
        await removeFromCart(cartItemId)
      } else {
        await updateCartItem(cartItemId, newQuantity)
      }
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(cartItemId)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (cartItemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(cartItemId))
    
    try {
      await removeFromCart(cartItemId)
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(cartItemId)
        return newSet
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your cart...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">Continue Shopping</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Shopping Cart
          </h1>
          {cartCount > 0 && (
            <Badge variant="secondary" className="text-sm sm:text-lg px-2 sm:px-3 py-1">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </Badge>
          )}
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart */
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. 
              Start shopping to fill it up!
            </p>
            <Link href="/">
              <Button size="lg" className="px-8">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          /* Cart Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {cartItems.map((item) => {
                const product = item.products
                const isUpdating = updatingItems.has(item.id)
                const displayPrice = product.sale_price || product.price
                const originalPrice = product.sale_price ? product.price : null

                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex gap-3 sm:gap-4">
                        {/* Product Image */}
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                          <Image
                            src={product.images?.[0] || '/placeholder-product.jpg'}
                            alt={product.name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={`/products/${product.sku || product.id}`}
                                className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 text-sm sm:text-base"
                              >
                                {product.name}
                              </Link>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                SKU: {product.sku}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isUpdating}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 flex-shrink-0 ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Price */}
                          <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <span className="text-base sm:text-lg font-bold text-gray-900">
                              ৳{displayPrice.toLocaleString()}
                            </span>
                            {originalPrice && (
                              <span className="text-xs sm:text-sm text-gray-500 line-through">
                                ৳{originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={isUpdating || item.quantity <= 1}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <span className="w-8 sm:w-12 text-center font-medium text-sm sm:text-base">
                                {isUpdating ? '...' : item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                disabled={isUpdating || item.quantity >= product.stock_quantity}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                            
                            {/* Item Total */}
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 text-sm sm:text-base">
                                ৳{(displayPrice * item.quantity).toLocaleString()}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-xs sm:text-sm text-gray-600">
                                  ৳{displayPrice.toLocaleString()} each
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Stock Warning */}
                          {item.quantity >= product.stock_quantity && (
                            <p className="text-xs sm:text-sm text-amber-600 mt-2">
                              Only {product.stock_quantity} left in stock
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-lg sm:text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({cartCount} items)</span>
                    <span className="font-medium">৳{cartTotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  
                  <hr className="my-3 sm:my-4" />
                  
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>Total</span>
                    <span>৳{cartTotal.toLocaleString()}</span>
                  </div>
                  
                  <Button className="w-full mt-4 sm:mt-6" size="lg" onClick={handleCheckout}>
                    Proceed to Checkout
                  </Button>
                  
                  <Link href="/" className="block mt-3">
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
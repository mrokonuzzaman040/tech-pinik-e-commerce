'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CartItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  session_id: string
  created_at: string
  products: {
    id: string
    name: string
    price: number
    sale_price?: number
    images: string[]
    stock_quantity: number
    sku: string
  }
}

interface CartContextType {
  cartItems: CartItem[]
  cartCount: number
  cartTotal: number
  isLoading: boolean
  addToCart: (productId: string, quantity?: number) => Promise<boolean>
  updateCartItem: (cartItemId: string, quantity: number) => Promise<boolean>
  removeFromCart: (cartItemId: string) => Promise<boolean>
  clearCart: () => void
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')

  // Generate or get session ID
  useEffect(() => {
    let storedSessionId = localStorage.getItem('cart_session_id')
    if (!storedSessionId) {
      storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('cart_session_id', storedSessionId)
    }
    setSessionId(storedSessionId)
  }, [])

  // Load cart items on mount
  useEffect(() => {
    if (sessionId) {
      refreshCart()
    }
  }, [sessionId])

  const refreshCart = async () => {
    if (!sessionId) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/cart?session_id=${sessionId}`)
      const data = await response.json()
      
      if (response.ok) {
        setCartItems(data.cartItems || [])
      } else {
        console.error('Failed to fetch cart:', data.error)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addToCart = async (productId: string, quantity: number = 1): Promise<boolean> => {
    if (!sessionId) return false
    
    try {
      setIsLoading(true)
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          quantity,
          session_id: sessionId,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await refreshCart()
        return true
      } else {
        console.error('Failed to add to cart:', data.error)
        alert(data.error || 'Failed to add item to cart')
        return false
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add item to cart')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updateCartItem = async (cartItemId: string, quantity: number): Promise<boolean> => {
    if (!sessionId) return false
    
    try {
      setIsLoading(true)
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_item_id: cartItemId,
          quantity,
          session_id: sessionId,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await refreshCart()
        return true
      } else {
        console.error('Failed to update cart:', data.error)
        alert(data.error || 'Failed to update cart')
        return false
      }
    } catch (error) {
      console.error('Error updating cart:', error)
      alert('Failed to update cart')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromCart = async (cartItemId: string): Promise<boolean> => {
    if (!sessionId) return false
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/cart?cart_item_id=${cartItemId}&session_id=${sessionId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        await refreshCart()
        return true
      } else {
        console.error('Failed to remove from cart:', data.error)
        alert(data.error || 'Failed to remove item from cart')
        return false
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
      alert('Failed to remove item from cart')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = () => {
    setCartItems([])
  }

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cartItems.reduce((total, item) => {
    const price = item.products.sale_price || item.products.price
    return total + (price * item.quantity)
  }, 0)

  const value: CartContextType = {
    cartItems,
    cartCount,
    cartTotal,
    isLoading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
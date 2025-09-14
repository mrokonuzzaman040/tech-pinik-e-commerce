'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react'

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
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingRef = useRef(false)

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

  const refreshCart = useCallback(async () => {
    if (!sessionId || isUpdatingRef.current) return
    
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
  }, [sessionId])

  const addToCart = useCallback(async (productId: string, quantity: number = 1): Promise<boolean> => {
    if (!sessionId) return false
    
    // Optimistic update
    const existingItem = cartItems.find(item => item.product_id === productId)
    if (existingItem) {
      const updatedItems = cartItems.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      )
      setCartItems(updatedItems)
    }
    
    try {
      isUpdatingRef.current = true
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
        // Debounced refresh to avoid multiple API calls
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }
        debounceTimeoutRef.current = setTimeout(() => {
          refreshCart()
        }, 300)
        return true
      } else {
        // Revert optimistic update on error
        await refreshCart()
        console.error('Failed to add to cart:', data.error)
        alert(data.error || 'Failed to add item to cart')
        return false
      }
    } catch (error) {
      // Revert optimistic update on error
      await refreshCart()
      console.error('Error adding to cart:', error)
      alert('Failed to add item to cart')
      return false
    } finally {
      isUpdatingRef.current = false
    }
  }, [sessionId, cartItems, refreshCart])

  const updateCartItem = useCallback(async (cartItemId: string, quantity: number): Promise<boolean> => {
    if (!sessionId) return false
    
    // Optimistic update
    const updatedItems = cartItems.map(item => 
      item.id === cartItemId ? { ...item, quantity } : item
    )
    setCartItems(updatedItems)
    
    try {
      isUpdatingRef.current = true
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
        // Debounced refresh
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }
        debounceTimeoutRef.current = setTimeout(() => {
          refreshCart()
        }, 300)
        return true
      } else {
        // Revert optimistic update on error
        await refreshCart()
        console.error('Failed to update cart:', data.error)
        alert(data.error || 'Failed to update cart')
        return false
      }
    } catch (error) {
      // Revert optimistic update on error
      await refreshCart()
      console.error('Error updating cart:', error)
      alert('Failed to update cart')
      return false
    } finally {
      isUpdatingRef.current = false
    }
  }, [sessionId, cartItems, refreshCart])

  const removeFromCart = useCallback(async (cartItemId: string): Promise<boolean> => {
    if (!sessionId) return false
    
    // Optimistic update
    const updatedItems = cartItems.filter(item => item.id !== cartItemId)
    setCartItems(updatedItems)
    
    try {
      isUpdatingRef.current = true
      const response = await fetch(`/api/cart?cart_item_id=${cartItemId}&session_id=${sessionId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Debounced refresh
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }
        debounceTimeoutRef.current = setTimeout(() => {
          refreshCart()
        }, 300)
        return true
      } else {
        // Revert optimistic update on error
        await refreshCart()
        console.error('Failed to remove from cart:', data.error)
        alert(data.error || 'Failed to remove item from cart')
        return false
      }
    } catch (error) {
      // Revert optimistic update on error
      await refreshCart()
      console.error('Error removing from cart:', error)
      alert('Failed to remove item from cart')
      return false
    } finally {
      isUpdatingRef.current = false
    }
  }, [sessionId, cartItems, refreshCart])

  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  // Memoized calculations to prevent unnecessary re-renders
  const cartCount = useMemo(() => 
    cartItems.reduce((total, item) => total + item.quantity, 0), 
    [cartItems]
  )
  
  const cartTotal = useMemo(() => 
    cartItems.reduce((total, item) => {
      const price = item.products.sale_price || item.products.price
      return total + (price * item.quantity)
    }, 0), 
    [cartItems]
  )

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  const value: CartContextType = useMemo(() => ({
    cartItems,
    cartCount,
    cartTotal,
    isLoading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
  }), [cartItems, cartCount, cartTotal, isLoading, addToCart, updateCartItem, removeFromCart, clearCart, refreshCart])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
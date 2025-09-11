import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// In-memory cart storage (for demo purposes)
// In production, you'd want to use Redis or a proper database
const cartStorage = new Map<string, Array<{
  id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: string
  updated_at: string
}>>()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const cartItems = cartStorage.get(sessionId) || []
    
    // If no cart items, return empty array
    if (cartItems.length === 0) {
      return NextResponse.json({ cartItems: [] })
    }
    
    // Get product details for each cart item
    const itemsWithProducts = await Promise.all(
      cartItems.map(async (item) => {
        try {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, name, price, sale_price, sku, stock_quantity, images')
            .eq('id', item.product_id)
            .single()
          
          if (productError) {
            console.error('Error fetching product:', productError)
            return null
          }
          
          return {
            ...item,
            products: product
          }
        } catch (error) {
          console.error('Error fetching product details:', error)
          return null
        }
      })
    )

    // Filter out any null results
    const validItems = itemsWithProducts.filter(item => item !== null)
    
    return NextResponse.json({ cartItems: validItems })
  } catch (error) {
    console.error('Error fetching cart items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, quantity = 1, session_id } = body

    if (!product_id || !session_id) {
      return NextResponse.json(
        { error: 'Product ID and session ID are required' },
        { status: 400 }
      )
    }

    // Check if product exists and get its details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, price, sale_price, stock_quantity, sku')
      .eq('id', product_id)
      .eq('is_active', true)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found or inactive' },
        { status: 404 }
      )
    }

    // Check stock availability
    if (product.stock_quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    const cartItems = cartStorage.get(session_id) || []
    const existingItemIndex = cartItems.findIndex(item => item.product_id === product_id)

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      const newQuantity = cartItems[existingItemIndex].quantity + quantity
      
      if (product.stock_quantity < newQuantity) {
        return NextResponse.json(
          { error: 'Insufficient stock for requested quantity' },
          { status: 400 }
        )
      }

      cartItems[existingItemIndex].quantity = newQuantity
      cartItems[existingItemIndex].updated_at = new Date().toISOString()

      return NextResponse.json({ 
        message: 'Cart updated successfully',
        cartItem: cartItems[existingItemIndex]
      })
    } else {
      // Add new item to cart
      const newItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        product_id,
        quantity,
        unit_price: product.sale_price || product.price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      cartItems.push(newItem)
      cartStorage.set(session_id, cartItems)

      return NextResponse.json({ 
        message: 'Item added to cart successfully',
        cartItem: newItem
      })
    }
  } catch (error) {
    console.error('Cart POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { cart_item_id, quantity, session_id } = body

    if (!cart_item_id || !session_id || quantity < 0) {
      return NextResponse.json(
        { error: 'Cart item ID, session ID, and valid quantity are required' },
        { status: 400 }
      )
    }

    const cartItems = cartStorage.get(session_id) || []
    const itemIndex = cartItems.findIndex(item => item.id === cart_item_id)

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      )
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      cartItems.splice(itemIndex, 1)
      cartStorage.set(session_id, cartItems)
      return NextResponse.json({ message: 'Item removed from cart' })
    }

    // Get product details to check stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock_quantity, price, sale_price')
      .eq('id', cartItems[itemIndex].product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.stock_quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Update quantity
    cartItems[itemIndex].quantity = quantity
    cartItems[itemIndex].unit_price = product.sale_price || product.price
    cartItems[itemIndex].updated_at = new Date().toISOString()
    cartStorage.set(session_id, cartItems)

    return NextResponse.json({ 
      message: 'Cart updated successfully',
      cartItem: cartItems[itemIndex]
    })
  } catch (error) {
    console.error('Cart PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cartItemId = searchParams.get('cart_item_id')
    const sessionId = searchParams.get('session_id')

    if (!cartItemId || !sessionId) {
      return NextResponse.json(
        { error: 'Cart item ID and session ID are required' },
        { status: 400 }
      )
    }

    const cartItems = cartStorage.get(sessionId) || []
    const filteredItems = cartItems.filter(item => item.id !== cartItemId)
    cartStorage.set(sessionId, filteredItems)

    return NextResponse.json({ message: 'Item removed from cart successfully' })
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
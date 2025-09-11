import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

// GET - Fetch all orders with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('payment_status')
    const search = searchParams.get('search')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        customers(id, first_name, last_name, email),
        order_items(
          id,
          product_name,
          product_sku,
          quantity,
          unit_price,
          total_price,
          products(id, name, images)
        )
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus)
    }
    
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`)
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    
    // Get total count for pagination
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    
    // Get paginated results
    const { data: orders, error } = await query
      .range(offset, offset + limit - 1)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error.message },
        { status: 500 }
      )
    }

    // Fetch districts to calculate shipping costs
    const { data: districts } = await supabase
      .from('districts')
      .select('id, name, delivery_charge')
    
    // Add shipping cost and district info to orders
    const ordersWithShipping = orders?.map(order => {
      const district = districts?.find(d => d.name === order.shipping_district)
      return {
        ...order,
        shipping_cost: district?.delivery_charge || 0,
        districts: district
      }
    }) || []

    return NextResponse.json({
      orders: ordersWithShipping,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdminClient()
    const body = await request.json()
    
    const {
      customer_email,
      customer_name,
      customer_phone,
      shipping_address,
      items,
      payment_method,
      notes
    } = body
    
    // Validate required fields for guest checkout
    if (!customer_name || !customer_phone || !shipping_address || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, customer_phone, shipping_address, and items are required' },
        { status: 400 }
      )
    }
    
    // Validate shipping address required fields
    if (!shipping_address.line_1 || !shipping_address.city || !shipping_address.district) {
      return NextResponse.json(
        { error: 'Missing required shipping address fields: line_1, city, and district are required' },
        { status: 400 }
      )
    }
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    // Get shipping cost from district
    const { data: district, error: districtError } = await supabase
      .from('districts')
      .select('id, name, delivery_charge')
      .eq('name', shipping_address.district)
      .single()
    
    if (districtError || !district) {
      return NextResponse.json(
        { error: `District not found: ${shipping_address.district}` },
        { status: 400 }
      )
    }
    
    const shippingCost = district.delivery_charge
    
    // Calculate totals
    let subtotal = 0
    const validatedItems = []
    
    for (const item of items) {
      // Validate product exists and get current price
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, sku, price, sale_price, stock_quantity')
        .eq('id', item.product_id)
        .single()
      
      if (productError || !product) {
        return NextResponse.json(
          { error: `Product not found: ${item.product_id}` },
          { status: 400 }
        )
      }
      
      // Check stock
      if (product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        )
      }
      
      const unitPrice = product.sale_price || product.price
      const totalPrice = unitPrice * item.quantity
      subtotal += totalPrice
      
      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice
      })
    }
    
    const totalAmount = subtotal + shippingCost
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_email,
        customer_name,
        customer_phone,
        shipping_address_line_1: shipping_address.line_1,
        shipping_address_line_2: shipping_address.line_2,
        shipping_city: shipping_address.city,
        shipping_district: shipping_address.district,
        shipping_country: shipping_address.country || 'Bangladesh',
        total_amount: totalAmount,
        shipping_cost: shippingCost,
        payment_method,
        notes
      })
      .select()
      .single()
    
    if (orderError) {
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError.message },
        { status: 500 }
      )
    }
    
    // Create order items
    const orderItemsWithOrderId = validatedItems.map(item => ({
      ...item,
      order_id: order.id
    }))
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId)
    
    if (itemsError) {
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: 'Failed to create order items', details: itemsError.message },
        { status: 500 }
      )
    }
    
    // Update product stock
    for (const item of validatedItems) {
      const { data: currentProduct } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single()
      
      if (currentProduct) {
        await supabase
          .from('products')
          .update({ 
            stock_quantity: currentProduct.stock_quantity - item.quantity
          })
          .eq('id', item.product_id)
      }
    }
    
    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update order status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdminClient()
    const body = await request.json()
    
    const { id, status, payment_status, notes } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    const updateData: any = {}
    
    if (status) updateData.status = status
    if (payment_status) updateData.payment_status = payment_status
    if (notes !== undefined) updateData.notes = notes
    
    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to update order', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
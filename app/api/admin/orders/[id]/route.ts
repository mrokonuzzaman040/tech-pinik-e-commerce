import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

// GET - Fetch a specific order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseAdminClient()
    const { id } = await params
    
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(id, first_name, last_name, email, phone),
        order_items(
          id,
          product_name,
          product_sku,
          quantity,
          unit_price,
          total_price,
          products(id, name, images, sku)
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch order', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update a specific order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseAdminClient()
    const { id } = await params
    const body = await request.json()
    
    const {
      status,
      payment_status,
      notes,
      shipping_address,
      customer_name,
      customer_phone
    } = body
    
    // Build update object
    const updateData: any = {}
    
    if (status) updateData.status = status
    if (payment_status) updateData.payment_status = payment_status
    if (notes !== undefined) updateData.notes = notes
    if (customer_name) updateData.customer_name = customer_name
    if (customer_phone) updateData.customer_phone = customer_phone
    
    if (shipping_address) {
      updateData.shipping_address_line_1 = shipping_address.line_1
      updateData.shipping_address_line_2 = shipping_address.line_2
      updateData.shipping_city = shipping_address.city
      updateData.shipping_district = shipping_address.district
      updateData.shipping_country = shipping_address.country
    }
    
    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        customers(id, first_name, last_name, email, phone),
        order_items(
          id,
          product_name,
          product_sku,
          quantity,
          unit_price,
          total_price,
          products(id, name, images, sku)
        )
      `)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
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

// DELETE - Delete a specific order (soft delete by updating status)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseAdminClient()
    const { id } = await params
    
    // Check if order exists and get current status
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch order', details: fetchError.message },
        { status: 500 }
      )
    }
    
    // Only allow deletion of pending or cancelled orders
    if (!['pending', 'cancelled'].includes(existingOrder.status)) {
      return NextResponse.json(
        { error: 'Cannot delete order with current status' },
        { status: 400 }
      )
    }
    
    // Soft delete by updating status to cancelled
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to cancel order', details: error.message },
        { status: 500 }
      )
    }
    
    // Restore product stock for cancelled orders
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', id)
    
    if (orderItems) {
      for (const item of orderItems) {
        const { data: currentProduct } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single()
        
        if (currentProduct) {
          await supabase
            .from('products')
            .update({ 
              stock_quantity: currentProduct.stock_quantity + item.quantity
            })
            .eq('id', item.product_id)
        }
      }
    }
    
    return NextResponse.json({ 
      message: 'Order cancelled successfully',
      order 
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
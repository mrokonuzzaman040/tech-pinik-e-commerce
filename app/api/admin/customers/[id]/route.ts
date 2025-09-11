import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { Database } from '@/lib/supabase'

type Customer = Database['public']['Tables']['customers']['Row']
type CustomerUpdate = Database['public']['Tables']['customers']['Update']

// GET - Fetch a specific customer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseAdminClient()
    const { id } = await params
    
    const { data: customer, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders!inner(
          id,
          order_number,
          total_amount,
          status,
          payment_status,
          created_at
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching customer:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customer' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error in GET /api/admin/customers/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update a customer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseAdminClient()
    const { id } = await params
    const body = await request.json()
    
    // Extract updatable fields
    const {
      email,
      first_name,
      last_name,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      is_active
    } = body
    
    // Check if customer exists
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id, email')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // If email is being updated, check for duplicates
    if (email && email !== existingCustomer.email) {
      const { data: emailExists } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single()
      
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists for another customer' },
          { status: 409 }
        )
      }
    }
    
    const updateData: CustomerUpdate = {}
    
    // Only include fields that are provided
    if (email !== undefined) updateData.email = email
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (phone !== undefined) updateData.phone = phone
    if (address_line_1 !== undefined) updateData.address_line_1 = address_line_1
    if (address_line_2 !== undefined) updateData.address_line_2 = address_line_2
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (postal_code !== undefined) updateData.postal_code = postal_code
    if (country !== undefined) updateData.country = country
    if (is_active !== undefined) updateData.is_active = is_active
    
    const { data: customer, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating customer:', error)
      return NextResponse.json(
        { error: 'Failed to update customer' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error in PATCH /api/admin/customers/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete a customer (deactivate)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseAdminClient()
    const { id } = await params
    
    // Check if customer exists
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Check if customer has any orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', id)
      .limit(1)
    
    if (ordersError) {
      console.error('Error checking customer orders:', ordersError)
      return NextResponse.json(
        { error: 'Failed to check customer orders' },
        { status: 500 }
      )
    }
    
    if (orders && orders.length > 0) {
      // If customer has orders, just deactivate instead of deleting
      const { data: customer, error } = await supabase
        .from('customers')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error deactivating customer:', error)
        return NextResponse.json(
          { error: 'Failed to deactivate customer' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ 
        message: 'Customer deactivated successfully (has existing orders)',
        customer 
      })
    } else {
      // If no orders, we can safely delete the customer
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting customer:', error)
        return NextResponse.json(
          { error: 'Failed to delete customer' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ 
        message: 'Customer deleted successfully' 
      })
    }
  } catch (error) {
    console.error('Error in DELETE /api/admin/customers/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
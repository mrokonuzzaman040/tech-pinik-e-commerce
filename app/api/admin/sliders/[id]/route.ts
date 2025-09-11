import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

// GET - Fetch a specific slider by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseAdminClient()
    
    const { data: slider, error } = await supabase
      .from('sliders')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Slider not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch slider' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ slider })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseAdminClient()
    const body = await request.json()
    
    const { title, subtitle, image_url, link_url, button_text, order_index, is_active } = body
    
    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Slider title is required' },
        { status: 400 }
      )
    }

    if (!image_url?.trim()) {
      return NextResponse.json(
        { error: 'Slider image is required' },
        { status: 400 }
      )
    }
    
    const { data: slider, error } = await supabase
      .from('sliders')
      .update({
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        image_url: image_url.trim(),
        link_url: link_url?.trim() || null,
        button_text: button_text?.trim() || 'Shop Now',
        order_index: order_index || 0,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update slider' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ slider })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseAdminClient()
    
    const { error } = await supabase
      .from('sliders')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete slider' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

// GET - Fetch all sliders
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('sliders')
      .select('*')
      .order('order_index', { ascending: true })
    
    // Apply status filter if provided
    if (status) {
      if (status === 'active') {
        query = query.eq('is_active', true)
      } else if (status === 'inactive') {
        query = query.eq('is_active', false)
      }
    }
    
    // Get total count for pagination
    const { count } = await supabase
      .from('sliders')
      .select('*', { count: 'exact', head: true })
    
    // Get paginated results
    const { data: sliders, error } = await query
      .range(offset, offset + limit - 1)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch sliders', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      sliders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching sliders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new slider
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdminClient()
    const body = await request.json()
    
    const {
      title,
      subtitle,
      description,
      image_url,
      mobile_image_url,
      button_text,
      button_url,
      status = 'active',
      sort_order = 0,
      text_position = 'center',
      text_color = '#ffffff',
      overlay_opacity = 0.3
    } = body
    
    // Validation
    if (!title || !image_url) {
      return NextResponse.json(
        { error: 'Title and image URL are required' },
        { status: 400 }
      )
    }
    
    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "active" or "inactive"' },
        { status: 400 }
      )
    }
    
    // Validate text position
    if (!['left', 'center', 'right'].includes(text_position)) {
      return NextResponse.json(
        { error: 'Text position must be "left", "center", or "right"' },
        { status: 400 }
      )
    }
    
    // Validate overlay opacity
    if (overlay_opacity < 0 || overlay_opacity > 1) {
      return NextResponse.json(
        { error: 'Overlay opacity must be between 0 and 1' },
        { status: 400 }
      )
    }
    
    // If no sort_order provided, get the next available order
    if (sort_order === 0) {
      const { data: lastSlider } = await supabase
        .from('sliders')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()
      
      const nextOrder = lastSlider ? lastSlider.sort_order + 1 : 1
      
      // Create slider
      const { data: slider, error } = await supabase
        .from('sliders')
        .insert({
          title,
          subtitle,
          description,
          image_url,
          mobile_image_url,
          button_text,
          button_url,
          status,
          sort_order: nextOrder,
          text_position,
          text_color,
          overlay_opacity: parseFloat(overlay_opacity.toString())
        })
        .select('*')
        .single()
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to create slider', details: error.message },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ slider }, { status: 201 })
    } else {
      // Check if sort_order already exists
      const { data: existingSlider } = await supabase
        .from('sliders')
        .select('id')
        .eq('sort_order', sort_order)
        .single()
      
      if (existingSlider) {
        return NextResponse.json(
          { error: 'A slider with this sort order already exists' },
          { status: 400 }
        )
      }
      
      // Create slider with specified sort_order
      const { data: slider, error } = await supabase
        .from('sliders')
        .insert({
          title,
          subtitle,
          description,
          image_url,
          mobile_image_url,
          button_text,
          button_url,
          status,
          sort_order: parseInt(sort_order.toString()),
          text_position,
          text_color,
          overlay_opacity: parseFloat(overlay_opacity.toString())
        })
        .select('*')
        .single()
      
      if (error) {
        return NextResponse.json(
          { error: 'Failed to create slider', details: error.message },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ slider }, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating slider:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update a slider
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdminClient()
    const body = await request.json()
    
    const {
      id,
      title,
      subtitle,
      description,
      image_url,
      mobile_image_url,
      button_text,
      button_url,
      status,
      sort_order,
      text_position,
      text_color,
      overlay_opacity
    } = body
    
    // Validation
    if (!id) {
      return NextResponse.json(
        { error: 'Slider ID is required' },
        { status: 400 }
      )
    }
    
    // Check if slider exists
    const { data: existingSlider, error: fetchError } = await supabase
      .from('sliders')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingSlider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      )
    }
    
    // Validate status if provided
    if (status && !['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "active" or "inactive"' },
        { status: 400 }
      )
    }
    
    // Validate text position if provided
    if (text_position && !['left', 'center', 'right'].includes(text_position)) {
      return NextResponse.json(
        { error: 'Text position must be "left", "center", or "right"' },
        { status: 400 }
      )
    }
    
    // Validate overlay opacity if provided
    if (overlay_opacity !== undefined && (overlay_opacity < 0 || overlay_opacity > 1)) {
      return NextResponse.json(
        { error: 'Overlay opacity must be between 0 and 1' },
        { status: 400 }
      )
    }
    
    // Check if sort_order conflicts with another slider
    if (sort_order !== undefined && sort_order !== existingSlider.sort_order) {
      const { data: conflictSlider } = await supabase
        .from('sliders')
        .select('id')
        .eq('sort_order', sort_order)
        .neq('id', id)
        .single()
      
      if (conflictSlider) {
        return NextResponse.json(
          { error: 'A slider with this sort order already exists' },
          { status: 400 }
        )
      }
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (title !== undefined) updateData.title = title
    if (subtitle !== undefined) updateData.subtitle = subtitle
    if (description !== undefined) updateData.description = description
    if (image_url !== undefined) updateData.image_url = image_url
    if (mobile_image_url !== undefined) updateData.mobile_image_url = mobile_image_url
    if (button_text !== undefined) updateData.button_text = button_text
    if (button_url !== undefined) updateData.button_url = button_url
    if (status !== undefined) updateData.status = status
    if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order.toString())
    if (text_position !== undefined) updateData.text_position = text_position
    if (text_color !== undefined) updateData.text_color = text_color
    if (overlay_opacity !== undefined) updateData.overlay_opacity = parseFloat(overlay_opacity.toString())
    
    // Update slider
    const { data: slider, error } = await supabase
      .from('sliders')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to update slider', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ slider })
  } catch (error) {
    console.error('Error updating slider:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a slider
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Slider ID is required' },
        { status: 400 }
      )
    }
    
    // Check if slider exists
    const { data: existingSlider, error: fetchError } = await supabase
      .from('sliders')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingSlider) {
      return NextResponse.json(
        { error: 'Slider not found' },
        { status: 404 }
      )
    }
    
    // Delete slider
    const { error } = await supabase
      .from('sliders')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete slider', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { message: 'Slider deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting slider:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
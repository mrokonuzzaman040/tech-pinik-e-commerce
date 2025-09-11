import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

// GET - Fetch all active categories for public use
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    
    const supabase = createSupabaseClient()
    
    let query = supabase
      .from('categories')
      .select('id, name, slug, image_url, banner_image_url, description')
      .eq('is_active', true)
    
    // If slug is provided, filter by slug
    if (slug) {
      query = query.eq('slug', slug)
    } else {
      query = query.order('name', { ascending: true })
    }
    
    const { data: categories, error } = await query
    
    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }
    
    // Return categories directly when filtering by slug, otherwise wrap in object
    if (slug) {
      return NextResponse.json(categories || [])
    } else {
      return NextResponse.json({ categories: categories || [] })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
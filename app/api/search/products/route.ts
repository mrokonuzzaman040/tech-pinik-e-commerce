import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

// GET - Search products publicly
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    
    // If no query and no category, return empty results
    if (!query.trim() && !category) {
      // console.log('Empty query and no category, returning empty results')
      return NextResponse.json(
        { products: [], total: 0, query: '' },
        { status: 200 }
      )
    }
    
    let searchQuery = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        sale_price,
        sku,
        images,
        stock_quantity,
        category_id,
        created_at,
        categories!inner(id, name, slug)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(limit)
    
    // Add text search filter if query is provided
    if (query.trim()) {
      searchQuery = searchQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%`)
    }
    
    // Filter by category if provided
    if (category) {
      searchQuery = searchQuery.eq('category_id', category)
    }
    
    const { data: products, error } = await searchQuery
    
    if (error) {
      console.error('Search database error:', error)
      return NextResponse.json(
        { error: 'Failed to search products', details: error.message },
        { status: 500 }
      )
    }
    
    // console.log(`Found ${products?.length || 0} products for query "${query}"`)
    
    return NextResponse.json({
      products: products || [],
      total: products?.length || 0,
      query
    })
    
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
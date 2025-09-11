import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

// GET - Fetch all products with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('products')
      .select(`
        *,
        categories!inner(id, name, slug)
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (category) {
      query = query.eq('category_id', category)
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    if (status) {
      if (status === 'active') {
        query = query.eq('is_active', true)
      } else if (status === 'inactive') {
        query = query.eq('is_active', false)
      }
    }
    
    // Get total count for pagination
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    // Get paginated results
    const { data: products, error } = await query
      .range(offset, offset + limit - 1)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch products', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdminClient()
    const body = await request.json()

    
    const {
      name,
      description,
      price,
      sale_price,
      category_id,
      images,
      status = 'draft',
      is_active = true,
      is_featured = false,
      stock_quantity = 0,
      sku,
      weight,
      dimensions,
      warranty, // Restored - schema cache issue resolved
      brand, // Restored - schema cache issue resolved
      origin, // Restored - schema cache issue resolved
      availability_status = 'In Stock', // Restored - schema cache issue resolved
      meta_title,
      meta_description,
      tags,
      key_features, // Restored - schema cache issue resolved
      box_contents // Restored - schema cache issue resolved
    } = body
    
    // Validation
    if (!name || !description || !price || !category_id) {
      return NextResponse.json(
        { error: 'Name, description, price, and category are required' },
        { status: 400 }
      )
    }
    
    if (price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      )
    }
    
    // Check if category exists
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .single()
    
    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      )
    }
    
    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    // Generate SKU if not provided
    const finalSku = sku || name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-6)
    
    // Check if slug is unique
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single()
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this name already exists' },
        { status: 400 }
      )
    }
    
    // Create product
    let product
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name,
          // slug, // Not in schema
          description,
          price: parseFloat(price),
          sale_price: sale_price ? parseFloat(sale_price) : null,
          category_id,
          images: images || [],
          is_active,
          is_featured,
          stock_quantity: parseInt(stock_quantity),
          sku: finalSku,
          weight: weight ? parseFloat(weight) : null,
          dimensions,
          warranty, // Restored - schema cache issue resolved
          brand, // Restored - schema cache issue resolved
          origin, // Restored - schema cache issue resolved
          availability_status, // Restored - schema cache issue resolved
          // meta_title: meta_title || name, // Not in schema
          // meta_description: meta_description || description.substring(0, 160), // Not in schema
          // tags: tags || [] // Not in schema
          key_features: key_features || [], // Restored - schema cache issue resolved
          box_contents: box_contents || [] // Restored - schema cache issue resolved
        })
        .select(`
          *,
          categories(id, name, slug)
        `)
        .single()
      
      if (error) {
        console.error('Supabase error creating product:', error)
        return NextResponse.json(
          { error: 'Failed to create product', details: error.message },
          { status: 500 }
        )
      }
      
      product = data
    } catch (err) {
      console.error('Unexpected error creating product:', err)
      return NextResponse.json(
        { error: 'Failed to create product', details: err instanceof Error ? err.message : 'Unknown error' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update a product
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdminClient()
    const body = await request.json()
    
    const {
      id,
      name,
      description,
      price,
      sale_price,
      category_id,
      images,
      status,
      featured,
      inventory_quantity,
      sku,
      weight,
      dimensions,
      meta_title,
      meta_description,
      tags,
      key_features,
      box_contents
    } = body
    
    // Validation
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    if (price && price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      )
    }
    
    // Check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Check if category exists (if provided)
    if (category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', category_id)
        .single()
      
      if (categoryError || !category) {
        return NextResponse.json(
          { error: 'Invalid category ID' },
          { status: 400 }
        )
      }
    }
    
    // Generate new slug if name is being updated
    let slug = existingProduct.slug
    if (name && name !== existingProduct.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      // Check if new slug is unique
      const { data: slugCheck } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single()
      
      if (slugCheck) {
        return NextResponse.json(
          { error: 'A product with this name already exists' },
          { status: 400 }
        )
      }
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (name !== undefined) {
      updateData.name = name
      updateData.slug = slug
    }
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (sale_price !== undefined) updateData.sale_price = sale_price ? parseFloat(sale_price) : null
    if (category_id !== undefined) updateData.category_id = category_id
    if (images !== undefined) updateData.images = images
    if (status !== undefined) updateData.status = status
    if (featured !== undefined) updateData.featured = featured
    if (inventory_quantity !== undefined) updateData.inventory_quantity = parseInt(inventory_quantity)
    if (sku !== undefined) updateData.sku = sku
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null
    if (dimensions !== undefined) updateData.dimensions = dimensions
    if (meta_title !== undefined) updateData.meta_title = meta_title
    if (meta_description !== undefined) updateData.meta_description = meta_description
    if (tags !== undefined) updateData.tags = tags
    if (key_features !== undefined) updateData.key_features = key_features
    if (box_contents !== undefined) updateData.box_contents = box_contents
    
    // Update product
    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        categories(id, name, slug)
      `)
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to update product', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a product
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    // Check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Delete product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete product', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
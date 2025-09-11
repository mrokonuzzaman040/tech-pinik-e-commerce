import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

// GET - Fetch dashboard statistics and overview data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdminClient()
    const { searchParams } = new URL(request.url)
    
    const period = searchParams.get('period') || '30' // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))
    
    // Get total counts
    const [categoriesResult, productsResult, slidersResult] = await Promise.all([
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('sliders').select('*', { count: 'exact', head: true })
    ])
    
    // Get product statistics by status
    const { data: productsByStatus, error: productStatusError } = await supabase
      .from('products')
      .select('is_active')
    
    if (productStatusError) {
      console.error('Error fetching products by status:', productStatusError)
    }
    
    const productStatusCounts = productsByStatus?.reduce((acc: any, product: any) => {
      const status = product.is_active ? 'active' : 'inactive'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, { active: 0, inactive: 0 }) || { active: 0, inactive: 0 }
    
    // Get category statistics with product counts
    const { data: categoriesWithProducts, error: categoryStatsError } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug
      `)
    
    if (categoryStatsError) {
      console.error('Error fetching category statistics:', categoryStatsError)
    }
    
    // Get recent products (last 10)
    const { data: recentProducts, error: recentProductsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        price,
        stock_quantity,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (recentProductsError) {
      console.error('Error fetching recent products:', recentProductsError)
    }
    
    // Get products created in the specified period
    const { data: recentProductsCount, error: recentCountError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
    
    if (recentCountError) {
      console.error('Error fetching recent products count:', recentCountError)
    }
    
    // Get categories created in the specified period
    const { data: recentCategoriesCount, error: recentCatCountError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
    
    if (recentCatCountError) {
      console.error('Error fetching recent categories count:', recentCatCountError)
    }
    
    // Get inventory statistics
    const { data: inventoryStats, error: inventoryError } = await supabase
      .from('products')
      .select('stock_quantity')
    
    if (inventoryError) {
      console.error('Error fetching inventory statistics:', inventoryError)
    }
    
    const inventoryData = inventoryStats?.reduce((acc: any, product: any) => {
      const quantity = product.stock_quantity || 0
      acc.totalStock += quantity
      if (quantity === 0) {
        acc.outOfStockCount += 1
      } else if (quantity < 10) {
        acc.lowStockCount += 1
      }
      return acc
    }, { totalStock: 0, lowStockCount: 0, outOfStockCount: 0 }) || { totalStock: 0, lowStockCount: 0, outOfStockCount: 0 }
    
    // Get price statistics
    const { data: priceStats, error: priceError } = await supabase
      .from('products')
      .select('price')
      .eq('is_active', true)
    
    if (priceError) {
      console.error('Error fetching price statistics:', priceError)
    }
    
    const priceData = priceStats?.reduce((acc: any, product: any) => {
      const price = product.price || 0
      acc.total += price
      acc.count += 1
      if (price > acc.highest) acc.highest = price
      if (price < acc.lowest || acc.lowest === 0) acc.lowest = price
      return acc
    }, { total: 0, count: 0, highest: 0, lowest: 0 }) || { total: 0, count: 0, highest: 0, lowest: 0 }
    
    const averagePrice = priceData.count > 0 ? priceData.total / priceData.count : 0
    
    // Get slider statistics
    const { data: sliderStats, error: sliderStatsError } = await supabase
      .from('sliders')
      .select('is_active')
    
    if (sliderStatsError) {
      console.error('Error fetching slider statistics:', sliderStatsError)
    }
    
    const sliderStatusCounts = sliderStats?.reduce((acc: any, slider: any) => {
      const status = slider.is_active ? 'active' : 'inactive'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, { active: 0, inactive: 0 }) || { active: 0, inactive: 0 }
    
    // Prepare response data
    const dashboardData = {
      overview: {
        totalCategories: categoriesResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalSliders: slidersResult.count || 0,
        recentProductsCount: recentProductsCount || 0,
        recentCategoriesCount: recentCategoriesCount || 0
      },
      products: {
        byStatus: {
          active: productStatusCounts.active || 0,
          inactive: productStatusCounts.inactive || 0,
          featured: productStatusCounts.featured || 0
        },
        inventory: {
          totalStock: inventoryData.totalStock,
          lowStockCount: inventoryData.lowStockCount,
          outOfStockCount: inventoryData.outOfStockCount
        },
        pricing: {
          averagePrice: Math.round(averagePrice * 100) / 100,
          highestPrice: priceData.highest,
          lowestPrice: priceData.lowest
        },
        recent: recentProducts || []
      },
      categories: {
        withProductCounts: categoriesWithProducts?.map((category: any) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          productCount: 0
        })) || []
      },
      sliders: {
        byStatus: {
          active: sliderStatusCounts.active || 0,
          inactive: sliderStatusCounts.inactive || 0
        }
      },
      period: {
        days: parseInt(period),
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    }
    
    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
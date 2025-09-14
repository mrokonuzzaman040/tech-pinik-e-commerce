import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import ProductsByCategoryClient from '@/components/products-by-category-client'
import { HeroImage } from '@/components/ui/optimized-image'

interface Product {
  id: string
  name: string
  price: number
  sale_price?: number | null
  images?: string[]
  stock_quantity: number
  sku: string
  categories: {
    id: string
    name: string
    slug: string
  }[]
}

interface Category {
  id: string
  name: string
  slug: string
  image_url?: string
  banner_image_url?: string
  description?: string
}

interface CategoryWithProducts {
  category: Category
  products: Product[]
}

async function getCategoriesWithProducts(): Promise<CategoryWithProducts[]> {
  const supabase = await createSupabaseServerClient()
  
  try {
    // Fetch categories and products in parallel for better performance
    const [categoriesResult, productsResult] = await Promise.all([
      // Fetch all active categories
      supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name'),
      
      // Fetch all active products with their categories in a single query
      supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          sale_price,
          images,
          stock_quantity,
          sku,
          category_id,
          created_at,
          categories!inner(
            id,
            name,
            slug
          )
        `)
        .eq('is_active', true)
        .eq('categories.is_active', true)
        .order('created_at', { ascending: false })
    ])

    const { data: categories, error: categoriesError } = categoriesResult
    const { data: allProducts, error: productsError } = productsResult

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      return []
    }

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return []
    }

    if (!categories || categories.length === 0) {
      return []
    }

    // Group products by category and limit to 4 per category
    const productsByCategory = new Map<string, Product[]>()
    
    // Transform and group products
    allProducts?.forEach((product: any) => {
      const categoryId = product.category_id
      const transformedProduct: Product = {
        ...product,
        categories: Array.isArray(product.categories) ? product.categories : [product.categories]
      }
      
      if (!productsByCategory.has(categoryId)) {
        productsByCategory.set(categoryId, [])
      }
      
      const categoryProducts = productsByCategory.get(categoryId)!
      if (categoryProducts.length < 4) {
        categoryProducts.push(transformedProduct)
      }
    })

    // Build final result with categories that have products
    const categoriesWithProductsData: CategoryWithProducts[] = categories
      .map((category: Category) => ({
        category,
        products: productsByCategory.get(category.id) || []
      }))
      .filter(item => item.products.length > 0)

    return categoriesWithProductsData
  } catch (error) {
    console.error('Error in getCategoriesWithProducts:', error)
    return []
  }
}

export default async function ProductsByCategory() {
  const categoriesWithProducts = await getCategoriesWithProducts()

  if (categoriesWithProducts.length === 0) {
    return (
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          <p className="text-muted-foreground">No products found in any category.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="container mx-auto px-4 py-16">
      {categoriesWithProducts.map(({ category, products }) => (
        <div key={category.id} className="mb-16">
          {/* Category Banner */}
          {category.banner_image_url && (
            <div className="mb-8">
              <div className="rounded-lg overflow-hidden mb-4">
                <HeroImage
                  src={category.banner_image_url}
                  alt={`${category.name} banner`}
                  fill
                  className="w-full h-48 md:h-64 lg:h-72 object-cover"
                />
              </div>
            </div>
          )}

          {/* Category Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">{category.name}</h3>
              {category.description && (
                <p className="text-muted-foreground">{category.description}</p>
              )}
            </div>
            <Link href={`/categories/${category.slug}`}>
              <Button variant="outline" className="flex items-center gap-2">
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mb-2">
            <hr className="border-t border-border" />
          </div>

          {/* Products Grid - Client Component */}
          <ProductsByCategoryClient products={products} />
        </div>
      ))}
    </section>
  )
}
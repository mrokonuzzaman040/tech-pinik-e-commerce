'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight, ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useRouter } from 'next/navigation'

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
  }
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

export default function ProductsByCategory() {
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<CategoryWithProducts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addToCart, isLoading } = useCart()
  const router = useRouter()

  useEffect(() => {
    fetchCategoriesWithProducts()
  }, [])

  const fetchCategoriesWithProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      // First, fetch all categories
      const categoriesResponse = await fetch('/api/categories')
      if (!categoriesResponse.ok) {
        throw new Error('Failed to fetch categories')
      }
      const categoriesData = await categoriesResponse.json()
      const categories = categoriesData.categories || []

      // Then, fetch 4 products for each category
      const categoriesWithProductsData = await Promise.all(
        categories.map(async (category: Category) => {
          try {
            const productsResponse = await fetch(
              `/api/search/products?category=${encodeURIComponent(category.id)}&limit=4`
            )
            if (!productsResponse.ok) {
              console.error(`Failed to fetch products for category ${category.name}`)
              return { category, products: [] }
            }
            const productsData = await productsResponse.json()
            return {
              category,
              products: productsData.products || []
            }
          } catch (err) {
            console.error(`Error fetching products for category ${category.name}:`, err)
            return { category, products: [] }
          }
        })
      )

      // Filter out categories with no products
      const filteredCategories = categoriesWithProductsData.filter(
        (item) => item.products.length > 0
      )

      setCategoriesWithProducts(filteredCategories)
      
      // Debug log to check banner images
      console.log('Categories with products loaded:', filteredCategories.map(item => ({
        categoryName: item.category.name,
        hasBannerImage: !!item.category.banner_image_url,
        bannerImageUrl: item.category.banner_image_url,
        productCount: item.products.length
      })))
    } catch (err) {
      console.error('Error fetching categories with products:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number, salePrice?: number | null) => {
    if (salePrice && salePrice < price) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">৳{salePrice.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground line-through">৳{price.toLocaleString()}</span>
        </div>
      )
    }
    return <span className="text-lg font-bold text-primary">৳{price.toLocaleString()}</span>
  }

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-16">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
          {[...Array(3)].map((_, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <div className="h-6 bg-gray-300 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, productIndex) => (
                  <div key={productIndex} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="h-48 bg-gray-300 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <Button onClick={fetchCategoriesWithProducts}>Try Again</Button>
        </div>
      </section>
    )
  }

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
                <img
                  src={category.banner_image_url}
                  alt={`${category.name} banner`}
                  className="w-full h-48 md:h-64 lg:h-72 object-cover"
                  onLoad={() => console.log(`Banner image loaded for ${category.name}:`, category.banner_image_url)}
                  onError={(e) => console.error(`Banner image failed to load for ${category.name}:`, category.banner_image_url, e)}
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

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {products.map((product) => (
              <div key={product.id} className="group">
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-200 hover:border-primary/30 bg-white cursor-pointer transform hover:-translate-y-2 rounded-xl sm:rounded-2xl h-full">
                  <Link href={`/products/${product.sku}`}>
                    <div className="aspect-square relative overflow-hidden rounded-t-2xl">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
                          <div className="text-gray-300 text-center">
                            <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
                              📦
                            </div>
                            <span className="text-xs">No Image</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Enhanced Badges */}
                      {product.stock_quantity === 0 && (
                        <Badge className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-full shadow-lg text-xs">
                          Out of Stock
                        </Badge>
                      )}
                      {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                        <Badge className="absolute top-3 right-3 bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded-full shadow-lg text-xs">
                          Low Stock
                        </Badge>
                      )}
                      {product.sale_price && product.sale_price < product.price && (
                        <Badge className="absolute top-3 left-3 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-full shadow-lg text-xs">
                          Sale
                        </Badge>
                      )}
                      
                      {/* Quick View Overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button variant="secondary" className="bg-white/90 hover:bg-white text-black rounded-full px-4 py-2 text-xs">
                          Quick View
                        </Button>
                      </div>
                    </div>
                  </Link>
                  
                  <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 flex flex-col">
                    <Link href={`/products/${product.sku}`}>
                      <h4 className="font-bold text-xs sm:text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight">
                        {product.name}
                      </h4>
                    </Link>
                    
                    {/* Price */}
                    <div className="flex flex-col">
                      <span className="text-sm sm:text-lg font-bold text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text">
                        {product.sale_price && product.sale_price < product.price ? (
                          <>৳{product.sale_price.toLocaleString()}</>
                        ) : (
                          <>৳{product.price.toLocaleString()}</>
                        )}
                      </span>
                      {product.sale_price && product.sale_price < product.price && (
                        <span className="text-xs text-gray-500 line-through">৳{product.price.toLocaleString()}</span>
                      )}
                    </div>
                    
                    {/* Stock Status */}
                     <div className="flex items-center gap-1 sm:gap-2">
                       <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                         product.stock_quantity > 10 ? 'bg-green-500' : 
                         product.stock_quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
                       }`}></div>
                       <span className="text-xs text-gray-500">
                         {product.stock_quantity > 0 ? (
                           `${product.stock_quantity} in stock`
                         ) : (
                           'Out of Stock'
                         )}
                       </span>
                     </div>
                     
                     {/* Action Buttons */}
                     <div className="flex gap-1 sm:gap-2 mt-auto pt-2 sm:pt-3">
                       <Button 
                         size="sm"
                         className="flex-1 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 hover:shadow-lg text-xs" 
                         disabled={isLoading || product.stock_quantity === 0}
                         variant={product.stock_quantity === 0 ? "secondary" : "default"}
                         onClick={async (e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           if (product.stock_quantity > 0) {
                             const success = await addToCart(product.id, 1);
                             if (success) {
                               console.log('Item added to cart successfully');
                             }
                           }
                         }}
                       >
                         <ShoppingCart className="h-3 w-3 mr-1" />
                         {isLoading ? 'Adding...' : (product.stock_quantity === 0 ? 'Out' : 'Add')}
                       </Button>
                       
                       <Button 
                         size="sm"
                         className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-300 hover:shadow-lg text-xs" 
                         disabled={product.stock_quantity === 0}
                         onClick={async (e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           if (product.stock_quantity > 0) {
                             const success = await addToCart(product.id, 1);
                             if (success) {
                               router.push('/cart');
                             }
                           }
                         }}
                       >
                         {product.stock_quantity === 0 ? 'Unavailable' : 'Buy'}
                       </Button>
                     </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
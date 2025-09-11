'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/navbar';
import { ArrowLeft, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price: number;
  images?: string[];
  description?: string;
  category_id: string;
  stock_quantity: number;
  sku: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, isLoading: cartLoading } = useCart();
  const router = useRouter();

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch category by slug
        const categoryResponse = await fetch(`/api/categories?slug=${encodeURIComponent(slug)}`);
        if (!categoryResponse.ok) {
          throw new Error('Failed to fetch category');
        }
        const categoryData = await categoryResponse.json();
        
        if (!categoryData || categoryData.length === 0) {
          throw new Error('Category not found');
        }
        
        const categoryInfo = categoryData[0];
        setCategory(categoryInfo);

        // Fetch products for this category
        const productsResponse = await fetch(`/api/search/products?category=${encodeURIComponent(categoryInfo.id)}`);
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        const productsData = await productsResponse.json();
        setProducts(productsData.products || []);
      } catch (err) {
        console.error('Error fetching category data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchCategoryAndProducts();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-6 w-6 bg-gray-300 rounded"></div>
              <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            </div>
            <div className="h-4 bg-gray-300 rounded w-2/3 mb-8"></div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-300 aspect-square rounded-xl sm:rounded-lg mb-2 sm:mb-4"></div>
                  <div className="h-3 sm:h-4 bg-gray-300 rounded mb-1 sm:mb-2"></div>
                  <div className="h-3 sm:h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8">
              <h1 className="text-2xl font-bold text-red-800 mb-4">Category Not Found</h1>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link href="/" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/categories">Browse Categories</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-foreground transition-colors">
            Categories
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">
            {category?.name || 'Category'}
          </span>
        </nav>

        {/* Category Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/" className="flex items-center gap-1 sm:gap-2">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Back</span>
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2 sm:mb-3">
            {category?.name || 'Category'}
          </h1>
          {category?.description && (
            <p className="text-sm sm:text-lg text-muted-foreground max-w-3xl">
              {category.description}
            </p>
          )}
          <div className="flex items-center gap-2 sm:gap-4 mt-3 sm:mt-4">
            <Badge variant="secondary" className="text-xs sm:text-sm">
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </Badge>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-muted/50 rounded-xl p-12 max-w-md mx-auto">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                No products found
              </h2>
              <p className="text-muted-foreground mb-6">
                There are no products in this category yet. Check back soon!
              </p>
              <Button asChild>
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
            {products.map((product) => (
              <div key={product.id} className="group">
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-200 hover:border-primary/30 bg-white cursor-pointer transform hover:-translate-y-1 sm:hover:-translate-y-2 rounded-xl sm:rounded-2xl">
                  <Link href={`/products/${product.sku || product.id}`}>
                    <div className="aspect-square relative overflow-hidden rounded-t-xl sm:rounded-t-2xl">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 sm:h-16 sm:w-16 text-gray-300" />
                        </div>
                      )}
                      
                      {/* Enhanced Badges - Responsive */}
                      {product.stock_quantity === 0 && (
                        <Badge className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-red-500 hover:bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full shadow-lg text-xs">
                          Out of Stock
                        </Badge>
                      )}
                      {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                        <Badge className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full shadow-lg text-xs">
                          Low Stock
                        </Badge>
                      )}
                      
                      {/* Wishlist Button - Hidden on small screens */}
                      <div className="hidden sm:block absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button size="sm" variant="secondary" className="rounded-full w-10 h-10 p-0 bg-white/90 hover:bg-white shadow-lg">
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Quick View Overlay - Hidden on small screens */}
                      <div className="hidden sm:flex absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center">
                        <Button variant="secondary" className="bg-white/90 hover:bg-white text-black rounded-full px-6">
                          Quick View
                        </Button>
                      </div>
                    </div>
                  </Link>
                  
                  <CardContent className="p-3 sm:p-6 space-y-2 sm:space-y-4">
                    <Link href={`/products/${product.sku || product.id}`}>
                      <h3 className="font-bold text-sm sm:text-xl mb-1 sm:mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <p className="hidden sm:block text-gray-600 text-sm line-clamp-2 leading-relaxed">
                      {product.description || "Premium quality product with excellent features and performance."}
                    </p>
                    
                    {/* Rating - Simplified for mobile */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-gray-300" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500">(4.0)</span>
                      <span className="hidden sm:inline text-sm text-gray-400">•</span>
                      <span className="hidden sm:inline text-sm text-gray-500">24 reviews</span>
                    </div>
                    
                    {/* Price and Stock */}
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="text-lg sm:text-3xl font-bold text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text">
                          ৳{product.price.toLocaleString()}
                        </span>
                        {product.stock_quantity > 0 && (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ {product.stock_quantity} in stock
                          </span>
                        )}
                      </div>
                      
                      {/* Stock Status Indicator - Hidden on small screens */}
                      <div className="hidden sm:flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          product.stock_quantity > 10 ? 'bg-green-500' : 
                          product.stock_quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-xs text-gray-500">
                          {product.stock_quantity > 10 ? 'In Stock' : 
                           product.stock_quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1 sm:pt-2">
                      <Button 
                        className="flex-1 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 hover:shadow-lg h-8 sm:h-10" 
                        disabled={cartLoading || product.stock_quantity === 0}
                        variant={product.stock_quantity === 0 ? "secondary" : "default"}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (product.stock_quantity > 0) {
                            const success = await addToCart(product.id, 1);
                            if (success) {
                              // console.log('Item added to cart successfully');
                            }
                          }
                        }}
                      >
                        <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">
                          {cartLoading ? 'Adding...' : (product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart')}
                        </span>
                        <span className="sm:hidden">
                          {cartLoading ? 'Adding...' : (product.stock_quantity === 0 ? 'Out' : 'Add')}
                        </span>
                      </Button>
                      
                      <Button 
                        className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 hover:shadow-lg h-8 sm:h-10" 
                        disabled={cartLoading || product.stock_quantity === 0}
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
                        <span className="hidden sm:inline">
                          {cartLoading ? 'Adding...' : 'Buy Now'}
                        </span>
                        <span className="sm:hidden">
                          {cartLoading ? 'Adding...' : 'Buy'}
                        </span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
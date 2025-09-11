'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/navbar';
import { Search, ShoppingCart, Star, ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  sku: string;
  images: string[];
  stock_quantity: number;
  categories: {
    id: string;
    name: string;
    slug: string;
  };
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart, isLoading: cartLoading } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);

  const query = searchParams.get('q') || '';

  useEffect(() => {
    setSearchQuery(query);
    if (query) {
      searchProducts(query);
    } else {
      setLoading(false);
    }
  }, [query]);

  const searchProducts = async (searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/search/products?q=${encodeURIComponent(searchTerm)}&limit=50`);
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setTotal(data.total || 0);
      } else {
        throw new Error('Failed to search products');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const formatPrice = (price: number, salePrice?: number | null) => {
    if (salePrice && salePrice < price) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">৳{salePrice.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground line-through">৳{price.toLocaleString()}</span>
        </div>
      );
    }
    return <span className="text-lg font-bold text-primary">৳{price.toLocaleString()}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4 mb-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/" className="flex items-center gap-1 sm:gap-2">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Back</span>
              </Link>
            </Button>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            {query ? `Search Results for "${query}"` : 'Search Products'}
          </h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-300 aspect-square rounded-xl mb-2 sm:mb-4"></div>
                <div className="h-3 sm:h-4 bg-gray-300 rounded mb-1 sm:mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-red-800 mb-4">Search Error</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <Button onClick={() => searchProducts(query)}>Try Again</Button>
            </div>
          </div>
        ) : !query ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Enter a search term
            </h2>
            <p className="text-muted-foreground">
              Use the search box above to find products
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-3">
              No products found
            </h2>
            <p className="text-muted-foreground mb-6">
              No products match your search for "{query}". Try different keywords.
            </p>
            <Button asChild>
              <Link href="/">Browse All Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                Found {total} {total === 1 ? 'product' : 'products'} for "{query}"
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {products.map((product) => (
                <div key={product.id} className="group">
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-200 hover:border-primary/30 bg-white cursor-pointer transform hover:-translate-y-1 sm:hover:-translate-y-2 rounded-xl sm:rounded-2xl h-full">
                    <Link href={`/products/${product.sku}`}>
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
                        
                        {product.stock_quantity === 0 && (
                          <Badge className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-red-500 hover:bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full shadow-lg text-xs">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </Link>
                    
                    <CardContent className="p-3 sm:p-6 space-y-2 sm:space-y-4">
                      <Link href={`/products/${product.sku}`}>
                        <h3 className="font-bold text-sm sm:text-xl mb-1 sm:mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center gap-1 sm:gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {product.categories.name}
                        </Badge>
                      </div>
                      
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-col">
                          {formatPrice(product.price, product.sale_price)}
                          {product.stock_quantity > 0 && (
                            <span className="text-xs text-green-600 font-medium">
                              ✓ In Stock
                            </span>
                          )}
                        </div>
                      </div>
                      
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
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-48 bg-gray-300 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
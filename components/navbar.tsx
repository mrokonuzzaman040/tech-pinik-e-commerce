"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { useCart } from "@/contexts/cart-context";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  sku: string;
  images: string[];
  categories: {
    id: string;
    name: string;
    slug: string;
  };
}

interface SearchResult {
  products: Product[];
  total: number;
  query: string;
}

const Navbar = () => {
  const { cartCount } = useCart();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    // console.log('Performing search for:', query.trim());
    setIsSearching(true);
    try {
      const searchUrl = `/api/search/products?q=${encodeURIComponent(query.trim())}&limit=8`;
      // console.log('Search URL:', searchUrl);
      
      const response = await fetch(searchUrl);
      // console.log('Search response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        // console.log('Search results:', data);
        setSearchResults(data);
        setShowResults(true);
      } else {
        console.error('Search failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Simple debounced search - no auto-navigation
  useEffect(() => {
    // Clear existing search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If query is too short, clear results immediately
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    // Debounce search API calls (400ms for stable typing)
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Original search logic (commented out for testing)
  /*
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      timeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 500);
    } else {
      setSearchResults(null);
      setShowResults(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery]);
  */

  // Close search results when clicking outside (less aggressive)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        // Add small delay to prevent premature closing
        setTimeout(() => {
          setShowResults(false);
        }, 100);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowResults(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      // Professional UX: Allow users to escape/close search results
      setShowResults(false);
      setSearchQuery("");
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const clearSearch = () => {
    // Clear search timeout when manually clearing search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    setSearchQuery("");
    setSearchResults(null);
    setShowResults(false);
  };

  // Cleanup timeouts on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const formatPrice = (price: number, salePrice?: number | null) => {
    if (salePrice && salePrice < price) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-red-600 font-semibold">৳{salePrice}</span>
          <span className="text-gray-500 line-through text-sm">৳{price}</span>
        </div>
      );
    }
    return <span className="font-semibold">৳{price}</span>;
  };

  const SearchInput = useCallback(({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="relative w-full" ref={!isMobile ? searchRef : undefined}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search products..."
        className="pl-10 pr-10"
        value={searchQuery}
        onChange={handleSearchInputChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck={false}
        onFocus={() => {
          if (searchResults && searchResults.products.length > 0) {
            setShowResults(true);
          }
        }}
        onBlur={(e) => {
          // Only hide results if we're not clicking on a search result
          setTimeout(() => {
            if (!searchRef.current?.contains(document.activeElement)) {
              setShowResults(false);
            }
          }, 150);
        }}
      />
      {searchQuery && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      
      {/* Search Results Dropdown */}
      {showResults && searchResults && !isMobile && (
        <div 
          className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg mt-1 z-50 max-h-96 overflow-y-auto"
        >
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">
              Searching...
            </div>
          ) : searchResults.products.length > 0 ? (
            <>
              <div className="p-2 border-b border-border">
                <p className="text-sm text-muted-foreground">
                  Found {searchResults.total} products for "{searchResults.query}"
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {searchResults.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.sku}`}
                    className="flex items-center p-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                    onClick={() => setShowResults(false)}
                  >
                    {product.images && product.images.length > 0 && (
                      <div className="relative w-12 h-12 mr-3 flex-shrink-0">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover rounded"
                          sizes="48px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{product.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {product.categories.name} • SKU: {product.sku}
                      </p>
                      <div className="flex items-center mt-1">
                        {formatPrice(product.price, product.sale_price)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {searchResults.total > searchResults.products.length && (
                <div className="p-3 border-t border-border">
                  <Link
                    href={`/search?q=${encodeURIComponent(searchResults.query)}`}
                    className="text-sm text-primary hover:underline"
                    onClick={() => setShowResults(false)}
                  >
                    View all {searchResults.total} results
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No products found for "{searchResults.query}"
            </div>
          )}
        </div>
      )}
    </div>
  ), [searchQuery, searchResults, showResults, isSearching, handleSearchInputChange, handleKeyDown, clearSearch, formatPrice]);

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Logo 
              width={120} 
              height={40} 
              className="h-10" 
              priority 
              variant="auto"
            />
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <SearchInput />
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {/* Cart item count badge */}
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="md:hidden pb-4">
          <SearchInput isMobile={true} />
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-6 space-y-4">
              <div className="space-y-2">
                <Link 
                  href="/" 
                  className="block px-3 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  href="/categories" 
                  className="block px-3 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Categories
                </Link>
                <Link 
                  href="/cart" 
                  className="block px-3 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Cart ({cartCount})
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
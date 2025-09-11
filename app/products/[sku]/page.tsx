'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/navbar';
import { ArrowLeft, ShoppingCart, Plus, Minus, Heart, Share2, Truck, Shield, RotateCcw, Clock, Award, CheckCircle, Gift, Zap } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';
import { useCart } from '@/contexts/cart-context';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price?: number | null;
  images: string[];
  stock_quantity: number;
  sku: string;
  weight?: number | null;
  dimensions?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  tags?: string[];
  key_features?: string[] | null;
  box_contents?: string[] | null;
  categories: {
    id: string;
    name: string;
    slug: string;
  };
}

interface PromotionalFeature {
  id: string;
  title: string;
  description: string;
  icon_name: string | null;
  is_active: boolean;
  display_order: number;
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const sku = params.sku as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [promotionalFeatures, setPromotionalFeatures] = useState<PromotionalFeature[]>([]);
  const supabase = createSupabaseClient();
  const { addToCart } = useCart();

  useEffect(() => {
    if (sku) {
      fetchProduct();
    }
    fetchPromotionalFeatures();
  }, [sku]);

  const fetchPromotionalFeatures = async () => {
    try {
      const response = await fetch('/api/promotional-features');
      if (response.ok) {
        const data = await response.json();
        setPromotionalFeatures(data.filter((feature: PromotionalFeature) => feature.is_active)
          .sort((a: PromotionalFeature, b: PromotionalFeature) => a.display_order - b.display_order));
      }
    } catch (error) {
      console.error('Error fetching promotional features:', error);
    }
  };

  const renderIcon = (iconName: string | null) => {
    const iconProps = { className: "h-6 w-6 text-blue-600 mx-auto mb-2" };
    
    // Handle null, undefined, or empty iconName
    if (!iconName || typeof iconName !== 'string') {
      return <Truck {...iconProps} />;
    }
    
    switch (iconName.toLowerCase()) {
      case 'truck':
        return <Truck {...iconProps} />;
      case 'shield':
        return <Shield {...iconProps} />;
      case 'rotateccw':
      case 'return':
        return <RotateCcw {...iconProps} />;
      case 'clock':
        return <Clock {...iconProps} />;
      case 'star':
        return <Award {...iconProps} />;
      case 'award':
        return <Award {...iconProps} />;
      case 'checkcircle':
        return <CheckCircle {...iconProps} />;
      case 'heart':
        return <Heart {...iconProps} />;
      case 'gift':
        return <Gift {...iconProps} />;
      case 'zap':
        return <Zap {...iconProps} />;
      default:
        return <Truck {...iconProps} />;
    }
  };

  // Check if product is in wishlist
  useEffect(() => {
    if (product) {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const isProductInWishlist = wishlist.some((item: any) => item.id === product.id);
      setIsInWishlist(isProductInWishlist);
    }
  }, [product]);

  // Keyboard navigation for fullscreen modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showFullscreen) return;
      
      switch (e.key) {
        case 'Escape':
          setShowFullscreen(false);
          break;
        case 'ArrowLeft':
          if (product?.images && product.images.length > 1) {
            setSelectedImage(selectedImage > 0 ? selectedImage - 1 : product.images.length - 1);
          }
          break;
        case 'ArrowRight':
          if (product?.images && product.images.length > 1) {
            setSelectedImage(selectedImage < product.images.length - 1 ? selectedImage + 1 : 0);
          }
          break;
      }
    };

    if (showFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showFullscreen, selectedImage, product?.images]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(
            id,
            name,
            slug
          )
        `)
        .eq('sku', sku)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Product not found');
        } else {
          setError('Failed to load product');
        }
        return;
      }

      setProduct(data);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, salePrice?: number | null) => {
    if (salePrice && salePrice < price) {
      return (
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-red-600">৳{salePrice.toLocaleString()}</span>
          <span className="text-xl text-gray-500 line-through">৳{price.toLocaleString()}</span>
          <Badge variant="destructive" className="text-sm px-2 py-1">
            {Math.round(((price - salePrice) / price) * 100)}% OFF
          </Badge>
        </div>
      );
    }
    return <span className="text-3xl font-bold text-gray-900">৳{price.toLocaleString()}</span>;
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stock_quantity || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      // Reset quantity to 1 after successful add
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    setIsBuyingNow(true);
    try {
      await addToCart(product.id, quantity);
      router.push('/checkout');
    } catch (error) {
      console.error('Error during buy now:', error);
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    
    setIsTogglingWishlist(true);
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const productIndex = wishlist.findIndex((item: any) => item.id === product.id);
      
      if (productIndex > -1) {
        // Remove from wishlist
        wishlist.splice(productIndex, 1);
        setIsInWishlist(false);
      } else {
        // Add to wishlist
        wishlist.push({
          id: product.id,
          name: product.name,
          price: product.sale_price || product.price,
          image: product.images[0],
          sku: product.sku
        });
        setIsInWishlist(true);
      }
      
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;
    
    setIsSharing(true);
    try {
      const shareData = {
        title: product.name,
        text: `Check out this amazing product: ${product.name}`,
        url: window.location.href
      };
      
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Product link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Product link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="aspect-square bg-gray-300 rounded-lg"></div>
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-20 h-20 bg-gray-300 rounded-lg"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-10 bg-gray-300 rounded w-1/3"></div>
                <div className="h-32 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="bg-white rounded-xl p-12 max-w-md mx-auto shadow-sm">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                {error || 'Product not found'}
              </h2>
              <p className="text-gray-600 mb-6">
                The product you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href={`/categories/${product.categories.slug}`}
            className="hover:text-blue-600 transition-colors"
          >
            {product.categories.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 p-4 sm:p-6 lg:p-8">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 border group">
                {product.images && product.images.length > 0 ? (
                  <div 
                    className="relative w-full h-full cursor-zoom-in"
                    onMouseEnter={() => setIsZoomed(true)}
                    onMouseLeave={() => setIsZoomed(false)}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setZoomPosition({ x, y });
                    }}
                    onClick={() => setShowFullscreen(true)}
                  >
                    <Image
                      src={product.images[selectedImage]}
                      alt={product.name}
                      fill
                      className={`object-cover transition-transform duration-300 ${
                        isZoomed ? 'scale-150' : 'scale-100'
                      }`}
                      style={{
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                      }}
                      priority
                    />
                    {/* Zoom indicator */}
                    <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      Hover to zoom • Click to expand
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                        selectedImage === index ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
              
              {/* Image Counter */}
              {product.images && product.images.length > 1 && (
                <div className="text-center text-sm text-gray-500">
                  {selectedImage + 1} of {product.images.length} images
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                  {product.name}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  SKU: <span className="font-medium">{product.sku}</span>
                </p>
              </div>

              {/* Price */}
              <div className="border-b pb-6">
                {formatPrice(product.price, product.sale_price)}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 sm:gap-4">
                {product.stock_quantity > 0 ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs sm:text-sm px-2 sm:px-3 py-1">
                    ✓ In Stock ({product.stock_quantity})
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs sm:text-sm">
                    Out of Stock
                  </Badge>
                )}
              </div>

              {/* Key Features */}
              {promotionalFeatures.length > 0 && (
                <div className={`grid gap-3 sm:gap-4 py-4 border-y ${
                  promotionalFeatures.length === 1 ? 'grid-cols-1' :
                  promotionalFeatures.length === 2 ? 'grid-cols-2' :
                  'grid-cols-2 sm:grid-cols-3'
                }`}>
                  {promotionalFeatures.map((feature) => (
                    <div key={feature.id} className="text-center">
                      {renderIcon(feature.icon_name)}
                      <p className="text-xs sm:text-sm text-gray-600 leading-tight">{feature.title}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity and Add to Cart */}
              {product.stock_quantity > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Quantity</label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="h-9 w-9 sm:h-10 sm:w-10 p-0"
                      >
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="text-base sm:text-lg font-medium w-10 sm:w-12 text-center border rounded px-2 sm:px-3 py-2">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= product.stock_quantity}
                        className="h-9 w-9 sm:h-10 sm:w-10 p-0"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700" 
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || product.stock_quantity === 0}
                    >
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className={`flex-1 sm:px-4 ${isInWishlist ? 'text-red-500 border-red-500' : ''}`} 
                        size="lg"
                        onClick={handleWishlistToggle}
                        disabled={isTogglingWishlist}
                      >
                        <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isInWishlist ? 'fill-current' : ''}`} />
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 sm:px-4" 
                        size="lg"
                        onClick={handleShare}
                        disabled={isSharing}
                      >
                        <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={handleBuyNow}
                    disabled={isBuyingNow || product.stock_quantity === 0}
                  >
                    {isBuyingNow ? 'Processing...' : 'Buy Now'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-6 sm:mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white border rounded-lg h-auto p-1">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 text-xs sm:text-sm py-2 sm:py-3"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="specifications" 
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 text-xs sm:text-sm py-2 sm:py-3"
              >
                Specifications
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4 sm:mt-6">
              <TabsContent value="overview" className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Product Overview</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
                    {product.description}
                  </p>
                  
                  {/* Key Features */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Key Features</h4>
                      {product.key_features && product.key_features.length > 0 ? (
                        <ul className="space-y-2 text-gray-700">
                          {product.key_features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm sm:text-base">
                              <span className="text-blue-600 mt-1 text-xs">•</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-start gap-2 text-sm sm:text-base">
                            <span className="text-blue-600 mt-1 text-xs">•</span>
                            High-quality construction and materials
                          </li>
                          <li className="flex items-start gap-2 text-sm sm:text-base">
                            <span className="text-blue-600 mt-1 text-xs">•</span>
                            Advanced technology integration
                          </li>
                          <li className="flex items-start gap-2 text-sm sm:text-base">
                            <span className="text-blue-600 mt-1 text-xs">•</span>
                            User-friendly design and interface
                          </li>
                          <li className="flex items-start gap-2 text-sm sm:text-base">
                            <span className="text-blue-600 mt-1 text-xs">•</span>
                            Reliable performance and durability
                          </li>
                        </ul>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">What's in the Box</h4>
                      {product.box_contents && product.box_contents.length > 0 ? (
                        <ul className="space-y-2 text-gray-700">
                          {product.box_contents.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm sm:text-base">
                              <span className="text-blue-600 mt-1 text-xs">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-start gap-2 text-sm sm:text-base">
                            <span className="text-blue-600 mt-1 text-xs">•</span>
                            1x {product.name}
                          </li>
                          <li className="flex items-start gap-2 text-sm sm:text-base">
                            <span className="text-blue-600 mt-1 text-xs">•</span>
                            User manual and documentation
                          </li>
                          <li className="flex items-start gap-2 text-sm sm:text-base">
                            <span className="text-blue-600 mt-1 text-xs">•</span>
                            Warranty card
                          </li>
                          <li className="flex items-start gap-2 text-sm sm:text-base">
                            <span className="text-blue-600 mt-1 text-xs">•</span>
                            Original packaging
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="specifications" className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Technical Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Physical Specifications</h4>
                    <div className="space-y-2 sm:space-y-3">
                      {product.dimensions && (
                        <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 gap-1 sm:gap-0">
                          <span className="text-gray-600 text-sm">Dimensions:</span>
                          <span className="font-medium text-sm sm:text-base">{product.dimensions}</span>
                        </div>
                      )}
                      {product.weight && (
                        <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 gap-1 sm:gap-0">
                          <span className="text-gray-600 text-sm">Weight:</span>
                          <span className="font-medium text-sm sm:text-base">{product.weight}g</span>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 gap-1 sm:gap-0">
                        <span className="text-gray-600 text-sm">SKU:</span>
                        <span className="font-medium text-sm sm:text-base">{product.sku}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 gap-1 sm:gap-0">
                        <span className="text-gray-600 text-sm">Category:</span>
                        <span className="font-medium text-sm sm:text-base">{product.categories.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Additional Information</h4>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 gap-1 sm:gap-0">
                        <span className="text-gray-600 text-sm">Warranty:</span>
                        <span className="font-medium text-sm sm:text-base">1 Year</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 gap-1 sm:gap-0">
                        <span className="text-gray-600 text-sm">Brand:</span>
                        <span className="font-medium text-sm sm:text-base">TechPinik</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 gap-1 sm:gap-0">
                        <span className="text-gray-600 text-sm">Origin:</span>
                        <span className="font-medium text-sm sm:text-base">Imported</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 gap-1 sm:gap-0">
                        <span className="text-gray-600 text-sm">Availability:</span>
                        <span className="font-medium text-green-600 text-sm sm:text-base">In Stock</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      
      {/* Fullscreen Image Modal */}
      {showFullscreen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullscreen(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-black p-2 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="relative">
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                width={1200}
                height={1200}
                className="object-contain max-h-[90vh] w-auto"
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Navigation arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(selectedImage > 0 ? selectedImage - 1 : product.images.length - 1);
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-gray-700 p-3 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(selectedImage < product.images.length - 1 ? selectedImage + 1 : 0);
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-gray-700 p-3 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                {selectedImage + 1} / {product.images.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
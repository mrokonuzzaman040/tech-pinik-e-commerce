'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
}

// Generate a simple blur placeholder
const generateBlurDataURL = (width: number = 10, height: number = 10): string => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    // Create a simple gradient blur effect
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#f3f4f6')
    gradient.addColorStop(0.5, '#e5e7eb')
    gradient.addColorStop(1, '#d1d5db')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }
  
  return canvas.toDataURL('image/jpeg', 0.1)
}

// Check if WebP is supported
const checkWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new window.Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

// Check if AVIF is supported
const checkAVIFSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const avif = new window.Image()
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2)
    }
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
  })
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [webpSupported, setWebpSupported] = useState<boolean | null>(null)
  const [avifSupported, setAvifSupported] = useState<boolean | null>(null)

  // Check format support on mount - only in browser
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const checkSupport = async () => {
      const [webp, avif] = await Promise.all([
        checkWebPSupport(),
        checkAVIFSupport()
      ])
      setWebpSupported(webp)
      setAvifSupported(avif)
    }
    
    checkSupport()
  }, [])

  // Generate optimized image URL based on format support
  useEffect(() => {
    if (typeof window === 'undefined') {
      setImageSrc(src)
      return
    }
    
    if (webpSupported === null || avifSupported === null) return

    let optimizedSrc = src
    
    // Only optimize if it's not already an optimized format and not an external URL
    if (!src.includes('.webp') && !src.includes('.avif') && !src.startsWith('http')) {
      const url = new URL('/api/optimize-image', window.location.origin)
      url.searchParams.set('src', src)
      url.searchParams.set('quality', quality.toString())
      
      if (width) url.searchParams.set('width', width.toString())
      if (height) url.searchParams.set('height', height.toString())
      
      // Choose best supported format
      if (avifSupported) {
        url.searchParams.set('format', 'avif')
      } else if (webpSupported) {
        url.searchParams.set('format', 'webp')
      }
      
      optimizedSrc = url.toString()
    }
    
    setImageSrc(optimizedSrc)
  }, [src, webpSupported, avifSupported, quality, width, height])

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    // Fallback to original src if optimization fails
    if (imageSrc !== src) {
      setImageSrc(src)
      return
    }
    onError?.()
  }

  // Generate blur placeholder if not provided - use static placeholder to avoid hydration mismatch
  const blurPlaceholder = blurDataURL || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo='

  // Default responsive sizes if not provided
  const responsiveSizes = sizes || (
    fill 
      ? '100vw'
      : width 
        ? `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${width}px`
        : '100vw'
  )

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Loading skeleton */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}
        />
      )}
      
      {/* Error fallback */}
      {hasError && (
        <div 
          className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded"
          style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      {/* Optimized Image */}
      <Image
        src={imageSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={responsiveSizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder === 'blur' && blurPlaceholder ? 'blur' : 'empty'}
        blurDataURL={blurPlaceholder}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          hasError && 'hidden'
        )}
      />
    </div>
  )
}

// Preset configurations for common use cases
export const ProductImage = (props: Omit<OptimizedImageProps, 'sizes'>) => (
  <OptimizedImage
    {...props}
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
    quality={90}
  />
)

export const CategoryImage = (props: Omit<OptimizedImageProps, 'sizes'>) => (
  <OptimizedImage
    {...props}
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
    quality={85}
  />
)

export const HeroImage = (props: Omit<OptimizedImageProps, 'sizes' | 'priority'>) => (
  <OptimizedImage
    {...props}
    sizes="100vw"
    quality={95}
    priority={true}
  />
)

export const ThumbnailImage = (props: Omit<OptimizedImageProps, 'sizes'>) => (
  <OptimizedImage
    {...props}
    sizes="150px"
    quality={80}
  />
)
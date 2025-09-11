export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  progressive?: boolean
}

export interface OptimizedImage {
  buffer: ArrayBuffer
  filename: string
  mimeType: string
  size: number
}

/**
 * Optimize an image file for web usage using server-side API
 * @param file - The original image file
 * @param options - Optimization options
 * @returns Promise<OptimizedImage>
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    format = 'webp',
    progressive = true
  } = options

  // Create FormData for API request
  const formData = new FormData()
  formData.append('file', file)
  formData.append('maxWidth', maxWidth.toString())
  formData.append('maxHeight', maxHeight.toString())
  formData.append('quality', quality.toString())
  formData.append('format', format)
  formData.append('progressive', progressive.toString())

  // Call the optimization API
  const response = await fetch('/api/optimize-image', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    throw new Error('Failed to optimize image')
  }

  const buffer = await response.arrayBuffer()
  const filename = response.headers.get('X-Filename') || `optimized.${format}`
  const mimeType = response.headers.get('Content-Type') || `image/${format}`
  const size = parseInt(response.headers.get('Content-Length') || '0')

  return {
    buffer,
    filename,
    mimeType,
    size
  }
}

/**
 * Generate multiple sizes of an image for responsive usage
 * Note: This function now uses the optimization API for each size
 * @param file - The original image file
 * @param sizes - Array of size configurations
 * @returns Promise<OptimizedImage[]>
 */
export async function generateResponsiveImages(
  file: File,
  sizes: Array<{ width: number; height?: number; suffix: string }> = [
    { width: 400, suffix: 'thumb' },
    { width: 800, suffix: 'medium' },
    { width: 1200, suffix: 'large' }
  ]
): Promise<OptimizedImage[]> {
  const optimizedImages: OptimizedImage[] = []
  const originalName = file.name.split('.').slice(0, -1).join('.')

  for (const size of sizes) {
    try {
      const optimized = await optimizeImage(file, {
        maxWidth: size.width,
        maxHeight: size.height,
        format: 'webp',
        quality: 85
      })
      
      // Update filename with suffix
      optimized.filename = `${originalName}-${size.suffix}.webp`
      optimizedImages.push(optimized)
    } catch (error) {
      console.error(`Failed to generate ${size.suffix} size:`, error)
    }
  }

  return optimizedImages
}

/**
 * Validate an image file
 * @param file - The file to validate
 * @param maxSizeInMB - Maximum file size in MB
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSizeInMB: number = 10,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
): { isValid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${maxSizeInMB}MB`
    }
  }

  return { isValid: true }
}

/**
 * Generate a unique filename with timestamp
 * @param originalFilename - The original filename
 * @param prefix - Optional prefix
 * @returns Unique filename
 */
export function generateUniqueFilename(
  originalFilename: string,
  prefix: string = ''
): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = originalFilename.split('.').pop() || ''
  const nameWithoutExt = originalFilename.split('.').slice(0, -1).join('.')
  
  const uniqueName = prefix 
    ? `${prefix}-${nameWithoutExt}-${timestamp}-${randomString}`
    : `${nameWithoutExt}-${timestamp}-${randomString}`
    
  return extension ? `${uniqueName}.${extension}` : uniqueName
}

/**
 * Get image dimensions from a file (client-side)
 * @param file - The image file
 * @returns Promise with width and height
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

/**
 * Create a thumbnail using the optimization API
 * @param file - The original image file
 * @param size - Thumbnail size (square)
 * @returns Promise<OptimizedImage>
 */
export async function createThumbnail(
  file: File,
  size: number = 200
): Promise<OptimizedImage> {
  return optimizeImage(file, {
    maxWidth: size,
    maxHeight: size,
    format: 'webp',
    quality: 80
  })
}
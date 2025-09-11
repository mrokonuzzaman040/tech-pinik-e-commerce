import { createSupabaseClient } from './supabase'
import { 
  optimizeImage, 
  generateResponsiveImages, 
  validateImageFile, 
  generateUniqueFilename,
  createThumbnail,
  type ImageOptimizationOptions,
  type OptimizedImage
} from './image-utils'

export interface UploadOptions {
  bucket?: string
  folder?: string
  optimize?: boolean
  generateResponsive?: boolean
  createThumbnail?: boolean
  optimizationOptions?: ImageOptimizationOptions
}

export interface UploadResult {
  url: string
  path: string
  size: number
  variants?: {
    thumbnail?: string
    medium?: string
    large?: string
  }
}

export interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  result?: UploadResult
}

class UploadService {
  private supabase = createSupabaseClient()
  private progressCallbacks: Map<string, (progress: UploadProgress) => void> = new Map()

  /**
   * Upload a single file with optimization
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const {
      bucket = 'images',
      folder = '',
      optimize = true,
      generateResponsive = false,
      createThumbnail: shouldCreateThumbnail = false,
      optimizationOptions = {}
    } = options

    const fileId = Math.random().toString(36).substring(2)
    
    if (onProgress) {
      this.progressCallbacks.set(fileId, onProgress)
    }

    try {
      // Update progress: Starting
      this.updateProgress(fileId, {
        file,
        progress: 0,
        status: 'pending'
      })

      // Validate file
      const validation = validateImageFile(file)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      // Update progress: Processing
      this.updateProgress(fileId, {
        file,
        progress: 10,
        status: 'processing'
      })

      let uploadTasks: Array<{ buffer: Buffer; filename: string; path: string }> = []
      const variants: UploadResult['variants'] = {}

      if (optimize) {
        // Optimize main image
        const optimized = await optimizeImage(file, optimizationOptions)
        const mainPath = this.buildPath(folder, optimized.filename)
        uploadTasks.push({
          buffer: Buffer.from(optimized.buffer),
          filename: optimized.filename,
          path: mainPath
        })

        // Update progress: Main image optimized
        this.updateProgress(fileId, {
          file,
          progress: 30,
          status: 'processing'
        })

        // Generate responsive images if requested
        if (generateResponsive) {
          const responsiveImages = await generateResponsiveImages(file)
          
          for (const img of responsiveImages) {
            const responsivePath = this.buildPath(folder, img.filename)
            uploadTasks.push({
              buffer: Buffer.from(img.buffer),
              filename: img.filename,
              path: responsivePath
            })

            // Store variant URLs (we'll update these after upload)
            if (img.filename.includes('-thumb.')) {
              variants.thumbnail = responsivePath
            } else if (img.filename.includes('-medium.')) {
              variants.medium = responsivePath
            } else if (img.filename.includes('-large.')) {
              variants.large = responsivePath
            }
          }
        }

        // Create thumbnail if requested
        if (shouldCreateThumbnail && !generateResponsive) {
          const thumbnail = await createThumbnail(file)
          const thumbPath = this.buildPath(folder, thumbnail.filename)
          uploadTasks.push({
            buffer: Buffer.from(thumbnail.buffer),
            filename: thumbnail.filename,
            path: thumbPath
          })
          variants.thumbnail = thumbPath
        }

        // Update progress: All images processed
        this.updateProgress(fileId, {
          file,
          progress: 50,
          status: 'uploading'
        })
      } else {
        // Upload original file without optimization
        const filename = generateUniqueFilename(file.name)
        const path = this.buildPath(folder, filename)
        const arrayBuffer = await file.arrayBuffer()
        uploadTasks.push({
          buffer: Buffer.from(arrayBuffer),
          filename,
          path
        })
      }

      // Upload all files
      const uploadPromises = uploadTasks.map(async (task, index) => {
        const { data, error } = await this.supabase.storage
          .from(bucket)
          .upload(task.path, task.buffer, {
            contentType: 'image/webp',
            cacheControl: '31536000', // 1 year
            upsert: true // Allow overwriting to prevent "file exists" errors
          })

        if (error) {
          // If still getting file exists error, try with a new unique filename
          if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
            // Generate a new unique filename with additional randomness
            const timestamp = Date.now()
            const randomId = Math.random().toString(36).substring(2, 15)
            const fileExtension = task.filename.split('.').pop() || 'webp'
            const newFilename = `retry-${timestamp}-${randomId}.${fileExtension}`
            const newPath = this.buildPath(folder, newFilename)
            
            const retryData = await this.supabase.storage
              .from(bucket)
              .upload(newPath, task.buffer, {
                contentType: 'image/webp',
                cacheControl: '31536000',
                upsert: true
              })
            
            if (retryData.error) {
              throw new Error(`Upload failed for ${task.filename}: ${retryData.error.message}`)
            }
            
            return { ...task, path: newPath, uploadData: retryData.data }
          }
          
          throw new Error(`Upload failed for ${task.filename}: ${error.message}`)
        }

        // Update progress for each upload
        const progressIncrement = 40 / uploadTasks.length
        this.updateProgress(fileId, {
          file,
          progress: 50 + (index + 1) * progressIncrement,
          status: 'uploading'
        })

        return { ...task, uploadData: data }
      })

      const uploadResults = await Promise.all(uploadPromises)
      const mainUpload = uploadResults[0]

      // Get public URLs
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(mainUpload.path)

      // Update variant URLs with public URLs
      const finalVariants: UploadResult['variants'] = {}
      if (variants.thumbnail) {
        const { data } = this.supabase.storage.from(bucket).getPublicUrl(variants.thumbnail)
        finalVariants.thumbnail = data.publicUrl
      }
      if (variants.medium) {
        const { data } = this.supabase.storage.from(bucket).getPublicUrl(variants.medium)
        finalVariants.medium = data.publicUrl
      }
      if (variants.large) {
        const { data } = this.supabase.storage.from(bucket).getPublicUrl(variants.large)
        finalVariants.large = data.publicUrl
      }

      const result: UploadResult = {
        url: urlData.publicUrl,
        path: mainUpload.path,
        size: mainUpload.buffer.length,
        variants: Object.keys(finalVariants).length > 0 ? finalVariants : undefined
      }

      // Update progress: Completed
      this.updateProgress(fileId, {
        file,
        progress: 100,
        status: 'completed',
        result
      })

      return result

    } catch (error) {
      // Update progress: Error
      this.updateProgress(fileId, {
        file,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      })
      throw error
    } finally {
      // Clean up progress callback
      this.progressCallbacks.delete(fileId)
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    options: UploadOptions = {},
    onProgress?: (fileId: string, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file, index) => {
      const fileId = `${index}-${Math.random().toString(36).substring(2)}`
      return this.uploadFile(file, options, (progress) => {
        if (onProgress) {
          onProgress(fileId, progress)
        }
      })
    })

    return Promise.all(uploadPromises)
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(path: string, bucket: string = 'images'): Promise<void> {
    // console.log(`Attempting to delete file: ${path} from bucket: ${bucket}`);
    
    // First, check if file exists
    try {
      const { data: files, error: listError } = await this.supabase.storage
        .from(bucket)
        .list(path.includes('/') ? path.split('/').slice(0, -1).join('/') : '', {
          search: path.includes('/') ? path.split('/').pop() : path
        });

      if (listError) {
        console.error('Error listing files:', listError);
      } else {
        // console.log('Files found in directory:', files);
      }
    } catch (e) {
      console.log('Could not check file existence:', e);
    }

    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Delete error details:', error);
      throw new Error(`Failed to delete file "${path}" from bucket "${bucket}": ${error.message}`)
    }
    
    console.log(`Successfully deleted file: ${path}`);
  }

  /**
   * Delete multiple files from storage
   */
  async deleteFiles(paths: string[], bucket: string = 'images'): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove(paths)

    if (error) {
      throw new Error(`Failed to delete files: ${error.message}`)
    }
  }

  /**
   * Get file info from storage
   */
  async getFileInfo(path: string, bucket: string = 'images') {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop()
      })

    if (error) {
      throw new Error(`Failed to get file info: ${error.message}`)
    }

    return data?.[0] || null
  }

  private updateProgress(fileId: string, progress: UploadProgress) {
    const callback = this.progressCallbacks.get(fileId)
    if (callback) {
      callback(progress)
    }
  }

  private buildPath(folder: string, filename: string): string {
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
    return cleanFolder ? `${cleanFolder}/${filename}` : filename
  }
}

// Export singleton instance
export const uploadService = new UploadService()

// Export class for custom instances
export { UploadService }
'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadService, type UploadProgress } from '@/lib/upload-service'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  maxSize?: number // in MB
  className?: string
  bucket?: string
  folder?: string
  optimize?: boolean
  generateResponsive?: boolean
  createThumbnail?: boolean
}

interface UploadingFile {
  file: File
  progress: number
  error?: string
  url?: string
}

export function ImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 5,
  className,
  bucket = 'images',
  folder = '',
  optimize = true,
  generateResponsive = false,
  createThumbnail = false
}: ImageUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [error, setError] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError('')
    
    // Check file limits
    if (value.length + acceptedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Check file sizes
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError(`Files must be smaller than ${maxSize}MB`)
      return
    }

    // Initialize uploading files
    const newUploadingFiles = acceptedFiles.map(file => ({
      file,
      progress: 0
    }))
    setUploadingFiles(prev => [...prev, ...newUploadingFiles])

    // Upload files
    const uploadPromises = acceptedFiles.map(async (file, index) => {
      try {
        const result = await uploadService.uploadFile(
          file,
          {
            bucket,
            folder,
            optimize,
            generateResponsive,
            createThumbnail
          },
          (progress: UploadProgress) => {
            setUploadingFiles(prev => 
              prev.map((uf, i) => 
                uf.file === file 
                  ? { ...uf, progress: progress.progress }
                  : uf
              )
            )
          }
        )

        // Update uploading file with success
        setUploadingFiles(prev => 
          prev.map((uf, i) => 
            uf.file === file 
              ? { ...uf, progress: 100, url: result.url }
              : uf
          )
        )

        return result.url
      } catch (error: any) {
        // Update uploading file with error
        setUploadingFiles(prev => 
          prev.map((uf, i) => 
            uf.file === file 
              ? { ...uf, error: error.message }
              : uf
          )
        )
        throw error
      }
    })

    try {
      const uploadedUrls = await Promise.all(uploadPromises)
      const successfulUrls = uploadedUrls.filter(Boolean)
      
      if (successfulUrls.length > 0) {
        onChange([...value, ...successfulUrls])
      }
    } catch (error: any) {
      setError('Some files failed to upload')
    } finally {
      // Clear uploading files after a delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(uf => !uf.url && !uf.error))
      }, 2000)
    }
  }, [value, onChange, maxFiles, maxSize, bucket, folder, optimize, generateResponsive, createThumbnail])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles: maxFiles - value.length,
    disabled: value.length >= maxFiles
  })

  const removeImage = async (url: string) => {
    let filePath = '';
    
    try {
      // Extract file path from Supabase URL more accurately
      if (url.includes('/storage/v1/object/public/')) {
        // Supabase public URL format: https://project.supabase.co/storage/v1/object/public/bucket/path/file.ext
        const urlParts = url.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const pathWithBucket = urlParts[1];
          // Remove bucket name from path (first segment)
          const pathParts = pathWithBucket.split('/');
          if (pathParts.length > 1) {
            filePath = pathParts.slice(1).join('/'); // Everything after bucket name
          }
        }
      } else {
        // Fallback to simple extraction
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        filePath = folder ? `${folder}/${fileName}` : fileName;
      }

      // console.log('Debug - Original URL:', url);
      // console.log('Debug - Extracted filePath:', filePath);
      // console.log('Debug - Target bucket:', bucket);
      // console.log('Debug - Folder context:', folder);

      // Delete from storage using upload service
      await uploadService.deleteFile(filePath, bucket);
      
      // console.log('File deleted successfully:', filePath);
      
      // Update state
      onChange(value.filter(v => v !== url));
    } catch (error) {
      console.error('Error removing image:', error);
      console.error('URL was:', url);
      console.error('Extracted path was:', filePath);
      
      // Show user-friendly error
      setError(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Still remove from state to avoid UI inconsistency, but after a delay
      setTimeout(() => {
        onChange(value.filter(v => v !== url));
      }, 2000);
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag & drop images here, or click to select'
            }
          </p>
          <p className="text-xs text-gray-500">
            Maximum {maxFiles} files, up to {maxSize}MB each
          </p>
          <p className="text-xs text-blue-600 mt-1">
            ✨ Filenames will be auto-generated for better organization
          </p>
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uploadingFile, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
              <ImageIcon className="h-8 w-8 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium truncate">
                  {uploadingFile.file.name}
                </p>
                <p className="text-xs text-gray-400">
                  Auto-generated unique filename will be used
                </p>
                {uploadingFile.error ? (
                  <p className="text-xs text-red-600">{uploadingFile.error}</p>
                ) : uploadingFile.url ? (
                  <p className="text-xs text-green-600">Upload complete</p>
                ) : (
                  <div className="space-y-1">
                    <Progress value={uploadingFile.progress} className="h-1" />
                    <p className="text-xs text-gray-500">Uploading...</p>
                  </div>
                )}
              </div>
              {uploadingFile.progress > 0 && uploadingFile.progress < 100 && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Images */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square relative rounded-lg overflow-hidden border">
                <Image
                  src={url}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                <div className="absolute inset-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(url)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length >= maxFiles && (
        <p className="text-sm text-gray-500 text-center">
          Maximum number of files reached ({maxFiles})
        </p>
      )}
    </div>
  )
}
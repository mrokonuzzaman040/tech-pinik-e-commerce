import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const maxWidth = parseInt(formData.get('maxWidth') as string) || 1920
    const maxHeight = parseInt(formData.get('maxHeight') as string) || 1080
    const quality = parseInt(formData.get('quality') as string) || 85
    const format = (formData.get('format') as string) || 'webp'
    const progressive = formData.get('progressive') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Get original filename without extension
    const originalName = file.name.split('.').slice(0, -1).join('.')
    const filename = `${originalName}.${format}`

    let sharpInstance = sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })

    // Apply format-specific optimizations
    switch (format) {
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality
        })
        break
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality,
          progressive
        })
        break
      case 'png':
        sharpInstance = sharpInstance.png({
          quality
        })
        break
      default:
        sharpInstance = sharpInstance.webp({
          quality
        })
    }

    const optimizedBuffer = await sharpInstance.toBuffer()
    const mimeType = `image/${format}`

    return new NextResponse(optimizedBuffer as any, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': optimizedBuffer.length.toString(),
        'X-Filename': filename,
        'X-Original-Size': buffer.length.toString(),
        'X-Optimized-Size': optimizedBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Image optimization error:', error)
    return NextResponse.json(
      { error: 'Failed to optimize image' },
      { status: 500 }
    )
  }
}

// GET endpoint for dynamic image optimization via URL parameters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const src = searchParams.get('src')
    const width = parseInt(searchParams.get('width') || '1920')
    const height = parseInt(searchParams.get('height') || '1080')
    const quality = parseInt(searchParams.get('quality') || '85')
    const format = searchParams.get('format') || 'webp'

    if (!src) {
      return NextResponse.json({ error: 'No source image provided' }, { status: 400 })
    }

    let imageBuffer: Buffer

    // Handle different source types
    if (src.startsWith('http')) {
      // External URL
      const response = await fetch(src)
      if (!response.ok) {
        throw new Error('Failed to fetch external image')
      }
      const arrayBuffer = await response.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
    } else {
      // Supabase storage URL
      const supabase = createSupabaseClient()
      const { data, error } = await supabase.storage
        .from('images')
        .download(src.replace('/storage/v1/object/public/images/', ''))
      
      if (error || !data) {
        throw new Error('Failed to fetch image from storage')
      }
      
      const arrayBuffer = await data.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
    }

    // Optimize the image
    let sharpInstance = sharp(imageBuffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })

    // Apply format-specific optimizations
    switch (format) {
      case 'avif':
        sharpInstance = sharpInstance.avif({
          quality,
          effort: 4
        })
        break
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality,
          effort: 4
        })
        break
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality,
          progressive: true
        })
        break
      case 'png':
        sharpInstance = sharpInstance.png({
          quality
        })
        break
      default:
        sharpInstance = sharpInstance.webp({
          quality,
          effort: 4
        })
    }

    const optimizedBuffer = await sharpInstance.toBuffer()
    const mimeType = `image/${format}`

    return new NextResponse(optimizedBuffer as any, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': optimizedBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Original-Size': imageBuffer.length.toString(),
        'X-Optimized-Size': optimizedBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Dynamic image optimization error:', error)
    return NextResponse.json(
      { error: 'Failed to optimize image' },
      { status: 500 }
    )
  }
}
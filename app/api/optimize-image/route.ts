import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

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
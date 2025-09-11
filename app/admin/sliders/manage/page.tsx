'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImageUpload } from '@/components/ui/image-upload'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/lib/supabase'

type Slider = Database['public']['Tables']['sliders']['Row']

export default function SliderManagePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sliderId = searchParams.get('id')
  const isEditing = Boolean(sliderId)

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    button_text: 'Shop Now',
    order_index: 0,
    is_active: true
  })

  // Fetch slider data if editing
  useEffect(() => {
    if (isEditing && sliderId) {
      fetchSlider(sliderId)
    }
  }, [isEditing, sliderId])

  const fetchSlider = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/sliders/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch slider')
      }
      
      const data = await response.json()
      setFormData({
        title: data.slider.title,
        subtitle: data.slider.subtitle || '',
        image_url: data.slider.image_url,
        link_url: data.slider.link_url || '',
        button_text: data.slider.button_text || 'Shop Now',
        order_index: data.slider.order_index || 0,
        is_active: data.slider.is_active
      })
    } catch (error: any) {
      setError(error.message || 'Failed to fetch slider')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const url = isEditing 
        ? `/api/admin/sliders/${sliderId}`
        : '/api/admin/sliders'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save slider')
      }

      router.push('/admin/sliders')
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string) => (value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/sliders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sliders
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Slider' : 'Add New Slider'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Update slider information' : 'Create a new slider for the homepage'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Slider Details</CardTitle>
          <CardDescription>
            Configure the slider content and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title')(e.target.value)}
                  placeholder="Slider title"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="button_text">Button Text</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => handleInputChange('button_text')(e.target.value)}
                  placeholder="Shop Now"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle')(e.target.value)}
                placeholder="Slider subtitle"
                rows={3}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link_url">Link URL</Label>
              <Input
                id="link_url"
                type="url"
                value={formData.link_url}
                onChange={(e) => handleInputChange('link_url')(e.target.value)}
                placeholder="https://example.com"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="order_index">Order Index</Label>
                <Input
                  id="order_index"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => handleInputChange('order_index')(parseInt(e.target.value) || 0)}
                  min="0"
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active')(checked)}
                  disabled={submitting}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Slider Image *</Label>
              <ImageUpload
                value={formData.image_url ? [formData.image_url] : []}
                onChange={(urls) => handleInputChange('image_url')(urls[0] || '')}
                maxFiles={1}
                maxSize={5}
                bucket="images"
                folder="sliders"
                optimize={true}
                createThumbnail={true}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/sliders">Cancel</Link>
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Slider' : 'Create Slider'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
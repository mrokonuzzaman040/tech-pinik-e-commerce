'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  banner_image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function ManageCategoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('id')
  const isEditing = !!categoryId

  const [category, setCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    banner_image_url: '',
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  useEffect(() => {
    if (isEditing) {
      fetchCategory()
    }
  }, [categoryId, isEditing])

  const fetchCategory = async () => {
    if (!categoryId) return

    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/admin/categories/${categoryId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch category')
      }
      
      setCategory(data)
      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        description: data.description || '',
        image_url: data.image_url || '',
        banner_image_url: data.banner_image_url || '',
        is_active: data.is_active ?? true
      })
    } catch (err: any) {
      setError(err.message || 'Failed to fetch category')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!formData.name.trim()) {
        setError('Category name is required')
        return
      }

      const slug = formData.slug || generateSlug(formData.name)
      const payload = {
        ...formData,
        slug,
        name: formData.name.trim(),
        description: formData.description.trim() || null
      }

      const url = isEditing 
        ? `/api/admin/categories/${categoryId}`
        : '/api/admin/categories'
      
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} category`)
      }

      setSuccess(`Category ${isEditing ? 'updated' : 'created'} successfully!`)
      
      if (!isEditing) {
        // Redirect to edit the newly created category
        router.push(`/admin/categories/manage?id=${data.id}`)
      } else {
        // Refresh the category data
        fetchCategory()
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} category`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!categoryId || !confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      setError('')

      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete category')
      }

      router.push('/admin/categories?deleted=true')
    } catch (err: any) {
      setError(err.message || 'Failed to delete category')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading category...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/admin/categories')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Categories</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isEditing ? 'Edit Category' : 'Create New Category'}
              </h1>
              {isEditing && category && (
                <p className="text-muted-foreground">
                  Last updated: {new Date(category.updated_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {isEditing && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center space-x-2"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </Button>
            )}
            
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? 'Saving...' : 'Save Category'}</span>
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Basic Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic details for this category
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Category Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value
                        setFormData(prev => ({
                          ...prev,
                          name,
                          slug: prev.slug || generateSlug(name)
                        }))
                      }}
                      placeholder="Enter category name"
                      disabled={saving}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="category-url-slug"
                      disabled={saving}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter category description (optional)"
                    rows={4}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    disabled={saving}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Active (visible to customers)</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status & Preview */}
          <div className="space-y-6">
            {isEditing && category && (
              <Card>
                <CardHeader>
                  <CardTitle>Category Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      category.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Created:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(category.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Images Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Image */}
          <Card>
            <CardHeader>
              <CardTitle>Category Image</CardTitle>
              <CardDescription>
                Main category image displayed in category listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ImageUpload
                  value={formData.image_url ? [formData.image_url] : []}
                  onChange={(urls) => setFormData(prev => ({ ...prev, image_url: urls[0] || '' }))}
                  maxFiles={1}
                  maxSize={5}
                  bucket="images"
                  folder="categories/images"
                  optimize={true}
                  createThumbnail={true}
                />
                
                {formData.image_url && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Current Image:</p>
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                      <Image
                        src={formData.image_url}
                        alt="Category image"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Banner Image */}
          <Card>
            <CardHeader>
              <CardTitle>Banner Image</CardTitle>
              <CardDescription>
                Large banner image displayed on category pages (recommended: 1200x400px)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ImageUpload
                  value={formData.banner_image_url ? [formData.banner_image_url] : []}
                  onChange={(urls) => setFormData(prev => ({ ...prev, banner_image_url: urls[0] || '' }))}
                  maxFiles={1}
                  maxSize={10}
                  bucket="images"
                  folder="categories/banners"
                  optimize={true}
                  generateResponsive={true}
                />
                
                {formData.banner_image_url && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Current Banner:</p>
                    <div className="relative w-full h-24 rounded-lg overflow-hidden border">
                      <Image
                        src={formData.banner_image_url}
                        alt="Banner image"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button (Bottom) */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="px-8"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Category' : 'Create Category'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
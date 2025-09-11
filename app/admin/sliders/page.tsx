'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import Image from 'next/image'
import type { Database } from '@/lib/supabase'

type Slider = Database['public']['Tables']['sliders']['Row']

export default function SlidersPage() {
  const [sliders, setSliders] = useState<Slider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchSliders()
  }, [])

  const fetchSliders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/sliders')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sliders')
      }
      
      setSliders(data.sliders || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sliders')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      return
    }

    try {
      const response = await fetch(`/api/admin/sliders/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete slider')
      }
      
      await fetchSliders()
      setDeleteConfirm(null)
    } catch (error: any) {
      setError(error.message || 'Failed to delete slider')
    }
  }

  const toggleSliderStatus = async (slider: Slider) => {
    try {
      const response = await fetch(`/api/admin/sliders/${slider.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...slider,
          is_active: !slider.is_active
        }),
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update slider')
      }
      
      await fetchSliders()
    } catch (error: any) {
      setError(error.message || 'Failed to update slider')
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sliders</h1>
          <p className="text-gray-600">Manage homepage slider images and content</p>
        </div>
        
        <Button asChild>
          <Link href="/admin/sliders/manage">
            <Plus className="mr-2 h-4 w-4" />
            Add Slider
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Sliders</CardTitle>
          <CardDescription>
            {sliders.length} {sliders.length === 1 ? 'slider' : 'sliders'} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sliders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No sliders found. Create your first slider to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sliders.map((slider) => (
                  <TableRow key={slider.id}>
                    <TableCell>
                      {slider.image_url ? (
                        <div className="w-16 h-10 relative rounded-md overflow-hidden">
                          <Image
                            src={slider.image_url}
                            alt={slider.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{slider.title}</div>
                        {slider.subtitle && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {slider.subtitle}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{slider.order_index}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={slider.is_active ? "default" : "secondary"}>
                        {slider.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(slider.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSliderStatus(slider)}
                        >
                          {slider.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/admin/sliders/manage?id=${slider.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant={deleteConfirm === slider.id ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => handleDelete(slider.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deleteConfirm === slider.id && (
                            <span className="ml-1">Confirm</span>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
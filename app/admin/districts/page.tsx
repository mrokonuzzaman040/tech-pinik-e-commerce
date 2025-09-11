'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface District {
  id: string
  name: string
  delivery_charge: number
  is_active: boolean
  created_at: string
}

export default function DistrictsPage() {
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    delivery_charge: '',
    is_active: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchDistricts()
  }, [])

  const fetchDistricts = async () => {
    try {
      const response = await fetch('/api/admin/districts')
      if (!response.ok) {
        throw new Error('Failed to fetch districts')
      }
      const data = await response.json()
      setDistricts(data.districts || [])
    } catch (error) {
      console.error('Error fetching districts:', error)
      alert('Failed to load districts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingDistrict 
        ? `/api/admin/districts/${editingDistrict.id}`
        : '/api/admin/districts'
      
      const method = editingDistrict ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          delivery_charge: parseFloat(formData.delivery_charge),
          is_active: formData.is_active
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save district')
      }

      await fetchDistricts()
      setIsDialogOpen(false)
      resetForm()
      alert(editingDistrict ? 'District updated successfully!' : 'District created successfully!')
    } catch (error) {
      console.error('Error saving district:', error)
      alert('Failed to save district')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (district: District) => {
    setEditingDistrict(district)
    setFormData({
      name: district.name,
      delivery_charge: district.delivery_charge.toString(),
      is_active: district.is_active
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this district?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/districts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete district')
      }

      await fetchDistricts()
      alert('District deleted successfully!')
    } catch (error) {
      console.error('Error deleting district:', error)
      alert('Failed to delete district')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      delivery_charge: '',
      is_active: true
    })
    setEditingDistrict(null)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading districts...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-8 w-8 text-blue-600" />
            Districts Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage delivery districts and their charges
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add District
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingDistrict ? 'Edit District' : 'Add New District'}
              </DialogTitle>
              <DialogDescription>
                {editingDistrict 
                  ? 'Update the district information below.'
                  : 'Add a new delivery district with its charge.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">District Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter district name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="delivery_charge">Delivery Charge (৳)</Label>
                  <Input
                    id="delivery_charge"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.delivery_charge}
                    onChange={(e) => setFormData(prev => ({ ...prev, delivery_charge: e.target.value }))}
                    placeholder="Enter delivery charge"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingDistrict ? 'Update' : 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Districts ({districts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {districts.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No districts found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first district to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>District Name</TableHead>
                  <TableHead>Delivery Charge</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {districts.map((district) => (
                  <TableRow key={district.id}>
                    <TableCell className="font-medium">
                      {district.name}
                    </TableCell>
                    <TableCell>
                      ৳{district.delivery_charge.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={district.is_active ? 'default' : 'secondary'}>
                        {district.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(district.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(district)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(district.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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
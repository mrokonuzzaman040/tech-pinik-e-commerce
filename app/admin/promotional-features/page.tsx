'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface PromotionalFeature {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const iconOptions = [
  { value: 'Truck', label: 'Truck (Delivery)' },
  { value: 'Shield', label: 'Shield (Warranty)' },
  { value: 'RotateCcw', label: 'RotateCcw (Return)' },
  { value: 'Clock', label: 'Clock (Time)' },
  { value: 'Star', label: 'Star (Quality)' },
  { value: 'Award', label: 'Award (Achievement)' },
  { value: 'CheckCircle', label: 'CheckCircle (Verified)' },
  { value: 'Heart', label: 'Heart (Love)' },
  { value: 'Gift', label: 'Gift (Bonus)' },
  { value: 'Zap', label: 'Zap (Fast)' }
];

export default function PromotionalFeaturesAdmin() {
  const [features, setFeatures] = useState<PromotionalFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFeature, setEditingFeature] = useState<PromotionalFeature | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon_name: '',
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await fetch('/api/promotional-features');
      if (response.ok) {
        const data = await response.json();
        setFeatures(data);
      }
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      title: '',
      description: '',
      icon_name: '',
      is_active: true,
      display_order: features.length + 1
    });
  };

  const handleEdit = (feature: PromotionalFeature) => {
    setEditingFeature(feature);
    setFormData({
      title: feature.title,
      description: feature.description,
      icon_name: feature.icon_name,
      is_active: feature.is_active,
      display_order: feature.display_order
    });
  };

  const handleSave = async () => {
    try {
      const url = '/api/promotional-features';
      const method = isCreating ? 'POST' : 'PUT';
      const body = isCreating ? formData : { ...formData, id: editingFeature?.id };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchFeatures();
        handleCancel();
      }
    } catch (error) {
      console.error('Error saving feature:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this feature?')) {
      try {
        const response = await fetch(`/api/promotional-features?id=${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchFeatures();
        }
      } catch (error) {
        console.error('Error deleting feature:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingFeature(null);
    setFormData({
      title: '',
      description: '',
      icon_name: '',
      is_active: true,
      display_order: 0
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Promotional Features Management</h1>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Feature
        </Button>
      </div>

      {(isCreating || editingFeature) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{isCreating ? 'Create New Feature' : 'Edit Feature'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Feature title"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Feature description"
              />
            </div>
            
            <div>
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={formData.icon_name}
                onValueChange={(value) => setFormData({ ...formData, icon_name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {features.map((feature) => (
          <Card key={feature.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-gray-600 mb-2">{feature.description}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Icon: {feature.icon_name}</span>
                    <span>Order: {feature.display_order}</span>
                    <span>Status: {feature.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(feature)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(feature.id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {features.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No promotional features found. Create your first feature to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
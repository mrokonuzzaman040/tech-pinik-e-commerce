'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Loader2, Eye, Search, Filter, Calendar, Printer } from 'lucide-react'
import { Database } from '@/lib/supabase'
import { format } from 'date-fns'

type Order = Database['public']['Tables']['orders']['Row']
type OrderUpdate = Database['public']['Tables']['orders']['Update']
type OrderItem = Database['public']['Tables']['order_items']['Row']

interface OrderWithDetails extends Order {
  customers?: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  order_items?: (OrderItem & {
    products?: {
      id: string
      name: string
      images: string[]
      sku: string
    }
  })[]
  districts?: {
    id: string
    name: string
    delivery_charge: number
  }
}

interface OrderFilters {
  status: string
  payment_status: string
  search: string
  start_date: string
  end_date: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<OrderWithDetails | null>(null)
  const [viewingOrder, setViewingOrder] = useState<OrderWithDetails | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  
  // Filters and pagination
  const [filters, setFilters] = useState<OrderFilters>({
    status: '',
    payment_status: '',
    search: '',
    start_date: '',
    end_date: ''
  })
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const [formData, setFormData] = useState<OrderUpdate>({
    status: 'pending',
    payment_status: 'pending',
    notes: ''
  })

  useEffect(() => {
    fetchOrders()
  }, [filters, pagination.page])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.payment_status && { payment_status: filters.payment_status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date })
      })

      const response = await fetch(`/api/admin/orders?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders')
      }
      
      setOrders(data.orders || [])
      setPagination(data.pagination)
    } catch (error: any) {
      console.error('Error fetching orders:', error)
      setError(error.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingOrder) return
    
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/orders/${editingOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order')
      }
      
      await fetchOrders()
      resetForm()
      setDialogOpen(false)
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (order: OrderWithDetails) => {
    setEditingOrder(order)
    setFormData({
      status: order.status,
      payment_status: order.payment_status,
      notes: order.notes || ''
    })
    setDialogOpen(true)
  }

  const handleView = async (order: OrderWithDetails) => {
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order details')
      }
      
      setViewingOrder(data.order)
      setViewDialogOpen(true)
    } catch (error: any) {
      setError(error.message || 'Failed to fetch order details')
    }
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id)
      return
    }

    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel order')
      }
      
      await fetchOrders()
      setDeleteConfirm(null)
    } catch (error: any) {
      setError(error.message || 'Failed to cancel order')
    }
  }

  const resetForm = () => {
    setFormData({
      status: 'pending',
      payment_status: 'pending',
      notes: ''
    })
    setEditingOrder(null)
    setError('')
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      partially_refunded: 'bg-orange-100 text-orange-800'
    }
    
    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    )
  }

  const handlePrintInvoice = (order: OrderWithDetails) => {
    // Create a professional invoice
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.order_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.4; 
              color: #333; 
              background: #fff;
              background-image: 
                radial-gradient(circle at 100% 50%, transparent 20%, rgba(59, 130, 246, 0.02) 21%, rgba(59, 130, 246, 0.02) 34%, transparent 35%, transparent),
                linear-gradient(0deg, rgba(59, 130, 246, 0.01) 50%, transparent 50%);
            }
            .invoice-container { 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 40px 30px; 
            }
            .invoice-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              margin-bottom: 40px; 
              border-bottom: 3px solid #3b82f6; 
              padding-bottom: 20px; 
            }
            .company-info { 
              flex: 1; 
            }
            .logo { 
              width: 120px; 
              height: auto; 
              margin-bottom: 10px; 
            }
            .company-name { 
              font-size: 28px; 
              font-weight: bold; 
              color: #3b82f6; 
              margin-bottom: 5px; 
            }
            .company-details { 
              font-size: 12px; 
              color: #666; 
              line-height: 1.5; 
            }
            .invoice-title { 
              text-align: right; 
              flex: 1; 
            }
            .invoice-title h1 { 
              font-size: 36px; 
              color: #3b82f6; 
              margin-bottom: 10px; 
            }
            .invoice-meta { 
              font-size: 14px; 
              color: #666; 
            }
            .invoice-meta p { 
              margin: 3px 0; 
            }
            .billing-shipping { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 40px; 
              gap: 40px; 
            }
            .bill-to, .ship-to { 
              flex: 1; 
            }
            .section-title { 
              font-size: 16px; 
              font-weight: bold; 
              color: #3b82f6; 
              margin-bottom: 10px; 
              text-transform: uppercase; 
              letter-spacing: 0.5px; 
            }
            .address-block { 
              background: #f8fafc; 
              padding: 15px; 
              border-radius: 8px; 
              border-left: 4px solid #3b82f6; 
            }
            .address-block p { 
              margin: 3px 0; 
              font-size: 14px; 
            }
            .customer-name { 
              font-weight: bold; 
              font-size: 16px; 
              color: #333; 
            }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 30px; 
              box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
            }
            .items-table th { 
              background: #3b82f6; 
              color: white; 
              padding: 12px 8px; 
              text-align: left; 
              font-weight: 600; 
              font-size: 14px; 
            }
            .items-table td { 
              padding: 12px 8px; 
              border-bottom: 1px solid #e5e7eb; 
              font-size: 14px; 
            }
            .items-table tr:nth-child(even) { 
              background: #f9fafb; 
            }
            .text-right { 
              text-align: right; 
            }
            .text-center { 
              text-align: center; 
            }
            .totals-section { 
              display: flex; 
              justify-content: flex-end; 
              margin-bottom: 40px; 
            }
            .totals-table { 
              width: 300px; 
              border-collapse: collapse; 
            }
            .totals-table td { 
              padding: 8px 12px; 
              border-bottom: 1px solid #e5e7eb; 
              font-size: 14px; 
            }
            .totals-table tr:last-child td { 
              border-bottom: 2px solid #3b82f6; 
              font-weight: bold; 
              font-size: 16px; 
              background: #f0f9ff; 
            }
            .payment-info { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 40px; 
              gap: 40px; 
            }
            .payment-section { 
              flex: 1; 
              background: #f8fafc; 
              padding: 20px; 
              border-radius: 8px; 
              border-left: 4px solid #f97316; 
            }
            .status-badge { 
              display: inline-block; 
              padding: 4px 12px; 
              border-radius: 20px; 
              font-size: 12px; 
              font-weight: bold; 
              text-transform: uppercase; 
              letter-spacing: 0.5px; 
            }
            .status-pending { 
              background: #fef3c7; 
              color: #92400e; 
            }
            .status-paid { 
              background: #d1fae5; 
              color: #065f46; 
            }
            .status-failed { 
              background: #fee2e2; 
              color: #991b1b; 
            }
            .footer { 
              text-align: center; 
              padding-top: 30px; 
              border-top: 1px solid #e5e7eb; 
              color: #666; 
              font-size: 12px; 
            }
            @media print { 
              body { margin: 0; }
              .invoice-container { padding: 20px; }
              .invoice-header { page-break-after: avoid; }
              .items-table { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <div class="company-info">
                <img src="/logo.jpeg" alt="TechPinik Logo" class="logo" style="mix-blend-mode: multiply; filter: contrast(1.2) brightness(1.1);" />
                <div class="company-name">TechPinik</div>
                <div class="company-details">
                  Your Tech Shopping Destination<br>
                  Email: support@techpinik.com<br>
                  Phone: +880 1814-931931<br>
                  Website: www.techpinik.com
                </div>
              </div>
              <div class="invoice-title">
                <h1>INVOICE</h1>
                <div class="invoice-meta">
                  <p><strong>Invoice #:</strong> ${order.order_number}</p>
                  <p><strong>Date:</strong> ${format(new Date(order.created_at), 'MMM dd, yyyy')}</p>
                  <p><strong>Due Date:</strong> ${format(new Date(order.created_at), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>
            
            <div class="billing-shipping">
              <div class="bill-to">
                <div class="section-title">Bill To</div>
                <div class="address-block">
                  <p class="customer-name">${order.customer_name}</p>
                  <p>${order.customer_email || 'N/A'}</p>
                  <p>${order.customer_phone}</p>
                  <p>${order.shipping_address_line_1}</p>
                  ${order.shipping_address_line_2 ? `<p>${order.shipping_address_line_2}</p>` : ''}
                  <p>${order.shipping_city}, ${order.shipping_district}</p>
                  <p>${order.shipping_country}</p>
                </div>
              </div>
              
              <div class="ship-to">
                <div class="section-title">Ship To</div>
                <div class="address-block">
                  <p class="customer-name">${order.customer_name}</p>
                  <p>${order.customer_phone}</p>
                  <p>${order.shipping_address_line_1}</p>
                  ${order.shipping_address_line_2 ? `<p>${order.shipping_address_line_2}</p>` : ''}
                  <p>${order.shipping_city}, ${order.shipping_district}</p>
                  <p>${order.shipping_country}</p>
                </div>
              </div>
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 50%">Description</th>
                  <th style="width: 15%" class="text-center">Qty</th>
                  <th style="width: 15%" class="text-right">Unit Price</th>
                  <th style="width: 20%" class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.order_items?.map(item => `
                  <tr>
                    <td>
                      <strong>${item.products?.name || 'Product'}</strong><br>
                      <small style="color: #666;">SKU: ${item.products?.sku || 'N/A'}</small>
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">৳${item.unit_price.toFixed(2)}</td>
                    <td class="text-right">৳${(item.quantity * item.unit_price).toFixed(2)}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
            
            <div class="totals-section">
              <table class="totals-table">
                <tr>
                  <td>Subtotal:</td>
                  <td class="text-right">৳${(order.total_amount - (order.shipping_cost || 0)).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Shipping:</td>
                  <td class="text-right">৳${(order.shipping_cost || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td><strong>Total Amount:</strong></td>
                  <td class="text-right"><strong>৳${order.total_amount.toFixed(2)}</strong></td>
                </tr>
              </table>
            </div>
            
            <div class="payment-info">
              <div class="payment-section">
                <div class="section-title">Payment Information</div>
                <p><strong>Method:</strong> ${order.payment_method || 'Cash on Delivery'}</p>
                <p><strong>Status:</strong> 
                  <span class="status-badge ${order.payment_status === 'paid' ? 'status-paid' : order.payment_status === 'failed' ? 'status-failed' : 'status-pending'}">
                    ${order.payment_status}
                  </span>
                </p>
              </div>
              
              <div class="payment-section">
                <div class="section-title">Order Status</div>
                <p><strong>Current Status:</strong> ${order.status}</p>
                <p><strong>Order Date:</strong> ${format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}</p>
                ${order.updated_at !== order.created_at ? `<p><strong>Last Updated:</strong> ${format(new Date(order.updated_at), 'MMM dd, yyyy HH:mm')}</p>` : ''}
              </div>
            </div>
            
            <div style="margin-bottom: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <div class="section-title" style="margin-bottom: 10px;">Terms & Conditions</div>
              <div style="font-size: 12px; color: #666; line-height: 1.5;">
                <p>• Payment is due within 30 days of invoice date.</p>
                <p>• Returns are accepted within 14 days of delivery with original packaging.</p>
                <p>• Warranty terms apply as per product specifications.</p>
                <p>• Delivery charges are non-refundable unless product is defective.</p>
              </div>
            </div>
            
            <div class="footer">
              <p style="font-size: 16px; font-weight: bold; color: #3b82f6; margin-bottom: 10px;">Thank you for choosing TechPinik!</p>
              <p>This is a computer-generated invoice and does not require a signature.</p>
              <p style="margin-top: 10px;">For any questions regarding this invoice, please contact us at support@techpinik.com</p>
              <p style="margin-top: 15px; font-style: italic;">Your trusted partner in technology solutions.</p>
            </div>
          </div>
        </body>
      </html>
    `
    
    printWindow.document.write(invoiceHTML)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleFilterChange = (key: keyof OrderFilters, value: string) => {
    // Convert "all" back to empty string for API filtering
    const filterValue = value === 'all' ? '' : value
    setFilters(prev => ({ ...prev, [key]: filterValue }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      payment_status: '',
      search: '',
      start_date: '',
      end_date: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  if (loading && orders.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and track their status</p>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Order number, customer..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Order Status</Label>
              <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select value={filters.payment_status || 'all'} onValueChange={(value) => handleFilterChange('payment_status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All payment statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payment statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({pagination.total})</CardTitle>
          <CardDescription>
            Showing {orders.length} of {pagination.total} orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Shipping</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-[120px] truncate" title={order.order_number}>
                        {order.order_number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer_email || 'Guest Order'}
                        </div>
                        <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      ৳{(order.total_amount - (order.shipping_cost || 0)).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      ৳{(order.shipping_cost || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      ৳{order.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(order.payment_status)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(order)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintInvoice(order)}
                          title="Print Invoice"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {(order.status === 'pending' || order.status === 'cancelled') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(order.id)}
                            className={deleteConfirm === order.id ? 'text-red-600' : ''}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Update order status and payment information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Order Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="payment_status">Payment Status</Label>
                <Select
                  value={formData.payment_status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add notes about this order..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              <span className="max-w-[400px] truncate inline-block" title={viewingOrder?.order_number}>
                {viewingOrder?.order_number}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          {viewingOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Order Information</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Order Number:</span> 
                      <span className="break-all" title={viewingOrder.order_number}>
                        {viewingOrder.order_number}
                      </span>
                    </div>
                    <div><span className="font-medium">Status:</span> {getStatusBadge(viewingOrder.status)}</div>
                    <div><span className="font-medium">Payment:</span> {getPaymentStatusBadge(viewingOrder.payment_status)}</div>
                    <div><span className="font-medium">Date:</span> {format(new Date(viewingOrder.created_at), 'MMM dd, yyyy HH:mm')}</div>
                    {viewingOrder.payment_method && (
                      <div><span className="font-medium">Payment Method:</span> {viewingOrder.payment_method}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Name:</span> {viewingOrder.customer_name}</div>
                    <div><span className="font-medium">Email:</span> {viewingOrder.customer_email || 'Not provided (Guest Order)'}</div>
                    <div><span className="font-medium">Phone:</span> {viewingOrder.customer_phone}</div>
                    <div><span className="font-medium">Type:</span> {viewingOrder.customer_email ? 'Registered Customer' : 'Guest Order'}</div>
                  </div>
                </div>
              </div>
              
              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <div className="text-sm space-y-1">
                  <div>{viewingOrder.shipping_address_line_1}</div>
                  {viewingOrder.shipping_address_line_2 && <div>{viewingOrder.shipping_address_line_2}</div>}
                  <div>{viewingOrder.shipping_city}, {(viewingOrder as any).shipping_district}</div>
                  <div>{viewingOrder.shipping_country}</div>
                </div>
              </div>
              
              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingOrder.order_items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.product_sku}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>৳{item.unit_price.toFixed(2)}</TableCell>
                        <TableCell>৳{item.total_price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>৳{(viewingOrder.total_amount - (viewingOrder.shipping_cost || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping ({viewingOrder.shipping_district}):</span>
                      <span>৳{(viewingOrder.shipping_cost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Amount:</span>
                      <span>৳{viewingOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              {viewingOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded">{viewingOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
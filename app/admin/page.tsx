'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package, 
  FolderOpen, 
  Image, 
  TrendingUp,
  ShoppingCart,
  Users,
  MapPin,
  Star
} from 'lucide-react'

interface DashboardStats {
  totalProducts: number
  totalCategories: number
  totalSliders: number
  recentProducts: number
  totalOrders: number
  totalCustomers: number
  pendingOrders: number
  recentOrders: number
  totalDistricts: number
  activeDistricts: number
  totalPromotionalFeatures: number
  activePromotionalFeatures: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalSliders: 0,
    recentProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    recentOrders: 0,
    totalDistricts: 0,
    activeDistricts: 0,
    totalPromotionalFeatures: 0,
    activePromotionalFeatures: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total products
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })

        // Get total categories
        const { count: categoriesCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })

        // Get total sliders
        const { count: slidersCount } = await supabase
          .from('sliders')
          .select('*', { count: 'exact', head: true })

        // Get recent products (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const { count: recentProductsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString())

        // Get total orders
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })

        // Get total customers
        const { count: customersCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })

        // Get pending orders
        const { count: pendingOrdersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        // Get recent orders (last 7 days)
        const { count: recentOrdersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString())

        // Get total districts
        const { count: districtsCount } = await supabase
          .from('districts')
          .select('*', { count: 'exact', head: true })

        // Get active districts
        const { count: activeDistrictsCount } = await supabase
          .from('districts')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        // Get total promotional features
        const { count: promotionalFeaturesCount } = await supabase
          .from('promotional_features')
          .select('*', { count: 'exact', head: true })

        // Get active promotional features
        const { count: activePromotionalFeaturesCount } = await supabase
          .from('promotional_features')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        setStats({
          totalProducts: productsCount || 0,
          totalCategories: categoriesCount || 0,
          totalSliders: slidersCount || 0,
          recentProducts: recentProductsCount || 0,
          totalOrders: ordersCount || 0,
          totalCustomers: customersCount || 0,
          pendingOrders: pendingOrdersCount || 0,
          recentOrders: recentOrdersCount || 0,
          totalDistricts: districtsCount || 0,
          activeDistricts: activeDistrictsCount || 0,
          totalPromotionalFeatures: promotionalFeaturesCount || 0,
          activePromotionalFeatures: activePromotionalFeaturesCount || 0
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      description: 'Products in your store',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      description: 'Product categories',
      icon: FolderOpen,
      color: 'text-green-600'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      description: 'All orders received',
      icon: ShoppingCart,
      color: 'text-orange-600'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      description: 'Registered customers',
      icon: Users,
      color: 'text-indigo-600'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      description: 'Orders awaiting processing',
      icon: ShoppingCart,
      color: 'text-yellow-600'
    },
    {
      title: 'Recent Orders',
      value: stats.recentOrders,
      description: 'Orders in last 7 days',
      icon: TrendingUp,
      color: 'text-red-600'
    },
    {
      title: 'Sliders',
      value: stats.totalSliders,
      description: 'Homepage sliders',
      icon: Image,
      color: 'text-purple-600'
    },
    {
      title: 'Recent Products',
      value: stats.recentProducts,
      description: 'Added in last 7 days',
      icon: TrendingUp,
      color: 'text-emerald-600'
    },
    {
      title: 'Total Districts',
      value: stats.totalDistricts,
      description: 'Delivery districts',
      icon: MapPin,
      color: 'text-cyan-600'
    },
    {
      title: 'Active Districts',
      value: stats.activeDistricts,
      description: 'Available for delivery',
      icon: MapPin,
      color: 'text-teal-600'
    },
    {
      title: 'Promotional Features',
      value: stats.totalPromotionalFeatures,
      description: 'Total features',
      icon: Star,
      color: 'text-amber-600'
    },
    {
      title: 'Active Features',
      value: stats.activePromotionalFeatures,
      description: 'Currently displayed',
      icon: Star,
      color: 'text-yellow-600'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to TechPinik Admin Panel</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to TechPinik Admin Panel</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <a
                href="/admin/products"
                className="flex items-center p-3 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Package className="h-4 w-4 mr-3 text-blue-600" />
                Manage Products
              </a>
              <a
                href="/admin/categories"
                className="flex items-center p-3 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FolderOpen className="h-4 w-4 mr-3 text-green-600" />
                Manage Categories
              </a>
              <a
                href="/admin/orders"
                className="flex items-center p-3 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ShoppingCart className="h-4 w-4 mr-3 text-orange-600" />
                Manage Orders
              </a>
              <a
                href="/admin/customers"
                className="flex items-center p-3 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="h-4 w-4 mr-3 text-indigo-600" />
                Manage Customers
              </a>
              <a
                href="/admin/sliders"
                className="flex items-center p-3 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Image className="h-4 w-4 mr-3 text-purple-600" />
                Manage Sliders
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Storage</span>
                <span className="text-sm font-medium text-green-600">Available</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/supabase'
import CategoryScrollClient from '@/components/category-scroll-client'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  is_active: boolean
}

async function getCategories(): Promise<Category[]> {
  const supabase = createSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error fetching categories:', err)
    return []
  }
}

export default async function CategoryScroll() {
  const categories = await getCategories()

  if (categories.length === 0) {
    return (
      <div className="w-full py-8">
        <div className="text-center text-gray-500">No categories available</div>
      </div>
    );
  }

  return <CategoryScrollClient categories={categories} />;
}
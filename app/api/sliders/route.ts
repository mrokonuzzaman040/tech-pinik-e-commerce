import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

// GET - Fetch active sliders for public use
export async function GET() {
  try {
    const supabase = createSupabaseClient()
    
    const { data: sliders, error } = await supabase
      .from('sliders')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
    
    if (error) {
      console.error('Error fetching sliders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sliders' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ sliders: sliders || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: districts, error } = await supabase
      .from('districts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching districts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch districts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ districts });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { name, delivery_charge, is_active } = await request.json();

    if (!name || delivery_charge === undefined) {
      return NextResponse.json(
        { error: 'Name and delivery charge are required' },
        { status: 400 }
      );
    }

    const { data: district, error } = await supabase
      .from('districts')
      .insert({
        name,
        delivery_charge: parseFloat(delivery_charge),
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating district:', error);
      return NextResponse.json(
        { error: 'Failed to create district' },
        { status: 500 }
      );
    }

    return NextResponse.json({ district }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
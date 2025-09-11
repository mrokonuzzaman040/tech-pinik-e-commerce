import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    
    const { data: features, error } = await supabase
      .from('promotional_features')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching promotional features:', error);
      return NextResponse.json(
        { error: 'Failed to fetch promotional features' },
        { status: 500 }
      );
    }

    return NextResponse.json(features || []);
  } catch (error) {
    console.error('Error in promotional features API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { data: feature, error } = await supabase
      .from('promotional_features')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating promotional feature:', error);
      return NextResponse.json(
        { error: 'Failed to create promotional feature' },
        { status: 500 }
      );
    }

    return NextResponse.json(feature);
  } catch (error) {
    console.error('Error in promotional features POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    // console.log('PUT request body:', body);
    // console.log('Update data:', updateData);
    // console.log('ID to update:', id);
    
    // First check if the record exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('promotional_features')
      .select('id')
      .eq('id', id)
      .single();
    
    if (checkError || !existingRecord) {
      console.error('Record not found:', checkError);
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }
    
    const { data: feature, error } = await supabase
      .from('promotional_features')
      .update(updateData)
      .eq('id', id)
      .select();
    
    // console.log('Update result:', { feature, error });
    
    if (error) {
      console.error('Error updating promotional feature:', error);
      return NextResponse.json(
        { error: 'Failed to update promotional feature' },
        { status: 500 }
      );
    }
    
    if (!feature || feature.length === 0) {
      console.error('No rows updated');
      return NextResponse.json(
        { error: 'No rows updated' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(feature[0]);
  } catch (error) {
    console.error('Error in promotional features PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Feature ID is required' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('promotional_features')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting promotional feature:', error);
      return NextResponse.json(
        { error: 'Failed to delete promotional feature' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in promotional features DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
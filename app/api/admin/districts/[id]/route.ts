import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseAdminClient();
    const { name, delivery_charge, is_active } = await request.json();
    const { id } = await params;



    if (!name || delivery_charge === undefined) {
      return NextResponse.json(
        { error: 'Name and delivery charge are required' },
        { status: 400 }
      );
    }

    const { data: districts, error } = await supabase
      .from('districts')
      .update({
        name,
        delivery_charge: parseFloat(delivery_charge),
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();



    if (error) {
      console.error('Error updating district:', error);
      return NextResponse.json(
        { error: 'Failed to update district' },
        { status: 500 }
      );
    }

    if (!districts || districts.length === 0) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 404 }
      );
    }

    const district = districts[0];

    return NextResponse.json({ district });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseAdminClient();
    const { id } = await params;

    const { error } = await supabase
      .from('districts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting district:', error);
      return NextResponse.json(
        { error: 'Failed to delete district' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'District deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
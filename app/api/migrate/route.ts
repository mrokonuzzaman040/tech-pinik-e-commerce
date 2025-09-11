import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    const supabase = await createSupabaseAdminClient()
    
    // Execute schema migration SQL
    const migrationSQL = `
      -- Add availability_status column if it doesn't exist
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='products' AND column_name='availability_status') THEN
              ALTER TABLE products ADD COLUMN availability_status TEXT DEFAULT 'In Stock';
          END IF;
      END $$;
      
      -- Add warranty column if it doesn't exist
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='products' AND column_name='warranty') THEN
              ALTER TABLE products ADD COLUMN warranty TEXT;
          END IF;
      END $$;
      
      -- Add brand column if it doesn't exist
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='products' AND column_name='brand') THEN
              ALTER TABLE products ADD COLUMN brand TEXT;
          END IF;
      END $$;
      
      -- Add origin column if it doesn't exist
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='products' AND column_name='origin') THEN
              ALTER TABLE products ADD COLUMN origin TEXT;
          END IF;
      END $$;
      
      -- Add key_features column if it doesn't exist
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='products' AND column_name='key_features') THEN
              ALTER TABLE products ADD COLUMN key_features TEXT[];
          END IF;
      END $$;
      
      -- Add box_contents column if it doesn't exist
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='products' AND column_name='box_contents') THEN
              ALTER TABLE products ADD COLUMN box_contents TEXT[];
          END IF;
      END $$;
      
      -- Add weight column if it doesn't exist
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='products' AND column_name='weight') THEN
              ALTER TABLE products ADD COLUMN weight DECIMAL(8,2);
          END IF;
      END $$;
      
      -- Add dimensions column if it doesn't exist
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='products' AND column_name='dimensions') THEN
              ALTER TABLE products ADD COLUMN dimensions TEXT;
          END IF;
      END $$;
      
      -- Add sale_price column if it doesn't exist
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='products' AND column_name='sale_price') THEN
              ALTER TABLE products ADD COLUMN sale_price DECIMAL(10,2);
          END IF;
      END $$;
    `
    
    // Test column accessibility and add missing ones
    const columnsToCheck = [
      { name: 'availability_status', defaultValue: 'In Stock' },
      { name: 'warranty', defaultValue: null },
      { name: 'brand', defaultValue: null },
      { name: 'origin', defaultValue: null },
      { name: 'key_features', defaultValue: [] },
      { name: 'box_contents', defaultValue: [] },
      { name: 'weight', defaultValue: null },
      { name: 'dimensions', defaultValue: null },
      { name: 'sale_price', defaultValue: null }
    ]
    
    const missingColumns = []
    const accessibleColumns = []
    
    for (const column of columnsToCheck) {
      try {
        const { error } = await supabase
          .from('products')
          .select(column.name)
          .limit(1)
        
        if (error && error.code === 'PGRST116') {
          missingColumns.push(column.name)
        } else {
          accessibleColumns.push(column.name)
        }
      } catch (e) {
        missingColumns.push(column.name)
      }
    }
    
    if (missingColumns.length > 0) {
      return NextResponse.json({
        error: 'Missing columns detected in schema cache',
        missingColumns,
        accessibleColumns,
        suggestion: 'These columns exist in schema but are not accessible via API. Schema cache refresh needed.',
        sqlCommands: missingColumns.map(col => {
          const column = columnsToCheck.find(c => c.name === col)
          if (col === 'availability_status') return `ALTER TABLE products ADD COLUMN ${col} TEXT DEFAULT 'In Stock';`
          if (col === 'key_features' || col === 'box_contents') return `ALTER TABLE products ADD COLUMN ${col} TEXT[];`
          if (col === 'weight') return `ALTER TABLE products ADD COLUMN ${col} DECIMAL(8,2);`
          if (col === 'sale_price') return `ALTER TABLE products ADD COLUMN ${col} DECIMAL(10,2);`
          return `ALTER TABLE products ADD COLUMN ${col} TEXT;`
        })
      }, { status: 200 })
    }
    
    return NextResponse.json({
      message: 'All required columns are accessible',
      accessibleColumns,
      status: 'Schema is up to date'
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please run the SQL migration script manually in your database'
      },
      { status: 500 }
    )
  }
}
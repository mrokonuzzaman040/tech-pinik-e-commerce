#!/usr/bin/env node

/**
 * Seed Database Script
 * This script populates the database with sample data for testing the admin panel
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease check your .env.local file.')
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')
    
    // Read the SQL seed file
    const sqlFilePath = path.join(__dirname, 'seed-data.sql')
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (statement.toLowerCase().includes('insert into')) {
        const tableName = statement.match(/insert into (\w+)/i)?.[1]
        console.log(`   Inserting data into ${tableName}...`)
      } else if (statement.toLowerCase().includes('select')) {
        console.log(`   Executing query...`)
      }
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // Try alternative method for simple queries
          if (statement.toLowerCase().startsWith('select')) {
            const { data: queryData, error: queryError } = await supabase
              .from('categories')
              .select('count')
              .limit(1)
            
            if (queryError && !queryError.message.includes('does not exist')) {
              console.warn(`   ⚠️  Warning: ${queryError.message}`)
            }
          } else {
            console.warn(`   ⚠️  Warning: ${error.message}`)
          }
        }
      } catch (err) {
        console.warn(`   ⚠️  Warning executing statement: ${err.message}`)
      }
    }
    
    // Verify the data was inserted by checking counts
    console.log('\n📊 Verifying inserted data:')
    
    const tables = ['categories', 'products', 'customers', 'orders', 'order_items', 'sliders']
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`   ${table}: Error - ${error.message}`)
        } else {
          console.log(`   ${table}: ${count} records`)
        }
      } catch (err) {
        console.log(`   ${table}: Error - ${err.message}`)
      }
    }
    
    console.log('\n✅ Database seeding completed!')
    console.log('\n🎯 You can now test the admin panel with sample data:')
    console.log('   - 5 Categories (Electronics, Computers, Mobile Phones, Gaming, Audio)')
    console.log('   - 10 Products (MacBook Pro, iPhone, Samsung Galaxy, PlayStation, etc.)')
    console.log('   - 8 Customers with complete profile information')
    console.log('   - 10 Orders with various statuses (pending, confirmed, shipped, delivered)')
    console.log('   - 10 Order items linking products to orders')
    console.log('   - 5 Homepage sliders for testing')
    console.log('\n🚀 Start your development server and visit /admin to see the data!')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message)
    process.exit(1)
  }
}

// Alternative method using direct SQL execution
async function seedDatabaseDirect() {
  try {
    console.log('🌱 Starting database seeding (direct method)...')
    
    // Insert categories
    console.log('📝 Inserting categories...')
    const { error: categoriesError } = await supabase
      .from('categories')
      .upsert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Electronics',
          description: 'Electronic devices and gadgets',
          slug: 'electronics',
          image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Computers',
          description: 'Laptops, desktops, and computer accessories',
          slug: 'computers',
          image_url: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400',
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Mobile Phones',
          description: 'Smartphones and mobile accessories',
          slug: 'mobile-phones',
          image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          name: 'Gaming',
          description: 'Gaming consoles, accessories, and games',
          slug: 'gaming',
          image_url: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400',
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440005',
          name: 'Audio',
          description: 'Headphones, speakers, and audio equipment',
          slug: 'audio',
          image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
          is_active: true
        }
      ], { onConflict: 'id' })
    
    if (categoriesError) {
      console.error('Error inserting categories:', categoriesError)
    } else {
      console.log('✅ Categories inserted successfully')
    }
    
    // Insert products
    console.log('📝 Inserting products...')
    const { error: productsError } = await supabase
      .from('products')
      .upsert([
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          name: 'MacBook Pro 16"',
          description: 'Apple MacBook Pro 16-inch with M3 Pro chip, 18GB RAM, 512GB SSD',
          price: 2499.00,
          sale_price: 2299.00,
          sku: 'MBP-16-M3-512',
          stock_quantity: 15,
          category_id: '550e8400-e29b-41d4-a716-446655440002',
          images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600'],
          is_active: true,
          is_featured: true,
          weight: 2.1,
          dimensions: '35.57 x 24.81 x 1.68 cm'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440002',
          name: 'iPhone 15 Pro',
          description: 'Apple iPhone 15 Pro with A17 Pro chip, 128GB storage',
          price: 999.00,
          sale_price: 949.00,
          sku: 'IPH-15-PRO-128',
          stock_quantity: 25,
          category_id: '550e8400-e29b-41d4-a716-446655440003',
          images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600', 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600'],
          is_active: true,
          is_featured: true,
          weight: 0.187,
          dimensions: '14.67 x 7.09 x 0.83 cm'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440003',
          name: 'Samsung Galaxy S24 Ultra',
          description: 'Samsung Galaxy S24 Ultra with S Pen, 256GB storage',
          price: 1199.00,
          sale_price: null,
          sku: 'SGS-24-ULTRA-256',
          stock_quantity: 20,
          category_id: '550e8400-e29b-41d4-a716-446655440003',
          images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600'],
          is_active: true,
          is_featured: false,
          weight: 0.232,
          dimensions: '16.26 x 7.90 x 0.86 cm'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440004',
          name: 'PlayStation 5',
          description: 'Sony PlayStation 5 Gaming Console with DualSense Controller',
          price: 499.00,
          sale_price: null,
          sku: 'PS5-CONSOLE-STD',
          stock_quantity: 8,
          category_id: '550e8400-e29b-41d4-a716-446655440004',
          images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600'],
          is_active: true,
          is_featured: true,
          weight: 4.5,
          dimensions: '39.0 x 26.0 x 10.4 cm'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440005',
          name: 'AirPods Pro 2nd Gen',
          description: 'Apple AirPods Pro with Active Noise Cancellation',
          price: 249.00,
          sale_price: 199.00,
          sku: 'APP-PRO-2ND-GEN',
          stock_quantity: 50,
          category_id: '550e8400-e29b-41d4-a716-446655440005',
          images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600'],
          is_active: true,
          is_featured: false,
          weight: 0.056,
          dimensions: '6.11 x 4.5 x 2.17 cm'
        }
      ], { onConflict: 'id' })
    
    if (productsError) {
      console.error('Error inserting products:', productsError)
    } else {
      console.log('✅ Products inserted successfully')
    }
    
    // Insert customers
    console.log('📝 Inserting customers...')
    const { error: customersError } = await supabase
      .from('customers')
      .upsert([
        {
          id: '770e8400-e29b-41d4-a716-446655440001',
          email: 'john.doe@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone: '+8801712345678',
          address_line_1: '123 Main Street',
          address_line_2: 'Apt 4B',
          city: 'Dhaka',
          state: 'Dhaka Division',
          postal_code: '1000',
          country: 'Bangladesh',
          is_active: true
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440002',
          email: 'jane.smith@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          phone: '+8801812345679',
          address_line_1: '456 Oak Avenue',
          address_line_2: null,
          city: 'Chittagong',
          state: 'Chittagong Division',
          postal_code: '4000',
          country: 'Bangladesh',
          is_active: true
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440003',
          email: 'mike.johnson@example.com',
          first_name: 'Mike',
          last_name: 'Johnson',
          phone: '+8801912345680',
          address_line_1: '789 Pine Road',
          address_line_2: 'Suite 12',
          city: 'Sylhet',
          state: 'Sylhet Division',
          postal_code: '3100',
          country: 'Bangladesh',
          is_active: true
        }
      ], { onConflict: 'id' })
    
    if (customersError) {
      console.error('Error inserting customers:', customersError)
    } else {
      console.log('✅ Customers inserted successfully')
    }
    
    // Insert orders
    console.log('📝 Inserting orders...')
    const { error: ordersError } = await supabase
      .from('orders')
      .upsert([
        {
          id: '880e8400-e29b-41d4-a716-446655440001',
          order_number: 'ORD-2024-001',
          customer_id: '770e8400-e29b-41d4-a716-446655440001',
          customer_email: 'john.doe@example.com',
          customer_name: 'John Doe',
          customer_phone: '+8801712345678',
          shipping_address_line_1: '123 Main Street',
          shipping_address_line_2: 'Apt 4B',
          shipping_city: 'Dhaka',
          shipping_district: 'Dhaka',
          shipping_country: 'Bangladesh',
          total_amount: 2299.00,
          status: 'delivered',
          payment_status: 'paid',
          notes: 'Customer requested express delivery'
        },
        {
          id: '880e8400-e29b-41d4-a716-446655440002',
          order_number: 'ORD-2024-002',
          customer_id: '770e8400-e29b-41d4-a716-446655440002',
          customer_email: 'jane.smith@example.com',
          customer_name: 'Jane Smith',
          customer_phone: '+8801812345679',
          shipping_address_line_1: '456 Oak Avenue',
          shipping_address_line_2: null,
          shipping_city: 'Chittagong',
          shipping_district: 'Chittagong',
          shipping_country: 'Bangladesh',
          total_amount: 949.00,
          status: 'shipped',
          payment_status: 'paid',
          notes: null
        },
        {
          id: '880e8400-e29b-41d4-a716-446655440003',
          order_number: 'ORD-2024-003',
          customer_id: '770e8400-e29b-41d4-a716-446655440003',
          customer_email: 'mike.johnson@example.com',
          customer_name: 'Mike Johnson',
          customer_phone: '+8801912345680',
          shipping_address_line_1: '789 Pine Road',
          shipping_address_line_2: 'Suite 12',
          shipping_city: 'Sylhet',
          shipping_district: 'Sylhet',
          shipping_country: 'Bangladesh',
          total_amount: 1199.00,
          status: 'processing',
          payment_status: 'paid',
          notes: 'Gift wrapping requested'
        }
      ], { onConflict: 'id' })
    
    if (ordersError) {
      console.error('Error inserting orders:', ordersError)
    } else {
      console.log('✅ Orders inserted successfully')
    }
    
    // Insert sliders
    console.log('📝 Inserting sliders...')
    const { error: slidersError } = await supabase
      .from('sliders')
      .upsert([
        {
          id: 'aa0e8400-e29b-41d4-a716-446655440001',
          title: 'Latest MacBook Pro',
          image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200',
          link_url: '/products/macbook-pro-16',
          button_text: 'Shop Now',
          order_index: 1,
          is_active: true
        },
        {
          id: 'aa0e8400-e29b-41d4-a716-446655440002',
          title: 'iPhone 15 Pro Series',
          image_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200',
          link_url: '/products/iphone-15-pro',
          button_text: 'Discover',
          order_index: 2,
          is_active: true
        },
        {
          id: 'aa0e8400-e29b-41d4-a716-446655440003',
          title: 'Gaming Paradise',
          image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200',
          link_url: '/categories/gaming',
          button_text: 'Explore Games',
          order_index: 3,
          is_active: true
        }
      ], { onConflict: 'id' })
    
    if (slidersError) {
      console.error('Error inserting sliders:', slidersError)
    } else {
      console.log('✅ Sliders inserted successfully')
    }
    
    console.log('\n✅ Database seeding completed successfully!')
    console.log('\n🎯 Sample data has been added to your database:')
    console.log('   - Categories: Electronics, Computers, Mobile Phones, Gaming, Audio')
    console.log('   - Products: MacBook Pro, iPhone 15 Pro, Samsung Galaxy S24, PlayStation 5, AirPods Pro')
    console.log('   - Customers: John Doe, Jane Smith, Mike Johnson')
    console.log('   - Orders: 3 sample orders with different statuses')
    console.log('   - Sliders: 3 homepage sliders')
    console.log('\n🚀 You can now test the admin panel at /admin')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message)
    process.exit(1)
  }
}

// Run the seeding function
if (require.main === module) {
  console.log('🌱 TechPinik Database Seeder')
  console.log('================================\n')
  
  // Use direct method as it's more reliable
  seedDatabaseDirect()
    .then(() => {
      console.log('\n🎉 Seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error.message)
      process.exit(1)
    })
}

module.exports = { seedDatabase, seedDatabaseDirect }
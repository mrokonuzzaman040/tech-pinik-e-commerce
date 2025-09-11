# Database Seeding Scripts

This directory contains scripts to populate your TechPinik database with sample data for testing the admin panel.

## Files

- `seed-data.sql` - Raw SQL file with sample data
- `seed-database.js` - Node.js script to execute the seeding process
- `README.md` - This documentation file

## Prerequisites

Before running the seed scripts, ensure you have:

1. **Environment Variables**: Your `.env.local` file must contain:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Database Schema**: The database tables must already exist. Run the schema from `supabase-schema.sql` first if you haven't already.

3. **Dependencies**: All required npm packages are installed (run `npm install` if needed).

## How to Run

### Method 1: Using npm script (Recommended)

```bash
npm run seed
```

### Method 2: Direct execution

```bash
node scripts/seed-database.js
```

### Method 3: SQL file directly (if you have psql access)

```bash
psql -h your_host -U your_user -d your_database -f scripts/seed-data.sql
```

## What Gets Created

The seeding process will create the following sample data:

### 📂 Categories (5 items)
- Electronics
- Computers  
- Mobile Phones
- Gaming
- Audio

### 📦 Products (10 items)
- MacBook Pro 16" (Featured)
- iPhone 15 Pro (Featured)
- Samsung Galaxy S24 Ultra
- PlayStation 5 (Featured)
- AirPods Pro 2nd Gen
- Dell XPS 13
- Sony WH-1000XM5 (Featured)
- iPad Air 5th Gen
- Nintendo Switch OLED
- Samsung 4K Monitor

### 👥 Customers (8 items)
- John Doe (Dhaka)
- Jane Smith (Chittagong)
- Mike Johnson (Sylhet)
- Sarah Wilson (Rajshahi)
- David Brown (Khulna)
- Emily Davis (Barisal)
- Alex Garcia (Rangpur)
- Lisa Martinez (Mymensingh)

### 📋 Orders (10 items)
Orders with various statuses:
- **Delivered**: 2 orders
- **Shipped**: 2 orders
- **Processing**: 2 orders
- **Confirmed**: 1 order
- **Pending**: 2 orders
- **Cancelled**: 1 order

Payment statuses:
- **Paid**: 8 orders
- **Pending**: 2 orders
- **Failed**: 1 order

### 🎨 Homepage Sliders (5 items)
- Latest MacBook Pro
- iPhone 15 Pro Series
- Gaming Paradise
- Audio Excellence (inactive)
- Tech Sale Event

## Testing the Admin Panel

After seeding, you can test various admin panel features:

1. **Dashboard**: View statistics and recent data
2. **Products**: Browse, edit, and manage the 10 sample products
3. **Categories**: Manage the 5 product categories
4. **Orders**: View and update order statuses and payment information
5. **Customers**: Browse customer profiles and order history
6. **Sliders**: Manage homepage slider content

## Data Characteristics

- **Realistic Data**: All sample data uses realistic product names, prices, and descriptions
- **Image URLs**: Uses Unsplash images for product and category photos
- **Bangladesh Context**: Customer addresses use Bangladeshi cities and divisions
- **Varied Statuses**: Orders have different statuses to test filtering and management
- **Price Ranges**: Products range from ৳199 to ৳2,499 to test various scenarios
- **Stock Levels**: Different stock quantities to test inventory management

## Troubleshooting

### Common Issues

1. **Environment Variables Missing**
   ```
   ❌ Missing required environment variables:
      - NEXT_PUBLIC_SUPABASE_URL
      - SUPABASE_SERVICE_ROLE_KEY
   ```
   **Solution**: Check your `.env.local` file and ensure both variables are set.

2. **Permission Errors**
   ```
   Error: insufficient_privilege
   ```
   **Solution**: Ensure you're using the `SUPABASE_SERVICE_ROLE_KEY`, not the anon key.

3. **Table Doesn't Exist**
   ```
   Error: relation "products" does not exist
   ```
   **Solution**: Run the database schema first using `supabase-schema.sql`.

4. **Duplicate Key Errors**
   ```
   Error: duplicate key value violates unique constraint
   ```
   **Solution**: The script uses `UPSERT` operations, so this shouldn't happen. If it does, you can safely re-run the script.

### Verification

After seeding, the script will show a summary:

```
📊 Verifying inserted data:
   categories: 5 records
   products: 10 records
   customers: 8 records
   orders: 10 records
   order_items: 10 records
   sliders: 5 records
```

## Resetting Data

To reset and re-seed the database:

1. **Clear existing data** (optional):
   ```sql
   TRUNCATE TABLE order_items, orders, customers, products, categories, sliders CASCADE;
   ```

2. **Re-run the seed script**:
   ```bash
   npm run seed
   ```

## Customization

To customize the seed data:

1. **Edit `seed-data.sql`** for SQL-based changes
2. **Edit `seed-database.js`** for programmatic changes
3. **Add your own data** by following the existing patterns

## Security Note

⚠️ **Important**: This seed data is for development and testing only. Never use this data in a production environment as it contains:

- Predictable UUIDs
- Sample customer information
- Test email addresses
- Demo product data

Always use real, unique data for production deployments.
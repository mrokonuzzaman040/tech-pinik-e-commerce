# TechPinik E-commerce Admin Panel

A modern, full-featured admin panel for managing e-commerce products, categories, and homepage sliders. Built with Next.js 15, TypeScript, Tailwind CSS, ShadcnUI, and Supabase.

## Features

### 🔐 Authentication & Authorization
- Secure admin authentication with Supabase Auth
- Role-based access control
- Protected admin routes
- Session management

### 📦 Product Management
- Complete CRUD operations for products
- Image upload with optimization
- SKU generation
- Category assignment
- Stock management
- Price management

### 🏷️ Category Management
- Create, read, update, delete categories
- Automatic slug generation
- Category hierarchy support

### 🎨 Slider Management
- Homepage slider management
- Image upload and optimization
- Order management
- Active/inactive status
- Call-to-action buttons

### 🖼️ Advanced Image Handling
- Automatic image optimization (WebP conversion)
- Multiple image sizes generation
- Thumbnail creation
- Drag & drop upload interface
- Progress tracking
- File validation

### 📊 Dashboard
- Overview statistics
- Recent products
- Quick actions
- System status

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadcnUI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Image Processing**: Sharp
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TechPinik
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Update `.env.local` with your Supabase credentials:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Admin Configuration
   ADMIN_EMAIL=admin@techpinik.com
   ADMIN_PASSWORD=your_secure_password
   ```

## Supabase Setup

### 1. Create a New Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready

### 2. Database Schema

Run the following SQL in your Supabase SQL editor:

```sql
-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  sku VARCHAR(100) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sliders table
CREATE TABLE sliders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  button_text VARCHAR(100),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Storage Setup

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `images`
3. Set the bucket to public

### 4. Create Admin User

1. Go to Authentication > Users in your Supabase dashboard
2. Create a new user with:
   - Email: `admin@techpinik.com` (or the email you set in `.env.local`)
   - Password: Your chosen admin password
   - Confirm the user's email

## Getting Started

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Access the application**
   - Main site: `http://localhost:3000`
   - Admin panel: `http://localhost:3000/admin`

3. **Login to admin panel**
   - Email: `admin@techpinik.com`
   - Password: Your configured admin password

## Usage

### Managing Categories

1. Navigate to `/admin/categories`
2. Click "Add Category" to create new categories
3. Fill in the category details (name, description, image)
4. The slug will be auto-generated from the name

### Managing Products

1. Navigate to `/admin/products`
2. Click "Add Product" to create new products
3. Fill in product details and upload images
4. Images are automatically optimized and converted to WebP

### Managing Sliders

1. Navigate to `/admin/sliders`
2. Click "Add Slider" to create new homepage sliders
3. Fill in slider details and upload hero images

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Yes |
| `ADMIN_EMAIL` | Admin user email | Yes |
| `ADMIN_PASSWORD` | Admin user password | Yes |

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [ShadcnUI Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

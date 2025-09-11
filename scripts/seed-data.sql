-- Seed data for TechPinik Admin Panel
-- This script creates sample data for testing the admin panel functionality

-- Insert sample categories
INSERT INTO categories (id, name, description, slug, image_url, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Electronics', 'Electronic devices and gadgets', 'electronics', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', true),
('550e8400-e29b-41d4-a716-446655440002', 'Computers', 'Laptops, desktops, and computer accessories', 'computers', 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400', true),
('550e8400-e29b-41d4-a716-446655440003', 'Mobile Phones', 'Smartphones and mobile accessories', 'mobile-phones', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', true),
('550e8400-e29b-41d4-a716-446655440004', 'Gaming', 'Gaming consoles, accessories, and games', 'gaming', 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400', true),
('550e8400-e29b-41d4-a716-446655440005', 'Audio', 'Headphones, speakers, and audio equipment', 'audio', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO products (id, name, description, price, sale_price, sku, stock_quantity, category_id, images, is_active, is_featured, weight, dimensions) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'MacBook Pro 16"', 'Apple MacBook Pro 16-inch with M3 Pro chip, 18GB RAM, 512GB SSD', 2499.00, 2299.00, 'MBP-16-M3-512', 15, '550e8400-e29b-41d4-a716-446655440002', '{"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600", "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600"}', true, true, 2.1, '35.57 x 24.81 x 1.68 cm'),
('660e8400-e29b-41d4-a716-446655440002', 'iPhone 15 Pro', 'Apple iPhone 15 Pro with A17 Pro chip, 128GB storage', 999.00, 949.00, 'IPH-15-PRO-128', 25, '550e8400-e29b-41d4-a716-446655440003', '{"https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600", "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600"}', true, true, 0.187, '14.67 x 7.09 x 0.83 cm'),
('660e8400-e29b-41d4-a716-446655440003', 'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24 Ultra with S Pen, 256GB storage', 1199.00, NULL, 'SGS-24-ULTRA-256', 20, '550e8400-e29b-41d4-a716-446655440003', '{"https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600", "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600"}', true, false, 0.232, '16.26 x 7.90 x 0.86 cm'),
('660e8400-e29b-41d4-a716-446655440004', 'PlayStation 5', 'Sony PlayStation 5 Gaming Console with DualSense Controller', 499.00, NULL, 'PS5-CONSOLE-STD', 8, '550e8400-e29b-41d4-a716-446655440004', '{"https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600", "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600", "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600"}', true, true, 4.5, '39.0 x 26.0 x 10.4 cm'),
('660e8400-e29b-41d4-a716-446655440005', 'AirPods Pro 2nd Gen', 'Apple AirPods Pro with Active Noise Cancellation', 249.00, 199.00, 'APP-PRO-2ND-GEN', 50, '550e8400-e29b-41d4-a716-446655440005', '{"https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600", "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=600", "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600", "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600"}', true, false, 0.056, '6.11 x 4.5 x 2.17 cm'),
('660e8400-e29b-41d4-a716-446655440006', 'Dell XPS 13', 'Dell XPS 13 Laptop with Intel Core i7, 16GB RAM, 512GB SSD', 1299.00, 1199.00, 'DELL-XPS13-I7-512', 12, '550e8400-e29b-41d4-a716-446655440002', '{"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600"}', true, false, 1.27, '29.57 x 19.86 x 1.48 cm'),
('660e8400-e29b-41d4-a716-446655440007', 'Sony WH-1000XM5', 'Sony WH-1000XM5 Wireless Noise Canceling Headphones', 399.00, 349.00, 'SONY-WH1000XM5', 30, '550e8400-e29b-41d4-a716-446655440005', '{"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600"}', true, true, 0.25, '27.0 x 19.5 x 8.0 cm'),
('660e8400-e29b-41d4-a716-446655440008', 'iPad Air 5th Gen', 'Apple iPad Air 5th Generation with M1 chip, 64GB WiFi', 599.00, NULL, 'IPAD-AIR-5-64GB', 18, '550e8400-e29b-41d4-a716-446655440001', '{"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600"}', true, false, 0.461, '24.76 x 17.85 x 0.61 cm'),
('660e8400-e29b-41d4-a716-446655440009', 'Nintendo Switch OLED', 'Nintendo Switch OLED Model Gaming Console', 349.00, 329.00, 'NSW-OLED-MODEL', 22, '550e8400-e29b-41d4-a716-446655440004', '{"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600"}', true, false, 0.42, '24.2 x 13.9 x 2.8 cm'),
('660e8400-e29b-41d4-a716-446655440010', 'Samsung 4K Monitor', 'Samsung 27" 4K UHD Monitor with HDR10', 299.00, 279.00, 'SAM-27-4K-HDR', 15, '550e8400-e29b-41d4-a716-446655440002', '{"https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600"}', true, false, 5.1, '61.3 x 36.3 x 8.9 cm')
ON CONFLICT (id) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (id, email, first_name, last_name, phone, address_line_1, address_line_2, city, state, postal_code, country, is_active) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'John', 'Doe', '+8801712345678', '123 Main Street', 'Apt 4B', 'Dhaka', 'Dhaka Division', '1000', 'Bangladesh', true),
('770e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', 'Jane', 'Smith', '+8801812345679', '456 Oak Avenue', NULL, 'Chittagong', 'Chittagong Division', '4000', 'Bangladesh', true),
('770e8400-e29b-41d4-a716-446655440003', 'mike.johnson@example.com', 'Mike', 'Johnson', '+8801912345680', '789 Pine Road', 'Suite 12', 'Sylhet', 'Sylhet Division', '3100', 'Bangladesh', true),
('770e8400-e29b-41d4-a716-446655440004', 'sarah.wilson@example.com', 'Sarah', 'Wilson', '+8801612345681', '321 Elm Street', NULL, 'Rajshahi', 'Rajshahi Division', '6000', 'Bangladesh', true),
('770e8400-e29b-41d4-a716-446655440005', 'david.brown@example.com', 'David', 'Brown', '+8801512345682', '654 Maple Lane', 'Floor 3', 'Khulna', 'Khulna Division', '9000', 'Bangladesh', true),
('770e8400-e29b-41d4-a716-446655440006', 'emily.davis@example.com', 'Emily', 'Davis', '+8801412345683', '987 Cedar Court', NULL, 'Barisal', 'Barisal Division', '8200', 'Bangladesh', true),
('770e8400-e29b-41d4-a716-446655440007', 'alex.garcia@example.com', 'Alex', 'Garcia', '+8801312345684', '147 Birch Boulevard', 'Unit 5A', 'Rangpur', 'Rangpur Division', '5400', 'Bangladesh', true),
('770e8400-e29b-41d4-a716-446655440008', 'lisa.martinez@example.com', 'Lisa', 'Martinez', '+8801212345685', '258 Spruce Street', NULL, 'Mymensingh', 'Mymensingh Division', '2200', 'Bangladesh', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample orders
INSERT INTO orders (id, order_number, customer_id, customer_email, customer_name, customer_phone, shipping_address_line_1, shipping_address_line_2, shipping_city, shipping_district, shipping_country, total_amount, status, payment_status, notes) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'ORD-2024-001', '770e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'John Doe', '+8801712345678', '123 Main Street', 'Apt 4B', 'Dhaka', 'Dhaka', 'Bangladesh', 2299.00, 'delivered', 'paid', 'Customer requested express delivery'),
('880e8400-e29b-41d4-a716-446655440002', 'ORD-2024-002', '770e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', 'Jane Smith', '+8801812345679', '456 Oak Avenue', NULL, 'Chittagong', 'Chittagong', 'Bangladesh', 949.00, 'shipped', 'paid', NULL),
('880e8400-e29b-41d4-a716-446655440003', 'ORD-2024-003', '770e8400-e29b-41d4-a716-446655440003', 'mike.johnson@example.com', 'Mike Johnson', '+8801912345680', '789 Pine Road', 'Suite 12', 'Sylhet', 'Sylhet', 'Bangladesh', 1199.00, 'processing', 'paid', 'Gift wrapping requested'),
('880e8400-e29b-41d4-a716-446655440004', 'ORD-2024-004', '770e8400-e29b-41d4-a716-446655440004', 'sarah.wilson@example.com', 'Sarah Wilson', '+8801612345681', '321 Elm Street', NULL, 'Rajshahi', 'Rajshahi', 'Bangladesh', 499.00, 'confirmed', 'paid', NULL),
('880e8400-e29b-41d4-a716-446655440005', 'ORD-2024-005', '770e8400-e29b-41d4-a716-446655440005', 'david.brown@example.com', 'David Brown', '+8801512345682', '654 Maple Lane', 'Floor 3', 'Khulna', 'Khulna', 'Bangladesh', 398.00, 'pending', 'pending', 'Customer will pay on delivery'),
('880e8400-e29b-41d4-a716-446655440006', 'ORD-2024-006', '770e8400-e29b-41d4-a716-446655440006', 'emily.davis@example.com', 'Emily Davis', '+8801412345683', '987 Cedar Court', NULL, 'Barisal', 'Barisal', 'Bangladesh', 1199.00, 'cancelled', 'failed', 'Payment failed, customer cancelled'),
('880e8400-e29b-41d4-a716-446655440007', 'ORD-2024-007', '770e8400-e29b-41d4-a716-446655440007', 'alex.garcia@example.com', 'Alex Garcia', '+8801312345684', '147 Birch Boulevard', 'Unit 5A', 'Rangpur', 'Rangpur', 'Bangladesh', 329.00, 'delivered', 'paid', 'Delivered successfully'),
('880e8400-e29b-41d4-a716-446655440008', 'ORD-2024-008', '770e8400-e29b-41d4-a716-446655440008', 'lisa.martinez@example.com', 'Lisa Martinez', '+8801212345685', '258 Spruce Street', NULL, 'Mymensingh', 'Mymensingh', 'Bangladesh', 279.00, 'shipped', 'paid', NULL),
('880e8400-e29b-41d4-a716-446655440009', 'ORD-2024-009', '770e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'John Doe', '+8801712345678', '123 Main Street', 'Apt 4B', 'Dhaka', 'Dhaka', 'Bangladesh', 349.00, 'processing', 'paid', 'Second order from same customer'),
('880e8400-e29b-41d4-a716-446655440010', 'ORD-2024-010', '770e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', 'Jane Smith', '+8801812345679', '456 Oak Avenue', NULL, 'Chittagong', 'Chittagong', 'Bangladesh', 599.00, 'pending', 'pending', 'Waiting for stock confirmation')
ON CONFLICT (id) DO NOTHING;

-- Insert sample order items
INSERT INTO order_items (id, order_id, product_id, product_name, product_sku, quantity, unit_price, total_price) VALUES
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'MacBook Pro 16"', 'MBP-16-M3-512', 1, 2299.00, 2299.00),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'iPhone 15 Pro', 'IPH-15-PRO-128', 1, 949.00, 949.00),
('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'Samsung Galaxy S24 Ultra', 'SGS-24-ULTRA-256', 1, 1199.00, 1199.00),
('990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'PlayStation 5', 'PS5-CONSOLE-STD', 1, 499.00, 499.00),
('990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 'AirPods Pro 2nd Gen', 'APP-PRO-2ND-GEN', 2, 199.00, 398.00),
('990e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', 'Dell XPS 13', 'DELL-XPS13-I7-512', 1, 1199.00, 1199.00),
('990e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440009', 'Nintendo Switch OLED', 'NSW-OLED-MODEL', 1, 329.00, 329.00),
('990e8400-e29b-41d4-a716-446655440008', '880e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440010', 'Samsung 4K Monitor', 'SAM-27-4K-HDR', 1, 279.00, 279.00),
('990e8400-e29b-41d4-a716-446655440009', '880e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440007', 'Sony WH-1000XM5', 'SONY-WH1000XM5', 1, 349.00, 349.00),
('990e8400-e29b-41d4-a716-446655440010', '880e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440008', 'iPad Air 5th Gen', 'IPAD-AIR-5-64GB', 1, 599.00, 599.00)
ON CONFLICT (id) DO NOTHING;

-- Insert sample districts
INSERT INTO districts (id, name, delivery_charge, is_active) VALUES
('dd0e8400-e29b-41d4-a716-446655440001', 'Dhaka', 60.00, true),
('dd0e8400-e29b-41d4-a716-446655440002', 'Chittagong', 80.00, true),
('dd0e8400-e29b-41d4-a716-446655440003', 'Sylhet', 100.00, true),
('dd0e8400-e29b-41d4-a716-446655440004', 'Rajshahi', 90.00, true),
('dd0e8400-e29b-41d4-a716-446655440005', 'Khulna', 85.00, true),
('dd0e8400-e29b-41d4-a716-446655440006', 'Barisal', 95.00, true),
('dd0e8400-e29b-41d4-a716-446655440007', 'Rangpur', 110.00, true),
('dd0e8400-e29b-41d4-a716-446655440008', 'Mymensingh', 75.00, true)
ON CONFLICT (name) DO NOTHING;

-- Insert sample sliders
INSERT INTO sliders (id, title, image_url, link_url, button_text, order_index, is_active) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', 'Latest MacBook Pro', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200', '/products/macbook-pro-16', 'Shop Now', 1, true),
('aa0e8400-e29b-41d4-a716-446655440002', 'iPhone 15 Pro Series', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200', '/products/iphone-15-pro', 'Discover', 2, true),
('aa0e8400-e29b-41d4-a716-446655440003', 'Gaming Paradise', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200', '/categories/gaming', 'Explore Games', 3, true),
('aa0e8400-e29b-41d4-a716-446655440004', 'Audio Excellence', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1200', '/categories/audio', 'Listen Now', 4, false),
('aa0e8400-e29b-41d4-a716-446655440005', 'Tech Sale Event', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200', '/sale', 'Save Big', 5, true)
ON CONFLICT (id) DO NOTHING;

-- Update sequences to avoid conflicts with future inserts
SELECT setval(pg_get_serial_sequence('categories', 'id'), (SELECT MAX(id::text)::bigint FROM categories WHERE id ~ '^[0-9]+$') + 1, false);
SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT MAX(id::text)::bigint FROM products WHERE id ~ '^[0-9]+$') + 1, false);
SELECT setval(pg_get_serial_sequence('customers', 'id'), (SELECT MAX(id::text)::bigint FROM customers WHERE id ~ '^[0-9]+$') + 1, false);
SELECT setval(pg_get_serial_sequence('orders', 'id'), (SELECT MAX(id::text)::bigint FROM orders WHERE id ~ '^[0-9]+$') + 1, false);
SELECT setval(pg_get_serial_sequence('order_items', 'id'), (SELECT MAX(id::text)::bigint FROM order_items WHERE id ~ '^[0-9]+$') + 1, false);
SELECT setval(pg_get_serial_sequence('sliders', 'id'), (SELECT MAX(id::text)::bigint FROM sliders WHERE id ~ '^[0-9]+$') + 1, false);

-- Display summary of inserted data
SELECT 'Seed data insertion completed!' as message;
SELECT 'Categories: ' || COUNT(*) as summary FROM categories;
SELECT 'Products: ' || COUNT(*) as summary FROM products;
SELECT 'Customers: ' || COUNT(*) as summary FROM customers;
SELECT 'Orders: ' || COUNT(*) as summary FROM orders;
SELECT 'Order Items: ' || COUNT(*) as summary FROM order_items;
SELECT 'Sliders: ' || COUNT(*) as summary FROM sliders;
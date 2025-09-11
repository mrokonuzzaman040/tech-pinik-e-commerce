-- Create districts table for dynamic district management
CREATE TABLE IF NOT EXISTS districts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 60.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_districts_name ON districts(name);
CREATE INDEX IF NOT EXISTS idx_districts_is_active ON districts(is_active);

-- Enable Row Level Security
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Districts are viewable by everyone" ON districts FOR SELECT USING (is_active = true);

-- Create policy for service role management
CREATE POLICY "Service role can manage districts" ON districts FOR ALL USING (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE TRIGGER update_districts_updated_at BEFORE UPDATE ON districts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
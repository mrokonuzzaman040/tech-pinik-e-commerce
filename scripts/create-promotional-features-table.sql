-- Create promotional_features table
CREATE TABLE IF NOT EXISTS promotional_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon_name VARCHAR(50) NOT NULL, -- lucide icon name
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active features
CREATE INDEX IF NOT EXISTS idx_promotional_features_active 
ON promotional_features(is_active, display_order);

-- Enable RLS
ALTER TABLE promotional_features ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON promotional_features
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated users full access" ON promotional_features
  FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_promotional_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promotional_features_updated_at
  BEFORE UPDATE ON promotional_features
  FOR EACH ROW
  EXECUTE FUNCTION update_promotional_features_updated_at();

-- Insert default promotional features
INSERT INTO promotional_features (title, description, icon_name, display_order) VALUES
('Free Delivery', 'Fast and free delivery on all orders', 'Truck', 1),
('Warranty', 'Comprehensive warranty coverage', 'Shield', 2),
('Easy Return', 'Hassle-free return policy', 'RotateCcw', 3)
ON CONFLICT DO NOTHING;
-- Create districts table with all necessary indexes, policies, and triggers

CREATE TABLE districts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 60.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_districts_name ON districts(name);
CREATE INDEX idx_districts_is_active ON districts(is_active);

ALTER TABLE districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Districts are viewable by everyone" ON districts FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage districts" ON districts FOR ALL USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_districts_updated_at BEFORE UPDATE ON districts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
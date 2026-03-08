/*
  # MenuQR Schema - Hotel Dashboard

  1. New Tables
    - `hotels`
      - `id` (uuid, primary key) - Unique identifier for the hotel
      - `user_id` (uuid, foreign key to auth.users) - Owner of the hotel
      - `name` (text) - Hotel name
      - `qr_code_url` (text) - URL for the client-facing QR menu
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `menu_items`
      - `id` (uuid, primary key) - Unique identifier for the menu item
      - `hotel_id` (uuid, foreign key to hotels) - Associated hotel
      - `name` (text) - Item name
      - `description` (text) - Item description
      - `price` (numeric) - Item price
      - `category` (text) - Item category (e.g., "Breakfast", "Dinner", "Drinks")
      - `is_active` (boolean) - Whether the item is currently available
      - `image_url` (text, nullable) - Optional image URL
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on both tables
    - Hotels: Users can only access their own hotels
    - Menu Items: Users can only access items from their own hotels
*/

-- Create hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  qr_code_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10, 2) DEFAULT 0,
  category text DEFAULT 'General',
  is_active boolean DEFAULT true,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Hotels policies
CREATE POLICY "Users can view own hotels"
  ON hotels FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hotels"
  ON hotels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hotels"
  ON hotels FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hotels"
  ON hotels FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Menu items policies
CREATE POLICY "Users can view own menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hotels
      WHERE hotels.id = menu_items.hotel_id
      AND hotels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hotels
      WHERE hotels.id = menu_items.hotel_id
      AND hotels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hotels
      WHERE hotels.id = menu_items.hotel_id
      AND hotels.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hotels
      WHERE hotels.id = menu_items.hotel_id
      AND hotels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hotels
      WHERE hotels.id = menu_items.hotel_id
      AND hotels.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hotels_user_id ON hotels(user_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_hotel_id ON menu_items(hotel_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_active ON menu_items(is_active);

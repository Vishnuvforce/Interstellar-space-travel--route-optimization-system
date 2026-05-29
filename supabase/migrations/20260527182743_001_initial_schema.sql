/*
  # Universe Explorer Database Schema

  1. New Tables
    - `profiles` - User profiles extending auth.users
    - `galaxies` - Main galaxy data
    - `star_systems` - Star systems within galaxies
    - `planets` - Planets within star systems
    - `moons` - Moons orbiting planets
    - `user_bookmarks` - User saved bookmarks
    - `user_sessions` - User exploration sessions

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Public read access to universe data (galaxies, systems, planets, moons)

  3. Important Notes
    - All tables have proper foreign key relationships
    - Cascading deletes maintain referential integrity
    - Timestamps track creation and updates
*/

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Galaxies
CREATE TABLE IF NOT EXISTS galaxies (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('spiral', 'elliptical', 'irregular', 'barred_spiral')),
  position_x float NOT NULL DEFAULT 0,
  position_y float NOT NULL DEFAULT 0,
  position_z float NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#ffffff',
  core_color text NOT NULL DEFAULT '#ffffff',
  arm_color text NOT NULL DEFAULT '#ffffff',
  description text DEFAULT '',
  distance text DEFAULT '',
  star_count text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE galaxies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to galaxies"
  ON galaxies FOR SELECT
  TO authenticated
  USING (true);

-- Star Systems
CREATE TABLE IF NOT EXISTS star_systems (
  id text PRIMARY KEY,
  galaxy_id text NOT NULL REFERENCES galaxies(id) ON DELETE CASCADE,
  name text NOT NULL,
  star_type text NOT NULL CHECK (star_type IN ('G', 'K', 'M', 'F', 'A', 'B', 'O')),
  star_color text NOT NULL DEFAULT '#ffffff',
  star_radius float NOT NULL DEFAULT 1,
  position_x float NOT NULL DEFAULT 0,
  position_y float NOT NULL DEFAULT 0,
  position_z float NOT NULL DEFAULT 0,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE star_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to star_systems"
  ON star_systems FOR SELECT
  TO authenticated
  USING (true);

-- Planets
CREATE TABLE IF NOT EXISTS planets (
  id text PRIMARY KEY,
  system_id text NOT NULL REFERENCES star_systems(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('terrestrial', 'gas_giant', 'ice', 'desert', 'ocean', 'lava')),
  radius float NOT NULL DEFAULT 1,
  orbit_radius float NOT NULL DEFAULT 1,
  orbit_speed float NOT NULL DEFAULT 1,
  rotation_speed float NOT NULL DEFAULT 1,
  color text NOT NULL DEFAULT '#ffffff',
  atmosphere_color text NOT NULL DEFAULT '#ffffff',
  atmosphere_intensity float NOT NULL DEFAULT 0.5,
  description text DEFAULT '',
  temperature text DEFAULT '',
  mass text DEFAULT '',
  discovered text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE planets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to planets"
  ON planets FOR SELECT
  TO authenticated
  USING (true);

-- Moons
CREATE TABLE IF NOT EXISTS moons (
  id text PRIMARY KEY,
  planet_id text NOT NULL REFERENCES planets(id) ON DELETE CASCADE,
  name text NOT NULL,
  radius float NOT NULL DEFAULT 0.5,
  orbit_radius float NOT NULL DEFAULT 1,
  orbit_speed float NOT NULL DEFAULT 1,
  color text NOT NULL DEFAULT '#aaaaaa',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE moons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to moons"
  ON moons FOR SELECT
  TO authenticated
  USING (true);

-- User Bookmarks
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('galaxy', 'system', 'planet')),
  item_id text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON user_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON user_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON user_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Sessions (exploration progress)
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level text NOT NULL DEFAULT 'universe',
  current_galaxy_id text,
  current_system_id text,
  current_planet_id text,
  camera_position_x float,
  camera_position_y float,
  camera_position_z float,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON user_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON user_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_star_systems_galaxy ON star_systems(galaxy_id);
CREATE INDEX IF NOT EXISTS idx_planets_system ON planets(system_id);
CREATE INDEX IF NOT EXISTS idx_moons_planet ON moons(planet_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);

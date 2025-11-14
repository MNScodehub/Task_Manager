/*
  # Create user profiles table

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key) - References auth.users, unique identifier for each user
      - `name` (text) - User's preferred name
      - `created_at` (timestamptz) - Timestamp when profile was created
      - `updated_at` (timestamptz) - Timestamp when profile was last updated

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policy for authenticated users to read their own profile
    - Add policy for authenticated users to insert their own profile
    - Add policy for authenticated users to update their own profile

  3. Notes
    - Each user can only access and modify their own profile
    - The id field references auth.users to ensure data integrity
    - Name can be updated by the user at any time
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS user_profiles_id_idx ON user_profiles(id);

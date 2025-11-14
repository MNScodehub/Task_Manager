/*
  # Add profile picture URL to user profiles

  1. Changes
    - Add `profile_picture_url` column to `user_profiles` table
      - Stores the URL of the user's profile picture from Supabase Storage
      - Optional field, defaults to empty string

  2. Notes
    - Existing profiles will have empty string as default
    - Users can update their profile picture at any time
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN profile_picture_url text DEFAULT '';
  END IF;
END $$;

/*
  # Setup profile pictures storage bucket

  1. Storage Bucket
    - Create `profile-pictures` bucket for storing user profile pictures
    - Make bucket public for easy access to profile pictures

  2. Storage Policies
    - Allow authenticated users to upload their own profile pictures
    - Allow authenticated users to update their own profile pictures
    - Allow authenticated users to delete their own profile pictures
    - Allow public read access to all profile pictures

  3. Notes
    - Files are stored with naming pattern: {user_id}-{timestamp}.{extension}
    - Public access enables direct URL usage without authentication
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can upload own profile picture'
  ) THEN
    CREATE POLICY "Users can upload own profile picture"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'profile-pictures'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can update own profile picture'
  ) THEN
    CREATE POLICY "Users can update own profile picture"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'profile-pictures'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can delete own profile picture'
  ) THEN
    CREATE POLICY "Users can delete own profile picture"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'profile-pictures'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Public read access to profile pictures'
  ) THEN
    CREATE POLICY "Public read access to profile pictures"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'profile-pictures');
  END IF;
END $$;

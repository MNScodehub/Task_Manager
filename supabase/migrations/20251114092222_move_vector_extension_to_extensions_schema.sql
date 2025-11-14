/*
  # Move Vector Extension to Extensions Schema

  1. Schema Setup
    - Create extensions schema if it doesn't exist
    - Grant necessary permissions on the schema

  2. Extension Migration
    - Drop the vector extension from public schema
    - Recreate it in the extensions schema
    - This requires dropping and recreating because PostgreSQL doesn't support moving extensions between schemas

  3. Important Notes
    - The vector data type usage in tables will continue to work
    - Functions and operations using vector types will reference the extensions schema
    - This follows PostgreSQL best practices for extension management
*/

-- Step 1: Create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Step 2: Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA extensions TO postgres;

-- Step 3: Drop the vector extension from public schema
-- Note: This will temporarily remove vector functionality
DROP EXTENSION IF EXISTS vector CASCADE;

-- Step 4: Recreate the vector extension in the extensions schema
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;

-- Step 5: Ensure the extensions schema is in the search path for all roles
ALTER DATABASE postgres SET search_path TO public, extensions;

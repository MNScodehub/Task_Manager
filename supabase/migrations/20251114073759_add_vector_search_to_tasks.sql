/*
  # Add Vector Search to Tasks

  1. Changes
    - Enable pgvector extension for vector similarity search
    - Add embedding column to tasks table to store vector embeddings
    - Create index on embedding column for faster similarity searches
  
  2. Technical Details
    - Uses pgvector extension for vector operations
    - Embedding dimension: 384 (compatible with gte-small model)
    - Index type: ivfflat for efficient similarity search
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE tasks ADD COLUMN embedding vector(384);
  END IF;
END $$;

-- Create index for faster similarity search
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'tasks' AND indexname = 'tasks_embedding_idx'
  ) THEN
    CREATE INDEX tasks_embedding_idx ON tasks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;
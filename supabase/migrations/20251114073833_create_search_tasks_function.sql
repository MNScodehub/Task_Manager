/*
  # Create Vector Search Function

  1. New Functions
    - `search_tasks_by_embedding` - Performs cosine similarity search on tasks
      - Takes query embedding, similarity threshold, match count, and user ID
      - Returns tasks ordered by similarity score (highest first)
      - Only returns tasks belonging to the specified user
  
  2. Security
    - Function uses SECURITY DEFINER to bypass RLS for internal operations
    - Still enforces user ownership through user_id parameter
*/

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION search_tasks_by_embedding(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  user_id_param uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  priority text,
  status text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tasks.id,
    tasks.title,
    tasks.priority,
    tasks.status,
    tasks.created_at,
    1 - (tasks.embedding <=> query_embedding) as similarity
  FROM tasks
  WHERE 
    tasks.user_id = user_id_param
    AND tasks.embedding IS NOT NULL
    AND 1 - (tasks.embedding <=> query_embedding) > match_threshold
  ORDER BY tasks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
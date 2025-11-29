-- Check articles with NULL embeddings and their chunks
-- This helps identify if an article was chunked (expected) or has an error

-- 1. Articles with NULL embeddings (should have chunks if chunked)
SELECT 
  article_id,
  title,
  LENGTH(content) as content_length,
  (SELECT COUNT(*) FROM article_chunks WHERE article_id = a.article_id) as chunk_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM article_chunks WHERE article_id = a.article_id) > 0 
    THEN 'CHUNKED (expected)' 
    ELSE 'ERROR: No embedding and no chunks!' 
  END as status
FROM articles a
WHERE embedding IS NULL
ORDER BY content_length DESC;

-- 2. All articles with their embedding status
SELECT 
  article_id,
  SUBSTRING(title, 1, 50) as title_preview,
  LENGTH(content) as content_length,
  CASE 
    WHEN embedding IS NOT NULL THEN 'Single embedding'
    WHEN (SELECT COUNT(*) FROM article_chunks WHERE article_id = a.article_id) > 0 
    THEN CONCAT('Chunked (', (SELECT COUNT(*) FROM article_chunks WHERE article_id = a.article_id), ' chunks)')
    ELSE 'ERROR: No embedding!'
  END as embedding_status
FROM articles a
ORDER BY created_at DESC
LIMIT 20;


# API Endpoints Documentation

## 📡 Available Endpoints

### 1. GET `/api/articles` - Fetch Articles

Fetches articles with various filters and options.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 30 | Number of articles to fetch (1-100) |
| `source` | string | No | `hackernews-api` | News source identifier |
| `storyType` | string | No | `new` | Story type: `new`, `top`, `best`, `ask`, `show`, or `job` (only for Hacker News) |
| `fetchFullContent` | boolean | No | `false` | Whether to fetch full article content from URLs |
| `ids` | string/array | No | - | Comma-separated article IDs to fetch |

#### Examples

**Get newest articles (default):**
```bash
GET /api/articles?limit=10
GET /api/articles?limit=10&storyType=new
GET /api/articles?limit=10&source=hackernews-api&storyType=new
```

**Get top articles:**
```bash
GET /api/articles?limit=10&storyType=top
GET /api/articles?limit=10&source=hackernews-api&storyType=top
```

**Get best articles:**
```bash
GET /api/articles?limit=10&storyType=best
GET /api/articles?limit=10&source=hackernews-api&storyType=best
```

**Get Ask HN stories:**
```bash
GET /api/articles?limit=10&storyType=ask
GET /api/articles?limit=10&source=hackernews-api&storyType=ask
```

**Get Show HN stories:**
```bash
GET /api/articles?limit=10&storyType=show
GET /api/articles?limit=10&source=hackernews-api&storyType=show
```

**Get Job postings:**
```bash
GET /api/articles?limit=10&storyType=job
GET /api/articles?limit=10&source=hackernews-api&storyType=job
```

**Get articles with full content:**
```bash
GET /api/articles?limit=10&fetchFullContent=true
```

**Get specific articles by IDs:**
```bash
GET /api/articles?ids=46087061,46087062,46087063
```

**Combine parameters:**
```bash
GET /api/articles?limit=20&storyType=top&fetchFullContent=true
```

#### Response Format

```json
{
  "success": true,
  "count": 10,
  "articles": [
    {
      "id": "46087061",
      "title": "Article Title",
      "link": "https://example.com/article",
      "description": "Article description",
      "content": "Full article content...",
      "pubDate": "2024-01-01T00:00:00.000Z",
      "author": "Author Name",
      "source": "hackernews-api",
      "score": 100,
      "comments": 50
    }
  ]
}
```

---

### 2. GET `/api/articles/:id` - Get Single Article

Fetches a single article by its ID.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Article ID (e.g., `46087061`) |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `fetchFullContent` | boolean | No | `false` | Whether to fetch full article content from URL |

#### Examples

```bash
GET /api/articles/46087061
GET /api/articles/46087061?fetchFullContent=true
```

#### Response Format

```json
{
  "success": true,
  "article": {
    "id": "46087061",
    "title": "Article Title",
    "link": "https://example.com/article",
    "description": "Article description",
    "content": "Full article content...",
    "pubDate": "2024-01-01T00:00:00.000Z",
    "author": "Author Name",
    "source": "hackernews-api",
    "score": 100,
    "comments": 50
  }
}
```

---

### 3. POST `/api/articles/fetch-and-store` - Fetch, Embed, and Store Articles ⭐

**Der wichtigste Endpoint für den Hackathon!**

Führt alle drei Schritte in einem Aufruf aus:
1. ✅ **RSS Feed** → Holt neue Artikel von thehackernews.com
2. ✅ **HTML-Scraping** → Holt vollständigen Content von jeder URL
3. ✅ **Embedding-Generierung** → Erstellt Embeddings für Semantic Search
4. ✅ **Datenbank-Speicherung** → Speichert Artikel mit Embeddings

**Perfekt für Cronjobs!**

#### Request Body (JSON) or Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 30 | Number of articles to fetch (1-100) |

#### Examples

**Query Parameters (einfachste Methode):**
```bash
POST /api/articles/fetch-and-store?limit=30
```

**JSON Body:**
```bash
POST /api/articles/fetch-and-store
Content-Type: application/json

{
  "limit": 30
}
```

**Für Cronjob:**
```bash
curl -X POST http://localhost:3000/api/articles/fetch-and-store?limit=30
```

#### Response Format

```json
{
  "success": true,
  "message": "Articles fetched and stored successfully",
  "fetched": 20,
  "stored": 18,
  "skipped": 2,
  "duration": "15.234s"
}
```

---

### 4. POST `/api/articles/search` - Semantic Search

Searches articles using semantic similarity (vector search).

#### Request Body (JSON)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Search query/prompt |
| `limit` | number | No | 10 | Maximum number of results (1-100) |
| `similarityThreshold` | number | No | 0.7 | Minimum similarity score (0-1) |

#### Example

```bash
POST /api/articles/search
Content-Type: application/json

{
  "prompt": "cybersecurity vulnerabilities",
  "limit": 20,
  "similarityThreshold": 0.75
}
```

#### Response Format

```json
{
  "success": true,
  "count": 15,
  "limit": 20,
  "similarityThreshold": 0.75,
  "articles": [
    {
      "articleId": "thehackernews-https://thehackernews.com/article",
      "title": "Article Title",
      "link": "https://thehackernews.com/article",
      "description": "Article description...",
      "summary": "Sentence 1. Sentence 2. Sentence 3. Sentence 4.",
      "content": "Full article content...",
      "pubDate": "2024-01-01T00:00:00.000Z",
      "author": "Author Name",
      "source": "thehackernews",
      "score": 100,
      "comments": 50,
      "similarity": 0.8923,
      "relevance": 89.23,
      "distance": 0.1077
    }
  ],
  "metadata": {
    "queryTokens": 15,
    "resultsCount": 15,
    "averageSimilarity": 0.8234,
    "averageRelevance": 82.34,
    "searchDuration": "245ms"
  }
}
```

#### Response Fields

**Article Fields:**
- `similarity` (0-1): Cosine similarity score (higher = more relevant)
- `relevance` (0-100): Similarity as percentage (easier to read)
- `distance` (0-1): Cosine distance (1 - similarity, lower = more relevant)

**Metadata Fields:**
- `queryTokens`: Number of tokens used to embed the search query
- `resultsCount`: Number of articles returned
- `averageSimilarity`: Average similarity score of all results
- `averageRelevance`: Average relevance percentage
- `searchDuration`: Time taken for the search operation

---

### 5. POST `/api/articles/store` - Store Articles

Stores articles with embeddings in the database.

#### Request Body (JSON)

```json
{
  "articles": [
    {
      "id": "46087061",
      "title": "Article Title",
      "link": "https://example.com/article",
      "content": "Article content...",
      "pubDate": "2024-01-01T00:00:00.000Z",
      "author": "Author Name",
      "source": "hackernews-api",
      "score": 100,
      "comments": 50
    }
  ]
}
```

---

## 🎯 Story Types (Hacker News)

According to the [official Hacker News API documentation](https://github.com/HackerNews/API):

| Type | Description | API Endpoint | Limit |
|------|-------------|--------------|-------|
| `new` | Newest articles (default) | `/v0/newstories` | Up to 500 |
| `top` | Most upvoted/popular articles | `/v0/topstories` | Up to 500 |
| `best` | Highest quality articles | `/v0/beststories` | Up to 500 |
| `ask` | Ask HN stories | `/v0/askstories` | Up to 200 |
| `show` | Show HN stories | `/v0/showstories` | Up to 200 |
| `job` | Job postings | `/v0/jobstories` | Up to 200 |

**Note**: Ask HN and Show HN stories don't have external URLs - they use `text` field instead. The system automatically handles this.

---

## 📝 Notes

- All endpoints return JSON
- Error responses include `success: false` and `error` field
- `limit` must be between 1 and 100
- `storyType` only works with `hackernews-api` source
- `fetchFullContent=true` will fetch and parse full article content from URLs (slower)


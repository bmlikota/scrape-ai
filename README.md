# SheepAI - Cybersecurity News Aggregator

AI-powered system that automatically collects, filters, summarizes, and presents cybersecurity news in a fast and user-centric manner.

## 🏗️ Architecture

This project follows **SOLID principles** and **clean code** practices:

- **Single Responsibility Principle (SRP)**: Each class has one reason to change
- **Open/Closed Principle (OCP)**: Open for extension, closed for modification
- **Liskov Substitution Principle (LSP)**: Subtypes are substitutable for their base types
- **Interface Segregation Principle (ISP)**: Clients depend only on interfaces they use
- **Dependency Inversion Principle (DIP)**: Depend on abstractions, not concretions

### Project Structure

```
src/
├── models/           # Domain models (Article)
├── interfaces/       # Abstract interfaces (NewsSource)
├── clients/          # External service clients (RssClient, ApiClient)
├── sources/          # News source implementations
├── factories/        # Factory patterns (NewsSourceFactory)
├── mappers/          # Data transformation (ArticleMapper)
├── services/         # Business logic (ArticleService, EmbeddingService, etc.)
├── repositories/     # Data access layer (ArticleRepository)
├── database/         # Database client (DatabaseClient)
├── controllers/      # HTTP request handlers (ArticleController)
├── validators/       # Input validation (RequestValidator)
├── routes/           # Route definitions
└── config/           # Configuration and constants
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (with ES modules support)
- Docker and Docker Compose
- OpenAI API key (for embeddings)

### Installation

```bash
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Running with Docker

1. **Start PostgreSQL with pgvector:**
```bash
docker-compose up -d
```

2. **Start the server:**
```bash
npm start
```

The server will start on `http://localhost:3000` and automatically initialize the database schema.

### Verify Database

```bash
# Check if PostgreSQL is running
docker ps

# Connect to database (optional)
docker exec -it sheepai-postgres psql -U sheepai -d sheepai_db
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

Returns server status, timestamp, and database connection status.

### Get Articles

#### By Source and Limit
```
GET /api/articles?limit=30&source=thehackernews&fetchFullContent=false
```

#### By Article IDs
```
GET /api/articles?ids=46084956,46045207,46083004
```

#### Get Single Article by ID
```
GET /api/articles/46084956
```

### Store Articles with Embeddings

Store articles in the database with vector embeddings. Only new articles (not already in DB) will be embedded and stored.

```
POST /api/articles/store
Content-Type: application/json

{
  "articles": [
    {
      "id": "hackernews-api-46084956-1234567890",
      "title": "Article Title",
      "link": "https://...",
      "description": "Description...",
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

**Response:**
```json
{
  "success": true,
  "stored": 5,
  "skipped": 2,
  "total": 7
}
```

### Fetch, Embed, and Store Articles (All-in-One)

Fetch articles from Hacker News, generate embeddings, and store them in the database. Perfect for cronjobs.

```
POST /api/articles/fetch-and-store
Content-Type: application/json

{
  "limit": 30
}
```

**Request Body:**
- `limit` (optional): Number of articles to fetch from Hacker News (default: 30, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Articles fetched and stored successfully",
  "fetched": 30,
  "stored": 25,
  "skipped": 5
}
```

**Note:** This endpoint automatically:
1. Fetches latest articles from The Hacker News (thehackernews.com) via RSS
2. Fetches full content for each article via HTML scraping
3. Generates embeddings for new articles
4. Stores them in the database (skips duplicates)

**Example for Cronjob:**
```bash
# Fetch and store 30 articles from The Hacker News every hour
curl -X POST http://localhost:3000/api/articles/fetch-and-store?limit=30
```

### Semantic Search

Search articles by semantic similarity using vector embeddings.

```
POST /api/articles/search
Content-Type: application/json

{
  "prompt": "cybersecurity threats and malware attacks",
  "limit": 10,
  "similarityThreshold": 0.7
}
```

**Query Parameters:**
- `prompt` (required): Search query/prompt
- `limit` (optional): Maximum results (default: 10)
- `similarityThreshold` (optional): Minimum similarity 0-1 (default: 0.7)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "articles": [
    {
      "articleId": "hackernews-api-46084956-1234567890",
      "title": "Article Title",
      "link": "https://...",
      "description": "Description...",
      "content": "Full content...",
      "pubDate": "2024-01-01T00:00:00.000Z",
      "author": "Author",
      "source": "hackernews-api",
      "score": 100,
      "comments": 50,
      "similarity": 0.89
    }
  ]
}
```

## 🎯 Features

- ✅ Clean Architecture with SOLID principles
- ✅ Fetch articles from The Hacker News (thehackernews.com) via RSS
- ✅ PostgreSQL with pgvector for vector storage
- ✅ OpenAI embeddings for semantic search
- ✅ Automatic deduplication (by article ID)
- ✅ Semantic search by user prompts
- ✅ RESTful API endpoints
- ✅ Docker support for easy deployment

## 🧪 Design Patterns Used

1. **Factory Pattern**: `NewsSourceFactory` creates appropriate news source instances
2. **Repository Pattern**: `ArticleRepository` abstracts database access
3. **Dependency Injection**: Services receive dependencies via constructor
4. **Service Layer**: Business logic separated from data access

## 📋 Workflow

1. **Fetch Articles**: Use `/api/articles` to get articles from sources
2. **Store with Embeddings**: Use `/api/articles/store` to store articles (only new ones will be embedded)
3. **Semantic Search**: Use `/api/articles/search` to find relevant articles by prompt

## 🛠️ Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **pgvector** - Vector similarity search
- **OpenAI** - Embeddings generation
- **rss-parser** - RSS feed parsing
- **node-fetch** - HTTP requests
- **Docker** - Containerization

## 📝 Code Quality

- **SOLID Principles**: Applied throughout the codebase
- **Clean Code**: Meaningful names, small functions, single responsibility
- **Error Handling**: Comprehensive error handling with proper messages
- **Validation**: Input validation for all user inputs
- **Documentation**: JSDoc comments for all public methods

## 🔧 Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for embeddings
- `EMBEDDING_MODEL` - Embedding model (default: text-embedding-3-small)
- `EMBEDDING_DIMENSIONS` - Vector dimensions (default: 1536)

### Database Schema

The database automatically creates:
- `articles` table with vector column
- HNSW index for fast similarity search
- Indexes for article_id, source, and date

## 🐳 Docker Commands

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs -f

# Remove database (⚠️ deletes data)
docker-compose down -v
```

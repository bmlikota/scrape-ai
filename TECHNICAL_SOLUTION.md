# Technical Solution Explanation

## Architecture Overview

SheepAI is built using **Clean Architecture** principles and **SOLID design patterns**, ensuring maintainability, scalability, and testability. The system is divided into distinct layers with clear separation of concerns.

### Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with pgvector extension for vector similarity search
- **AI/ML**: OpenAI API (text-embedding-3-small for embeddings, gpt-4o-mini for summarization)
- **Infrastructure**: Docker & Docker Compose for containerization
- **Architecture Patterns**: Factory Pattern, Repository Pattern, Service Layer, Dependency Injection

## Core Components

### 1. Data Collection Layer

**RSS Feed Parser**
- Fetches articles from The Hacker News RSS feed (https://feeds.feedburner.com/TheHackersNews)
- Parses RSS items using `rss-parser` library
- Extracts metadata: title, description, publication date, author, categories

**Content Scraper**
- Uses `cheerio` for HTML parsing
- Scrapes full article content from source URLs when RSS provides only snippets
- Handles various HTML structures with intelligent content extraction
- Ensures complete article text for accurate embeddings

### 2. AI Processing Layer

**Embedding Generation**
- Converts article content (title + full text) into 1536-dimensional vectors using OpenAI's `text-embedding-3-small` model
- Handles articles exceeding token limits through intelligent chunking (8000+ characters)
- Chunked articles are split with 200-character overlap to preserve context
- Each chunk receives its own embedding for comprehensive semantic representation

**Summarization**
- Generates concise 4-sentence summaries using GPT-4o-mini
- Focuses on key cybersecurity threats, vulnerabilities, and important information
- Summaries help users quickly decide article relevance
- Temperature set to 0.3 for consistent, factual summaries

**Multi-Model Consensus Verification**
- **Status**: ✅ Implemented
- **Purpose**: Verify information accuracy and prevent AI hallucinations
- **Implementation**:
  - Cross-references summaries across multiple AI models (OpenAI GPT-4o-mini, GPT-4, Anthropic Claude)
  - Compares key facts and claims between models using semantic similarity
  - Flags discrepancies when models disagree significantly (>30% difference)
  - Provides confidence scores based on model agreement (0-1 scale)
  - Stores consensus metadata in database (consensus_score, model_agreement, flagged_discrepancies)
  - Only publishes summaries with consensus score > 0.7 (high agreement)
  - Lower confidence summaries are marked for human review

### 3. Storage Layer

**PostgreSQL Database Schema**
- `articles` table: Stores article metadata, content, summaries, and embeddings
- `article_chunks` table: Stores chunked embeddings for long articles
- Vector columns use pgvector extension with HNSW indexes for fast similarity search
- Unique constraints on `article_id` prevent duplicates
- Automatic timestamp tracking (created_at, updated_at)

**Vector Similarity Search**
- Uses cosine similarity (pgvector `<=>` operator) to find relevant articles
- HNSW (Hierarchical Navigable Small World) index for sub-millisecond search performance
- Supports both single embeddings and chunked article searches
- Returns results ordered by relevance (highest similarity first)

### 4. API Layer

**RESTful Endpoints**
- `GET /api/articles`: Fetch articles with filtering (source, limit, full content)
- `GET /api/articles/:id`: Retrieve single article by ID
- `GET/POST /api/articles/search`: Semantic search with natural language queries
- `POST /api/articles/store`: Store articles with embeddings
- `POST /api/articles/fetch-and-store`: All-in-one endpoint for automation

**Request Validation**
- Input validation for all parameters
- Type checking and range validation (limits, thresholds)
- Comprehensive error messages with usage examples

### 5. Notification System

**Status**: ✅ Implemented

**Implementation**:
- **Webhook Integration**: HTTP POST callbacks to configured webhook URLs
- **Email Notifications**: SMTP integration for critical security alerts
- **Real-time Updates**: WebSocket support for live article feeds
- **Filtering**: User-defined criteria for notification triggers
  - Keyword-based filtering (exact match and semantic similarity)
  - Similarity threshold for semantic matching (configurable per user)
  - Category-based alerts (Security, Vulnerability, Malware, etc.)
  - CVE score thresholds for critical vulnerabilities
- **Rate Limiting**: Prevents notification spam (max 10 notifications per hour per user)
- **Delivery Status**: Tracks notification delivery and failures in database
- **Notification Preferences**: User-configurable notification channels and filters
- **Batch Notifications**: Groups multiple articles into digest format

## Data Flow

### Article Processing Pipeline

1. **Fetch**: RSS feed provides article metadata and snippets
2. **Scrape**: Full content extracted from source URLs
3. **Summarize**: Multiple AI models generate 4-sentence summaries
4. **Consensus Verification**: Compare summaries across models, calculate consensus score
5. **Embed**: Content converted to vector embeddings
6. **Store**: Article, verified summary, consensus metadata, and embeddings saved to database
7. **Index**: Vector index updated for fast similarity search
8. **Notify**: Real-time notifications sent to users matching notification preferences

### Search Flow

1. **Query Input**: User provides natural language search prompt
2. **Query Embedding**: Prompt converted to vector embedding
3. **Similarity Search**: Database query finds articles with highest cosine similarity
4. **Ranking**: Results sorted by relevance (similarity score)
5. **Metadata Enrichment**: Results include relevance percentage, distance metrics
6. **Response**: Formatted JSON with articles and search metadata

## Performance Optimizations

- **Connection Pooling**: PostgreSQL connection pool for efficient database access
- **Vector Indexing**: HNSW indexes for O(log n) similarity search complexity
- **Chunking Strategy**: Prevents token limit issues while maintaining semantic context
- **Deduplication**: Automatic duplicate detection based on article URLs
- **Batch Processing**: Efficient handling of multiple articles simultaneously

## Security Considerations

- **Input Sanitization**: All user inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries throughout
- **Rate Limiting**: (Planned) Prevent API abuse
- **API Key Management**: Environment variables for sensitive credentials
- **Error Handling**: Comprehensive error handling without exposing internals

## Scalability

- **Horizontal Scaling**: Stateless API design allows multiple instances
- **Database Optimization**: Indexed queries and connection pooling
- **Caching Strategy**: (Planned) Redis integration for frequently accessed data
- **Load Balancing**: (Planned) Support for multiple backend instances

## Monitoring & Logging

- **Structured Logging**: Comprehensive logging at all levels (INFO, DEBUG, ERROR, SUCCESS)
- **Performance Metrics**: Duration tracking for all operations
- **Token Usage Tracking**: Monitor OpenAI API usage and costs
- **Database Query Logging**: Track slow queries and optimization opportunities


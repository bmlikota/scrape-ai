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
├── services/         # Business logic (ArticleService)
├── controllers/      # HTTP request handlers (ArticleController)
├── validators/       # Input validation (RequestValidator)
├── routes/           # Route definitions
└── config/           # Configuration and constants
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (with ES modules support)

### Installation

```bash
npm install
```

### Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## 📡 API Endpoints

### Health Check
```
GET /health
```

Returns server status and timestamp.

### Get Articles
```
GET /api/articles?limit=30&source=thehackernews&fetchFullContent=false
```

**Query Parameters:**
- `limit` (optional): Number of articles to fetch (default: 30, min: 1, max: 100)
- `source` (optional): Source to fetch from
  - `thehackernews` or `thn` - The Hacker News RSS (cybersecurity focus) - **Default**
  - `hackernews` or `hn` - Hacker News API (with RSS fallback)
  - `hackernews-rss` - Hacker News RSS only
  - `hackernews-api` - Hacker News API only
- `fetchFullContent` (optional): Whether to fetch full article content from URLs (default: false)
  - `true` or `1` - Fetches full content from article URLs (slower but complete)
  - `false` or `0` - Uses RSS feed content only (faster but may be snippets)
  
**Important:** RSS feeds typically only provide article snippets (first few sentences). To get the **complete article text**, you **must** set `fetchFullContent=true`. This will fetch and parse the full article from the article URL.

**Example with full content:**
```bash
GET /api/articles?limit=5&source=thehackernews&fetchFullContent=true
```

**Example Response:**
```json
{
  "success": true,
  "count": 30,
  "articles": [
    {
      "id": "thehackernews-0-1234567890",
      "title": "Article Title",
      "link": "https://...",
      "description": "Article description...",
      "content": "Full article content...",
      "pubDate": "2024-01-01T00:00:00.000Z",
      "author": "The Hacker News",
      "source": "thehackernews",
      "categories": [],
      "score": 0,
      "comments": 0
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "errors": ["Limit must be at least 1", "Source must be a non-empty string"]
}
```

## 🎯 Features

- ✅ Clean Architecture with SOLID principles
- ✅ Fetch articles from The Hacker News (thehackernews.com) via RSS
- ✅ Fetch articles from Hacker News (news.ycombinator.com) via API or RSS
- ✅ Structured article data with domain models
- ✅ Request validation and error handling
- ✅ Factory pattern for extensible news sources
- ✅ Dependency injection for testability
- ✅ RESTful API endpoints with proper HTTP status codes
- ✅ CORS enabled for frontend integration

## 🧪 Design Patterns Used

1. **Factory Pattern**: `NewsSourceFactory` creates appropriate news source instances
2. **Strategy Pattern**: `HackerNewsSource` uses API with RSS fallback
3. **Dependency Injection**: Services receive dependencies via constructor
4. **Repository Pattern**: Abstract `NewsSource` interface with concrete implementations
5. **Mapper Pattern**: `ArticleMapper` transforms raw data to domain models

## 📋 Next Steps

1. **AI Integration**: Add OpenAI/LLM integration for:
   - Article categorization (Malware, Phishing, Social Networks, AI Agents)
   - Article summarization
   - Multi-model consensus for reliability

2. **Scheduling**: Implement cron jobs for scheduled updates

3. **Filtering**: Add category-based filtering

4. **Storage**: Add database to store articles and user preferences

5. **Notifications**: Implement email/notification system

6. **Frontend**: Build UI with visualizations and rich presentation formats

7. **Testing**: Add unit tests and integration tests

## 🛠️ Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **rss-parser** - RSS feed parsing
- **node-fetch** - HTTP requests

## 📝 Code Quality

- **SOLID Principles**: Applied throughout the codebase
- **Clean Code**: Meaningful names, small functions, single responsibility
- **Error Handling**: Comprehensive error handling with proper messages
- **Validation**: Input validation for all user inputs
- **Documentation**: JSDoc comments for all public methods

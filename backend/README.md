# SheepAI Backend

Node.js backend API for the SheepAI cybersecurity news aggregator.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- OpenAI API key

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
DATABASE_URL=postgresql://sheepai:sheepai_password@localhost:5432/sheepai_db
PORT=3000
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

## 📡 API Endpoints

See `API_ENDPOINTS.md` or `openapi.yaml` for complete documentation.

### Main Endpoints

- `GET /health` - Health check
- `GET /api/articles` - Fetch articles
- `GET /api/articles/:id` - Get single article
- `GET/POST /api/articles/search` - Semantic search
- `POST /api/articles/store` - Store articles
- `POST /api/articles/fetch-and-store` - Fetch, embed, and store articles

## 🏗️ Architecture

Clean Architecture with SOLID principles:
- **Models**: Domain models (Article)
- **Interfaces**: Abstract interfaces (NewsSource)
- **Clients**: External service clients (RssClient)
- **Sources**: News source implementations
- **Factories**: Factory patterns (NewsSourceFactory)
- **Services**: Business logic (ArticleService, EmbeddingService, etc.)
- **Repositories**: Data access layer (ArticleRepository)
- **Controllers**: HTTP request handlers (ArticleController)
- **Routes**: Route definitions

## 🔧 Scripts

- `npm start` - Start server
- `npm run dev` - Start with auto-reload
- `npm run reset-db` - Reset database schema

## 📝 Configuration

See `.env.example` for all available environment variables.


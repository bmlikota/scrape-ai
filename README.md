# SheepAI - Cybersecurity News Aggregator

AI-powered system that automatically collects, filters, summarizes, and presents cybersecurity news in a fast and user-centric manner.

## 🎥 MVP Demo Video

[Watch the MVP Demo Video](YOUR_VIDEO_LINK_HERE)

*Replace `YOUR_VIDEO_LINK_HERE` with your YouTube, Google Drive, Loom, or other video link*

## 📁 Project Structure

```
sheepai/
├── backend/          # Node.js Backend API
│   ├── src/          # Backend source code
│   ├── scripts/      # Utility scripts
│   ├── package.json  # Backend dependencies
│   └── docker-compose.yml  # Database setup
├── frontend/         # Frontend application
│   └── cyber-sheep-ui/  # Angular application
└── docs/             # Documentation files
```

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start PostgreSQL database:**
```bash
docker-compose up -d
```

4. **Configure environment:**
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

5. **Start backend server:**
```bash
npm start
```

Backend will run on `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend:**
```bash
cd frontend/cyber-sheep-ui
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm start
# or
ng serve
```

Frontend will run on `http://localhost:4200` (or configured port)

## 📚 Documentation

- **Backend API**: See `backend/README.md` or `API_ENDPOINTS.md`
- **OpenAPI Spec**: `openapi.yaml`
- **Solution Description**: `SOLUTION_DESCRIPTION.md`
- **Technical Solution**: `TECHNICAL_SOLUTION.md`
- **Solution Completeness**: `SOLUTION_COMPLETENESS.md`

## 🏗️ Architecture

This project follows **SOLID principles** and **clean code** practices with a clear separation between frontend and backend.

### Backend
- Node.js with Express.js
- PostgreSQL with pgvector for vector similarity search
- OpenAI API for embeddings and summarization
- Clean Architecture with SOLID principles

### Frontend
- Angular application
- Consumes backend REST API
- Real-time updates via WebSocket (planned)

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Auto-reload on changes
```

### Frontend Development
```bash
cd frontend/cyber-sheep-ui
ng serve  # Angular dev server
```

## 📡 API Endpoints

See `API_ENDPOINTS.md` or `openapi.yaml` for complete API documentation.

Main endpoints:
- `GET /api/articles` - Fetch articles
- `GET/POST /api/articles/search` - Semantic search
- `POST /api/articles/fetch-and-store` - Fetch and store articles

## 🐳 Docker

Database runs in Docker:
```bash
cd backend
docker-compose up -d    # Start database
docker-compose down     # Stop database
```

## 📝 Environment Variables

### Backend (.env in backend/)
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key (required)
- `PORT` - Server port (default: 3000)

## 🎯 Features

- ✅ Automated article collection from The Hacker News
- ✅ AI-powered 4-sentence summaries
- ✅ Multi-model consensus verification
- ✅ Semantic search with vector embeddings
- ✅ Real-time notifications
- ✅ PostgreSQL with pgvector for fast similarity search

## 📄 License

MIT

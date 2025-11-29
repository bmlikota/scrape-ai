# Project Structure

```
sheepai/
├── backend/                    # Node.js Backend API
│   ├── src/                    # Backend source code
│   │   ├── clients/           # External service clients
│   │   ├── config/            # Configuration
│   │   ├── controllers/       # HTTP request handlers
│   │   ├── database/          # Database client
│   │   ├── factories/         # Factory patterns
│   │   ├── interfaces/        # Abstract interfaces
│   │   ├── mappers/           # Data mappers
│   │   ├── models/            # Domain models
│   │   ├── repositories/      # Data access layer
│   │   ├── routes/            # Route definitions
│   │   ├── services/          # Business logic
│   │   ├── sources/           # News source implementations
│   │   ├── utils/             # Utilities
│   │   ├── validators/        # Request validators
│   │   └── server.js          # Server entry point
│   ├── scripts/               # Utility scripts
│   ├── .env                   # Environment variables (not in git)
│   ├── .env.example           # Environment template
│   ├── docker-compose.yml     # Database setup
│   ├── package.json           # Backend dependencies
│   ├── README.md              # Backend documentation
│   ├── API_ENDPOINTS.md       # API documentation
│   └── openapi.yaml           # OpenAPI specification
│
├── frontend/                   # Frontend application
│   └── cyber-sheep-ui/        # Angular application
│       ├── src/               # Frontend source code
│       ├── package.json       # Frontend dependencies
│       └── ...
│
├── .gitignore                  # Git ignore rules
├── README.md                   # Main project README
├── SOLUTION_DESCRIPTION.md     # Hackathon solution description
├── TECHNICAL_SOLUTION.md       # Technical solution explanation
└── SOLUTION_COMPLETENESS.md    # Solution completeness overview
```

## Quick Commands

### Backend
```bash
cd backend
npm install
docker-compose up -d
npm start
```

### Frontend
```bash
cd frontend/cyber-sheep-ui
npm install
npm start
```

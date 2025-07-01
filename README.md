# Questlog

Questlog is a gamified task management application that transforms tasks into quests with AI-powered prioritization, experience points, and motivational design. The goal is to help users overcome executive function challenges through engaging, game-like experiences.

---

## Features
- **Quest-Based Task Management**: Turn tasks into quests with progress tracking
- **AI-Powered Prioritization**: Smart task ordering and suggestions
- **Gamification**: XP, levels, achievements, and progress visualization
- **Cross-Platform**: Web (React), Desktop (Electron)
- **Executive Function Support**: Designed for focus and productivity

---

## Technology Stack
- **Frontend**: React + TypeScript (Web), Electron (Desktop)
- **Backend**: Node.js + Fastify (Quest & Auth Services), Python + FastAPI (AI Service)
- **Database**: PostgreSQL, Redis
- **AI**: OpenAI GPT-4, Anthropic Claude, Custom ML
- **Infrastructure**: Cloudflare, AWS S3, Pinecone

---

## Monorepo Structure
```
questlog/
  apps/
    web/         # React web app
    desktop/     # Electron desktop app
  services/
    quest-service/   # Node.js Fastify quest API
    auth-service/    # Node.js Fastify auth API
    ai-service/      # Python FastAPI AI service
  packages/
    types/       # Shared TypeScript types
    shared/      # Shared utilities
    ui/          # Shared UI components
  docs/          # Product & technical documentation
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+
- Python 3.11+
- PostgreSQL, Redis (see Docker setup below)

### Install Dependencies
```sh
npm install
```

### Run All Apps/Services (Dev)
- Web: `cd apps/web && npm run dev`
- Desktop: `cd apps/desktop && npm run dev`
- Quest Service: `cd services/quest-service && npm run dev`
- Auth Service: `cd services/auth-service && npm run dev`
- AI Service: `cd services/ai-service && uvicorn src.main:app --reload`

### Lint & Format
```sh
npm run lint
npm run format
```

### Build All
```sh
npm run build
```

### Run Tests
```sh
npm test
```

### Local Database & Redis (Docker)
```sh
docker-compose up -d
```

---

## Documentation
- [Product Vision](docs/product/vision.md)
- [Technical Architecture](docs/architecture/overview.md)
- [Feature Specs](docs/features/README.md)
- [Data Models](docs/data/models.md)
- [Style Guide](STYLE_GUIDE.md)

---

## Contributing
See [STYLE_GUIDE.md](STYLE_GUIDE.md) and [docs/development/README.md](docs/development/README.md) for coding standards and workflow.

---

## License
MIT © Noetic Software

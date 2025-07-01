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

1. **Start PostgreSQL and Redis:**
   ```sh
   docker-compose up -d
   ```
   This will start PostgreSQL (on port 5433) and Redis (on port 6379) in Docker containers.

2. **Database Initialization:**
   - The PostgreSQL container automatically runs the initialization script at `services/quest-service/prisma/init.sql` on first startup. This sets up tables and sample data.
   - If you need to reset the database, stop the container, delete the `postgres_data` Docker volume, and restart.

3. **Environment Variables:**
   - Copy `.env.example` to `.env` in the project root and in each service as needed.
   - The default database connection string is:
     ```
     DATABASE_URL=postgresql://questlog:questlog_dev_password@localhost:5433/questlog
     ```
   - Update the password/port if you change them in `docker-compose.yml`.

4. **Connecting to the Database:**
   - You can connect using any PostgreSQL client (e.g., psql, TablePlus, pgAdmin) with:
     - Host: `localhost`
     - Port: `5433`
     - User: `questlog`
     - Password: `questlog_dev_password`
     - Database: `questlog`

5. **Prisma ORM:**
   - The Prisma schema is defined in `services/quest-service/prisma/schema.prisma` and matches the SQL schema.
   - Migrations are not yet used; the schema is managed by the SQL script. You can baseline Prisma migrations later if needed.

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

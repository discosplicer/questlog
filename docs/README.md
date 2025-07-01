# Questlog - Design Documentation

## Overview

Questlog is a gamified task management application that transforms goals and work into "quests" similar to video game experiences. The application targets students tracking homework and projects, workers managing their tasks, and anyone needing executive function support in today's complex world.

## Key Features

- **Quest-Based Task Management**: Transform tasks into engaging quests with progress tracking
- **LLM-Powered Prioritization**: AI-driven task prioritization similar to World of Warcraft's RestedXP addon
- **Gamification Elements**: Experience points, levels, achievements, and progress visualization
- **Cross-Platform Support**: Web and desktop applications
- **Executive Function Support**: Designed to help users with task management and focus

## Documentation Structure

### [Product Vision & Strategy](./product/vision.md)
High-level product strategy, target audience, and business objectives.

### [User Experience Design](./design/ux-overview.md)
User journey maps, personas, and core user experience principles.

### [Technical Architecture](./architecture/overview.md)
System architecture, technology stack, and technical requirements.

### [Feature Specifications](./features/README.md)
Detailed specifications for all major features including:
- [Quest Management](./features/quest-management.md)
- [AI Prioritization Engine](./features/ai-prioritization.md)
- [Gamification System](./features/gamification.md)
- [User Interface](./features/user-interface.md)

### [Data Models](./data/models.md)
Database schema, data relationships, and API specifications.

### [Development Guidelines](./development/README.md)
Coding standards, development workflow, and deployment processes.

## Quick Start for Engineers

1. Read the [Product Vision](./product/vision.md) to understand the core concept
2. Review the [Technical Architecture](./architecture/overview.md) for system design
3. Dive into specific [Feature Specifications](./features/README.md) for implementation details
4. Follow [Development Guidelines](./development/README.md) for coding standards

## Development Setup

### Prerequisites
- Node.js v18+ and npm v9+
- Python 3.11+ (for AI service)
- Docker and Docker Compose
- PostgreSQL and Redis (via Docker)

### Current Status
- ✅ Monorepo structure established
- ✅ TypeScript configurations configured
- ✅ ESLint and Prettier setup complete
- ✅ Package.json workspace configuration
- ✅ Workspace dependencies working
- ✅ Docker configuration complete
- ✅ Source code implementation complete
- ✅ Build system functional
- ✅ Database schema designed and ready

### Getting Started
1. Clone the repository
2. Run `npm install` to install dependencies
3. Start Docker services: `docker-compose up -d`
4. Start development servers: `npm run dev`
5. Access services:
   - Web App: http://localhost:5173
   - Quest Service: http://localhost:3001
   - Auth Service: http://localhost:3002
   - API Docs: http://localhost:3001/docs, http://localhost:3002/docs

## Project Status

**Current Phase**: Foundation Setup (Sprint 1)  
**Status**: ✅ Task 1 Complete - Ready for Task 2  
**Last Updated**: July 1, 2025

The project foundation is complete and ready for the next development phase. All blocking issues have been resolved and the development environment is fully functional.

## Contributing

See [STYLE_GUIDE.md](../STYLE_GUIDE.md) for comprehensive coding standards and [ENGINEER_TASKS.md](../ENGINEER_TASKS.md) for current sprint tasks. 
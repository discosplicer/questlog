# Development Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the Questlog development environment and resolving current blocking issues.

## Current Blocking Issues

### 1. Workspace Dependencies Issue

**Problem**: npm cannot resolve `workspace:*` dependencies  
**Solution**: Update package.json files to use proper workspace syntax

#### Fix for Root package.json
```json
{
  "workspaces": [
    "packages/*",
    "apps/*", 
    "services/*"
  ]
}
```

#### Fix for Individual Package Dependencies
Replace all instances of `"workspace:*"` with `"*"` in:
- `services/quest-service/package.json`
- `services/auth-service/package.json`
- `apps/web/package.json`
- `apps/desktop/package.json`
- `packages/shared/package.json`
- `packages/types/package.json`
- `packages/ui/package.json`

### 2. Missing Docker Configuration

**Problem**: No docker-compose.yml for local development  
**Solution**: Create docker-compose.yml in root directory

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: questlog_dev
      POSTGRES_USER: questlog
      POSTGRES_PASSWORD: questlog_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U questlog -d questlog_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### 3. Missing Source Code Implementation

**Problem**: Empty src/ directories  
**Solution**: Add basic implementation files

#### Required Files to Create:

1. **services/quest-service/src/index.ts**
```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

const server = Fastify({
  logger: true
});

// Register plugins
await server.register(cors, {
  origin: true
});
await server.register(helmet);

// Health check endpoint
server.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'quest-service' };
});

// Start server
try {
  await server.listen({ port: 3001, host: '0.0.0.0' });
  console.log('Quest service running on port 3001');
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
```

2. **services/auth-service/src/index.ts**
```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

const server = Fastify({
  logger: true
});

// Register plugins
await server.register(cors, {
  origin: true
});
await server.register(helmet);

// Health check endpoint
server.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'auth-service' };
});

// Start server
try {
  await server.listen({ port: 3002, host: '0.0.0.0' });
  console.log('Auth service running on port 3002');
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
```

3. **apps/web/src/main.tsx**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

4. **apps/web/src/App.tsx**
```typescript
import React from 'react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Questlog</h1>
        <p>Gamified Task Management</p>
      </header>
    </div>
  );
}

export default App;
```

5. **apps/web/src/index.css**
```css
.App {
  text-align: center;
  padding: 2rem;
}

.App-header {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
}
```

6. **packages/shared/src/index.ts**
```typescript
export * from './utils/constants';
export * from './utils/errors';
export * from './utils/formatting';
export * from './utils/validation';
```

7. **packages/types/src/index.ts**
```typescript
// Basic type definitions
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quest {
  id: string;
  title: string;
  description?: string;
  status: QuestStatus;
  difficulty: QuestDifficulty;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum QuestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum QuestDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}
```

8. **packages/ui/src/index.ts**
```typescript
export * from './components/Button';
export * from './components/Card';
```

## Setup Instructions

### Step 1: Fix Workspace Dependencies
1. Update all package.json files to use `"*"` instead of `"workspace:*"`
2. Run `npm install` to verify dependencies resolve correctly

### Step 2: Create Docker Configuration
1. Create `docker-compose.yml` in root directory
2. Create `scripts/init-db.sql` for database initialization
3. Test with `docker-compose up -d`

### Step 3: Add Source Code
1. Create all required source files listed above
2. Ensure TypeScript compilation works: `npm run type-check`
3. Test builds: `npm run build`

### Step 4: Test Development Environment
1. Start services: `npm run dev`
2. Verify all services start without errors
3. Test health endpoints:
   - http://localhost:3001/health (quest service)
   - http://localhost:3002/health (auth service)
   - http://localhost:5173 (web app)

## Verification Checklist

- [ ] `npm install` completes successfully
- [ ] `npm run build` builds all packages
- [ ] `npm run dev` starts all services
- [ ] Docker containers start and are healthy
- [ ] Health endpoints return 200 OK
- [ ] Web app loads in browser
- [ ] ESLint passes: `npm run lint`
- [ ] Prettier formatting: `npm run format`

## Troubleshooting

### npm install fails
- Check Node.js version: `node --version` (should be 18+)
- Check npm version: `npm --version` (should be 9+)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and package-lock.json, then retry

### Docker issues
- Ensure Docker Desktop is running
- Check ports are not in use: `lsof -i :5432` and `lsof -i :6379`
- Restart Docker containers: `docker-compose down && docker-compose up -d`

### TypeScript errors
- Run `npm run type-check` to see specific errors
- Ensure all required dependencies are installed
- Check tsconfig.json paths are correct

## Next Steps

Once the blocking issues are resolved:
1. Implement basic API endpoints in services
2. Add database schema and migrations
3. Create basic UI components
4. Add unit tests
5. Set up CI/CD pipeline

## Support

For issues not covered in this guide, refer to:
- [STYLE_GUIDE.md](../STYLE_GUIDE.md) for coding standards
- [ENGINEER_TASKS.md](../ENGINEER_TASKS.md) for current tasks
- [PM_FEEDBACK.md](../PM_FEEDBACK.md) for detailed feedback 
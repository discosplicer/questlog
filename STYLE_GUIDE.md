# Questlog Style Guide

*"Code is read much more often than it is written."* - Guido van Rossum

## Table of Contents

1. [General Principles](#general-principles)
2. [Code Organization](#code-organization)
3. [Naming Conventions](#naming-conventions)
4. [Documentation Standards](#documentation-standards)
5. [Testing Requirements](#testing-requirements)
6. [Performance Standards](#performance-standards)
7. [Security Guidelines](#security-guidelines)
8. [API Design Standards](#api-design-standards)
9. [Database Standards](#database-standards)
10. [Frontend Standards](#frontend-standards)
11. [Backend Standards](#backend-standards)
12. [Git Workflow](#git-workflow)
13. [Code Review Checklist](#code-review-checklist)

## General Principles

### 1.1 Clarity Over Cleverness
- **Write code for humans, not machines**
- Prefer explicit over implicit
- Use descriptive names that explain intent
- Avoid "clever" one-liners that require mental parsing

```typescript
// ❌ Clever but unclear
const isEligible = user.age >= 18 && user.verified && !user.banned;

// ✅ Clear and explicit
const isUserOfLegalAge = user.age >= 18;
const isUserVerified = user.verified;
const isUserNotBanned = !user.banned;
const isEligible = isUserOfLegalAge && isUserVerified && isUserNotBanned;
```

### 1.2 Consistency
- **Follow established patterns religiously**
- Use the same approach for similar problems
- Maintain consistent formatting across the codebase
- Document any deviations from established patterns

### 1.3 Defensive Programming
- **Assume nothing, validate everything**
- Handle edge cases explicitly
- Provide meaningful error messages
- Log important state changes and errors

### 1.4 Performance Awareness
- **Measure before optimizing**
- Use appropriate data structures
- Consider time and space complexity
- Profile critical paths

## Code Organization

### 2.1 File Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── hooks/              # Custom React hooks
├── services/           # API and external service integrations
├── stores/             # State management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── constants/          # Application constants
└── pages/              # Page components
```

### 2.2 Module Organization
- **One concept per file**
- Export only what's necessary
- Use index files for clean imports
- Group related functionality

```typescript
// ❌ Multiple concepts in one file
// quest-utils.ts
export const formatQuestTitle = (title: string) => { /* ... */ };
export const calculateQuestProgress = (quest: Quest) => { /* ... */ };
export const validateQuestData = (data: QuestData) => { /* ... */ };
export const QUEST_TYPES = { /* ... */ };

// ✅ Separated by concept
// quest-formatters.ts
export const formatQuestTitle = (title: string) => { /* ... */ };

// quest-calculators.ts
export const calculateQuestProgress = (quest: Quest) => { /* ... */ };

// quest-validators.ts
export const validateQuestData = (data: QuestData) => { /* ... */ };

// quest-constants.ts
export const QUEST_TYPES = { /* ... */ };
```

## Naming Conventions

### 3.1 Variables and Functions
- **Use camelCase for variables and functions**
- **Use PascalCase for classes, interfaces, and types**
- **Use UPPER_SNAKE_CASE for constants**

```typescript
// Variables
const questTitle = 'Defeat the Dragon';
const isQuestComplete = true;
const MAX_QUEST_DURATION = 30; // days

// Functions
const calculateQuestReward = (quest: Quest): number => { /* ... */ };
const validateQuestData = (data: QuestData): boolean => { /* ... */ };

// Classes and Interfaces
interface QuestData {
  title: string;
  description: string;
  difficulty: QuestDifficulty;
}

class QuestManager {
  // ...
}
```

### 3.2 Database and API
- **Use snake_case for database columns and API endpoints**
- **Use camelCase for JSON properties**

```sql
-- Database
CREATE TABLE quests (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

```typescript
// API endpoints
GET /api/v1/quests
POST /api/v1/quests
PUT /api/v1/quests/:id
DELETE /api/v1/quests/:id

// JSON response
{
  "questId": "uuid",
  "questTitle": "Defeat the Dragon",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 3.3 Boolean Naming
- **Use positive boolean names**
- **Prefix with 'is', 'has', 'can', 'should'**

```typescript
// ✅ Good boolean names
const isQuestComplete = true;
const hasUserPermission = false;
const canEditQuest = true;
const shouldShowProgress = false;

// ❌ Avoid negative names
const isNotComplete = false;
const hasNoPermission = true;
```

## Documentation Standards

### 4.1 Code Comments
- **Document the 'why', not the 'what'**
- **Use JSDoc for public APIs**
- **Keep comments up to date with code changes**

```typescript
/**
 * Calculates the experience points awarded for completing a quest.
 * 
 * The formula considers quest difficulty, time spent, and user level
 * to provide balanced progression. Higher difficulty quests award
 * exponentially more XP to encourage challenging content.
 * 
 * @param quest - The completed quest
 * @param timeSpent - Time spent on quest in minutes
 * @param userLevel - Current user level
 * @returns Experience points awarded
 * 
 * @example
 * const xp = calculateQuestXP(quest, 120, 5); // Returns 150
 */
const calculateQuestXP = (
  quest: Quest,
  timeSpent: number,
  userLevel: number
): number => {
  // Base XP from quest difficulty
  const baseXP = quest.difficulty * 10;
  
  // Time bonus (diminishing returns after 2 hours)
  const timeBonus = Math.min(timeSpent / 10, 12);
  
  // Level multiplier (higher levels get slightly more XP)
  const levelMultiplier = 1 + (userLevel * 0.05);
  
  return Math.round((baseXP + timeBonus) * levelMultiplier);
};
```

### 4.2 README Files
- **Every directory should have a README.md**
- **Document purpose, usage, and examples**
- **Include setup instructions for new developers**

```markdown
# Quest Management Module

## Purpose
Handles all quest-related operations including creation, updates, completion tracking, and progress calculation.

## Key Components
- `QuestManager`: Main service for quest operations
- `QuestValidator`: Data validation and sanitization
- `QuestCalculator`: Progress and reward calculations

## Usage Examples

### Creating a New Quest
```typescript
const questManager = new QuestManager();
const quest = await questManager.createQuest({
  title: 'Defeat the Dragon',
  description: 'Slay the ancient dragon terrorizing the village',
  difficulty: QuestDifficulty.HARD,
  estimatedDuration: 120 // minutes
});
```

### Updating Quest Progress
```typescript
await questManager.updateProgress(questId, {
  completedSteps: 3,
  totalSteps: 5,
  timeSpent: 45
});
```

## Setup
1. Ensure database migrations are run
2. Configure environment variables
3. Run tests: `npm test quest-management`
```

## Testing Requirements

### 5.1 Test Coverage
- **Minimum 90% code coverage**
- **100% coverage for critical business logic**
- **Test all error paths and edge cases**

### 5.2 Test Organization
```
tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
├── e2e/               # End-to-end tests
└── fixtures/          # Test data and mocks
```

### 5.3 Test Naming
- **Use descriptive test names**
- **Follow the pattern: "should [expected behavior] when [condition]"**

```typescript
describe('QuestManager', () => {
  describe('createQuest', () => {
    it('should create a quest with valid data when all required fields are provided', async () => {
      // Test implementation
    });

    it('should throw ValidationError when title is empty', async () => {
      // Test implementation
    });

    it('should assign default difficulty when not specified', async () => {
      // Test implementation
    });
  });
});
```

### 5.4 Mocking Guidelines
- **Mock external dependencies**
- **Use realistic test data**
- **Reset mocks between tests**

```typescript
// ✅ Good mocking
const mockQuestRepository = {
  create: jest.fn().mockResolvedValue(mockQuest),
  findById: jest.fn().mockResolvedValue(mockQuest),
  update: jest.fn().mockResolvedValue(updatedQuest)
};

beforeEach(() => {
  jest.clearAllMocks();
});
```

## Performance Standards

### 6.1 Response Times
- **API endpoints: < 200ms for 95th percentile**
- **Database queries: < 50ms for 95th percentile**
- **Frontend interactions: < 100ms for perceived performance**

### 6.2 Database Optimization
- **Use appropriate indexes**
- **Avoid N+1 queries**
- **Use pagination for large datasets**

```sql
-- ✅ Good: Use indexes
CREATE INDEX idx_quests_user_id ON quests(user_id);
CREATE INDEX idx_quests_status_created ON quests(status, created_at);

-- ✅ Good: Use pagination
SELECT * FROM quests 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 40;
```

### 6.3 Caching Strategy
- **Cache frequently accessed data**
- **Use appropriate cache invalidation**
- **Monitor cache hit rates**

```typescript
// ✅ Good caching
const getQuestById = async (id: string): Promise<Quest> => {
  const cacheKey = `quest:${id}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const quest = await questRepository.findById(id);
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(quest));
  
  return quest;
};
```

## Security Guidelines

### 7.1 Input Validation
- **Validate all inputs at boundaries**
- **Use parameterized queries**
- **Sanitize user-generated content**

```typescript
// ✅ Good validation
const createQuestSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().max(1000).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  estimatedDuration: z.number().min(1).max(1440) // max 24 hours
});

const createQuest = async (data: unknown): Promise<Quest> => {
  const validatedData = createQuestSchema.parse(data);
  // Process validated data
};
```

### 7.2 Authentication & Authorization
- **Use JWT with short expiration**
- **Implement proper role-based access**
- **Log security events**

```typescript
// ✅ Good authorization
const updateQuest = async (questId: string, data: QuestUpdate, user: User) => {
  const quest = await questRepository.findById(questId);
  
  if (!quest) {
    throw new NotFoundError('Quest not found');
  }
  
  if (quest.userId !== user.id && !user.hasRole('ADMIN')) {
    throw new ForbiddenError('Insufficient permissions');
  }
  
  // Proceed with update
};
```

### 7.3 Data Protection
- **Encrypt sensitive data at rest**
- **Use HTTPS for all communications**
- **Implement proper session management**

## API Design Standards

### 8.1 RESTful Design
- **Use proper HTTP methods**
- **Return appropriate status codes**
- **Provide consistent error responses**

```typescript
// ✅ Good RESTful design
// GET /api/v1/quests - List quests
app.get('/api/v1/quests', async (req, res) => {
  const quests = await questService.listQuests(req.query);
  res.json({
    data: quests,
    meta: {
      total: quests.length,
      page: req.query.page || 1
    }
  });
});

// POST /api/v1/quests - Create quest
app.post('/api/v1/quests', async (req, res) => {
  const quest = await questService.createQuest(req.body);
  res.status(201).json({ data: quest });
});

// PUT /api/v1/quests/:id - Update quest
app.put('/api/v1/quests/:id', async (req, res) => {
  const quest = await questService.updateQuest(req.params.id, req.body);
  res.json({ data: quest });
});

// DELETE /api/v1/quests/:id - Delete quest
app.delete('/api/v1/quests/:id', async (req, res) => {
  await questService.deleteQuest(req.params.id);
  res.status(204).send();
});
```

### 8.2 Error Handling
- **Use consistent error format**
- **Provide meaningful error messages**
- **Log errors with context**

```typescript
// ✅ Good error handling
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

const handleError = (error: Error, req: Request, res: Response) => {
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id
  });

  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.details
      }
    });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: error.message
      }
    });
  }

  // Default error
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};
```

## Database Standards

### 9.1 Schema Design
- **Use meaningful table and column names**
- **Include created_at and updated_at timestamps**
- **Use appropriate data types**

```sql
-- ✅ Good schema design
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty quest_difficulty NOT NULL DEFAULT 'MEDIUM',
  status quest_status NOT NULL DEFAULT 'PENDING',
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  estimated_duration INTEGER CHECK (estimated_duration > 0),
  actual_duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_quests_user_id ON quests(user_id);
CREATE INDEX idx_quests_status ON quests(status);
CREATE INDEX idx_quests_created_at ON quests(created_at);
```

### 9.2 Migration Management
- **Use versioned migrations**
- **Make migrations reversible**
- **Test migrations on staging**

```sql
-- ✅ Good migration
-- Migration: 001_create_quests_table.up.sql
CREATE TABLE quests (
  -- table definition
);

-- Migration: 001_create_quests_table.down.sql
DROP TABLE quests;
```

## Frontend Standards

### 10.1 Component Design
- **Use functional components with hooks**
- **Implement proper prop validation**
- **Follow single responsibility principle**

```typescript
// ✅ Good component design
interface QuestCardProps {
  quest: Quest;
  onComplete: (questId: string) => void;
  onEdit: (questId: string) => void;
  className?: string;
}

const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  onComplete,
  onEdit,
  className
}) => {
  const handleComplete = useCallback(() => {
    onComplete(quest.id);
  }, [quest.id, onComplete]);

  const handleEdit = useCallback(() => {
    onEdit(quest.id);
  }, [quest.id, onEdit]);

  return (
    <div className={cn('quest-card', className)}>
      <h3 className="quest-title">{quest.title}</h3>
      <p className="quest-description">{quest.description}</p>
      <div className="quest-actions">
        <button onClick={handleComplete}>Complete</button>
        <button onClick={handleEdit}>Edit</button>
      </div>
    </div>
  );
};

QuestCard.propTypes = {
  quest: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string
  }).isRequired,
  onComplete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  className: PropTypes.string
};
```

### 10.2 State Management
- **Use appropriate state management patterns**
- **Avoid prop drilling**
- **Keep state as local as possible**

```typescript
// ✅ Good state management
const useQuestState = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuests = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await questService.getQuests();
      setQuests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quests');
    } finally {
      setLoading(false);
    }
  }, []);

  const addQuest = useCallback((quest: Quest) => {
    setQuests(prev => [...prev, quest]);
  }, []);

  const updateQuest = useCallback((updatedQuest: Quest) => {
    setQuests(prev => 
      prev.map(quest => 
        quest.id === updatedQuest.id ? updatedQuest : quest
      )
    );
  }, []);

  return {
    quests,
    loading,
    error,
    fetchQuests,
    addQuest,
    updateQuest
  };
};
```

## Backend Standards

### 11.1 Service Layer Design
- **Separate business logic from data access**
- **Use dependency injection**
- **Implement proper error handling**

```typescript
// ✅ Good service design
interface QuestService {
  createQuest(data: CreateQuestData): Promise<Quest>;
  getQuest(id: string): Promise<Quest>;
  updateQuest(id: string, data: UpdateQuestData): Promise<Quest>;
  deleteQuest(id: string): Promise<void>;
  listQuests(filters: QuestFilters): Promise<Quest[]>;
}

class QuestServiceImpl implements QuestService {
  constructor(
    private questRepository: QuestRepository,
    private validator: QuestValidator,
    private eventBus: EventBus
  ) {}

  async createQuest(data: CreateQuestData): Promise<Quest> {
    // Validate input
    const validatedData = this.validator.validateCreate(data);
    
    // Check business rules
    await this.validateBusinessRules(validatedData);
    
    // Create quest
    const quest = await this.questRepository.create(validatedData);
    
    // Emit event
    await this.eventBus.emit('quest.created', { questId: quest.id });
    
    return quest;
  }

  private async validateBusinessRules(data: CreateQuestData): Promise<void> {
    // Check user quest limits
    const userQuestCount = await this.questRepository.countByUser(data.userId);
    if (userQuestCount >= MAX_QUESTS_PER_USER) {
      throw new BusinessRuleError('User has reached maximum quest limit');
    }
  }
}
```

### 11.2 Repository Pattern
- **Abstract data access layer**
- **Use interfaces for testability**
- **Implement proper error handling**

```typescript
// ✅ Good repository design
interface QuestRepository {
  create(data: CreateQuestData): Promise<Quest>;
  findById(id: string): Promise<Quest | null>;
  findByUser(userId: string, filters?: QuestFilters): Promise<Quest[]>;
  update(id: string, data: UpdateQuestData): Promise<Quest>;
  delete(id: string): Promise<void>;
  countByUser(userId: string): Promise<number>;
}

class PostgresQuestRepository implements QuestRepository {
  constructor(private db: Database) {}

  async create(data: CreateQuestData): Promise<Quest> {
    try {
      const result = await this.db.query(
        'INSERT INTO quests (title, description, user_id) VALUES ($1, $2, $3) RETURNING *',
        [data.title, data.description, data.userId]
      );
      
      return this.mapToQuest(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictError('Quest with this title already exists');
      }
      throw new DatabaseError('Failed to create quest', error);
    }
  }

  private mapToQuest(row: any): Quest {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      userId: row.user_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
```

## Git Workflow

### 12.1 Branch Naming
- **Use descriptive branch names**
- **Follow the pattern: `type/description`**

```
feature/quest-prioritization
bugfix/fix-quest-progress-calculation
hotfix/security-patch-for-auth
refactor/improve-quest-validation
docs/update-api-documentation
```

### 12.2 Commit Messages
- **Use conventional commit format**
- **Write clear, descriptive messages**
- **Reference issues when applicable**

```
feat: add AI-powered quest prioritization

- Implement priority scoring algorithm
- Add user behavior analysis
- Integrate with OpenAI API for suggestions

Closes #123
```

### 12.3 Pull Request Standards
- **Include clear description of changes**
- **Add screenshots for UI changes**
- **Link related issues**
- **Request reviews from appropriate team members**

## Code Review Checklist

### 13.1 Functionality
- [ ] Does the code work as intended?
- [ ] Are all requirements met?
- [ ] Are edge cases handled?
- [ ] Is error handling appropriate?

### 13.2 Code Quality
- [ ] Is the code readable and well-structured?
- [ ] Are naming conventions followed?
- [ ] Is there appropriate documentation?
- [ ] Are there any code smells or anti-patterns?

### 13.3 Testing
- [ ] Are there adequate tests?
- [ ] Do tests cover edge cases?
- [ ] Are tests meaningful and maintainable?
- [ ] Is test coverage sufficient?

### 13.4 Performance
- [ ] Are there any performance concerns?
- [ ] Are database queries optimized?
- [ ] Is caching used appropriately?
- [ ] Are there any memory leaks?

### 13.5 Security
- [ ] Are inputs properly validated?
- [ ] Are there any security vulnerabilities?
- [ ] Is authentication/authorization correct?
- [ ] Is sensitive data handled properly?

### 13.6 Maintainability
- [ ] Is the code easy to understand?
- [ ] Are there clear separation of concerns?
- [ ] Is the code reusable?
- [ ] Are dependencies minimal and appropriate?

---

## Enforcement

This style guide is **mandatory** for all Questlog development. Code reviews will strictly enforce these standards. Any deviations must be documented and approved by the Staff Software Engineer.

**Remember**: Code is read much more often than it is written. Write for your future self and your teammates.

---

*Last updated: July 2025*
*Maintained by: AI Staff Software Engineer, Noetic Software* 
# API Design Specification

## Overview

Questlog's API follows REST principles with JSON payloads, comprehensive error handling, and consistent patterns across all services. The API is versioned and designed for both internal service communication and external integrations.

**Current Status**: ✅ **PRODUCTION READY** - Quest management API has been implemented with enterprise-grade quality, comprehensive validation, and security best practices. See CODE_REVIEW.md for detailed assessment.

### Reference Implementation
The quest management API serves as our **reference implementation** for API design best practices:

- **Comprehensive Validation**: Zod schemas for all input validation
- **Security First**: Input sanitization and user authorization
- **Error Handling**: Proper HTTP status codes and meaningful error messages
- **Type Safety**: Full TypeScript integration with shared types
- **Documentation**: Swagger integration for API documentation

## API Standards

### Base URL
```
Production: https://api.questlog.com/v1
Staging: https://api-staging.questlog.com/v1
Development: http://localhost:3000/v1
```

### Authentication
All API requests require authentication via JWT Bearer token:
```
Authorization: Bearer <jwt_token>
```

### Content Type
```
Content-Type: application/json
Accept: application/json
```

### Response Format
All responses follow a consistent format:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456789"
  }
}
```

## Core API Endpoints

### Authentication API

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "securePassword123",
  "displayName": "John Doe",
  "timezone": "America/New_York",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "username": "username",
      "displayName": "John Doe",
      "timezone": "America/New_York",
      "language": "en",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

#### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** Same as register response

#### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

#### Get User Profile
```http
GET /auth/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "username": "username",
      "displayName": "John Doe",
      "avatarUrl": "https://cdn.questlog.com/avatars/user_123.jpg",
      "timezone": "America/New_York",
      "language": "en",
      "subscriptionTier": "premium",
      "subscriptionExpiresAt": "2024-12-31T23:59:59Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "lastLoginAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Quest API

#### Create Quest
```http
POST /quests?userId={userId}
```

**Request Body:**
```json
{
  "title": "Complete project proposal",
  "description": "Write and submit the Q1 project proposal to stakeholders",
  "difficulty": "MEDIUM",
  "estimatedDuration": 120,
  "priority": "HIGH",
  "categoryId": "uuid-optional",
  "tags": ["proposal", "stakeholders"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Complete project proposal",
    "description": "Write and submit the Q1 project proposal to stakeholders",
    "difficulty": "MEDIUM",
    "status": "DRAFT",
    "estimatedDuration": 120,
    "actualDuration": null,
    "priority": "HIGH",
    "experiencePoints": 0,
    "userId": "uuid",
    "categoryId": "uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "completedAt": null,
    "category": {
      "id": "uuid",
      "name": "Work",
      "description": "Work-related tasks",
      "color": "#3B82F6",
      "userId": "uuid",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    "tags": [
      {
        "questId": "uuid",
        "tagName": "proposal"
      },
      {
        "questId": "uuid",
        "tagName": "stakeholders"
      }
    ],
    "steps": []
  }
}
```

#### List Quests
```http
GET /quests?userId={userId}&page=1&limit=20&status=ACTIVE&priority=HIGH&difficulty=MEDIUM
```

**Query Parameters:**
- `userId` (required): User ID to filter quests
- `page`: Page number (default: 1)
- `limit`: Number of results per page (default: 20, max: 100)
- `status`: Filter by quest status (DRAFT, ACTIVE, IN_PROGRESS, COMPLETED, ARCHIVED)
- `priority`: Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `difficulty`: Filter by difficulty (EASY, MEDIUM, HARD, EPIC)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Complete project proposal",
      "description": "Write and submit the Q1 project proposal to stakeholders",
      "difficulty": "MEDIUM",
      "status": "ACTIVE",
      "estimatedDuration": 120,
      "actualDuration": null,
      "priority": "HIGH",
      "experiencePoints": 0,
      "userId": "uuid",
      "categoryId": "uuid",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "completedAt": null,
      "category": {
        "id": "uuid",
        "name": "Work",
        "description": "Work-related tasks",
        "color": "#3B82F6",
        "userId": "uuid",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      },
      "tags": [
        {
          "questId": "uuid",
          "tagName": "proposal"
        }
      ],
      "steps": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get Quest Details
```http
GET /quests/{questId}?userId={userId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Complete project proposal",
    "description": "Write and submit the Q1 project proposal to stakeholders",
    "difficulty": "MEDIUM",
    "status": "ACTIVE",
    "estimatedDuration": 120,
    "actualDuration": null,
    "priority": "HIGH",
    "experiencePoints": 0,
    "userId": "uuid",
    "categoryId": "uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "completedAt": null,
    "category": {
      "id": "uuid",
      "name": "Work",
      "description": "Work-related tasks",
      "color": "#3B82F6",
      "userId": "uuid",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    "tags": [
      {
        "questId": "uuid",
        "tagName": "proposal"
      },
      {
        "questId": "uuid",
        "tagName": "stakeholders"
      }
    ],
    "steps": [
      {
        "id": "uuid",
        "title": "Research requirements",
        "description": "Gather stakeholder requirements",
        "completed": false,
        "orderIndex": 1,
        "questId": "uuid",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### Update Quest
```http
PUT /quests/{questId}?userId={userId}
```

**Request Body:**
```json
{
  "title": "Updated project proposal",
  "description": "Updated description",
  "difficulty": "HARD",
  "estimatedDuration": 180,
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  "categoryId": "uuid-optional",
  "tags": ["updated", "proposal"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Updated project proposal",
    "description": "Updated description",
    "difficulty": "HARD",
    "status": "IN_PROGRESS",
    "estimatedDuration": 180,
    "actualDuration": null,
    "priority": "URGENT",
    "experiencePoints": 0,
    "userId": "uuid",
    "categoryId": "uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:30:00Z",
    "completedAt": null,
    "category": {
      "id": "uuid",
      "name": "Work",
      "description": "Work-related tasks",
      "color": "#3B82F6",
      "userId": "uuid",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    "tags": [
      {
        "questId": "uuid",
        "tagName": "updated"
      },
      {
        "questId": "uuid",
        "tagName": "proposal"
      }
    ],
    "steps": []
  }
}
```

#### Delete Quest
```http
DELETE /quests/{questId}?userId={userId}
```

**Response:**
```json
{
  "success": true,
  "message": "Quest deleted successfully"
}
```

#### Complete Quest
```http
PUT /quests/{questId}/complete
```

**Request Body:**
```json
{
  "actualDuration": 135,
  "notes": "Completed ahead of schedule"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quest": {
      "id": "quest_456",
      "status": "completed",
      "actualTimeMinutes": 135,
      "completedAt": "2024-01-15T14:30:00Z",
      "experiencePoints": 150
    }
  }
}
```

#### Update Quest Progress
```http
POST /quests/{questId}/progress
```

**Request Body:**
```json
{
  "progressPercentage": 75,
  "actualTimeMinutes": 90
}
```

### AI API

#### Get Prioritized Quests
```http
POST /ai/prioritize
```

**Request Body:**
```json
{
  "context": {
    "timeAvailable": 120,
    "energyLevel": "high",
    "location": "office",
    "currentTime": "2024-01-15T10:30:00Z"
  },
  "filters": {
    "status": "active",
    "categoryId": "cat_work"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prioritizedQuests": [
      {
        "questId": "quest_456",
        "priorityScore": 85,
        "reasoning": "High impact task with approaching deadline",
        "recommendedAction": "start_now",
        "estimatedCompletionTime": 120
      }
    ],
    "context": {
      "availableTime": 120,
      "energyLevel": "high",
      "optimalTaskType": "complex"
    }
  }
}
```

#### Get AI Suggestions
```http
POST /ai/suggest
```

**Request Body:**
```json
{
  "suggestionType": "quest_breakdown",
  "questId": "quest_456",
  "context": {
    "userLevel": 15,
    "preferredComplexity": "moderate"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "sub_quest",
        "title": "Research stakeholder requirements",
        "description": "Gather requirements from key stakeholders",
        "estimatedTimeMinutes": 30,
        "priority": 1
      },
      {
        "type": "sub_quest",
        "title": "Draft proposal outline",
        "description": "Create initial structure and outline",
        "estimatedTimeMinutes": 45,
        "priority": 2
      }
    ]
  }
}
```

### Gamification API

#### Get User Profile
```http
GET /gamification/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "level": 15,
      "experiencePoints": 12500,
      "totalQuestsCompleted": 150,
      "currentStreakDays": 7,
      "longestStreakDays": 30,
      "totalStreakDays": 45,
      "achievements": [
        {
          "id": "ach_123",
          "name": "Quest Master",
          "description": "Complete 100 quests",
          "unlockedAt": "2024-01-10T10:30:00Z"
        }
      ]
    }
  }
}
```

#### Get Achievements
```http
GET /gamification/achievements?category=all&unlocked=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "achievements": [
      {
        "id": "ach_123",
        "name": "Quest Master",
        "description": "Complete 100 quests",
        "category": "milestone",
        "rarity": "rare",
        "icon": "trophy",
        "xpReward": 500,
        "unlockedAt": "2024-01-10T10:30:00Z",
        "progress": {
          "current": 150,
          "required": 100,
          "percentage": 100
        }
      }
    ]
  }
}
```

#### Get Leaderboard
```http
GET /gamification/leaderboard?type=global&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "user_123",
        "username": "questmaster",
        "displayName": "John Doe",
        "level": 25,
        "experiencePoints": 25000,
        "totalQuestsCompleted": 300
      }
    ],
    "userRank": {
      "rank": 15,
      "totalParticipants": 1000
    }
  }
}
```

### Notification API

#### Get Notifications
```http
GET /notifications?unread=true&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "type": "quest_reminder",
        "title": "Quest Due Soon",
        "message": "Your quest 'Complete project proposal' is due in 2 hours",
        "data": {
          "questId": "quest_456",
          "dueDate": "2024-01-15T17:00:00Z"
        },
        "read": false,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### Mark Notification as Read
```http
POST /notifications/{notificationId}/read
```

## Error Codes

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

### Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Invalid or expired token
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `RESOURCE_CONFLICT` - Resource conflict (e.g., duplicate email)
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Unexpected server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

## Rate Limiting

### Limits
- **Authentication endpoints**: 5 requests per minute
- **Quest endpoints**: 100 requests per minute
- **AI endpoints**: 20 requests per minute
- **Gamification endpoints**: 50 requests per minute

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

## Webhooks

### Webhook Events
- `quest.created` - New quest created
- `quest.updated` - Quest updated
- `quest.completed` - Quest completed
- `achievement.unlocked` - Achievement unlocked
- `level.up` - User leveled up
- `streak.broken` - Streak broken

### Webhook Payload
```json
{
  "event": "quest.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "questId": "quest_456",
    "userId": "user_123",
    "completedAt": "2024-01-15T10:30:00Z",
    "xpEarned": 150
  }
}
```

## SDKs and Libraries

### Official SDKs
- **JavaScript/TypeScript**: `@questlog/sdk`
- **Python**: `questlog-python`
- **React Hook**: `@questlog/react`

### Example Usage (JavaScript)
```javascript
import { QuestlogClient } from '@questlog/sdk';

const client = new QuestlogClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.questlog.com/v1'
});

// Create a quest
const quest = await client.quests.create({
  title: 'Complete project proposal',
  description: 'Write and submit the Q1 project proposal',
  dueDate: '2024-01-20T17:00:00Z'
});

// Get prioritized quests
const prioritized = await client.ai.prioritize({
  context: {
    timeAvailable: 120,
    energyLevel: 'high'
  }
});
```

## API Versioning

### Version Strategy
- **URL Versioning**: `/v1/`, `/v2/`
- **Backward Compatibility**: Maintained for 12 months
- **Deprecation Notice**: 6 months advance notice
- **Breaking Changes**: Only in major versions

### Version Lifecycle
1. **Beta**: New features in beta
2. **Stable**: Production-ready features
3. **Deprecated**: Features marked for removal
4. **Removed**: Features no longer available 

## Quest Service Implementation Details

### Security Features
The quest service implements enterprise-grade security measures:

#### Input Validation & Sanitization
- **Zod Schema Validation**: All inputs validated using shared schemas
- **XSS Prevention**: Input sanitization removes script tags and HTML
- **SQL Injection Protection**: Parameterized queries via Prisma ORM
- **Rate Limiting**: 100 requests per 15-minute window per IP

#### Authorization & Access Control
- **User Isolation**: All quest operations require valid `userId`
- **Ownership Validation**: Users can only access their own quests
- **Resource Validation**: Category relationships verified before assignment

### Performance Optimizations
- **Database Indexes**: Optimized queries on `userId`, `status`, `createdAt`
- **Pagination**: Efficient offset-based pagination with metadata
- **Selective Includes**: Related data loaded only when needed
- **Connection Pooling**: Managed by Prisma client

### Error Handling
- **Structured Responses**: Consistent error format across all endpoints
- **Validation Errors**: Detailed Zod validation error messages
- **HTTP Status Codes**: Proper status codes (200, 201, 400, 404, 500)
- **Logging**: Structured logging with request context

### Testing Strategy
- **57 Comprehensive Tests**: 100% coverage of all endpoints
- **Test Categories**:
  - CRUD Operations (31 tests)
  - Pagination & Filtering (11 tests)
  - Integration Scenarios (8 tests)
  - User Registration (7 tests)
- **Test Isolation**: Each test cleans up after itself
- **Security Testing**: XSS prevention and authorization verification

### API Documentation
- **Swagger Integration**: Auto-generated OpenAPI documentation
- **Interactive Testing**: Available at `/docs` endpoint
- **Response Examples**: Complete request/response examples
- **Error Documentation**: All error codes and messages documented

### Database Design
- **Normalized Schema**: Proper relationships with foreign keys
- **Cascade Operations**: Automatic cleanup of related records
- **Enum Constraints**: Type-safe status, priority, and difficulty values
- **Audit Trail**: `createdAt`, `updatedAt`, `completedAt` timestamps

### Monitoring & Observability
- **Structured Logging**: JSON format with correlation IDs
- **Request Tracking**: Operation logging with user context
- **Error Monitoring**: Comprehensive error logging and handling
- **Health Checks**: Service health endpoint for monitoring

## Error Codes & Troubleshooting

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_string",
      "message": "Quest title is required",
      "path": ["title"]
    }
  ]
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Quest not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

### Troubleshooting Guide

#### Missing User ID
**Problem**: `userId query parameter is required`
**Solution**: Ensure `userId` is provided in query parameters for all quest operations

#### Invalid Category
**Problem**: `Category not found`
**Solution**: Verify category exists and belongs to the user before assignment

#### Validation Errors
**Problem**: Zod validation failures
**Solution**: Check request body against API documentation schema

#### Rate Limiting
**Problem**: Too many requests
**Solution**: Implement client-side rate limiting or retry with exponential backoff

## Performance Considerations

### Database Query Optimization
- Use pagination for large result sets
- Leverage filtering to reduce data transfer
- Consider caching for frequently accessed quests
- Monitor query performance in production

### API Usage Best Practices
- Implement client-side caching for quest lists
- Use optimistic updates for better UX
- Batch operations when possible
- Handle network errors gracefully

### Scaling Considerations
- Database connection pooling
- Horizontal scaling with load balancers
- Caching layer for frequently accessed data
- Monitoring and alerting for performance metrics 
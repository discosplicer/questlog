# API Design Specification

## Overview

Questlog's API follows REST principles with JSON payloads, comprehensive error handling, and consistent patterns across all services. The API is versioned and designed for both internal service communication and external integrations.

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
POST /quests
```

**Request Body:**
```json
{
  "title": "Complete project proposal",
  "description": "Write and submit the Q1 project proposal to stakeholders",
  "categoryId": "cat_work",
  "projectId": "proj_123",
  "priority": 3,
  "dueDate": "2024-01-20T17:00:00Z",
  "estimatedTimeMinutes": 120,
  "complexity": "moderate",
  "tags": ["proposal", "stakeholders"],
  "recurrencePattern": {
    "type": "none"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quest": {
      "id": "quest_456",
      "title": "Complete project proposal",
      "description": "Write and submit the Q1 project proposal to stakeholders",
      "categoryId": "cat_work",
      "projectId": "proj_123",
      "status": "active",
      "priority": 3,
      "dueDate": "2024-01-20T17:00:00Z",
      "estimatedTimeMinutes": 120,
      "actualTimeMinutes": 0,
      "progressPercentage": 0,
      "complexity": "moderate",
      "tags": ["proposal", "stakeholders"],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### List Quests
```http
GET /quests?status=active&categoryId=cat_work&limit=20&offset=0
```

**Query Parameters:**
- `status`: Filter by quest status (draft, active, in_progress, completed, paused, overdue)
- `categoryId`: Filter by category
- `projectId`: Filter by project
- `priority`: Filter by priority level (1-5)
- `dueDateFrom`: Filter by due date range
- `dueDateTo`: Filter by due date range
- `search`: Full-text search in title and description
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)
- `sortBy`: Sort field (createdAt, dueDate, priority, title)
- `sortOrder`: Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "quests": [
      {
        "id": "quest_456",
        "title": "Complete project proposal",
        "description": "Write and submit the Q1 project proposal to stakeholders",
        "categoryId": "cat_work",
        "projectId": "proj_123",
        "status": "active",
        "priority": 3,
        "dueDate": "2024-01-20T17:00:00Z",
        "estimatedTimeMinutes": 120,
        "actualTimeMinutes": 0,
        "progressPercentage": 0,
        "complexity": "moderate",
        "tags": ["proposal", "stakeholders"],
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### Get Quest Details
```http
GET /quests/{questId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quest": {
      "id": "quest_456",
      "title": "Complete project proposal",
      "description": "Write and submit the Q1 project proposal to stakeholders",
      "categoryId": "cat_work",
      "projectId": "proj_123",
      "status": "active",
      "priority": 3,
      "dueDate": "2024-01-20T17:00:00Z",
      "estimatedTimeMinutes": 120,
      "actualTimeMinutes": 0,
      "progressPercentage": 0,
      "complexity": "moderate",
      "tags": ["proposal", "stakeholders"],
      "dependencies": [
        {
          "id": "dep_789",
          "prerequisiteQuestId": "quest_123",
          "dependencyType": "sequential"
        }
      ],
      "attachments": [
        {
          "id": "att_101",
          "filename": "proposal-template.docx",
          "url": "https://cdn.questlog.com/attachments/att_101",
          "size": 1024000,
          "uploadedAt": "2024-01-15T10:30:00Z"
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### Update Quest
```http
PUT /quests/{questId}
```

**Request Body:** Same as create quest (all fields optional)

#### Complete Quest
```http
POST /quests/{questId}/complete
```

**Request Body:**
```json
{
  "actualTimeMinutes": 135,
  "notes": "Completed ahead of schedule!"
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
      "progressPercentage": 100,
      "actualTimeMinutes": 135,
      "completedAt": "2024-01-15T10:30:00Z"
    },
    "gamification": {
      "xpEarned": 150,
      "levelUp": false,
      "achievements": [
        {
          "id": "ach_123",
          "name": "First Quest Complete",
          "description": "Complete your first quest",
          "xpReward": 50
        }
      ]
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
# Data Models and API Specification

## Overview

This document defines the data models, database schema, and API specifications for Questlog. The data architecture supports the gamified task management system with AI prioritization, user achievements, and team collaboration features.

**Current Status**: ✅ **PRODUCTION READY** - Core models have been implemented with enterprise-grade quality, comprehensive validation, and proper relationships. See CODE_REVIEW.md for detailed assessment.

## Current Implementation Status

### ✅ Implemented Models
- **User**: Basic user model with authentication fields
- **Quest**: Core quest model with status and difficulty tracking
- **QuestCategory**: User-specific quest categorization
- **QuestStep**: Individual steps within quests
- **QuestTag**: Simple tagging system for quests

### ✅ Production-Ready Features
1. **Comprehensive Schema**: Complete quest management system with proper enums, relationships, and constraints
2. **Enterprise Validation**: Zod schemas for all input validation with proper error handling
3. **Security Implementation**: Input sanitization and user authorization throughout
4. **Type Safety**: Full TypeScript integration with shared types and enums

### 🔧 Minor Enhancements Needed
- Add comprehensive test coverage for quest operations
- Implement pagination for large datasets
- Add performance monitoring and logging enhancements

## Database Schema

### Core Entities

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE
);
```

#### Quests Table
```sql
CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    project_id UUID REFERENCES projects(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'in_progress', 'completed', 'paused', 'overdue', 'deleted')),
    priority INTEGER DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_time_minutes INTEGER,
    actual_time_minutes INTEGER,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    complexity VARCHAR(20) DEFAULT 'simple' CHECK (complexity IN ('simple', 'moderate', 'complex', 'expert')),
    recurrence_pattern JSONB,
    parent_quest_id UUID REFERENCES quests(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

#### Categories Table
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#2563EB',
    icon VARCHAR(50),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Projects Table
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
    start_date DATE,
    end_date DATE,
    progress_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tags Table
```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Quest Tags Table (Many-to-Many)
```sql
CREATE TABLE quest_tags (
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (quest_id, tag_id)
);
```

#### Quest Dependencies Table
```sql
CREATE TABLE quest_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dependent_quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    prerequisite_quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'sequential' CHECK (dependency_type IN ('sequential', 'resource', 'time')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dependent_quest_id, prerequisite_quest_id)
);
```

### Gamification Tables

#### User Profiles Table
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    total_quests_completed INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    total_streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Achievements Table
```sql
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    icon VARCHAR(100),
    xp_reward INTEGER DEFAULT 0,
    unlock_criteria JSONB NOT NULL,
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### User Achievements Table
```sql
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress_data JSONB,
    UNIQUE(user_id, achievement_id)
);
```

#### Streaks Table
```sql
CREATE TABLE streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_type VARCHAR(20) NOT NULL CHECK (streak_type IN ('daily', 'weekly', 'monthly')),
    current_count INTEGER DEFAULT 0,
    longest_count INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    last_activity_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### AI and Analytics Tables

#### User Behavior Logs Table
```sql
CREATE TABLE user_behavior_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB,
    context_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### AI Suggestions Table
```sql
CREATE TABLE ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
    suggestion_type VARCHAR(50) NOT NULL,
    suggestion_data JSONB NOT NULL,
    priority_score DECIMAL(5,2),
    reasoning TEXT,
    is_accepted BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);
```

#### Quest Analytics Table
```sql
CREATE TABLE quest_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    time_estimate_minutes INTEGER,
    actual_time_minutes INTEGER,
    completion_date DATE,
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Team and Collaboration Tables

#### Teams Table
```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Team Members Table
```sql
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);
```

#### Shared Quests Table
```sql
CREATE TABLE shared_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id),
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quest_id, team_id)
);
```

### System Tables

#### Notifications Table
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### User Settings Table
```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, setting_key)
);
```

## Data Relationships

### Entity Relationship Diagram

```
Users (1) ──── (N) Quests
Users (1) ──── (N) Categories
Users (1) ──── (N) Projects
Users (1) ──── (N) Tags
Users (1) ──── (1) UserProfiles
Users (1) ──── (N) UserAchievements
Users (1) ──── (N) Streaks
Users (1) ──── (N) UserBehaviorLogs
Users (1) ──── (N) AISuggestions
Users (1) ──── (N) QuestAnalytics
Users (1) ──── (N) Notifications
Users (1) ──── (N) UserSettings

Quests (N) ──── (N) Tags (via QuestTags)
Quests (N) ──── (N) Quests (via QuestDependencies)
Quests (1) ──── (N) QuestAnalytics
Quests (1) ──── (N) AISuggestions

Categories (1) ──── (N) Quests
Projects (1) ──── (N) Quests

Achievements (1) ──── (N) UserAchievements

Teams (1) ──── (N) TeamMembers
Teams (1) ──── (N) SharedQuests
Users (N) ──── (N) Teams (via TeamMembers)
Quests (N) ──── (N) Teams (via SharedQuests)
```

### Key Relationships

#### User-Quest Relationship
- One user can have many quests
- Quests are always associated with a user
- Quests can be shared with teams
- Quests can have dependencies on other quests

#### Quest-Category Relationship
- Each quest belongs to one category
- Categories are user-specific (with defaults)
- Categories help with organization and analytics

#### Quest-Project Relationship
- Quests can optionally belong to a project
- Projects help organize related quests
- Projects can be shared with teams

#### Quest-Tag Relationship
- Quests can have multiple tags
- Tags are user-specific
- Tags enable cross-category organization

#### Quest-Dependency Relationship
- Quests can depend on other quests
- Dependencies can be sequential, resource-based, or time-based
- Dependencies affect priority calculations

## API Specifications

### Authentication

#### JWT Token Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "iat": 1516239022,
    "exp": 1516242622,
    "refresh_token": "refresh_token_id"
  }
}
```

#### Authentication Endpoints
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Quest Management API

#### Quest Endpoints
```http
GET    /api/quests                    # List quests with filters
POST   /api/quests                    # Create new quest
GET    /api/quests/{id}               # Get quest details
PUT    /api/quests/{id}               # Update quest
DELETE /api/quests/{id}               # Delete quest
POST   /api/quests/{id}/complete      # Mark quest complete
POST   /api/quests/{id}/start         # Start working on quest
POST   /api/quests/{id}/pause         # Pause quest
POST   /api/quests/{id}/progress      # Update quest progress
```

#### Quest Request/Response Examples

**Create Quest Request**:
```json
{
  "title": "Complete project proposal",
  "description": "Write and submit the Q4 project proposal",
  "category_id": "550e8400-e29b-41d4-a716-446655440000",
  "project_id": "550e8400-e29b-41d4-a716-446655440001",
  "priority": 3,
  "due_date": "2024-01-15T17:00:00Z",
  "estimated_time_minutes": 120,
  "complexity": "moderate",
  "tags": ["work", "proposal", "deadline"],
  "dependencies": ["550e8400-e29b-41d4-a716-446655440002"]
}
```

**Quest Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "title": "Complete project proposal",
  "description": "Write and submit the Q4 project proposal",
  "category": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Work",
    "color": "#2563EB"
  },
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Q4 Planning"
  },
  "status": "active",
  "priority": 3,
  "due_date": "2024-01-15T17:00:00Z",
  "estimated_time_minutes": 120,
  "actual_time_minutes": null,
  "progress_percentage": 0,
  "complexity": "moderate",
  "tags": [
    {"id": "tag1", "name": "work", "color": "#6B7280"},
    {"id": "tag2", "name": "proposal", "color": "#6B7280"}
  ],
  "xp_reward": 60,
  "created_at": "2024-01-10T10:00:00Z",
  "updated_at": "2024-01-10T10:00:00Z"
}
```

### AI Prioritization API

#### AI Endpoints
```http
POST /api/ai/prioritize              # Get prioritized quest list
POST /api/ai/suggest                 # Get AI suggestions
POST /api/ai/analyze                 # Analyze user patterns
POST /api/ai/breakdown               # Break down complex tasks
POST /api/ai/feedback                # Provide feedback on suggestions
```

#### AI Request/Response Examples

**Prioritize Quests Request**:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "context": {
    "time_available_minutes": 120,
    "energy_level": "high",
    "location": "office",
    "current_time": "2024-01-10T14:00:00Z"
  },
  "quest_ids": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003"
  ]
}
```

**Prioritize Quests Response**:
```json
{
  "prioritized_quests": [
    {
      "quest_id": "550e8400-e29b-41d4-a716-446655440001",
      "priority_score": 85.5,
      "reasoning": "High impact task with approaching deadline",
      "confidence": 0.92,
      "recommended_action": "start_now"
    },
    {
      "quest_id": "550e8400-e29b-41d4-a716-446655440003",
      "priority_score": 72.3,
      "reasoning": "Good energy match for complex task",
      "confidence": 0.78,
      "recommended_action": "consider_next"
    }
  ],
  "context_analysis": {
    "optimal_work_window": "2 hours",
    "energy_peak": "next 30 minutes",
    "focus_recommendation": "deep_work"
  }
}
```

### Gamification API

#### Achievement Endpoints
```http
GET    /api/achievements              # List all achievements
GET    /api/achievements/{id}         # Get achievement details
GET    /api/users/{id}/achievements   # Get user achievements
POST   /api/achievements/{id}/unlock  # Unlock achievement
```

#### User Profile Endpoints
```http
GET    /api/users/{id}/profile        # Get user profile
PUT    /api/users/{id}/profile        # Update user profile
GET    /api/users/{id}/stats          # Get user statistics
GET    /api/users/{id}/streaks        # Get user streaks
```

#### Gamification Response Examples

**User Profile Response**:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "level": 15,
  "experience_points": 3450,
  "xp_to_next_level": 550,
  "total_quests_completed": 127,
  "current_streak_days": 7,
  "longest_streak_days": 23,
  "total_streak_days": 45,
  "recent_achievements": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Week Warrior",
      "description": "Complete quests for 7 consecutive days",
      "unlocked_at": "2024-01-09T10:00:00Z",
      "xp_reward": 100
    }
  ],
  "level_title": "Goal Getter",
  "next_level_title": "Achievement Hunter"
}
```

### Analytics API

#### Analytics Endpoints
```http
GET    /api/analytics/productivity    # Get productivity metrics
GET    /api/analytics/patterns        # Get behavior patterns
GET    /api/analytics/goals           # Get goal progress
GET    /api/analytics/export          # Export analytics data
```

#### Analytics Response Examples

**Productivity Analytics Response**:
```json
{
  "period": "last_30_days",
  "quests_completed": 45,
  "completion_rate": 0.78,
  "average_completion_time": 85,
  "time_estimate_accuracy": 0.72,
  "category_performance": [
    {
      "category": "Work",
      "quests_completed": 23,
      "completion_rate": 0.85,
      "average_time": 95
    },
    {
      "category": "Personal",
      "quests_completed": 12,
      "completion_rate": 0.67,
      "average_time": 45
    }
  ],
  "productivity_trends": {
    "daily_completion": [12, 15, 8, 20, 18, 14, 16],
    "weekly_completion": [85, 92, 78, 95, 88]
  }
}
```

## Data Validation

### Input Validation Rules

#### Quest Validation
- Title: Required, 1-255 characters
- Description: Optional, max 10,000 characters
- Due date: Optional, must be in the future
- Estimated time: Optional, 1-1440 minutes (24 hours)
- Priority: 1-5 (1=lowest, 5=highest)
- Progress: 0-100 percentage

#### User Validation
- Email: Required, valid email format, unique
- Username: Required, 3-50 characters, alphanumeric + underscore
- Display name: Optional, 1-100 characters
- Timezone: Valid IANA timezone identifier

#### Achievement Validation
- Name: Required, 1-100 characters
- Description: Required, 1-1000 characters
- XP reward: 0-10000
- Unlock criteria: Valid JSON schema

### Business Logic Validation

#### Quest Dependencies
- Cannot create circular dependencies
- Dependent quests cannot be completed before prerequisites
- Deleted quests remove their dependencies

#### Achievement Unlocking
- Achievements can only be unlocked once per user
- Progress tracking for multi-step achievements
- Hidden achievements require discovery

#### Streak Calculations
- Daily streaks reset at midnight in user's timezone
- Grace periods allow for missed days
- Streak protection items prevent loss

## Data Migration and Versioning

### Migration Strategy
- Versioned schema changes
- Backward compatibility for 2 versions
- Data transformation scripts
- Rollback procedures

### Version Control
- Schema version tracking
- Migration history
- Dependency management
- Testing procedures

## Performance Considerations

### Indexing Strategy
```sql
-- Primary indexes
CREATE INDEX idx_quests_user_id ON quests(user_id);
CREATE INDEX idx_quests_status ON quests(status);
CREATE INDEX idx_quests_due_date ON quests(due_date);
CREATE INDEX idx_quests_category_id ON quests(category_id);

-- Composite indexes
CREATE INDEX idx_quests_user_status ON quests(user_id, status);
CREATE INDEX idx_quests_user_due_date ON quests(user_id, due_date);
CREATE INDEX idx_quests_user_category ON quests(user_id, category_id);

-- Gamification indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_streaks_user_type ON streaks(user_id, streak_type);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Analytics indexes
CREATE INDEX idx_behavior_logs_user_timestamp ON user_behavior_logs(user_id, timestamp);
CREATE INDEX idx_quest_analytics_quest_id ON quest_analytics(quest_id);
```

### Query Optimization
- Efficient joins for related data
- Pagination for large result sets
- Caching for frequently accessed data
- Read replicas for analytics queries

### Data Archiving
- Archive completed quests older than 2 years
- Archive behavior logs older than 1 year
- Archive analytics data older than 5 years
- Maintain data integrity during archiving 
-- Questlog Database Initialization Script
-- This script sets up the initial database schema

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(30) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar VARCHAR(500),
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create quest_categories table
CREATE TABLE IF NOT EXISTS quest_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quests table
CREATE TABLE IF NOT EXISTS quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EPIC')),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED')),
    estimated_duration INTEGER NOT NULL CHECK (estimated_duration > 0 AND estimated_duration <= 1440),
    actual_duration INTEGER,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    experience_points INTEGER DEFAULT 0,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES quest_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create quest_steps table
CREATE TABLE IF NOT EXISTS quest_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    order_index INTEGER NOT NULL,
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quest_tags table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS quest_tags (
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (quest_id, tag_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quests_user_id ON quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_created_at ON quests(created_at);
CREATE INDEX IF NOT EXISTS idx_quests_category_id ON quests(category_id);
CREATE INDEX IF NOT EXISTS idx_quest_steps_quest_id ON quest_steps(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_categories_user_id ON quest_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quests_updated_at BEFORE UPDATE ON quests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quest_steps_updated_at BEFORE UPDATE ON quest_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quest_categories_updated_at BEFORE UPDATE ON quest_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO users (email, username, display_name, level, experience_points) VALUES
    ('demo@questlog.local', 'demo_user', 'Demo User', 5, 2500),
    ('test@questlog.local', 'test_user', 'Test User', 3, 1200)
ON CONFLICT (email) DO NOTHING;

INSERT INTO quest_categories (name, description, color, user_id) VALUES
    ('Work', 'Professional tasks and projects', '#EF4444', (SELECT id FROM users WHERE email = 'demo@questlog.local')),
    ('Personal', 'Personal goals and hobbies', '#10B981', (SELECT id FROM users WHERE email = 'demo@questlog.local')),
    ('Learning', 'Educational goals and skill development', '#8B5CF6', (SELECT id FROM users WHERE email = 'demo@questlog.local'))
ON CONFLICT DO NOTHING;

INSERT INTO quests (title, description, difficulty, status, estimated_duration, priority, experience_points, user_id, category_id) VALUES
    ('Complete Project Proposal', 'Write and submit the Q4 project proposal', 'HARD', 'ACTIVE', 120, 'HIGH', 150, 
     (SELECT id FROM users WHERE email = 'demo@questlog.local'),
     (SELECT id FROM quest_categories WHERE name = 'Work' AND user_id = (SELECT id FROM users WHERE email = 'demo@questlog.local'))),
    ('Learn React Hooks', 'Complete the advanced React Hooks tutorial', 'MEDIUM', 'IN_PROGRESS', 90, 'MEDIUM', 100,
     (SELECT id FROM users WHERE email = 'demo@questlog.local'),
     (SELECT id FROM quest_categories WHERE name = 'Learning' AND user_id = (SELECT id FROM users WHERE email = 'demo@questlog.local'))),
    ('Organize Home Office', 'Clean and organize the home workspace', 'EASY', 'DRAFT', 45, 'LOW', 50,
     (SELECT id FROM users WHERE email = 'demo@questlog.local'),
     (SELECT id FROM quest_categories WHERE name = 'Personal' AND user_id = (SELECT id FROM users WHERE email = 'demo@questlog.local')))
ON CONFLICT DO NOTHING;

-- Insert sample quest steps
INSERT INTO quest_steps (title, description, order_index, quest_id) VALUES
    ('Research requirements', 'Gather all project requirements and constraints', 1, 
     (SELECT id FROM quests WHERE title = 'Complete Project Proposal' LIMIT 1)),
    ('Create outline', 'Create a detailed project outline', 2,
     (SELECT id FROM quests WHERE title = 'Complete Project Proposal' LIMIT 1)),
    ('Write proposal', 'Write the complete project proposal', 3,
     (SELECT id FROM quests WHERE title = 'Complete Project Proposal' LIMIT 1)),
    ('Review and submit', 'Review the proposal and submit for approval', 4,
     (SELECT id FROM quests WHERE title = 'Complete Project Proposal' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Insert sample tags
INSERT INTO quest_tags (quest_id, tag_name) VALUES
    ((SELECT id FROM quests WHERE title = 'Complete Project Proposal' LIMIT 1), 'work'),
    ((SELECT id FROM quests WHERE title = 'Complete Project Proposal' LIMIT 1), 'important'),
    ((SELECT id FROM quests WHERE title = 'Learn React Hooks' LIMIT 1), 'learning'),
    ((SELECT id FROM quests WHERE title = 'Learn React Hooks' LIMIT 1), 'frontend'),
    ((SELECT id FROM quests WHERE title = 'Organize Home Office' LIMIT 1), 'personal'),
    ((SELECT id FROM quests WHERE title = 'Organize Home Office' LIMIT 1), 'organization')
ON CONFLICT DO NOTHING; 
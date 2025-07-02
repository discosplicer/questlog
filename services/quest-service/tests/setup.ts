/* eslint-disable prettier/prettier */
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, beforeEach } from 'vitest';

// Load test environment variables
config({ path: '.env.test' });

// Create a test Prisma client - use test database
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['DATABASE_URL']!,
    },
  },
});

// Global test setup
beforeAll(async () => {
  console.log('Setting up test database...');
  // Ensure test database is clean
  await cleanupTestDatabase();
});

// Global test teardown
afterAll(async () => {
  console.log('Cleaning up test database...');
  await cleanupTestDatabase();
  await testPrisma.$disconnect();
});

// Clean up between each test to prevent conflicts
beforeEach(async () => {
  await cleanupTestDatabase();
  // Add a small delay to ensure cleanup is complete
  await new Promise(resolve => setTimeout(resolve, 10));
});

// Clean up test database
async function cleanupTestDatabase() {
  try {
    console.log('Cleaning up test database tables...');
    
    // Use a transaction to ensure atomic cleanup
    await testPrisma.$transaction(async (tx) => {
      // Delete in order to respect foreign key constraints
      await tx.questTag.deleteMany({});
      await tx.questStep.deleteMany({});
      await tx.quest.deleteMany({});
      await tx.user.deleteMany({});
      await tx.questCategory.deleteMany({});
    });
    
    console.log('Test database cleanup completed successfully');
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
}

// Helper to generate unique test data
export function generateTestUser(
  overrides: Partial<{
    email: string;
    username: string;
    displayName: string;
  }> = {}
) {
  const timestamp = Date.now();
  return {
    email: overrides.email || `test-${timestamp}@example.com`,
    username: overrides.username || `testuser-${timestamp}`,
    displayName: overrides.displayName || `Test User ${timestamp}`,
    password: 'SecurePass123',
  };
}

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll } from 'vitest';

// Load test environment variables
config({ path: '.env.test' });

// Create a test Prisma client - use main database for now
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['DATABASE_URL']!,
    },
  },
});

// Global test setup
beforeAll(async () => {
  // Ensure test database is clean
  await cleanupTestDatabase();
});

// Global test teardown
afterAll(async () => {
  await testPrisma.$disconnect();
});

// Clean up test database
export async function cleanupTestDatabase() {
  try {
    // Delete all test data in reverse order of dependencies
    await testPrisma.questTag.deleteMany();
    await testPrisma.questStep.deleteMany();
    await testPrisma.quest.deleteMany();
    await testPrisma.questCategory.deleteMany();
    await testPrisma.user.deleteMany();
  } catch (error) {
    // Log error but don't fail the test setup
    console.warn('Warning: Could not clean up test database:', error);
  }
}

// Helper to generate unique test data
export function generateTestUser(overrides: Partial<{
  email: string;
  username: string;
  displayName: string;
}> = {}) {
  const timestamp = Date.now();
  return {
    email: overrides.email || `test-${timestamp}@example.com`,
    username: overrides.username || `testuser-${timestamp}`,
    displayName: overrides.displayName || `Test User ${timestamp}`,
    password: 'SecurePass123',
  };
} 
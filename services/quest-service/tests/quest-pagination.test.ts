import { test, expect } from 'vitest';
import { buildServer } from '../src/index';
import { generateTestUser, testPrisma } from './setup';
import { QuestDifficulty, QuestPriority, QuestStatus } from '@questlog/shared';

// Helper function to create a test user and return user data
async function createTestUser() {
  const server = await buildServer();
  const testUser = generateTestUser();

  const response = await server.inject({
    method: 'POST',
    url: '/users',
    payload: testUser,
  });

  const result = JSON.parse(response.payload);
  if (!result.success || !result.data || !result.data.id) {
    throw new Error('Failed to create test user: ' + JSON.stringify(result));
  }
  return {
    server,
    user: result.data,
    userId: result.data.id,
  };
}

// Helper function to create a test quest
async function createTestQuest(
  userId: string,
  overrides: Partial<{
    title: string;
    difficulty: QuestDifficulty;
    priority: QuestPriority;
  }> = {}
) {
  const server = await buildServer();
  const questData = {
    title: overrides.title || `Test Quest ${Date.now()}`,
    description: 'A test quest description',
    difficulty: overrides.difficulty || QuestDifficulty.MEDIUM,
    estimatedDuration: 60,
    priority: overrides.priority || QuestPriority.MEDIUM,
    tags: ['test', 'automated'],
  };

  const response = await server.inject({
    method: 'POST',
    url: '/quests',
    query: { userId },
    payload: questData,
  });

  const result = JSON.parse(response.payload);
  if (!result.success || !result.data || !result.data.id) {
    throw new Error('Failed to create test quest: ' + JSON.stringify(result));
  }
  return {
    server,
    quest: result.data,
    questId: result.data.id,
  };
}

// ============================================================================
// PAGINATION TESTS
// ============================================================================

test('GET /quests should return second page correctly', async () => {
  const { server, userId } = await createTestUser();

  // Create multiple quests
  for (let i = 0; i < 25; i++) {
    await createTestQuest(userId, { title: `Quest ${i + 1}` });
  }

  const response = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId, page: '2', limit: '10' },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data).toHaveLength(10);
  expect(result.pagination).toMatchObject({
    page: 2,
    limit: 10,
    total: 25,
    totalPages: 3,
    hasNext: true,
    hasPrev: true,
  });
});

test('GET /quests should handle invalid pagination parameters', async () => {
  const { server, userId } = await createTestUser();

  const response = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId, page: '-1', limit: '1000' },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.pagination.page).toBe(1); // Should be normalized to 1
  expect(result.pagination.limit).toBe(100); // Should be capped at 100
});

test('GET /quests should handle empty results with pagination', async () => {
  const { server, userId } = await createTestUser();

  const response = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId, page: '1', limit: '10' },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data).toHaveLength(0);
  expect(result.pagination).toMatchObject({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
});

test('GET /quests should handle last page correctly', async () => {
  const { server, userId } = await createTestUser();

  // Create exactly 15 quests
  for (let i = 0; i < 15; i++) {
    await createTestQuest(userId, { title: `Quest ${i + 1}` });
  }

  const response = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId, page: '2', limit: '10' },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data).toHaveLength(5); // Only 5 quests on last page
  expect(result.pagination).toMatchObject({
    page: 2,
    limit: 10,
    total: 15,
    totalPages: 2,
    hasNext: false,
    hasPrev: true,
  });
});

// ============================================================================
// FILTERING TESTS
// ============================================================================

test('GET /quests should filter by status', async () => {
  const { server, userId } = await createTestUser();

  // Create quests with different statuses
  await createTestQuest(userId, { title: 'Draft Quest' });
  await createTestQuest(userId, { title: 'Active Quest' });

  // Update one quest to ACTIVE status
  const quests = await testPrisma.quest.findMany({ where: { userId } });
  if (quests[1]) {
    await testPrisma.quest.update({
      where: { id: quests[1].id },
      data: { status: QuestStatus.ACTIVE },
    });
  }

  const response = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId, status: QuestStatus.ACTIVE },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data).toHaveLength(1);
  expect(result.data[0].status).toBe(QuestStatus.ACTIVE);
});

test('GET /quests should filter by priority', async () => {
  const { server, userId } = await createTestUser();

  // Create quests with different priorities
  await createTestQuest(userId, { priority: QuestPriority.LOW });
  await createTestQuest(userId, { priority: QuestPriority.HIGH });

  const response = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId, priority: QuestPriority.HIGH },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data).toHaveLength(1);
  expect(result.data[0].priority).toBe(QuestPriority.HIGH);
});

test('GET /quests should filter by difficulty', async () => {
  const { server, userId } = await createTestUser();

  // Create quests with different difficulties
  await createTestQuest(userId, { difficulty: QuestDifficulty.EASY });
  await createTestQuest(userId, { difficulty: QuestDifficulty.HARD });

  const response = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId, difficulty: QuestDifficulty.HARD },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data).toHaveLength(1);
  expect(result.data[0].difficulty).toBe(QuestDifficulty.HARD);
});

test('GET /quests should combine multiple filters', async () => {
  const { server, userId } = await createTestUser();

  // Create quests with different combinations
  await createTestQuest(userId, {
    priority: QuestPriority.HIGH,
    difficulty: QuestDifficulty.EASY,
  });
  await createTestQuest(userId, {
    priority: QuestPriority.HIGH,
    difficulty: QuestDifficulty.HARD,
  });
  await createTestQuest(userId, {
    priority: QuestPriority.LOW,
    difficulty: QuestDifficulty.EASY,
  });

  const response = await server.inject({
    method: 'GET',
    url: '/quests',
    query: {
      userId,
      priority: QuestPriority.HIGH,
      difficulty: QuestDifficulty.EASY,
    },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data).toHaveLength(1);
  expect(result.data[0].priority).toBe(QuestPriority.HIGH);
  expect(result.data[0].difficulty).toBe(QuestDifficulty.EASY);
});

test('GET /quests should handle non-existent filter values', async () => {
  const { server, userId } = await createTestUser();

  // Create some quests
  await createTestQuest(userId, { title: 'Quest 1' });
  await createTestQuest(userId, { title: 'Quest 2' });

  const response = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId, status: 'NON_EXISTENT_STATUS' },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data).toHaveLength(0); // No quests should match
});

// ============================================================================
// PAGINATION WITH FILTERS TESTS
// ============================================================================

test('GET /quests should paginate filtered results correctly', async () => {
  const { server, userId } = await createTestUser();

  // Create quests with different priorities
  for (let i = 0; i < 15; i++) {
    await createTestQuest(userId, {
      title: `High Priority Quest ${i + 1}`,
      priority: QuestPriority.HIGH,
    });
  }

  for (let i = 0; i < 10; i++) {
    await createTestQuest(userId, {
      title: `Low Priority Quest ${i + 1}`,
      priority: QuestPriority.LOW,
    });
  }

  // Get first page of high priority quests
  const response = await server.inject({
    method: 'GET',
    url: '/quests',
    query: {
      userId,
      priority: QuestPriority.HIGH,
      page: '1',
      limit: '10',
    },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data).toHaveLength(10);
  expect(result.pagination).toMatchObject({
    page: 1,
    limit: 10,
    total: 15, // Only high priority quests
    totalPages: 2,
    hasNext: true,
    hasPrev: false,
  });

  // Verify all returned quests are high priority
  result.data.forEach((quest: any) => {
    expect(quest.priority).toBe(QuestPriority.HIGH);
  });
});

test('GET /quests should handle complex filtering with pagination', async () => {
  const { server, userId } = await createTestUser();

  // Create quests with different combinations
  for (let i = 0; i < 8; i++) {
    await createTestQuest(userId, {
      title: `Active High Quest ${i + 1}`,
      priority: QuestPriority.HIGH,
    });
  }

  // Update some quests to ACTIVE status
  const quests = await testPrisma.quest.findMany({ where: { userId } });
  for (let i = 0; i < Math.min(5, quests.length); i++) {
    const quest = quests[i];
    if (quest) {
      await testPrisma.quest.update({
        where: { id: quest.id },
        data: { status: QuestStatus.ACTIVE },
      });
    }
  }

  const response = await server.inject({
    method: 'GET',
    url: '/quests',
    query: {
      userId,
      priority: QuestPriority.HIGH,
      status: QuestStatus.ACTIVE,
      page: '1',
      limit: '3',
    },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data).toHaveLength(3);
  expect(result.pagination).toMatchObject({
    page: 1,
    limit: 3,
    total: 5, // Only active high priority quests
    totalPages: 2,
    hasNext: true,
    hasPrev: false,
  });

  // Verify all returned quests match the filters
  result.data.forEach((quest: any) => {
    expect(quest.priority).toBe(QuestPriority.HIGH);
    expect(quest.status).toBe(QuestStatus.ACTIVE);
  });
});

/* eslint-disable prettier/prettier */
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

// Helper function to generate test quest data
function generateTestQuest(
  overrides: Partial<{
    title: string;
    description: string;
    difficulty: QuestDifficulty;
    estimatedDuration: number;
    priority: QuestPriority;
  }> = {},
) {
  return {
    title: overrides.title ?? `Test Quest ${Date.now()}`,
    description: overrides.description ?? 'A test quest description',
    difficulty: overrides.difficulty ?? QuestDifficulty.MEDIUM,
    estimatedDuration: overrides.estimatedDuration ?? 60,
    priority: overrides.priority ?? QuestPriority.MEDIUM,
    tags: ['test', 'automated'],
  };
}

// Helper function to create a test quest
async function createTestQuest(userId: string, overrides = {}) {
  const server = await buildServer();
  const questData = generateTestQuest(overrides);

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
// CREATE QUEST TESTS
// ============================================================================

test('POST /quests should create a quest with valid data', async () => {
  const { server, userId } = await createTestUser();
  const questData = generateTestQuest();

  const response = await server.inject({
    method: 'POST',
    url: '/quests',
    query: { userId },
    payload: questData,
  });

  expect(response.statusCode).toBe(201);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data).toMatchObject({
    title: questData.title,
    description: questData.description,
    difficulty: questData.difficulty,
    estimatedDuration: questData.estimatedDuration,
    priority: questData.priority,
    status: QuestStatus.DRAFT,
    userId: userId,
  });
  expect(result.data.id).toBeDefined();
  expect(result.data.createdAt).toBeDefined();
  expect(result.data.updatedAt).toBeDefined();
  expect(result.data.tags).toHaveLength(2);
});

test('POST /quests should return 400 when userId is missing', async () => {
  const server = await buildServer();
  const questData = generateTestQuest();

  const response = await server.inject({
    method: 'POST',
    url: '/quests',
    payload: questData,
  });

  expect(response.statusCode).toBe(400);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('userId query parameter is required');
});

test('POST /quests should return 404 when user does not exist', async () => {
  const server = await buildServer();
  const questData = generateTestQuest();
  const fakeUserId = '00000000-0000-0000-0000-000000000000';

  const response = await server.inject({
    method: 'POST',
    url: '/quests',
    query: { userId: fakeUserId },
    payload: questData,
  });

  expect(response.statusCode).toBe(404);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('User not found');
});

test('POST /quests should return 400 for invalid title', async () => {
  const { server, userId } = await createTestUser();
  const questData = generateTestQuest({ title: '' });

  const response = await server.inject({
    method: 'POST',
    url: '/quests',
    query: { userId },
    payload: questData,
  });

  expect(response.statusCode).toBe(400);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('Validation error');
  expect(result.details).toBeDefined();
});

test('POST /quests should return 400 for invalid difficulty', async () => {
  const { server, userId } = await createTestUser();
  const questData = generateTestQuest({ difficulty: 'INVALID' as any });

  const response = await server.inject({
    method: 'POST',
    url: '/quests',
    query: { userId },
    payload: questData,
  });

  expect(response.statusCode).toBe(400);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('Validation error');
});

test('POST /quests should return 400 for invalid estimated duration', async () => {
  const { server, userId } = await createTestUser();
  const questData = generateTestQuest({ estimatedDuration: 0 });

  const response = await server.inject({
    method: 'POST',
    url: '/quests',
    query: { userId },
    payload: questData,
  });

  expect(response.statusCode).toBe(400);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('Validation error');
});

test('POST /quests should create quest with default priority when not provided', async () => {
  const { server, userId } = await createTestUser();
  const questData = generateTestQuest();
  delete (questData as any).priority;

  const response = await server.inject({
    method: 'POST',
    url: '/quests',
    query: { userId },
    payload: questData,
  });

  expect(response.statusCode).toBe(201);
  const result = JSON.parse(response.payload);
  expect(result.data.priority).toBe(QuestPriority.MEDIUM);
});

test('POST /quests should sanitize input to prevent XSS', async () => {
  const { server, userId } = await createTestUser();
  const questData = generateTestQuest({
    title: 'Test Quest<script>alert("xss")</script>',
    description: 'Description<script>alert("xss")</script>',
  });

  const response = await server.inject({
    method: 'POST',
    url: '/quests',
    query: { userId },
    payload: questData,
  });

  expect(response.statusCode).toBe(201);
  const result = JSON.parse(response.payload);
  expect(result.data.title).toBe('Test Quest');
  expect(result.data.description).toBe('Description');
});

// ============================================================================
// GET QUESTS TESTS (with pagination)
// ============================================================================

test('GET /quests should return user quests with pagination', async () => {
  const { server, userId } = await createTestUser();

  // Create multiple quests
  for (let i = 0; i < 25; i++) {
    await createTestQuest(userId, { title: `Quest ${i + 1}` });
  }

  const response = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId, page: 1, limit: 10 },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data).toHaveLength(10);
  expect(result.pagination).toMatchObject({
    page: 1,
    limit: 10,
    total: 25,
    totalPages: 3,
    hasNext: true,
    hasPrev: false,
  });
});

test('GET /quests should return second page correctly', async () => {
  const { server, userId } = await createTestUser();

  // Create multiple quests
  for (let i = 0; i < 25; i++) {
    await createTestQuest(userId, { title: `Quest ${i + 1}` });
  }

  const response = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId, page: 2, limit: 10 },
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

test('GET /quests should filter by status', async () => {
  const { server, userId } = await createTestUser();

  // Create quests with different statuses
  await createTestQuest(userId, { title: 'Draft Quest' });
  await createTestQuest(userId, { title: 'Active Quest' });

  // Update one quest to ACTIVE status
  const quests = await testPrisma.quest.findMany({ where: { userId } });
  await testPrisma.quest.update({
    where: { id: quests[1].id },
    data: { status: QuestStatus.ACTIVE },
  });

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

test('GET /quests should return 400 when userId is missing', async () => {
  const server = await buildServer();

  const response = await server.inject({
    method: 'GET',
    url: '/quests',
  });

  expect(response.statusCode).toBe(400);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('userId query parameter is required');
});

test('GET /quests should handle invalid pagination parameters', async () => {
  const { server, userId } = await createTestUser();

  const response = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId, page: -1, limit: 1000 },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.pagination.page).toBe(1); // Should be normalized to 1
  expect(result.pagination.limit).toBe(100); // Should be capped at 100
});

// ============================================================================
// GET QUEST BY ID TESTS
// ============================================================================

test('GET /quests/:id should return quest by ID', async () => {
  const { server, userId } = await createTestUser();
  const { questId } = await createTestQuest(userId);

  const response = await server.inject({
    method: 'GET',
    url: `/quests/${questId}`,
    query: { userId },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data.id).toBe(questId);
  expect(result.data.userId).toBe(userId);
});

test('GET /quests/:id should return 404 for non-existent quest', async () => {
  const { server, userId } = await createTestUser();
  const fakeQuestId = '00000000-0000-0000-0000-000000000000';

  const response = await server.inject({
    method: 'GET',
    url: `/quests/${fakeQuestId}`,
    query: { userId },
  });

  expect(response.statusCode).toBe(404);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('Quest not found');
});

test('GET /quests/:id should return 404 for quest belonging to different user', async () => {
  const { server, userId } = await createTestUser();
  const { questId } = await createTestQuest(userId);

  // Create another user
  const { userId: otherUserId } = await createTestUser();

  const response = await server.inject({
    method: 'GET',
    url: `/quests/${questId}`,
    query: { userId: otherUserId },
  });

  expect(response.statusCode).toBe(404);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('Quest not found');
});

test('GET /quests/:id should return 400 when userId is missing', async () => {
  const server = await buildServer();
  const fakeQuestId = '00000000-0000-0000-0000-000000000000';

  const response = await server.inject({
    method: 'GET',
    url: `/quests/${fakeQuestId}`,
  });

  expect(response.statusCode).toBe(400);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('userId query parameter is required');
});

// ============================================================================
// UPDATE QUEST TESTS
// ============================================================================

test('PUT /quests/:id should update quest successfully', async () => {
  const { server, userId } = await createTestUser();
  const { questId } = await createTestQuest(userId);

  const updateData = {
    title: 'Updated Quest Title',
    description: 'Updated description',
    priority: QuestPriority.HIGH,
    status: QuestStatus.ACTIVE,
  };

  const response = await server.inject({
    method: 'PUT',
    url: `/quests/${questId}`,
    query: { userId },
    payload: updateData,
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data).toMatchObject(updateData);
  expect(result.data.id).toBe(questId);
});

test('PUT /quests/:id should set completedAt when status is COMPLETED', async () => {
  const { server, userId } = await createTestUser();
  const { questId } = await createTestQuest(userId);

  const response = await server.inject({
    method: 'PUT',
    url: `/quests/${questId}`,
    query: { userId },
    payload: { status: QuestStatus.COMPLETED },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data.status).toBe(QuestStatus.COMPLETED);
  expect(result.data.completedAt).toBeDefined();
});

test('PUT /quests/:id should update tags correctly', async () => {
  const { server, userId } = await createTestUser();
  const { questId } = await createTestQuest(userId);

  const newTags = ['updated', 'tags', 'only'];

  const response = await server.inject({
    method: 'PUT',
    url: `/quests/${questId}`,
    query: { userId },
    payload: { tags: newTags },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data.tags).toHaveLength(3);
  const tagNames = result.data.tags.map((t: any) => t.tagName);
  expect(tagNames).toContain('updated');
  expect(tagNames).toContain('tags');
  expect(tagNames).toContain('only');
});

test('PUT /quests/:id should return 404 for non-existent quest', async () => {
  const { server, userId } = await createTestUser();
  const fakeQuestId = '00000000-0000-0000-0000-000000000000';

  const response = await server.inject({
    method: 'PUT',
    url: `/quests/${fakeQuestId}`,
    query: { userId },
    payload: { title: 'Updated Title' },
  });

  expect(response.statusCode).toBe(404);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('Quest not found');
});

test('PUT /quests/:id should return 400 for invalid data', async () => {
  const { server, userId } = await createTestUser();
  const { questId } = await createTestQuest(userId);

  const response = await server.inject({
    method: 'PUT',
    url: `/quests/${questId}`,
    query: { userId },
    payload: { title: '' }, // Invalid empty title
  });

  expect(response.statusCode).toBe(400);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('Validation error');
});

test('PUT /quests/:id should return 400 when userId is missing', async () => {
  const server = await buildServer();
  const fakeQuestId = '00000000-0000-0000-0000-000000000000';

  const response = await server.inject({
    method: 'PUT',
    url: `/quests/${fakeQuestId}`,
    payload: { title: 'Updated Title' },
  });

  expect(response.statusCode).toBe(400);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('userId query parameter is required');
});

// ============================================================================
// DELETE QUEST TESTS
// ============================================================================

test('DELETE /quests/:id should delete quest successfully', async () => {
  const { server, userId } = await createTestUser();
  const { questId } = await createTestQuest(userId);

  const response = await server.inject({
    method: 'DELETE',
    url: `/quests/${questId}`,
    query: { userId },
  });

  expect(response.statusCode).toBe(200);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.message).toBe('Quest deleted successfully');

  // Verify quest is actually deleted
  const deletedQuest = await testPrisma.quest.findUnique({
    where: { id: questId },
  });
  expect(deletedQuest).toBeNull();
});

test('DELETE /quests/:id should cascade delete related data', async () => {
  const { server, userId } = await createTestUser();
  const { questId } = await createTestQuest(userId);

  // Verify quest has tags
  const questWithTags = await testPrisma.quest.findUnique({
    where: { id: questId },
    include: { tags: true },
  });
  expect(questWithTags?.tags).toHaveLength(2);

  // Delete quest
  await server.inject({
    method: 'DELETE',
    url: `/quests/${questId}`,
    query: { userId },
  });

  // Verify tags are also deleted
  const remainingTags = await testPrisma.questTag.findMany({
    where: { questId },
  });
  expect(remainingTags).toHaveLength(0);
});

test('DELETE /quests/:id should return 404 for non-existent quest', async () => {
  const { server, userId } = await createTestUser();
  const fakeQuestId = '00000000-0000-0000-0000-000000000000';

  const response = await server.inject({
    method: 'DELETE',
    url: `/quests/${fakeQuestId}`,
    query: { userId },
  });

  expect(response.statusCode).toBe(404);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('Quest not found');
});

test('DELETE /quests/:id should return 400 when userId is missing', async () => {
  const server = await buildServer();
  const fakeQuestId = '00000000-0000-0000-0000-000000000000';

  const response = await server.inject({
    method: 'DELETE',
    url: `/quests/${fakeQuestId}`,
  });

  expect(response.statusCode).toBe(400);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('userId query parameter is required');
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

test('Full quest lifecycle: create, read, update, delete', async () => {
  const { server, userId } = await createTestUser();

  // 1. Create quest
  const questData = generateTestQuest();
  const createResponse = await server.inject({
    method: 'POST',
    url: '/quests',
    query: { userId },
    payload: questData,
  });

  expect(createResponse.statusCode).toBe(201);
  const createdQuest = JSON.parse(createResponse.payload).data;

  // 2. Read quest
  const readResponse = await server.inject({
    method: 'GET',
    url: `/quests/${createdQuest.id}`,
    query: { userId },
  });

  expect(readResponse.statusCode).toBe(200);
  const readQuest = JSON.parse(readResponse.payload).data;
  expect(readQuest.id).toBe(createdQuest.id);

  // 3. Update quest
  const updateData = {
    title: 'Updated Quest Title',
    status: QuestStatus.ACTIVE,
    priority: QuestPriority.HIGH,
  };

  const updateResponse = await server.inject({
    method: 'PUT',
    url: `/quests/${createdQuest.id}`,
    query: { userId },
    payload: updateData,
  });

  expect(updateResponse.statusCode).toBe(200);
  const updatedQuest = JSON.parse(updateResponse.payload).data;
  expect(updatedQuest.title).toBe(updateData.title);
  expect(updatedQuest.status).toBe(updateData.status);

  // 4. Delete quest
  const deleteResponse = await server.inject({
    method: 'DELETE',
    url: `/quests/${createdQuest.id}`,
    query: { userId },
  });

  expect(deleteResponse.statusCode).toBe(200);

  // 5. Verify deletion
  const verifyResponse = await server.inject({
    method: 'GET',
    url: `/quests/${createdQuest.id}`,
    query: { userId },
  });

  expect(verifyResponse.statusCode).toBe(404);
});

test('Multiple users should have isolated quest data', async () => {
  const { server, userId: user1Id } = await createTestUser();
  const { userId: user2Id } = await createTestUser();

  // Create quests for both users
  const { questId: quest1Id } = await createTestQuest(user1Id);
  const { questId: quest2Id } = await createTestQuest(user2Id);

  // User 1 should only see their own quests
  const user1QuestsResponse = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId: user1Id },
  });

  expect(user1QuestsResponse.statusCode).toBe(200);
  const user1Quests = JSON.parse(user1QuestsResponse.payload).data;
  expect(user1Quests).toHaveLength(1);
  expect(user1Quests[0].id).toBe(quest1Id);

  // User 2 should only see their own quests
  const user2QuestsResponse = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId: user2Id },
  });

  expect(user2QuestsResponse.statusCode).toBe(200);
  const user2Quests = JSON.parse(user2QuestsResponse.payload).data;
  expect(user2Quests).toHaveLength(1);
  expect(user2Quests[0].id).toBe(quest2Id);

  // User 1 should not be able to access user 2's quest
  const unauthorizedResponse = await server.inject({
    method: 'GET',
    url: `/quests/${quest2Id}`,
    query: { userId: user1Id },
  });

  expect(unauthorizedResponse.statusCode).toBe(404);
});

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
// INTEGRATION TESTS
// ============================================================================

test('Full quest lifecycle: create, read, update, delete', async () => {
  const { server, userId } = await createTestUser();

  // 1. Create quest
  const questData = {
    title: 'Integration Test Quest',
    description: 'A quest for testing the full lifecycle',
    difficulty: QuestDifficulty.HARD,
    estimatedDuration: 120,
    priority: QuestPriority.HIGH,
    tags: ['integration', 'test'],
  };

  const createResponse = await server.inject({
    method: 'POST',
    url: '/quests',
    query: { userId },
    payload: questData,
  });

  expect(createResponse.statusCode).toBe(201);
  const createdQuest = JSON.parse(createResponse.payload).data;
  expect(createdQuest.title).toBe(questData.title);
  expect(createdQuest.difficulty).toBe(questData.difficulty);
  expect(createdQuest.priority).toBe(questData.priority);
  expect(createdQuest.tags).toHaveLength(2);

  // 2. Read quest
  const readResponse = await server.inject({
    method: 'GET',
    url: `/quests/${createdQuest.id}`,
    query: { userId },
  });

  expect(readResponse.statusCode).toBe(200);
  const readQuest = JSON.parse(readResponse.payload).data;
  expect(readQuest.id).toBe(createdQuest.id);
  expect(readQuest.title).toBe(questData.title);

  // 3. Update quest
  const updateData = {
    title: 'Updated Integration Test Quest',
    status: QuestStatus.ACTIVE,
    priority: QuestPriority.URGENT,
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
  expect(updatedQuest.priority).toBe(updateData.priority);

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
  const { questId: quest1Id } = await createTestQuest(user1Id, {
    title: 'User 1 Quest',
  });
  const { questId: quest2Id } = await createTestQuest(user2Id, {
    title: 'User 2 Quest',
  });

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
  expect(user1Quests[0].title).toBe('User 1 Quest');

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
  expect(user2Quests[0].title).toBe('User 2 Quest');

  // User 1 should not be able to access user 2's quest
  const unauthorizedResponse = await server.inject({
    method: 'GET',
    url: `/quests/${quest2Id}`,
    query: { userId: user1Id },
  });

  expect(unauthorizedResponse.statusCode).toBe(404);

  // User 2 should not be able to update user 1's quest
  const unauthorizedUpdateResponse = await server.inject({
    method: 'PUT',
    url: `/quests/${quest1Id}`,
    query: { userId: user2Id },
    payload: { title: 'Hacked Quest' },
  });

  expect(unauthorizedUpdateResponse.statusCode).toBe(404);
});

test('Quest completion should set completedAt timestamp', async () => {
  const { server, userId } = await createTestUser();
  const { questId } = await createTestQuest(userId, {
    title: 'Quest to Complete',
  });

  // Initially, quest should not have completedAt
  const initialResponse = await server.inject({
    method: 'GET',
    url: `/quests/${questId}`,
    query: { userId },
  });

  const initialQuest = JSON.parse(initialResponse.payload).data;
  expect(initialQuest.completedAt).toBeNull();

  // Mark quest as completed
  const completeResponse = await server.inject({
    method: 'PUT',
    url: `/quests/${questId}`,
    query: { userId },
    payload: { status: QuestStatus.COMPLETED },
  });

  expect(completeResponse.statusCode).toBe(200);
  const completedQuest = JSON.parse(completeResponse.payload).data;
  expect(completedQuest.status).toBe(QuestStatus.COMPLETED);
  expect(completedQuest.completedAt).toBeDefined();
  expect(new Date(completedQuest.completedAt)).toBeInstanceOf(Date);

  // Verify in database
  const dbQuest = await testPrisma.quest.findUnique({
    where: { id: questId },
  });
  expect(dbQuest?.completedAt).toBeDefined();
  expect(dbQuest?.status).toBe(QuestStatus.COMPLETED);
});

test('Quest tags should be properly managed', async () => {
  const { server, userId } = await createTestUser();

  // Create quest with tags
  const questData = {
    title: 'Tagged Quest',
    description: 'A quest with tags',
    difficulty: QuestDifficulty.MEDIUM,
    estimatedDuration: 60,
    priority: QuestPriority.MEDIUM,
    tags: ['work', 'urgent', 'project'],
  };

  const createResponse = await server.inject({
    method: 'POST',
    url: '/quests',
    query: { userId },
    payload: questData,
  });

  expect(createResponse.statusCode).toBe(201);
  const createdQuest = JSON.parse(createResponse.payload).data;
  expect(createdQuest.tags).toHaveLength(3);
  const tagNames = createdQuest.tags.map((t: any) => t.tagName);
  expect(tagNames).toContain('work');
  expect(tagNames).toContain('urgent');
  expect(tagNames).toContain('project');

  // Update tags
  const updateResponse = await server.inject({
    method: 'PUT',
    url: `/quests/${createdQuest.id}`,
    query: { userId },
    payload: { tags: ['personal', 'fun'] },
  });

  expect(updateResponse.statusCode).toBe(200);
  const updatedQuest = JSON.parse(updateResponse.payload).data;
  expect(updatedQuest.tags).toHaveLength(2);
  const updatedTagNames = updatedQuest.tags.map((t: any) => t.tagName);
  expect(updatedTagNames).toContain('personal');
  expect(updatedTagNames).toContain('fun');

  // Remove all tags
  const removeTagsResponse = await server.inject({
    method: 'PUT',
    url: `/quests/${createdQuest.id}`,
    query: { userId },
    payload: { tags: [] },
  });

  expect(removeTagsResponse.statusCode).toBe(200);
  const questWithoutTags = JSON.parse(removeTagsResponse.payload).data;
  expect(questWithoutTags.tags).toHaveLength(0);
});

test('Bulk operations should work correctly', async () => {
  const { server, userId } = await createTestUser();

  // Create multiple quests
  const questTitles = ['Quest 1', 'Quest 2', 'Quest 3', 'Quest 4', 'Quest 5'];
  const createdQuests = [];

  for (const title of questTitles) {
    const { questId } = await createTestQuest(userId, { title });
    createdQuests.push(questId);
  }

  // Verify all quests were created
  const listResponse = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId },
  });

  expect(listResponse.statusCode).toBe(200);
  const quests = JSON.parse(listResponse.payload).data;
  expect(quests).toHaveLength(5);

  // Update all quests to ACTIVE status
  for (const questId of createdQuests) {
    const updateResponse = await server.inject({
      method: 'PUT',
      url: `/quests/${questId}`,
      query: { userId },
      payload: { status: QuestStatus.ACTIVE },
    });

    expect(updateResponse.statusCode).toBe(200);
  }

  // Verify all quests are now ACTIVE
  const updatedListResponse = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId, status: QuestStatus.ACTIVE },
  });

  expect(updatedListResponse.statusCode).toBe(200);
  const activeQuests = JSON.parse(updatedListResponse.payload).data;
  expect(activeQuests).toHaveLength(5);
  activeQuests.forEach((quest: any) => {
    expect(quest.status).toBe(QuestStatus.ACTIVE);
  });

  // Delete all quests
  for (const questId of createdQuests) {
    const deleteResponse = await server.inject({
      method: 'DELETE',
      url: `/quests/${questId}`,
      query: { userId },
    });

    expect(deleteResponse.statusCode).toBe(200);
  }

  // Verify all quests are deleted
  const finalListResponse = await server.inject({
    method: 'GET',
    url: '/quests',
    query: { userId },
  });

  expect(finalListResponse.statusCode).toBe(200);
  const remainingQuests = JSON.parse(finalListResponse.payload).data;
  expect(remainingQuests).toHaveLength(0);
});

test('Database constraints should be enforced', async () => {
  const { server, userId } = await createTestUser();

  // Try to create quest with invalid difficulty
  const invalidQuestData = {
    title: 'Invalid Quest',
    description: 'A quest with invalid data',
    difficulty: 'INVALID_DIFFICULTY',
    estimatedDuration: 60,
    priority: QuestPriority.MEDIUM,
  };

  const createResponse = await server.inject({
    method: 'POST',
    url: '/quests',
    query: { userId },
    payload: invalidQuestData,
  });

  expect(createResponse.statusCode).toBe(400);
  const result = JSON.parse(createResponse.payload);
  expect(result.success).toBe(false);
  expect(result.error).toBe('Validation error');

  // Try to create quest with invalid priority
  const invalidPriorityData = {
    title: 'Invalid Priority Quest',
    description: 'A quest with invalid priority',
    difficulty: QuestDifficulty.MEDIUM,
    estimatedDuration: 60,
    priority: 'INVALID_PRIORITY',
  };

  const createPriorityResponse = await server.inject({
    method: 'POST',
    url: '/quests',
    query: { userId },
    payload: invalidPriorityData,
  });

  expect(createPriorityResponse.statusCode).toBe(400);
  const priorityResult = JSON.parse(createPriorityResponse.payload);
  expect(priorityResult.success).toBe(false);
  expect(priorityResult.error).toBe('Validation error');
});

test('Cascade deletion should work correctly', async () => {
  const { server, userId } = await createTestUser();

  // Create a quest with tags
  const { questId } = await createTestQuest(userId, {
    title: 'Quest with Tags',
  });

  // Verify quest and tags exist
  const questWithTags = await testPrisma.quest.findUnique({
    where: { id: questId },
    include: { tags: true },
  });
  expect(questWithTags?.tags).toHaveLength(2);

  // Delete the quest
  const deleteResponse = await server.inject({
    method: 'DELETE',
    url: `/quests/${questId}`,
    query: { userId },
  });

  expect(deleteResponse.statusCode).toBe(200);

  // Verify quest is deleted
  const deletedQuest = await testPrisma.quest.findUnique({
    where: { id: questId },
  });
  expect(deletedQuest).toBeNull();

  // Verify tags are also deleted (cascade)
  const remainingTags = await testPrisma.questTag.findMany({
    where: { questId },
  });
  expect(remainingTags).toHaveLength(0);
});

test('Input sanitization should prevent XSS attacks', async () => {
  const { server, userId } = await createTestUser();
  
  const questData = {
    title: 'Test Quest<script>alert("xss")</script>',
    description: 'Description<script>alert("xss")</script>',
    difficulty: QuestDifficulty.MEDIUM,
    estimatedDuration: 60,
    priority: QuestPriority.MEDIUM,
    tags: ['test', '<script>alert("xss")</script>'],
  };

  const response = await server.inject({
    method: 'POST',
    url: '/quests',
    query: { userId },
    payload: questData,
  });

  expect(response.statusCode).toBe(201);
  const result = JSON.parse(response.payload);
  const createdQuest = result.data;

  // Verify script tags are removed
  expect(createdQuest.title).toBe('Test Quest');
  expect(createdQuest.description).toBe('Description');
  expect(createdQuest.tags).toHaveLength(2);
  
  // Check that tags contain the expected values (order-independent)
  const tagNames = createdQuest.tags.map((t: any) => t.tagName);
  expect(tagNames).toContain('test');
  // The sanitization removes the entire script tag content, so the second tag becomes empty
  expect(tagNames).toContain('');
});

import { test, expect } from 'vitest';
import { buildServer } from '../src/index';
import { generateTestUser } from './setup';

test('POST /users should create a new user', async () => {
  const server = await buildServer();
  const testUser = generateTestUser();

  const response = await server.inject({
    method: 'POST',
    url: '/users',
    payload: testUser,
  });

  expect(response.statusCode).toBe(201);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data).toMatchObject({
    email: testUser.email,
    username: testUser.username,
  });
  expect(result.data.id).toBeDefined();
  expect(result.data.createdAt).toBeDefined();
  expect(result.data.updatedAt).toBeDefined();
});

test('POST /users should return 409 for duplicate email', async () => {
  const server = await buildServer();
  const testUser = generateTestUser();

  // Create first user
  const firstResponse = await server.inject({
    method: 'POST',
    url: '/users',
    payload: testUser,
  });

  expect(firstResponse.statusCode).toBe(201);

  // Try to create second user with same email
  const response = await server.inject({
    method: 'POST',
    url: '/users',
    payload: {
      ...testUser,
      username: 'different-username',
    },
  });

  expect(response.statusCode).toBe(409);
  expect(JSON.parse(response.payload)).toMatchObject({
    success: false,
    error: 'User with this email or username already exists',
  });
});

test('POST /users should return 409 for duplicate username', async () => {
  const server = await buildServer();
  const testUser = generateTestUser();

  // Create first user
  const firstResponse = await server.inject({
    method: 'POST',
    url: '/users',
    payload: testUser,
  });

  expect(firstResponse.statusCode).toBe(201);

  // Try to create second user with same username
  const response = await server.inject({
    method: 'POST',
    url: '/users',
    payload: {
      ...testUser,
      email: 'different@example.com',
    },
  });

  expect(response.statusCode).toBe(409);
  expect(JSON.parse(response.payload)).toMatchObject({
    success: false,
    error: 'User with this email or username already exists',
  });
});

test('POST /users should return 400 for invalid email', async () => {
  const server = await buildServer();
  const testUser = generateTestUser();

  const response = await server.inject({
    method: 'POST',
    url: '/users',
    payload: {
      ...testUser,
      email: 'invalid-email',
    },
  });

  expect(response.statusCode).toBe(400);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error.message).toBe('Invalid request body');
  expect(result.error.code).toBe('VALIDATION_ERROR');
  expect(result.error.field).toBe('email');
});

test('POST /users should return 400 for weak password', async () => {
  const server = await buildServer();
  const testUser = generateTestUser();

  const response = await server.inject({
    method: 'POST',
    url: '/users',
    payload: {
      ...testUser,
      password: 'weak',
    },
  });

  expect(response.statusCode).toBe(400);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error.message).toBe('Invalid request body');
  expect(result.error.code).toBe('VALIDATION_ERROR');
  expect(result.error.field).toBe('password');
});

test('POST /users should return 400 for invalid username', async () => {
  const server = await buildServer();
  const testUser = generateTestUser();

  const response = await server.inject({
    method: 'POST',
    url: '/users',
    payload: {
      ...testUser,
      username: 'a', // Too short
    },
  });

  expect(response.statusCode).toBe(400);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(false);
  expect(result.error.message).toBe('Invalid request body');
  expect(result.error.code).toBe('VALIDATION_ERROR');
  expect(result.error.field).toBe('username');
});

test('POST /users should create user with optional displayName', async () => {
  const server = await buildServer();
  const testUser = generateTestUser();

  const response = await server.inject({
    method: 'POST',
    url: '/users',
    payload: {
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      displayName: 'Custom Display Name',
    },
  });

  expect(response.statusCode).toBe(201);
  const result = JSON.parse(response.payload);
  expect(result.success).toBe(true);
  expect(result.data.displayName).toBe('Custom Display Name');
});

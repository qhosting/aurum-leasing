
import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';

// Use vi.hoisted to ensure variables are available in the mock factory
const { mockPoolInstance, mockQuery } = vi.hoisted(() => {
  const mockQuery = vi.fn();
  const mockPoolInstance = {
    query: mockQuery,
    connect: vi.fn(),
    on: vi.fn(),
  };
  return { mockPoolInstance, mockQuery };
});

// Use vi.mock factory
vi.mock('pg', () => {
  return {
    Pool: vi.fn(function() { return mockPoolInstance; })
  };
});

vi.mock('ioredis', () => {
  return {
    default: vi.fn(function() {
      return {
        get: vi.fn(),
        set: vi.fn(),
        setex: vi.fn(),
        incr: vi.fn(),
      };
    }),
  };
});

// Import app AFTER mocks are defined
import { app } from '../../app';

describe('API Integration Tests', () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  it('should reject login with invalid credentials', async () => {
    // Setup mock response
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('should return 401 for protected route without token', async () => {
    const response = await request(app).get('/api/fleet');
    expect(response.status).toBe(401);
  });
});

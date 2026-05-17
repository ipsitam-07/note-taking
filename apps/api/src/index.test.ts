import { describe, expect, it } from 'vitest';

describe('API env', () => {
  it('loads required environment variables', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5433/test';
    process.env.PORT = '4000';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    const { env } = await import('./config/env');

    expect(env.DATABASE_URL).toBe('postgresql://localhost:5433/test');
    expect(env.PORT).toBe('4000');
    expect(env.JWT_ACCESS_SECRET).toBe('test-access-secret');
    expect(env.JWT_REFRESH_SECRET).toBe('test-refresh-secret');
  });
});

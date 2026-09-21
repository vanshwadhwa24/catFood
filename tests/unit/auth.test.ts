import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/services/authService.js';

describe('Auth Service - Unit Tests', () => {
  it('should hash a password correctly and verify it', async () => {
    const rawPassword = 'SecretDogPassword123!';
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(rawPassword);

    const isValid = await verifyPassword(rawPassword, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });
});

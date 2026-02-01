
import { describe, it, expect } from 'vitest';
import { loginSchema, fleetSchema, paymentReportSchema } from '../../schemas';

describe('Zod Schemas Validation', () => {
  it('should validate correct login data', () => {
    const data = { email: 'test@example.com', password: 'password123' };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email in login', () => {
    const data = { email: 'invalid-email', password: 'password123' };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should validate correct fleet data', () => {
    const data = { plate: 'ABC-123', brand: 'Toyota', model: 'Corolla', tenant_id: 't1' };
    const result = fleetSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject missing fields in fleet data', () => {
    const data = { brand: 'Toyota' };
    const result = fleetSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

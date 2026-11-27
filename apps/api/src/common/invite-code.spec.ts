import { describe, it, expect } from 'vitest';
import { generateInviteCode } from './invite-code';

describe('generateInviteCode', () => {
  it('returns an 8-char base62 code', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[0-9A-Za-z]{8}$/);
  });

  it('is random (no collisions across 200 calls)', () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateInviteCode()));
    expect(codes.size).toBe(200);
  });
});

import { describe, it, expect } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const cfg = {
  accessSecret: 'a',
  refreshSecret: 'r',
  pendingSecret: 'p',
  accessTtl: '15m',
  refreshTtl: '14d',
  pendingTtl: '10m',
};
const tokens = new TokenService(new JwtService({}), cfg);
const guard = new JwtAuthGuard(tokens);

function ctx(authHeader?: string) {
  const req: any = { headers: authHeader ? { authorization: authHeader } : {} };
  return {
    req,
    switchToHttp: () => ({ getRequest: () => req }),
  } as any;
}

describe('JwtAuthGuard', () => {
  it('allows a valid access token and sets req.userId', () => {
    const c = ctx(`Bearer ${tokens.issueAccess('user-1')}`);
    expect(guard.canActivate(c)).toBe(true);
    expect(c.req.userId).toBe('user-1');
  });

  it('rejects when there is no Authorization header', () => {
    expect(() => guard.canActivate(ctx())).toThrow();
  });

  it('rejects an invalid token', () => {
    expect(() => guard.canActivate(ctx('Bearer not.a.token'))).toThrow();
  });
});

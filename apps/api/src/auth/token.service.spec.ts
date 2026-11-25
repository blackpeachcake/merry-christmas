import { describe, it, expect } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';

const cfg = {
  accessSecret: 'access-secret',
  refreshSecret: 'refresh-secret',
  pendingSecret: 'pending-secret',
  accessTtl: '15m',
  refreshTtl: '14d',
  pendingTtl: '10m',
};

const make = () => new TokenService(new JwtService({}), cfg);

describe('TokenService', () => {
  it('issues an access token that verifies back to the userId', () => {
    const svc = make();
    const token = svc.issueAccess('user-1');
    expect(svc.verifyAccess(token).sub).toBe('user-1');
  });

  it('issues a pending token carrying the kakao profile', () => {
    const svc = make();
    const token = svc.issuePending({
      provider: 'kakao',
      providerUserId: 'k-1',
      nickname: '닉',
      imageUrl: 'http://img',
    });
    expect(svc.verifyPending(token)).toMatchObject({
      provider: 'kakao',
      providerUserId: 'k-1',
      nickname: '닉',
      imageUrl: 'http://img',
    });
  });

  it('rejects an access token when verified as a refresh token (wrong secret)', () => {
    const svc = make();
    const access = svc.issueAccess('user-1');
    expect(() => svc.verifyRefresh(access)).toThrow();
  });
});

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';
import { KakaoProfile } from '../models/auth.model';

const cfg = {
  accessSecret: 'a',
  refreshSecret: 'r',
  pendingSecret: 'p',
  accessTtl: '15m',
  refreshTtl: '14d',
  pendingTtl: '10m',
};
const prisma = new PrismaService();
const users = new UsersService(prisma);
const tokens = new TokenService(new JwtService({}), cfg);
const auth = new AuthService(users, tokens);

const profile: KakaoProfile = {
  provider: 'kakao',
  providerUserId: 'k1',
  nickname: '닉',
  imageUrl: 'img',
};

beforeEach(async () => {
  await prisma.user.deleteMany();
});
afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('AuthService.handleKakaoProfile (real DB)', () => {
  it('returns terms_required with a pending token for a new kakao user', async () => {
    const res = await auth.handleKakaoProfile(profile);
    expect(res.status).toBe('terms_required');
    if (res.status === 'terms_required') {
      expect(tokens.verifyPending(res.pendingToken)).toMatchObject({
        providerUserId: 'k1',
        nickname: '닉',
      });
    }
  });

  it('returns authenticated tokens for an existing user', async () => {
    const created = await users.create({
      provider: 'kakao',
      providerUserId: 'k1',
      nickname: '닉',
    });
    const res = await auth.handleKakaoProfile(profile);
    expect(res.status).toBe('authenticated');
    if (res.status === 'authenticated') {
      expect(tokens.verifyAccess(res.accessToken).sub).toBe(created.id);
      expect(tokens.verifyRefresh(res.refreshToken).sub).toBe(created.id);
    }
  });
});

describe('AuthService.consume (약관동의 → 계정 생성)', () => {
  it('creates a user and returns tokens when both required consents are agreed', async () => {
    const pending = tokens.issuePending(profile);
    const res = await auth.consume(pending, { agreeTerms: true, agreePrivacy: true });
    expect(tokens.verifyAccess(res.accessToken).sub).toBeTruthy();
    const created = await users.findByProvider('kakao', 'k1');
    expect(created).not.toBeNull();
    expect(created?.termsAgreedAt).toBeInstanceOf(Date);
  });

  it('rejects and creates no user when a required consent is missing', async () => {
    const pending = tokens.issuePending(profile);
    await expect(
      auth.consume(pending, { agreeTerms: true, agreePrivacy: false }),
    ).rejects.toThrow();
    expect(await users.findByProvider('kakao', 'k1')).toBeNull();
  });
});

describe('AuthService.refresh', () => {
  it('rotates to a new access/refresh pair when the refresh token matches the current tokenVersion', async () => {
    const created = await users.create(profile);
    const refreshToken = tokens.issueRefresh(created.id, created.tokenVersion);
    const res = await auth.refresh(refreshToken);
    expect(tokens.verifyAccess(res.accessToken).sub).toBe(created.id);
    expect(tokens.verifyRefresh(res.refreshToken)).toMatchObject({
      sub: created.id,
      v: 0,
    });
  });

  it('rejects when the refresh token version no longer matches the user (logged out)', async () => {
    const created = await users.create(profile);
    const staleRefreshToken = tokens.issueRefresh(created.id, created.tokenVersion);
    await users.bumpTokenVersion(created.id);
    await expect(auth.refresh(staleRefreshToken)).rejects.toThrow();
  });

  it('rejects when the user no longer exists', async () => {
    const refreshToken = tokens.issueRefresh('no-such-user', 0);
    await expect(auth.refresh(refreshToken)).rejects.toThrow();
  });
});

describe('AuthService.logout', () => {
  it('bumps the tokenVersion so previously issued refresh tokens are rejected', async () => {
    const created = await users.create(profile);
    const refreshToken = tokens.issueRefresh(created.id, created.tokenVersion);
    await auth.logout(created.id);
    await expect(auth.refresh(refreshToken)).rejects.toThrow();
  });
});

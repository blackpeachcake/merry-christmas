import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

const prisma = new PrismaService();
const svc = new UsersService(prisma);

beforeEach(async () => {
  await prisma.user.deleteMany();
});
afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('UsersService (real DB)', () => {
  it('returns null when no user matches the provider identity', async () => {
    expect(await svc.findByProvider('kakao', 'nope')).toBeNull();
  });

  it('creates a user from a kakao profile and finds it back', async () => {
    const created = await svc.create({
      provider: 'kakao',
      providerUserId: 'k1',
      nickname: '닉',
      imageUrl: 'http://img',
      termsVersion: 'v1',
    });
    expect(created.id).toBeTruthy();
    expect(created.termsAgreedAt).toBeInstanceOf(Date);

    const found = await svc.findByProvider('kakao', 'k1');
    expect(found?.id).toBe(created.id);
    expect(found?.nickname).toBe('닉');
  });

  it('allows the same providerUserId under a different provider (dup accounts allowed)', async () => {
    await svc.create({ provider: 'kakao', providerUserId: 'same', nickname: 'a', termsVersion: 'v1' });
    const google = await svc.create({ provider: 'google', providerUserId: 'same', nickname: 'b', termsVersion: 'v1' });
    expect(google.id).toBeTruthy();
  });
});

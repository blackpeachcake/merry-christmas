import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

const prisma = new PrismaService();
const svc = new UsersService(prisma);

beforeEach(async () => {
  await prisma.notification.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.joinRequest.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();
});
afterAll(async () => {
  await prisma.notification.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.joinRequest.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
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
    });
    expect(created.id).toBeTruthy();
    expect(created.termsAgreedAt).toBeInstanceOf(Date);

    const found = await svc.findByProvider('kakao', 'k1');
    expect(found?.id).toBe(created.id);
    expect(found?.nickname).toBe('닉');
  });

  it('allows the same providerUserId under a different provider (dup accounts allowed)', async () => {
    await svc.create({ provider: 'kakao', providerUserId: 'same', nickname: 'a' });
    const google = await svc.create({ provider: 'google', providerUserId: 'same', nickname: 'b' });
    expect(google.id).toBeTruthy();
  });

  it('findById returns the user, or null when missing', async () => {
    const created = await svc.create({ provider: 'kakao', providerUserId: 'k2', nickname: 'c' });
    expect((await svc.findById(created.id))?.id).toBe(created.id);
    expect(await svc.findById('no-such-id')).toBeNull();
  });

  it('bumpTokenVersion increments tokenVersion', async () => {
    const created = await svc.create({ provider: 'kakao', providerUserId: 'k3', nickname: 'd' });
    expect(created.tokenVersion).toBe(0);
    await svc.bumpTokenVersion(created.id);
    expect((await svc.findById(created.id))?.tokenVersion).toBe(1);
  });
});

describe('UsersService.remove (real DB)', () => {
  it('cascades: deletes rooms I own along with their invitations/join_requests/room_members', async () => {
    const owner = await svc.create({ provider: 'kakao', providerUserId: 'owner', nickname: '방장' });
    const stranger = await svc.create({ provider: 'kakao', providerUserId: 'stranger', nickname: '남' });
    const room = await prisma.room.create({
      data: { name: '방', ownerId: owner.id, inviteCode: 'ABCDEFGH', capacity: 3 },
    });
    await prisma.roomMember.create({ data: { roomId: room.id, userId: owner.id, role: 'owner' } });
    const invitation = await prisma.invitation.create({
      data: { roomId: room.id, name: '초대장', ratio: '9:16', background: { type: 'color', value: '#fff' } },
    });
    const joinRequest = await prisma.joinRequest.create({
      data: { roomId: room.id, userId: stranger.id, status: 'pending' },
    });

    await svc.remove(owner.id);

    expect(await prisma.room.findUnique({ where: { id: room.id } })).toBeNull();
    expect(await prisma.invitation.findUnique({ where: { id: invitation.id } })).toBeNull();
    expect(await prisma.joinRequest.findUnique({ where: { id: joinRequest.id } })).toBeNull();
    expect(await svc.findById(owner.id)).toBeNull();
  });

  it('leaves rooms intact when I am only a member, but removes my membership', async () => {
    const owner = await svc.create({ provider: 'kakao', providerUserId: 'owner2', nickname: '방장2' });
    const member = await svc.create({ provider: 'kakao', providerUserId: 'member2', nickname: '멤버' });
    const room = await prisma.room.create({
      data: { name: '방2', ownerId: owner.id, inviteCode: 'IJKLMNOP', capacity: 3 },
    });
    await prisma.roomMember.create({ data: { roomId: room.id, userId: owner.id, role: 'owner' } });
    await prisma.roomMember.create({ data: { roomId: room.id, userId: member.id, role: 'member' } });

    await svc.remove(member.id);

    expect(await prisma.room.findUnique({ where: { id: room.id } })).not.toBeNull();
    expect(
      await prisma.roomMember.findUnique({ where: { roomId_userId: { roomId: room.id, userId: member.id } } }),
    ).toBeNull();
    expect(await svc.findById(member.id)).toBeNull();
  });

  it('removes my notifications and join requests, then deletes the user', async () => {
    const owner = await svc.create({ provider: 'kakao', providerUserId: 'owner3', nickname: '방장3' });
    const applicant = await svc.create({ provider: 'kakao', providerUserId: 'applicant', nickname: '신청자' });
    const room = await prisma.room.create({
      data: { name: '방3', ownerId: owner.id, inviteCode: 'QRSTUVWX', capacity: 3 },
    });
    await prisma.notification.create({
      data: { userId: applicant.id, type: 'join_approved', payload: { roomId: room.id } },
    });
    const joinRequest = await prisma.joinRequest.create({
      data: { roomId: room.id, userId: applicant.id, status: 'approved' },
    });

    await svc.remove(applicant.id);

    expect(await prisma.notification.findFirst({ where: { userId: applicant.id } })).toBeNull();
    expect(await prisma.joinRequest.findUnique({ where: { id: joinRequest.id } })).toBeNull();
    expect(await svc.findById(applicant.id)).toBeNull();
  });
});

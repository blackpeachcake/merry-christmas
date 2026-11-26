import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from './rooms.service';

const prisma = new PrismaService();
const svc = new RoomsService(prisma);

beforeEach(async () => {
  await prisma.notification.deleteMany();
  await prisma.joinRequest.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
});
afterAll(async () => {
  await prisma.notification.deleteMany();
  await prisma.joinRequest.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
  await prisma.$disconnect();
});

describe('RoomsService.preview (real DB)', () => {
  it('returns only the room name', async () => {
    const room = await svc.create('owner', { name: '크리스마스 방', capacity: 3 });
    const result = await svc.preview(room.id);
    expect(result).toEqual({ name: '크리스마스 방' });
  });

  it('throws 404 when the room does not exist', async () => {
    await expect(svc.preview('nope')).rejects.toThrow();
  });
});

describe('RoomsService.joinByCode (real DB)', () => {
  it('creates a pending join_request and a notification for the owner', async () => {
    const room = await svc.create('owner', { name: '방', capacity: 3 });
    await svc.joinByCode('friend', room.id, room.inviteCode);

    const req = await prisma.joinRequest.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: 'friend' } },
    });
    expect(req?.status).toBe('pending');

    const notif = await prisma.notification.findFirst({ where: { userId: 'owner' } });
    expect(notif?.type).toBe('join_requested');
  });

  it('rejects a wrong invite code', async () => {
    const room = await svc.create('owner', { name: '방', capacity: 3 });
    await expect(svc.joinByCode('friend', room.id, 'WRONGCOD')).rejects.toThrow();
  });

  it('rejects when the user is already an active member', async () => {
    const room = await svc.create('owner', { name: '방', capacity: 3 });
    await expect(svc.joinByCode('owner', room.id, room.inviteCode)).rejects.toThrow();
  });

  it('is idempotent for an existing pending request', async () => {
    const room = await svc.create('owner', { name: '방', capacity: 3 });
    await svc.joinByCode('friend', room.id, room.inviteCode);
    await svc.joinByCode('friend', room.id, room.inviteCode);
    const count = await prisma.joinRequest.count({ where: { roomId: room.id, userId: 'friend' } });
    expect(count).toBe(1);
  });

  it('rejects re-request after 3 rejections', async () => {
    const room = await svc.create('owner', { name: '방', capacity: 3 });
    await prisma.joinRequest.create({
      data: { roomId: room.id, userId: 'friend', status: 'rejected', rejectCount: 3 },
    });
    await expect(svc.joinByCode('friend', room.id, room.inviteCode)).rejects.toThrow();
  });
});

describe('RoomsService.listPendingRequests (real DB)', () => {
  it('returns only pending requests for the room', async () => {
    const room = await svc.create('owner', { name: '방', capacity: 3 });
    await svc.joinByCode('friend', room.id, room.inviteCode);
    await prisma.joinRequest.create({
      data: { roomId: room.id, userId: 'rejected-guy', status: 'rejected', rejectCount: 1 },
    });

    const list = await svc.listPendingRequests(room.id);
    expect(list).toHaveLength(1);
    expect(list[0].userId).toBe('friend');
  });
});

describe('RoomsService.approveRequest (real DB)', () => {
  it('adds the requester as a member and notifies them', async () => {
    const room = await svc.create('owner', { name: '방', capacity: 3 });
    await svc.joinByCode('friend', room.id, room.inviteCode);
    const req = await prisma.joinRequest.findUniqueOrThrow({
      where: { roomId_userId: { roomId: room.id, userId: 'friend' } },
    });

    await svc.approveRequest(room.id, req.id);

    const member = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: 'friend' } },
    });
    expect(member?.role).toBe('member');
    const updated = await prisma.joinRequest.findUniqueOrThrow({ where: { id: req.id } });
    expect(updated.status).toBe('approved');
    const notif = await prisma.notification.findFirst({ where: { userId: 'friend' } });
    expect(notif?.type).toBe('join_approved');
  });

  it('rejects when the room is already full', async () => {
    const room = await svc.create('owner', { name: '방', capacity: 1 });
    await svc.joinByCode('friend', room.id, room.inviteCode);
    const req = await prisma.joinRequest.findUniqueOrThrow({
      where: { roomId_userId: { roomId: room.id, userId: 'friend' } },
    });
    await expect(svc.approveRequest(room.id, req.id)).rejects.toThrow();
  });

  it('rejects when the request is not pending', async () => {
    const room = await svc.create('owner', { name: '방', capacity: 3 });
    const req = await prisma.joinRequest.create({
      data: { roomId: room.id, userId: 'friend', status: 'approved' },
    });
    await expect(svc.approveRequest(room.id, req.id)).rejects.toThrow();
  });
});

describe('RoomsService.rejectRequest (real DB)', () => {
  it('marks the request rejected, bumps reject_count, and notifies the requester', async () => {
    const room = await svc.create('owner', { name: '방', capacity: 3 });
    await svc.joinByCode('friend', room.id, room.inviteCode);
    const req = await prisma.joinRequest.findUniqueOrThrow({
      where: { roomId_userId: { roomId: room.id, userId: 'friend' } },
    });

    await svc.rejectRequest(room.id, req.id);

    const updated = await prisma.joinRequest.findUniqueOrThrow({ where: { id: req.id } });
    expect(updated.status).toBe('rejected');
    expect(updated.rejectCount).toBe(1);
    const notif = await prisma.notification.findFirst({ where: { userId: 'friend' } });
    expect(notif?.type).toBe('join_rejected');
  });

  it('rejects when the request is not pending', async () => {
    const room = await svc.create('owner', { name: '방', capacity: 3 });
    const req = await prisma.joinRequest.create({
      data: { roomId: room.id, userId: 'friend', status: 'approved' },
    });
    await expect(svc.rejectRequest(room.id, req.id)).rejects.toThrow();
  });
});

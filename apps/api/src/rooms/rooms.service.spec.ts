import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from './rooms.service';

const prisma = new PrismaService();
const svc = new RoomsService(prisma);

beforeEach(async () => {
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
});
afterAll(async () => {
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
  await prisma.$disconnect();
});

describe('RoomsService.create (real DB)', () => {
  it('creates a room with the creator as owner member + invite code', async () => {
    const room = await svc.create('user-1', { name: '내 방', capacity: 5 });
    expect(room.id).toBeTruthy();
    expect(room.ownerId).toBe('user-1');
    expect(room.inviteCode).toMatch(/^[0-9A-Za-z]{8}$/);
    expect(room.capacity).toBe(5);

    const member = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: 'user-1' } },
    });
    expect(member?.role).toBe('owner');
  });

  it('rejects capacity outside 1~8', async () => {
    await expect(svc.create('u', { name: 'x', capacity: 0 })).rejects.toThrow();
    await expect(svc.create('u', { name: 'x', capacity: 9 })).rejects.toThrow();
  });

  it('rejects an empty name', async () => {
    await expect(svc.create('u', { name: '   ', capacity: 3 })).rejects.toThrow();
  });
});

describe('RoomsService.listMine (real DB)', () => {
  it('returns rooms where I am owner or member, excluding others', async () => {
    const owned = await svc.create('me', { name: 'A', capacity: 3 });
    const joined = await svc.create('other', { name: 'B', capacity: 3 });
    await prisma.roomMember.create({
      data: { roomId: joined.id, userId: 'me', role: 'member' },
    });
    await svc.create('stranger', { name: 'C', capacity: 3 }); // 내가 없는 방

    const list = await svc.listMine('me');
    const ids = list.map((r) => r.id);
    expect(ids).toContain(owned.id);
    expect(ids).toContain(joined.id);
    expect(list).toHaveLength(2);
  });
});

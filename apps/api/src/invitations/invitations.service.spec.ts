import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { InvitationsService } from './invitations.service';

const prisma = new PrismaService();
const rooms = new RoomsService(prisma);
const svc = new InvitationsService(prisma);

beforeEach(async () => {
  await prisma.invitation.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
});
afterAll(async () => {
  await prisma.invitation.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
  await prisma.$disconnect();
});

describe('InvitationsService.create (real DB)', () => {
  it('creates an invitation for a room member', async () => {
    const room = await rooms.create('owner', { name: '방', capacity: 3 });
    const inv = await svc.create('owner', room.id, {
      name: '초대장',
      ratio: '9:16',
      background: { type: 'color', value: '#fff' },
    });
    expect(inv.roomId).toBe(room.id);
    expect(inv.ratio).toBe('9:16');
  });

  it('rejects a non-member', async () => {
    const room = await rooms.create('owner', { name: '방', capacity: 3 });
    await expect(
      svc.create('stranger', room.id, {
        name: '초대장',
        ratio: '9:16',
        background: { type: 'color', value: '#fff' },
      }),
    ).rejects.toThrow();
  });

  it('rejects an invalid ratio', async () => {
    const room = await rooms.create('owner', { name: '방', capacity: 3 });
    await expect(
      svc.create('owner', room.id, {
        name: '초대장',
        ratio: '3:3' as never,
        background: { type: 'color', value: '#fff' },
      }),
    ).rejects.toThrow();
  });
});

describe('InvitationsService.listByRoom (real DB)', () => {
  it('lists only invitations of the given room', async () => {
    const room = await rooms.create('owner', { name: '방', capacity: 3 });
    const other = await rooms.create('owner', { name: '다른방', capacity: 3 });
    await svc.create('owner', room.id, { name: 'A', ratio: '9:16', background: { type: 'color', value: '#fff' } });
    await svc.create('owner', other.id, { name: 'B', ratio: '9:16', background: { type: 'color', value: '#fff' } });

    const list = await svc.listByRoom('owner', room.id);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('A');
  });

  it('rejects a non-member', async () => {
    const room = await rooms.create('owner', { name: '방', capacity: 3 });
    await expect(svc.listByRoom('stranger', room.id)).rejects.toThrow();
  });
});

describe('InvitationsService.update (real DB)', () => {
  it('updates name/background/thumbnailUrl but ignores ratio', async () => {
    const room = await rooms.create('owner', { name: '방', capacity: 3 });
    const inv = await svc.create('owner', room.id, { name: 'A', ratio: '9:16', background: { type: 'color', value: '#fff' } });

    const updated = await svc.update('owner', inv.id, {
      name: 'B',
      ratio: '1:1' as never,
      background: { type: 'color', value: '#000' },
      thumbnailUrl: 'https://x/y.png',
    } as never);

    expect(updated.name).toBe('B');
    expect(updated.ratio).toBe('9:16');
    expect(updated.thumbnailUrl).toBe('https://x/y.png');
  });

  it('rejects a non-member', async () => {
    const room = await rooms.create('owner', { name: '방', capacity: 3 });
    const inv = await svc.create('owner', room.id, { name: 'A', ratio: '9:16', background: { type: 'color', value: '#fff' } });
    await expect(svc.update('stranger', inv.id, { name: 'B' })).rejects.toThrow();
  });

  it('throws 404 for a nonexistent invitation', async () => {
    await expect(svc.update('owner', 'nope', { name: 'B' })).rejects.toThrow();
  });
});

describe('InvitationsService.remove (real DB)', () => {
  it('removes the invitation when called by the room owner', async () => {
    const room = await rooms.create('owner', { name: '방', capacity: 3 });
    const inv = await svc.create('owner', room.id, { name: 'A', ratio: '9:16', background: { type: 'color', value: '#fff' } });

    await svc.remove('owner', inv.id);

    const found = await prisma.invitation.findUnique({ where: { id: inv.id } });
    expect(found).toBeNull();
  });

  it('rejects a non-owner member', async () => {
    const room = await rooms.create('owner', { name: '방', capacity: 3 });
    const inv = await svc.create('owner', room.id, { name: 'A', ratio: '9:16', background: { type: 'color', value: '#fff' } });
    await prisma.roomMember.create({ data: { roomId: room.id, userId: 'member', role: 'member' } });

    await expect(svc.remove('member', inv.id)).rejects.toThrow();
  });

  it('throws 404 for a nonexistent invitation', async () => {
    await expect(svc.remove('owner', 'nope')).rejects.toThrow();
  });
});

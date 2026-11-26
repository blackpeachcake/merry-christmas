import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

const prisma = new PrismaService();
const svc = new NotificationsService(prisma);

beforeEach(async () => {
  await prisma.notification.deleteMany();
});
afterAll(async () => {
  await prisma.notification.deleteMany();
  await prisma.$disconnect();
});

describe('NotificationsService.listMine (real DB)', () => {
  it('returns only my notifications, newest first', async () => {
    await prisma.notification.create({
      data: { userId: 'me', type: 'join_requested', payload: { a: 1 } },
    });
    await prisma.notification.create({
      data: { userId: 'other', type: 'join_requested', payload: { a: 2 } },
    });
    const second = await prisma.notification.create({
      data: { userId: 'me', type: 'join_approved', payload: { a: 3 } },
    });

    const list = await svc.listMine('me');
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(second.id);
  });
});

describe('NotificationsService.markRead (real DB)', () => {
  it('sets readAt on my notification', async () => {
    const notif = await prisma.notification.create({
      data: { userId: 'me', type: 'join_approved', payload: {} },
    });
    const updated = await svc.markRead('me', notif.id);
    expect(updated.readAt).not.toBeNull();
  });

  it('is idempotent when already read', async () => {
    const notif = await prisma.notification.create({
      data: { userId: 'me', type: 'join_approved', payload: {}, readAt: new Date() },
    });
    const updated = await svc.markRead('me', notif.id);
    expect(updated.readAt).toEqual(notif.readAt);
  });

  it('rejects when the notification belongs to someone else', async () => {
    const notif = await prisma.notification.create({
      data: { userId: 'other', type: 'join_approved', payload: {} },
    });
    await expect(svc.markRead('me', notif.id)).rejects.toThrow();
  });

  it('rejects when the notification does not exist', async () => {
    await expect(svc.markRead('me', 'nope')).rejects.toThrow();
  });
});

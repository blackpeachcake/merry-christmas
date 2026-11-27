import { describe, it, expect, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RoomOwnerGuard } from './room-owner.guard';

const ctx = (params: object, userId: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ params, userId }),
    }),
  }) as any;

describe('RoomOwnerGuard', () => {
  it('allows the room owner through', async () => {
    const prisma = {
      room: { findUnique: vi.fn().mockResolvedValue({ id: 'r1', ownerId: 'u1' }) },
    } as any;
    const guard = new RoomOwnerGuard(prisma);
    await expect(guard.canActivate(ctx({ id: 'r1' }, 'u1'))).resolves.toBe(true);
  });

  it('rejects a non-owner with 403', async () => {
    const prisma = {
      room: { findUnique: vi.fn().mockResolvedValue({ id: 'r1', ownerId: 'u1' }) },
    } as any;
    const guard = new RoomOwnerGuard(prisma);
    await expect(guard.canActivate(ctx({ id: 'r1' }, 'other'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects with 404 when the room does not exist', async () => {
    const prisma = { room: { findUnique: vi.fn().mockResolvedValue(null) } } as any;
    const guard = new RoomOwnerGuard(prisma);
    await expect(guard.canActivate(ctx({ id: 'nope' }, 'u1'))).rejects.toThrow(
      NotFoundException,
    );
  });
});

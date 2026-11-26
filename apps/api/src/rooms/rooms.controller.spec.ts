import { describe, it, expect, vi } from 'vitest';
import { RoomsController } from './rooms.controller';

describe('RoomsController', () => {
  it('create delegates to service with req.userId and body', async () => {
    const rooms = { create: vi.fn().mockResolvedValue({ id: 'r1' }) } as any;
    const ctrl = new RoomsController(rooms);
    const out = await ctrl.create({ userId: 'u1' } as any, {
      name: 'A',
      capacity: 3,
    });
    expect(rooms.create).toHaveBeenCalledWith('u1', { name: 'A', capacity: 3 });
    expect(out).toEqual({ id: 'r1' });
  });

  it('listMine delegates to service with req.userId', async () => {
    const rooms = { listMine: vi.fn().mockResolvedValue([]) } as any;
    const ctrl = new RoomsController(rooms);
    await ctrl.listMine({ userId: 'u1' } as any);
    expect(rooms.listMine).toHaveBeenCalledWith('u1');
  });
});

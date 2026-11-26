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

  it('join delegates to service with userId, roomId, code', async () => {
    const rooms = { joinByCode: vi.fn().mockResolvedValue(undefined) } as any;
    const ctrl = new RoomsController(rooms);
    await ctrl.join({ userId: 'u1', params: { id: 'r1' } } as any, { code: 'ABC12345' });
    expect(rooms.joinByCode).toHaveBeenCalledWith('u1', 'r1', 'ABC12345');
  });

  it('listRequests delegates to service with roomId', async () => {
    const rooms = { listPendingRequests: vi.fn().mockResolvedValue([]) } as any;
    const ctrl = new RoomsController(rooms);
    await ctrl.listRequests({ params: { id: 'r1' } } as any);
    expect(rooms.listPendingRequests).toHaveBeenCalledWith('r1');
  });

  it('approve delegates to service with roomId, reqId', async () => {
    const rooms = { approveRequest: vi.fn().mockResolvedValue(undefined) } as any;
    const ctrl = new RoomsController(rooms);
    await ctrl.approve({ params: { id: 'r1', reqId: 'j1' } } as any);
    expect(rooms.approveRequest).toHaveBeenCalledWith('r1', 'j1');
  });

  it('reject delegates to service with roomId, reqId', async () => {
    const rooms = { rejectRequest: vi.fn().mockResolvedValue(undefined) } as any;
    const ctrl = new RoomsController(rooms);
    await ctrl.reject({ params: { id: 'r1', reqId: 'j1' } } as any);
    expect(rooms.rejectRequest).toHaveBeenCalledWith('r1', 'j1');
  });

  it('leave delegates to service with userId, roomId', async () => {
    const rooms = { leave: vi.fn().mockResolvedValue(undefined) } as any;
    const ctrl = new RoomsController(rooms);
    await ctrl.leave({ userId: 'u1', params: { id: 'r1' } } as any);
    expect(rooms.leave).toHaveBeenCalledWith('u1', 'r1');
  });

  it('remove delegates to service with roomId', async () => {
    const rooms = { remove: vi.fn().mockResolvedValue(undefined) } as any;
    const ctrl = new RoomsController(rooms);
    await ctrl.remove({ params: { id: 'r1' } } as any);
    expect(rooms.remove).toHaveBeenCalledWith('r1');
  });
});

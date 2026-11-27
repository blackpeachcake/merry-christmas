import { describe, it, expect, vi } from 'vitest';
import { InvitationsController } from './invitations.controller';

describe('InvitationsController', () => {
  it('create delegates to service with userId, roomId, body', async () => {
    const svc = { create: vi.fn().mockResolvedValue({ id: 'i1' }) } as any;
    const ctrl = new InvitationsController(svc);
    const body = { name: 'A', ratio: '9:16', background: { type: 'color', value: '#fff' } } as any;
    await ctrl.create({ userId: 'u1', params: { id: 'r1' } } as any, body);
    expect(svc.create).toHaveBeenCalledWith('u1', 'r1', body);
  });

  it('listByRoom delegates to service with userId, roomId', async () => {
    const svc = { listByRoom: vi.fn().mockResolvedValue([]) } as any;
    const ctrl = new InvitationsController(svc);
    await ctrl.listByRoom({ userId: 'u1', params: { id: 'r1' } } as any);
    expect(svc.listByRoom).toHaveBeenCalledWith('u1', 'r1');
  });

  it('update delegates to service with userId, invitationId, body', async () => {
    const svc = { update: vi.fn().mockResolvedValue({ id: 'i1' }) } as any;
    const ctrl = new InvitationsController(svc);
    const body = { name: 'B' } as any;
    await ctrl.update({ userId: 'u1', params: { id: 'i1' } } as any, body);
    expect(svc.update).toHaveBeenCalledWith('u1', 'i1', body);
  });

  it('remove delegates to service with userId, invitationId', async () => {
    const svc = { remove: vi.fn().mockResolvedValue(undefined) } as any;
    const ctrl = new InvitationsController(svc);
    await ctrl.remove({ userId: 'u1', params: { id: 'i1' } } as any);
    expect(svc.remove).toHaveBeenCalledWith('u1', 'i1');
  });
});

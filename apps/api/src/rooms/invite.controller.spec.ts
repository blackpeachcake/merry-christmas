import { describe, it, expect, vi } from 'vitest';
import { InviteController } from './invite.controller';

describe('InviteController', () => {
  it('preview delegates to service with roomId', async () => {
    const rooms = { preview: vi.fn().mockResolvedValue({ name: '방' }) } as any;
    const ctrl = new InviteController(rooms);
    const out = await ctrl.preview({ params: { roomId: 'r1' } } as any);
    expect(rooms.preview).toHaveBeenCalledWith('r1');
    expect(out).toEqual({ name: '방' });
  });
});

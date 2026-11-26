import { describe, it, expect, vi } from 'vitest';
import { MeController } from './me.controller';

const makeRes = () => ({ cookie: vi.fn(), json: vi.fn() }) as any;

describe('MeController.remove', () => {
  it('delegates to UsersService.remove with req.userId, clears cookies, responds 200', async () => {
    const users = { remove: vi.fn().mockResolvedValue(undefined) } as any;
    const ctrl = new MeController(users);
    const res = makeRes();
    await ctrl.remove({ userId: 'u1' } as any, res);
    expect(users.remove).toHaveBeenCalledWith('u1');
    expect(res.cookie).toHaveBeenCalledWith('access_token', '', expect.objectContaining({ maxAge: 0 }));
    expect(res.cookie).toHaveBeenCalledWith('refresh_token', '', expect.objectContaining({ maxAge: 0 }));
    expect(res.json).toHaveBeenCalledWith({});
  });
});

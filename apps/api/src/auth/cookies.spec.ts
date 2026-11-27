import { describe, it, expect, vi } from 'vitest';
import { setAccessCookie, setRefreshCookie, clearAuthCookies } from './cookies';

const makeRes = () => ({ cookie: vi.fn() });

describe('cookies', () => {
  it('setAccessCookie sets an httpOnly access_token cookie scoped to /api', () => {
    const res = makeRes();
    setAccessCookie(res, 'ACC');
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'ACC',
      expect.objectContaining({ httpOnly: true, path: '/api' }),
    );
  });

  it('setRefreshCookie sets an httpOnly refresh_token cookie scoped to /api/auth', () => {
    const res = makeRes();
    setRefreshCookie(res, 'REF');
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'REF',
      expect.objectContaining({ httpOnly: true, path: '/api/auth' }),
    );
  });

  it('clearAuthCookies clears both access_token and refresh_token with maxAge 0', () => {
    const res = makeRes();
    clearAuthCookies(res);
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      '',
      expect.objectContaining({ maxAge: 0 }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      '',
      expect.objectContaining({ maxAge: 0 }),
    );
  });
});

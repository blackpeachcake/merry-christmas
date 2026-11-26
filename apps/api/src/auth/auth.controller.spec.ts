import { describe, it, expect, vi } from 'vitest';
import { AuthController } from './auth.controller';

const feUrl = 'http://fe.test';
const config = {
  getOrThrow: (k: string) => (k === 'FE_REDIRECT_URL' ? feUrl : ''),
} as any;
const makeRes = () =>
  ({ cookie: vi.fn(), redirect: vi.fn(), json: vi.fn() }) as any;

describe('AuthController.kakaoCallback', () => {
  it('existing user → sets access/refresh cookies and redirects to FE (no token in URL)', async () => {
    const auth = {
      handleKakaoProfile: vi
        .fn()
        .mockResolvedValue({ status: 'authenticated', accessToken: 'ACC', refreshToken: 'REF' }),
    } as any;
    const users = {} as any;
    const res = makeRes();
    await new AuthController(auth, users, config).kakaoCallback(
      { user: { provider: 'kakao', providerUserId: 'k1', nickname: 'n' } } as any,
      res,
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'ACC',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'REF',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining(feUrl));
    expect(res.redirect).not.toHaveBeenCalledWith(expect.stringContaining('ACC'));
  });

  it('new user → sets pending token as httpOnly cookie and redirects to terms (token NOT in URL)', async () => {
    const auth = {
      handleKakaoProfile: vi
        .fn()
        .mockResolvedValue({ status: 'terms_required', pendingToken: 'PEND' }),
    } as any;
    const users = {} as any;
    const res = makeRes();
    await new AuthController(auth, users, config).kakaoCallback({ user: {} } as any, res);
    expect(res.cookie).toHaveBeenCalledWith(
      'pending_token',
      'PEND',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/terms'));
    expect(res.redirect).not.toHaveBeenCalledWith(expect.stringContaining('PEND'));
  });
});

describe('AuthController.terms', () => {
  it('reads pending token from cookie, sets access/refresh cookies, returns empty body', async () => {
    const auth = {
      consume: vi.fn().mockResolvedValue({ accessToken: 'ACC', refreshToken: 'REF' }),
    } as any;
    const users = {} as any;
    const res = makeRes();
    const req = { cookies: { pending_token: 'PEND' } } as any;
    await new AuthController(auth, users, config).terms(
      req,
      { agreeTerms: true, agreePrivacy: true },
      res,
    );
    expect(auth.consume).toHaveBeenCalledWith('PEND', {
      agreeTerms: true,
      agreePrivacy: true,
    });
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'ACC',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'REF',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('rejects when there is no pending cookie', async () => {
    const auth = { consume: vi.fn() } as any;
    const users = {} as any;
    const res = makeRes();
    await expect(
      new AuthController(auth, users, config).terms(
        { cookies: {} } as any,
        { agreeTerms: true, agreePrivacy: true },
        res,
      ),
    ).rejects.toThrow();
    expect(auth.consume).not.toHaveBeenCalled();
  });
});

describe('AuthController.me', () => {
  it('returns the public profile for the authenticated user', async () => {
    const users = {
      findById: vi.fn().mockResolvedValue({
        id: 'u1',
        nickname: '닉',
        imageUrl: 'http://img',
        provider: 'kakao',
        providerUserId: 'k1',
      }),
    } as any;
    const result = await new AuthController({} as any, users, config).me({
      userId: 'u1',
    } as any);
    expect(result).toEqual({ id: 'u1', nickname: '닉', imageUrl: 'http://img' });
  });

  it('rejects when the user no longer exists', async () => {
    const users = { findById: vi.fn().mockResolvedValue(null) } as any;
    await expect(
      new AuthController({} as any, users, config).me({ userId: 'gone' } as any),
    ).rejects.toThrow();
  });
});

describe('AuthController.refresh', () => {
  it('rotates access/refresh cookies from the refresh_token cookie', async () => {
    const auth = {
      refresh: vi.fn().mockResolvedValue({ accessToken: 'ACC2', refreshToken: 'REF2' }),
    } as any;
    const users = {} as any;
    const res = makeRes();
    await new AuthController(auth, users, config).refresh(
      { cookies: { refresh_token: 'REF' } } as any,
      res,
    );
    expect(auth.refresh).toHaveBeenCalledWith('REF');
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'ACC2',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'REF2',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('rejects when there is no refresh_token cookie', async () => {
    const auth = { refresh: vi.fn() } as any;
    const users = {} as any;
    const res = makeRes();
    await expect(
      new AuthController(auth, users, config).refresh({ cookies: {} } as any, res),
    ).rejects.toThrow();
    expect(auth.refresh).not.toHaveBeenCalled();
  });
});

describe('AuthController.logout', () => {
  it('bumps tokenVersion and clears auth cookies', async () => {
    const auth = { logout: vi.fn().mockResolvedValue(undefined) } as any;
    const users = {} as any;
    const res = makeRes();
    await new AuthController(auth, users, config).logout({ userId: 'u1' } as any, res);
    expect(auth.logout).toHaveBeenCalledWith('u1');
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
    expect(res.json).toHaveBeenCalledWith({});
  });
});

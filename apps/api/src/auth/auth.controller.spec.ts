import { describe, it, expect, vi } from 'vitest';
import { AuthController } from './auth.controller';

const feUrl = 'http://fe.test';
const config = {
  getOrThrow: (k: string) => (k === 'FE_REDIRECT_URL' ? feUrl : ''),
} as any;
const makeRes = () =>
  ({ cookie: vi.fn(), redirect: vi.fn(), json: vi.fn() }) as any;

describe('AuthController.kakaoCallback', () => {
  it('existing user → sets refresh cookie and redirects to FE with access token', async () => {
    const auth = {
      handleKakaoProfile: vi
        .fn()
        .mockResolvedValue({ status: 'authenticated', accessToken: 'ACC', refreshToken: 'REF' }),
    } as any;
    const res = makeRes();
    await new AuthController(auth, config).kakaoCallback(
      { user: { provider: 'kakao', providerUserId: 'k1', nickname: 'n' } } as any,
      res,
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'REF',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('ACC'));
  });

  it('new user → sets pending token as httpOnly cookie and redirects to consent (token NOT in URL)', async () => {
    const auth = {
      handleKakaoProfile: vi
        .fn()
        .mockResolvedValue({ status: 'consent_required', pendingToken: 'PEND' }),
    } as any;
    const res = makeRes();
    await new AuthController(auth, config).kakaoCallback({ user: {} } as any, res);
    expect(res.cookie).toHaveBeenCalledWith(
      'pending_token',
      'PEND',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/consent'));
    // 토큰이 URL로 새면 안 됨
    expect(res.redirect).not.toHaveBeenCalledWith(expect.stringContaining('PEND'));
  });
});

describe('AuthController.consent', () => {
  it('reads pending token from cookie, sets refresh cookie, returns access token', async () => {
    const auth = {
      consume: vi.fn().mockResolvedValue({ accessToken: 'ACC', refreshToken: 'REF' }),
    } as any;
    const res = makeRes();
    const req = { cookies: { pending_token: 'PEND' } } as any;
    await new AuthController(auth, config).consent(
      req,
      { agreeTerms: true, agreePrivacy: true },
      res,
    );
    expect(auth.consume).toHaveBeenCalledWith('PEND', {
      agreeTerms: true,
      agreePrivacy: true,
    });
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'REF',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.json).toHaveBeenCalledWith({ accessToken: 'ACC' });
  });

  it('rejects when there is no pending cookie', async () => {
    const auth = { consume: vi.fn() } as any;
    const res = makeRes();
    await expect(
      new AuthController(auth, config).consent(
        { cookies: {} } as any,
        { agreeTerms: true, agreePrivacy: true },
        res,
      ),
    ).rejects.toThrow();
    expect(auth.consume).not.toHaveBeenCalled();
  });
});

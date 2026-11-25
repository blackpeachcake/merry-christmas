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

  it('new user → redirects to FE consent page with pending token, no cookie', async () => {
    const auth = {
      handleKakaoProfile: vi
        .fn()
        .mockResolvedValue({ status: 'consent_required', pendingToken: 'PEND' }),
    } as any;
    const res = makeRes();
    await new AuthController(auth, config).kakaoCallback({ user: {} } as any, res);
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('consent'));
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('PEND'));
  });
});

describe('AuthController.consent', () => {
  it('sets refresh cookie and returns the access token', async () => {
    const auth = {
      consume: vi.fn().mockResolvedValue({ accessToken: 'ACC', refreshToken: 'REF' }),
    } as any;
    const res = makeRes();
    await new AuthController(auth, config).consent(
      { pendingToken: 'P', agreeTerms: true, agreePrivacy: true },
      res,
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'REF',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.json).toHaveBeenCalledWith({ accessToken: 'ACC' });
  });
});

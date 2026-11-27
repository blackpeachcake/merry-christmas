// 인증 쿠키 헬퍼 — httpOnly·Secure·SameSite=Lax. access는 /api 전역, refresh는 /api/auth 전용.

const ACCESS_COOKIE = 'access_token';
const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15분
const REFRESH_COOKIE = 'refresh_token';
const REFRESH_MAX_AGE = 14 * 24 * 60 * 60 * 1000; // 14일

const BASE = { httpOnly: true, secure: true, sameSite: 'lax' as const };

export interface ResLike {
  cookie(name: string, value: string, opts: object): void;
}

export function setAccessCookie(res: ResLike, token: string): void {
  res.cookie(ACCESS_COOKIE, token, { ...BASE, path: '/api', maxAge: ACCESS_MAX_AGE });
}

export function setRefreshCookie(res: ResLike, token: string): void {
  res.cookie(REFRESH_COOKIE, token, { ...BASE, path: '/api/auth', maxAge: REFRESH_MAX_AGE });
}

export function clearAuthCookies(res: ResLike): void {
  res.cookie(ACCESS_COOKIE, '', { ...BASE, path: '/api', maxAge: 0 });
  res.cookie(REFRESH_COOKIE, '', { ...BASE, path: '/api/auth', maxAge: 0 });
}

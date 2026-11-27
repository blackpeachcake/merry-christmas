# 003 — 인증 세션 (쿠키 기반 전환)

상태: **확정** · 출처: [#18 인증 플로우](https://github.com/blackpeachcake/nacho/discussions/18)

## 1. 무엇을 / 왜

Bearer(FE가 access 관리) → **쿠키 기반**으로 전환. httpOnly 쿠키에 access·refresh를 담아 **FE가 토큰을 안 만지게**, XSS/유출 리스크를 줄인다. `/me`·`/refresh`·`/logout` 추가, refresh 회전 + 무효화.

## 2. 수용 기준

- [x] `access_token` httpOnly·Secure·SameSite=Lax 쿠키(15m). **가드가 쿠키에서 읽음**(Bearer 헤더도 호환 허용)
- [x] `refresh_token` httpOnly 쿠키(14d, path=/api/auth)
- [x] 콜백/terms가 access·refresh를 **쿠키로 설정**(URL 프래그먼트·바디 토큰 제거)
- [x] `GET /api/auth/me` (인증) → 공개 유저(id·nickname·imageUrl). 미인증 401
- [x] `POST /api/auth/refresh` — refresh 쿠키 검증 + `tokenVersion` 일치 → 새 access·refresh **회전** 쿠키. 무효/불일치 401
- [x] `POST /api/auth/logout` — `tokenVersion++`(기존 refresh 전부 무효) + 쿠키 삭제
- [x] `users.tokenVersion`(int, default 0) 추가. refresh JWT에 `{ sub, v }`
- [x] 로그아웃 후 기존 refresh로 `/refresh` → 401 (real DB 테스트로 검증)

## 3. 데이터 모델

```
users: + tokenVersion Int @default(0)
```

## 4. 범위 밖(추후)

- refresh **jti 재사용 탐지**(패밀리 폐기) — 현재는 tokenVersion 전체 무효화
- CSRF double-submit 토큰(SameSite로 1차 방어)
- 구글 로그인

## 5. 영향(기존 수정)

- `TokenService.issueRefresh(userId, version)` / `verifyRefresh → { sub, v }`
- `AuthController` 콜백/terms: 쿠키 설정 + 토큰 URL/바디 제거
- `JwtAuthGuard`: 쿠키에서 access 읽기(헤더 fallback)
- 공유: `/me` 응답 = `User`

> plan.md → tasks.md → TDD.

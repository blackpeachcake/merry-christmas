# 003 — plan

## 쿠키 헬퍼 (auth/cookies.ts)

`setAccessCookie(res, token)`·`setRefreshCookie(res, token)`·`clearAuthCookies(res)` — httpOnly·Secure·SameSite=Lax. access path=/api, refresh path=/api/auth.

## 변경

- **User**: `tokenVersion Int @default(0)`.
- **TokenService**: `issueRefresh(userId, version)` → payload `{ sub, v }`. `verifyRefresh → { sub, v }`. (access/pending 그대로)
- **UsersService**: `findById(id)` → User | null. `bumpTokenVersion(id)`.
- **AuthService**:
  - `handleKakaoProfile`: 기존 유저 refresh에 `user.tokenVersion` 포함.
  - `consume`: 생성 후 refresh에 version 포함.
  - `refresh(refreshToken)`: verifyRefresh → `users.findById` → `v === tokenVersion`? → 새 access + refresh(동일 version). 불일치/없음 → Unauthorized.
  - `logout(userId)`: `bumpTokenVersion`.
- **JwtAuthGuard**: `req.cookies.access_token` (없으면 Bearer 헤더) → verifyAccess → req.userId.
- **AuthController**:
  - 콜백: 기존→access·refresh 쿠키 + FE 리다이렉트(프래그먼트 제거). 신규→pending 쿠키(기존).
  - terms: 계정 생성 → access·refresh 쿠키 + `res.json({})`(토큰 바디 제거).
  - `GET /me`(JwtAuthGuard): users.findById(req.userId) → User.
  - `POST /refresh`: 쿠키 refresh → authService.refresh → 쿠키 재설정.
  - `POST /logout`(JwtAuthGuard): authService.logout + clearAuthCookies.

## 공유(@nacho/shared)

- `AuthTokens` 제거(쿠키라 바디에 토큰 없음). `/me` 응답 = `User`.

## 테스트(TDD)

- 단위: TokenService(refresh version 왕복), JwtAuthGuard(쿠키/헤더).
- real DB: UsersService(findById·bumpTokenVersion), AuthService(refresh 성공/version불일치/logout후 무효).
- 컨트롤러(mock): /me·/refresh·/logout·terms 쿠키 설정.

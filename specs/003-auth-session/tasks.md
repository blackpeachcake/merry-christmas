# 003 — tasks (TDD)

- [x] T1. `User.tokenVersion` 마이그레이션(로컬)
- [x] T2. `TokenService.issueRefresh(userId, version)` + `verifyRefresh → {sub,v}` (테스트 갱신)
- [x] T3. `UsersService.findById`·`bumpTokenVersion` (real DB)
- [x] T4. `AuthService.refresh(refreshToken)`(성공/version불일치/없음) + `logout(userId)` (real DB)
- [x] T5. `JwtAuthGuard` 쿠키에서 access(헤더 fallback) (테스트 갱신)
- [x] T6. `auth/cookies.ts` 헬퍼 + `AuthController` 콜백/consent 쿠키화 + `/me`·`/refresh`·`/logout` (테스트)
- [x] T7. 공유 타입(@nacho/shared) 정리(AuthTokens 제거, /me=User) + 빌드/부팅 E2E
- [x] T8. prod 마이그레이션 + 배포

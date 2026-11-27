# 001 — tasks (TDD 순서)

각 작업은 **실패 테스트 → 통과 코드 → 리팩터**. 체크 시 테스트 포함.

## 준비

- [ ] T1. 의존성 추가: `@nestjs/passport` `passport` `passport-kakao` `@nestjs/jwt` + `vitest` 세팅(apps/api)
- [ ] T2. `users` 테이블 로컬 마이그레이션 (docker compose up → `prisma db push`/migrate)

## 도메인 로직 (단위 TDD)

- [ ] T3. **TokenService** — access(15m)/refresh(14d)/pending(10m) 발급·검증. 테스트: 페이로드·만료·서명 불일치 거부
- [ ] T4. **UsersService** — `findByProvider`, `create`. 테스트: 신규 생성, 중복(provider+id) 유니크, email 미저장
- [ ] T5. **AuthService.handleKakaoProfile** — 기존→{access,refresh}, 신규→{pending}. 테스트: 분기 2종(Prisma 모킹)
- [ ] T6. **AuthService.consume(consent)** — pending 검증 → user 생성(terms_agreed_at/version) → 토큰. 테스트: 유효/만료/약관 미동의 거부

## 웹 계층 (통합)

- [ ] T7. **KakaoStrategy** + **KakaoAuthGuard** (config 주입). 테스트: 프로필 매핑
- [ ] T8. **AuthController** — `GET /auth/kakao`(302), `GET /auth/kakao/callback`(쿠키 set·리다이렉트 분기), `POST /auth/consent`. 통합테스트: strategy 모킹, Set-Cookie·Location 검증
- [ ] T9. `packages/shared` 타입: User·AuthTokens·KakaoProfile·ConsentDto

## 배선/배포

- [ ] T10. 로컬 `.env`에 카카오 키·JWT 시크릿·FE_REDIRECT_URL (사용자가 직접 주입 — 채팅 노출 X)
- [ ] T11. 수동 E2E: 로컬에서 실제 카카오 로그인 1회(기존/신규) 통과
- [ ] T12. prod: Secret Manager 시크릿 + Cloud Run `--set-secrets`/env, `prisma migrate deploy`(Cloud SQL Auth Proxy)

## 범위 밖(다음 스펙)

구글·프로필수정·탈퇴·로그아웃·refresh 엔드포인트.

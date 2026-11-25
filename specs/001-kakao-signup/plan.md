# 001 — plan (기술·구조)

## 스택
NestJS + `@nestjs/passport` + `passport-kakao` + `@nestjs/jwt` + Prisma. 테스트: **Vitest**(단위) + 모킹.

## 모듈/파일
```
apps/api/src/
├─ users/
│  ├─ users.service.ts      # findByProvider(provider, providerUserId) · create(...)
│  └─ users.module.ts
├─ auth/
│  ├─ auth.module.ts
│  ├─ auth.controller.ts    # GET /auth/kakao, GET /auth/kakao/callback, POST /auth/consent
│  ├─ auth.service.ts       # handleKakaoProfile(), consume(pendingToken, consent)
│  ├─ token.service.ts      # access/refresh/pending JWT 발급·검증
│  ├─ kakao.strategy.ts     # passport-kakao (REST API 키·secret·callback)
│  └─ dto/*
└─ prisma/ (기존)
```

## 토큰
| 토큰 | 만료 | 담김 | 전달 |
|---|---|---|---|
| access | 15m | `sub`(userId) | 응답(헤더/바디) |
| refresh | 14d | `sub` | **httpOnly·Secure 쿠키** |
| pending(신규 약관대기) | 10m | provider·providerUserId·nickname·image | 쿼리/바디로 FE→consent |

## 흐름
- `GET /auth/kakao` → KakaoAuthGuard가 카카오로 302.
- `GET /auth/kakao/callback` → strategy가 프로필 파싱 → `authService.handleKakaoProfile()`:
  - 기존(`findByProvider` 히트) → access+refresh 발급, refresh 쿠키 set, `FE_REDIRECT_URL`로 리다이렉트.
  - 신규 → **pending JWT** 발급 → `FE_REDIRECT_URL/consent?token=...` 로 리다이렉트(계정 생성 X).
- `POST /auth/consent {pendingToken, agreeTerms, agreePrivacy}` → pending 검증 → `users.create(terms_agreed_at, terms_version)` → access+refresh 발급.

## 설정(환경변수) — Secret Manager(prod)/.env(로컬)
`KAKAO_REST_API_KEY` · `KAKAO_CLIENT_SECRET` · `KAKAO_CALLBACK_URL` · `JWT_ACCESS_SECRET` · `JWT_REFRESH_SECRET` · `JWT_PENDING_SECRET` · `FE_REDIRECT_URL`

## DB
`users` 테이블 마이그레이션(로컬 docker + prod Cloud SQL Auth Proxy). `UsersService`가 Prisma 사용.

## 테스트 전략 (TDD)
- **단위(모킹)**: TokenService(발급/검증/만료), UsersService(findByProvider·create, dedup 유니크), AuthService(기존→토큰 / 신규→pending / consent→생성). Prisma·kakao 프로필 모킹.
- **통합**: AuthController 엔드포인트(쿠키 set, 리다이렉트) — kakao strategy 모킹.
- 실제 카카오 왕복은 수동 1회(로컬) 검증.

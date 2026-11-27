# 001 — 카카오 소셜 로그인 / 회원가입 (BE)

상태: **스펙 리뷰 중** · 출처: 디스커션 [#12 기획](https://github.com/blackpeachcake/merry-christmas/discussions/12) · [#6 BE 설계](https://github.com/blackpeachcake/merry-christmas/discussions/6)

## 1. 무엇을 / 왜

카카오 소셜 로그인으로 **회원가입·로그인**을 제공한다. 별도 가입 폼 없이, 카카오 인증 후 신규 유저면 **약관 동의 → 계정 생성**, 기존 유저면 바로 로그인. (구글은 다음 스펙)

## 2. 범위 (이 스펙)

- BE만. FE(로그인 버튼·약관 화면)는 별도 담당.
- **카카오만** (구글/실시간/방 등은 범위 밖).

## 3. 사용자 플로우

```
FE "카카오로 시작" → GET /api/auth/kakao → 카카오 인증
  → GET /api/auth/kakao/callback?code=...
     ├ 기존 유저 → 토큰 발급 → FE로 리다이렉트(로그인 완료)
     └ 신규 유저 → 아직 계정 생성 X → 약관동의 필요 상태로 FE 리다이렉트
         → FE 약관화면 → POST /api/auth/consent (동의)
             → users 생성(terms_agreed_at) → 토큰 발급
```

## 4. 수용 기준 (Acceptance Criteria)

- [ ] `GET /api/auth/kakao` → 카카오 인증 URL로 302 리다이렉트
- [ ] 콜백에서 카카오 프로필(provider='kakao', providerUserId=카카오 id, nickname, imageUrl) 취득
- [ ] **기존 유저**(provider+providerUserId 일치) → access JWT + refresh(httpOnly 쿠키) 발급 후 FE 리다이렉트
- [ ] **신규 유저** → 계정 **생성하지 않고**, 약관동의 대기 상태(임시 토큰/식별자)로 FE 리다이렉트
- [ ] `POST /api/auth/consent`(이용약관·개인정보 필수 동의) → `users` 생성(`terms_agreed_at`) + 토큰 발급
- [ ] **email 미저장**, **중복 계정 허용**(구글 유저와 별개)
- [ ] 닉네임/이미지는 카카오 값 자동 세팅(이후 수정은 별도 스펙)
- [ ] access JWT 만료 짧게 / refresh는 httpOnly·Secure 쿠키
- [ ] 시크릿(카카오 키)은 Secret Manager/.env, 코드·깃에 없음

## 5. 범위 밖 (나중)

- 구글 로그인 / 프로필 수정 / 탈퇴 / 로그아웃 / 토큰 리프레시 엔드포인트 세부 / 방·초대장
- FE UI

## 6. 결정 (확정)

- 신규 유저 "약관동의 대기" → **단기 임시 JWT(stateless)**. 카카오 프로필(provider/id/nickname/image)을 claim에 담고 만료 10분. 서버 임시레코드 안 씀.
- 토큰 만료: **access 15분 / refresh 14일**. refresh는 httpOnly·Secure 쿠키.

> `plan.md`(기술·구조) → `tasks.md`(TDD 단위) 작성 완료. 테스트 우선 구현.

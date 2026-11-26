// 인증 API 계약 (FE ↔ BE)
// access/refresh 토큰은 모두 httpOnly 쿠키로 전달됨 — 응답 바디에 토큰 없음
// GET /api/auth/me 응답 = User (packages/shared/src/models/user.ts)

// POST /api/auth/consent — 신규 유저 약관동의
// pendingToken은 httpOnly 쿠키로 전달됨(URL/바디 노출 방지) → FE는 동의 여부만 전송
export interface ConsentRequest {
  agreeTerms: boolean;
  agreePrivacy: boolean;
}

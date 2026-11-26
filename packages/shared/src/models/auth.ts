// 인증 API 계약 (FE ↔ BE)

export interface AuthTokens {
  accessToken: string; // refresh는 httpOnly 쿠키로 별도 전달
}

// POST /api/auth/consent — 신규 유저 약관동의
// pendingToken은 httpOnly 쿠키로 전달됨(URL/바디 노출 방지) → FE는 동의 여부만 전송
export interface ConsentRequest {
  agreeTerms: boolean;
  agreePrivacy: boolean;
}

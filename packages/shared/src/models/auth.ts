// 인증 API 계약 (FE ↔ BE)

export interface AuthTokens {
  accessToken: string; // refresh는 httpOnly 쿠키로 별도 전달
}

// POST /api/auth/consent — 신규 유저 약관동의
export interface ConsentRequest {
  pendingToken: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
}

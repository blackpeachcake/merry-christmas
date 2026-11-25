// 인증·토큰 관련 타입

export interface TokenConfig {
  accessSecret: string;
  refreshSecret: string;
  pendingSecret: string;
  accessTtl: string; // 예: '15m'
  refreshTtl: string; // 예: '14d'
  pendingTtl: string; // 예: '10m'
}

export interface KakaoProfile {
  provider: 'kakao';
  providerUserId: string;
  nickname: string;
  imageUrl?: string;
}

// passport-kakao가 주는 원본 프로필(일부) — BE 내부에서 KakaoProfile로 매핑
export interface KakaoRawProfile {
  id: number | string;
  username?: string;
  _json?: {
    properties?: { nickname?: string; profile_image?: string };
  };
}

export interface SubPayload {
  sub: string;
}

// 약관동의 입력 (신규 유저가 pending 토큰과 함께 제출)
export interface ConsentInput {
  pendingToken: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
}

// 카카오 프로필 처리 결과: 기존 유저면 토큰, 신규면 약관동의 대기(pending)
export type AuthResult =
  | { status: 'authenticated'; accessToken: string; refreshToken: string }
  | { status: 'consent_required'; pendingToken: string };

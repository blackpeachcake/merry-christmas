import { KakaoProfile, KakaoRawProfile } from '../models/auth.model';

// passport-kakao 원본 프로필 → 우리 KakaoProfile
export function mapKakaoProfile(raw: KakaoRawProfile): KakaoProfile {
  const props = raw._json?.properties;
  return {
    provider: 'kakao',
    providerUserId: String(raw.id),
    nickname: props?.nickname ?? raw.username ?? '',
    imageUrl: props?.profile_image,
  };
}

import { describe, it, expect } from 'vitest';
import { mapKakaoProfile } from './kakao.mapper';

describe('mapKakaoProfile', () => {
  it('maps a kakao raw profile to our KakaoProfile', () => {
    const raw = {
      id: 12345,
      username: '홍길동',
      _json: {
        properties: { nickname: '길동', profile_image: 'http://img/p.jpg' },
      },
    };
    expect(mapKakaoProfile(raw as any)).toEqual({
      provider: 'kakao',
      providerUserId: '12345',
      nickname: '길동',
      imageUrl: 'http://img/p.jpg',
    });
  });

  it('falls back to username when properties.nickname is missing', () => {
    const raw = { id: 7, username: '폴백', _json: {} };
    expect(mapKakaoProfile(raw as any)).toMatchObject({
      providerUserId: '7',
      nickname: '폴백',
    });
  });
});

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-kakao';
import { mapKakaoProfile } from './kakao.mapper';
import { KakaoProfile, KakaoRawProfile } from '../models/auth.model';

// 설정(키)은 env/Secret Manager. validate 결과가 req.user(KakaoProfile)로.
@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>('KAKAO_REST_API_KEY'),
      clientSecret: config.getOrThrow<string>('KAKAO_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('KAKAO_CALLBACK_URL'),
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: KakaoRawProfile,
  ): KakaoProfile {
    return mapKakaoProfile(profile);
  }
}

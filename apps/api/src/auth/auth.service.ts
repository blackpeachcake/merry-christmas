import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import { AuthResult, ConsentInput, KakaoProfile } from '../models/auth.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
  ) {}

  // 기존 유저 → access/refresh 발급. 신규 유저 → 계정 생성 X, 약관동의 대기 pending.
  async handleKakaoProfile(profile: KakaoProfile): Promise<AuthResult> {
    const user = await this.users.findByProvider(
      profile.provider,
      profile.providerUserId,
    );
    if (user) {
      return {
        status: 'authenticated',
        accessToken: this.tokens.issueAccess(user.id),
        refreshToken: this.tokens.issueRefresh(user.id),
      };
    }
    return {
      status: 'consent_required',
      pendingToken: this.tokens.issuePending(profile),
    };
  }

  // pending 토큰 + 필수 약관동의 → 계정 생성 → access/refresh 발급
  async consume(
    input: ConsentInput,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!input.agreeTerms || !input.agreePrivacy) {
      throw new BadRequestException('이용약관·개인정보 수집에 동의해야 합니다');
    }
    const profile = this.tokens.verifyPending(input.pendingToken);
    const user = await this.users.create({
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      nickname: profile.nickname,
      imageUrl: profile.imageUrl,
    });
    return {
      accessToken: this.tokens.issueAccess(user.id),
      refreshToken: this.tokens.issueRefresh(user.id),
    };
  }
}

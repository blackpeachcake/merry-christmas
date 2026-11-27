import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import type { TermsRequest } from '@nacho/shared';
import { AuthResult, KakaoProfile } from '../models/auth.model';

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
        refreshToken: this.tokens.issueRefresh(user.id, user.tokenVersion),
      };
    }
    return {
      status: 'terms_required',
      pendingToken: this.tokens.issuePending(profile),
    };
  }

  // pending 토큰(쿠키) + 필수 약관동의 → 계정 생성 → access/refresh 발급
  async consume(
    pendingToken: string,
    terms: TermsRequest,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!terms.agreeTerms || !terms.agreePrivacy) {
      throw new BadRequestException('이용약관·개인정보 수집에 동의해야 합니다');
    }
    const profile = this.tokens.verifyPending(pendingToken);
    const user = await this.users.create({
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      nickname: profile.nickname,
      imageUrl: profile.imageUrl,
    });
    return {
      accessToken: this.tokens.issueAccess(user.id),
      refreshToken: this.tokens.issueRefresh(user.id, user.tokenVersion),
    };
  }

  // refresh 쿠키 검증 + tokenVersion 일치 확인 → 새 access/refresh 회전 발급
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { sub, v } = this.tokens.verifyRefresh(refreshToken);
    const user = await this.users.findById(sub);
    if (!user || user.tokenVersion !== v) {
      throw new UnauthorizedException('유효하지 않은 세션입니다');
    }
    return {
      accessToken: this.tokens.issueAccess(user.id),
      refreshToken: this.tokens.issueRefresh(user.id, user.tokenVersion),
    };
  }

  // tokenVersion++ → 기존에 발급된 refresh 전부 무효화
  async logout(userId: string): Promise<void> {
    await this.users.bumpTokenVersion(userId);
  }
}

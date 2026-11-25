import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

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

export interface SubPayload {
  sub: string;
}

// access(15m)/refresh(14d)/pending(10m) 발급·검증. 타입별 secret 분리.
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly cfg: TokenConfig,
  ) {}

  issueAccess(userId: string): string {
    return this.jwt.sign(
      { sub: userId },
      { secret: this.cfg.accessSecret, expiresIn: this.cfg.accessTtl },
    );
  }

  issueRefresh(userId: string): string {
    return this.jwt.sign(
      { sub: userId },
      { secret: this.cfg.refreshSecret, expiresIn: this.cfg.refreshTtl },
    );
  }

  issuePending(profile: KakaoProfile): string {
    return this.jwt.sign(
      { ...profile },
      { secret: this.cfg.pendingSecret, expiresIn: this.cfg.pendingTtl },
    );
  }

  verifyAccess(token: string): SubPayload {
    return this.jwt.verify(token, { secret: this.cfg.accessSecret });
  }

  verifyRefresh(token: string): SubPayload {
    return this.jwt.verify(token, { secret: this.cfg.refreshSecret });
  }

  verifyPending(token: string): KakaoProfile {
    return this.jwt.verify(token, { secret: this.cfg.pendingSecret });
  }
}

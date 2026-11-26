import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { KakaoAuthGuard } from './kakao-auth.guard';
import type { ConsentRequest } from '@nacho/shared';
import { KakaoProfile } from '../models/auth.model';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_MAX_AGE = 14 * 24 * 60 * 60 * 1000; // 14일

// express 타입 의존 없이 쓰는 최소 인터페이스
interface ResLike {
  cookie(name: string, value: string, opts: object): void;
  redirect(url: string): void;
  json(body: unknown): void;
}
interface ReqLike {
  user?: unknown;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  kakao(): void {
    // 가드가 카카오 인증으로 리다이렉트
  }

  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  async kakaoCallback(@Req() req: ReqLike, @Res() res: ResLike): Promise<void> {
    const profile = req.user as KakaoProfile;
    const fe = this.config.getOrThrow<string>('FE_REDIRECT_URL');
    const result = await this.auth.handleKakaoProfile(profile);
    if (result.status === 'authenticated') {
      this.setRefreshCookie(res, result.refreshToken);
      res.redirect(`${fe}/auth/callback#access_token=${result.accessToken}`);
      return;
    }
    // 신규 → 계정 생성 X, 약관동의 페이지로(쿠키 없음)
    res.redirect(`${fe}/consent?token=${result.pendingToken}`);
  }

  @Post('consent')
  async consent(@Body() dto: ConsentRequest, @Res() res: ResLike): Promise<void> {
    const tokens = await this.auth.consume(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    res.json({ accessToken: tokens.accessToken });
  }

  private setRefreshCookie(res: ResLike, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: REFRESH_MAX_AGE,
    });
  }
}

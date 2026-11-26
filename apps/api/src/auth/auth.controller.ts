import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { KakaoAuthGuard } from './kakao-auth.guard';
import { KakaoProfile } from '../models/auth.model';
import { ConsentDto } from '../models/consent.dto';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_MAX_AGE = 14 * 24 * 60 * 60 * 1000; // 14일
const PENDING_COOKIE = 'pending_token';
const PENDING_MAX_AGE = 10 * 60 * 1000; // 10분

// express 타입 의존 없이 쓰는 최소 인터페이스
interface ResLike {
  cookie(name: string, value: string, opts: object): void;
  redirect(url: string): void;
  json(body: unknown): void;
}
interface ReqLike {
  user?: unknown;
  cookies?: Record<string, string>;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  @ApiOperation({
    summary: '카카오 로그인 시작',
    description:
      '브라우저를 이 URL로 **이동**시키면(fetch 아님) 카카오 로그인 페이지로 302. 끝나면 `/api/auth/kakao/callback`으로 돌아옴.',
  })
  @ApiResponse({ status: 302, description: '카카오 인증 페이지로 리다이렉트' })
  kakao(): void {
    // 가드가 카카오 인증으로 리다이렉트
  }

  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  @ApiOperation({
    summary: '카카오 콜백 (카카오가 호출)',
    description:
      '**기존 유저** → `refresh_token` 쿠키 설정 + FE로 `#access_token=...` 리다이렉트.\n\n**신규 유저** → 계정 생성 X, `pending_token`을 **httpOnly 쿠키**로 설정 + FE `/consent`로 리다이렉트(URL에 토큰 없음).',
  })
  @ApiResponse({
    status: 302,
    description: '기존→FE(#access_token), 신규→FE /consent (pending 쿠키 설정)',
  })
  async kakaoCallback(@Req() req: ReqLike, @Res() res: ResLike): Promise<void> {
    const profile = req.user as KakaoProfile;
    const fe = this.config.getOrThrow<string>('FE_REDIRECT_URL');
    const result = await this.auth.handleKakaoProfile(profile);
    if (result.status === 'authenticated') {
      this.setRefreshCookie(res, result.refreshToken);
      res.redirect(`${fe}/auth/callback#access_token=${result.accessToken}`);
      return;
    }
    // 신규 → 계정 생성 X. pendingToken은 httpOnly 쿠키로(URL 노출 금지) + 약관 페이지로
    res.cookie(PENDING_COOKIE, result.pendingToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: PENDING_MAX_AGE,
    });
    res.redirect(`${fe}/consent`);
  }

  @Post('consent')
  @ApiOperation({
    summary: '약관동의 → 계정 생성 (신규 유저 가입 완료)',
    description:
      '신규 유저가 약관화면에서 호출. **`pending_token` 쿠키 필요**(콜백에서 설정됨, 브라우저 자동 전송 — fetch 시 `credentials:"include"`). 바디엔 동의 여부만. 성공 시 계정 생성 + `pending_token` 삭제 + `refresh_token` 쿠키 + `access_token` 반환.',
  })
  @ApiBody({ type: ConsentDto })
  @ApiOkResponse({
    description: '가입 완료 — access 토큰(refresh는 쿠키)',
    schema: { type: 'object', properties: { accessToken: { type: 'string' } } },
  })
  @ApiResponse({ status: 401, description: 'pending_token 쿠키 없음/만료' })
  async consent(
    @Req() req: ReqLike,
    @Body() dto: ConsentDto,
    @Res() res: ResLike,
  ): Promise<void> {
    const pending = req.cookies?.[PENDING_COOKIE];
    if (!pending) {
      throw new UnauthorizedException('약관동의 대기 상태가 아니거나 만료되었습니다');
    }
    const tokens = await this.auth.consume(pending, dto);
    this.clearPendingCookie(res);
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

  private clearPendingCookie(res: ResLike): void {
    res.cookie(PENDING_COOKIE, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 0,
    });
  }
}

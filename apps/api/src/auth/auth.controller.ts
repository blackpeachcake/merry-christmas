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
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { KakaoAuthGuard } from './kakao-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { KakaoProfile } from '../models/auth.model';
import { TermsDto } from '../models/terms.dto';
import { UserDto } from '../models/user.dto';
import { setAccessCookie, setRefreshCookie, clearAuthCookies, ResLike } from './cookies';
import type { User } from '@nacho/shared';

const PENDING_COOKIE = 'pending_token';
const PENDING_MAX_AGE = 10 * 60 * 1000; // 10분

interface ReqLike {
  user?: unknown;
  userId?: string;
  cookies?: Record<string, string>;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  @ApiOperation({ summary: '카카오 로그인 시작' })
  @ApiResponse({ status: 302, description: '카카오 인증 페이지로 리다이렉트' })
  kakao(): void {
    // 가드가 카카오 인증으로 리다이렉트
  }

  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  @ApiOperation({ summary: '카카오 콜백 (카카오가 호출)' })
  @ApiResponse({ status: 302, description: 'FE로 리다이렉트(인증 쿠키 설정됨)' })
  async kakaoCallback(@Req() req: ReqLike, @Res() res: ResLike & { redirect(url: string): void }): Promise<void> {
    const profile = req.user as KakaoProfile;
    const fe = this.config.getOrThrow<string>('FE_REDIRECT_URL');
    const result = await this.auth.handleKakaoProfile(profile);
    if (result.status === 'authenticated') {
      setAccessCookie(res, result.accessToken);
      setRefreshCookie(res, result.refreshToken);
      res.redirect(`${fe}/auth/callback`);
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
    res.redirect(`${fe}/terms`);
  }

  @Post('terms')
  @ApiOperation({ summary: '약관동의 → 계정 생성 (신규 유저 가입 완료)' })
  @ApiBody({ type: TermsDto })
  @ApiOkResponse({ description: '가입 완료 (토큰은 쿠키로 전달됨)' })
  @ApiResponse({ status: 401, description: 'pending_token 쿠키 없음/만료' })
  async terms(@Req() req: ReqLike, @Body() dto: TermsDto, @Res() res: ResLike & { json(b: unknown): void }): Promise<void> {
    const pending = req.cookies?.[PENDING_COOKIE];
    if (!pending) {
      throw new UnauthorizedException('약관동의 대기 상태가 아니거나 만료되었습니다');
    }
    const tokens = await this.auth.consume(pending, dto);
    this.clearPendingCookie(res);
    setAccessCookie(res, tokens.accessToken);
    setRefreshCookie(res, tokens.refreshToken);
    res.json({});
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiOkResponse({ type: UserDto })
  @ApiResponse({ status: 401, description: '미인증' })
  async me(@Req() req: ReqLike): Promise<User> {
    const user = await this.users.findById(req.userId as string);
    if (!user) {
      throw new UnauthorizedException('유효하지 않은 세션입니다');
    }
    return { id: user.id, nickname: user.nickname, imageUrl: user.imageUrl ?? undefined };
  }

  @Post('refresh')
  @ApiOperation({ summary: '세션 갱신' })
  @ApiResponse({ status: 401, description: 'refresh_token 쿠키 없음/무효' })
  async refresh(@Req() req: ReqLike, @Res() res: ResLike & { json(b: unknown): void }): Promise<void> {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('refresh_token 쿠키가 없습니다');
    }
    const tokens = await this.auth.refresh(refreshToken);
    setAccessCookie(res, tokens.accessToken);
    setRefreshCookie(res, tokens.refreshToken);
    res.json({});
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃' })
  async logout(@Req() req: ReqLike, @Res() res: ResLike & { json(b: unknown): void }): Promise<void> {
    await this.auth.logout(req.userId as string);
    clearAuthCookies(res);
    res.json({});
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

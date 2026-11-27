import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// GET /auth/kakao, /auth/kakao/callback 에 사용 — 카카오 리다이렉트/콜백 처리
@Injectable()
export class KakaoAuthGuard extends AuthGuard('kakao') {}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from './token.service';

// access_token 쿠키(우선) 또는 Authorization: Bearer 헤더(호환) 검증 → req.userId. 미인증/무효 시 401.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers?.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
    const token = req.cookies?.access_token ?? bearer;
    if (!token) {
      throw new UnauthorizedException('인증이 필요합니다');
    }
    try {
      const { sub } = this.tokens.verifyAccess(token);
      req.userId = sub;
      return true;
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }
  }
}

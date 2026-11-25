import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService, TOKEN_CONFIG } from './token.service';
import { KakaoStrategy } from './kakao.strategy';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { TokenConfig } from '../models/auth.model';

// ⚠️ AppModule에 연결하면 KakaoStrategy가 부팅 시 KAKAO_* env를 요구함.
//    카카오 키를 .env(로컬)/Secret Manager(prod)에 넣은 뒤 연결할 것 (T10).
@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    UsersService,
    PrismaService,
    KakaoStrategy,
    {
      provide: TOKEN_CONFIG,
      inject: [ConfigService],
      useFactory: (c: ConfigService): TokenConfig => ({
        accessSecret: c.getOrThrow<string>('JWT_ACCESS_SECRET'),
        refreshSecret: c.getOrThrow<string>('JWT_REFRESH_SECRET'),
        pendingSecret: c.getOrThrow<string>('JWT_PENDING_SECRET'),
        accessTtl: '15m',
        refreshTtl: '14d',
        pendingTtl: '10m',
      }),
    },
  ],
})
export class AuthModule {}

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser()); // req.cookies (refresh/pending 토큰 읽기)
  // 인그레스가 /api 를 api 백엔드로 보냄 (#7 배포 인프라)
  app.setGlobalPrefix('api');

  // Swagger — /api/docs (globalPrefix는 setup 경로에 자동 적용 안 되므로 명시)
  const config = new DocumentBuilder()
    .setTitle('nacho API')
    .setDescription(
      [
        '친구랑 만드는 나만의 초대장 — API',
        '',
        '## 카카오 로그인/회원가입 흐름',
        '1. 브라우저를 `GET /api/auth/kakao` 로 **이동**(fetch 아님) → 카카오 로그인 페이지',
        '2. 카카오 콜백 `GET /api/auth/kakao/callback`:',
        '   - **기존 유저** → `refresh_token` httpOnly 쿠키 + FE로 리다이렉트(`#access_token=...`)',
        '   - **신규 유저** → `pending_token`을 **httpOnly 쿠키**로 설정 + FE `/consent`로 리다이렉트 (URL에 토큰 없음)',
        '3. 신규 유저 약관동의 → `POST /api/auth/consent` (바디: `agreeTerms`/`agreePrivacy`, `pending_token` 쿠키 자동 전송) → 계정 생성 + `access_token`(+`refresh_token` 쿠키)',
        '',
        '> `refresh_token`·`pending_token`은 httpOnly 쿠키라 JS·URL에 노출 안 됨. 약관 미동의 이탈 시 계정 미생성.',
        '> 교차출처에서 호출하면 fetch에 `credentials: "include"` 필요(같은 도메인이면 불필요).',
      ].join('\n'),
    )
    .setVersion('0.0.1')
    .addTag('auth', '카카오 로그인/회원가입 (OAuth 리다이렉트 + 쿠키 기반)')
    .addTag('health', '헬스체크')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, doc);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();

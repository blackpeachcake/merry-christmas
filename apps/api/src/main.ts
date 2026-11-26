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
    .setDescription('친구랑 만드는 나만의 초대장 — API')
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

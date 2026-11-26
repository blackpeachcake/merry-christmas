import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { DbHealthController } from './health/db-health.controller';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InvitationsModule } from './invitations/invitations.module';
import { MeModule } from './me/me.module';

@Module({
  imports: [
    // 로컬: apps/api/.env 로드 / 리얼: Cloud Run 환경변수 사용
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    RoomsModule,
    NotificationsModule,
    InvitationsModule,
    MeModule,
  ],
  controllers: [HealthController, DbHealthController],
  providers: [PrismaService],
})
export class AppModule {}

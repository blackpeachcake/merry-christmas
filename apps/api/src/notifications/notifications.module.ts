import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationEventsService } from './notification-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // JwtAuthGuard 사용
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationEventsService, PrismaService],
  exports: [NotificationEventsService], // RoomsService가 알림 생성 시 이벤트 발행용
})
export class NotificationsModule {}

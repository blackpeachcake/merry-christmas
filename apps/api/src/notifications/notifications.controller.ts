import { Controller, Get, Patch, Req, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationEventsService } from './notification-events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationDto } from '../models/notification.dto';

interface ReqLike {
  userId?: string;
  params: Record<string, string>;
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly events: NotificationEventsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '내 알림 목록 (최신순)' })
  @ApiOkResponse({ type: NotificationDto, isArray: true })
  listMine(@Req() req: ReqLike) {
    return this.notifications.listMine(req.userId!);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiOkResponse({ type: NotificationDto })
  markRead(@Req() req: ReqLike) {
    return this.notifications.markRead(req.userId!, req.params.id);
  }

  @Sse('stream')
  @ApiOperation({ summary: '내 알림 실시간 스트림 (SSE)' })
  stream(@Req() req: ReqLike) {
    return this.events.streamFor(req.userId!);
  }
}

import { Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface ReqLike {
  userId?: string;
  params: Record<string, string>;
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '내 알림 목록 (최신순)' })
  listMine(@Req() req: ReqLike) {
    return this.notifications.listMine(req.userId!);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  markRead(@Req() req: ReqLike) {
    return this.notifications.markRead(req.userId!, req.params.id);
  }
}

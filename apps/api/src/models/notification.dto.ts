import { ApiProperty } from '@nestjs/swagger';
import type { Notification, NotificationType } from '@nacho/shared';

// GET /api/notifications, PATCH /api/notifications/:id/read 응답
export class NotificationDto implements Notification {
  @ApiProperty({ example: 'f3b1...' })
  id!: string;

  @ApiProperty({ example: 'f3b1...' })
  userId!: string;

  @ApiProperty({
    example: 'join_requested',
    enum: ['join_requested', 'join_approved', 'join_rejected'],
  })
  type!: NotificationType;

  @ApiProperty({
    description: '알림 타입별 payload',
    example: { roomId: 'f3b1...', roomName: '우리의 크리스마스', requesterId: 'f3b1...' },
  })
  payload!: Record<string, unknown>;

  @ApiProperty({ required: false, example: '2026-11-22T10:00:00.000Z' })
  readAt?: string;

  @ApiProperty({ example: '2026-11-22T10:00:00.000Z' })
  createdAt!: string;
}

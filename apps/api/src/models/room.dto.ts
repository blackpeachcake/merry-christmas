import { ApiProperty } from '@nestjs/swagger';
import type { CreateRoomRequest, JoinRequest, JoinStatus, Room } from '@nacho/shared';

export class CreateRoomDto implements CreateRoomRequest {
  @ApiProperty({ description: '방 이름 (1~30자)' })
  name!: string;

  @ApiProperty({ description: '썸네일 이미지 URL', required: false })
  thumbnailUrl?: string;

  @ApiProperty({ description: '정원 — 방장 포함 총원 (1~8)', minimum: 1, maximum: 8 })
  capacity!: number;
}

// POST /api/rooms, GET /api/rooms 응답
export class RoomDto implements Room {
  @ApiProperty({ example: 'f3b1...' })
  id!: string;

  @ApiProperty({ example: '우리의 크리스마스' })
  name!: string;

  @ApiProperty({ required: false, example: 'https://res.cloudinary.com/.../thumb.jpg' })
  thumbnailUrl?: string;

  @ApiProperty({ example: 'f3b1...' })
  ownerId!: string;

  @ApiProperty({ example: 'ABCDEFGH' })
  inviteCode!: string;

  @ApiProperty({ description: '방장 포함 총원 (1~8)', example: 4 })
  capacity!: number;

  @ApiProperty({ example: '2026-11-22T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-11-22T10:00:00.000Z' })
  updatedAt!: string;
}

// GET /api/rooms/:id/requests 응답
export class JoinRequestDto implements JoinRequest {
  @ApiProperty({ example: 'f3b1...' })
  id!: string;

  @ApiProperty({ example: 'f3b1...' })
  roomId!: string;

  @ApiProperty({ example: 'f3b1...' })
  userId!: string;

  @ApiProperty({ example: 'pending', enum: ['pending', 'approved', 'rejected'] })
  status!: JoinStatus;

  @ApiProperty({ example: 0 })
  rejectCount!: number;

  @ApiProperty({ example: '2026-11-22T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-11-22T10:00:00.000Z' })
  updatedAt!: string;
}

// GET /api/invite/:roomId 응답
export class RoomPreviewDto {
  @ApiProperty({ example: '우리의 크리스마스' })
  name!: string;
}

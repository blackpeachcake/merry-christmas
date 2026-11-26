import { ApiProperty } from '@nestjs/swagger';
import type { CreateRoomRequest } from '@nacho/shared';

export class CreateRoomDto implements CreateRoomRequest {
  @ApiProperty({ description: '방 이름 (1~30자)' })
  name!: string;

  @ApiProperty({ description: '썸네일 이미지 URL', required: false })
  thumbnailUrl?: string;

  @ApiProperty({ description: '정원 — 방장 포함 총원 (1~8)', minimum: 1, maximum: 8 })
  capacity!: number;
}

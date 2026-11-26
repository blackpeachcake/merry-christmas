import { ApiProperty } from '@nestjs/swagger';
import type { UpdateUserRequest } from '@nacho/shared';

// PATCH /api/me
export class UpdateUserDto implements UpdateUserRequest {
  @ApiProperty({ required: false, description: '1~20자' })
  nickname?: string;

  @ApiProperty({ required: false })
  imageUrl?: string;
}

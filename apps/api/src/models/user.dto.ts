import { ApiProperty } from '@nestjs/swagger';
import type { UpdateUserRequest, User } from '@nacho/shared';

// PATCH /api/me
export class UpdateUserDto implements UpdateUserRequest {
  @ApiProperty({ required: false, description: '1~20자' })
  nickname?: string;

  @ApiProperty({ required: false })
  imageUrl?: string;
}

// GET /api/auth/me, PATCH /api/me 응답
export class UserDto implements User {
  @ApiProperty({ example: 'f3b1...' })
  id!: string;

  @ApiProperty({ example: '닉네임' })
  nickname!: string;

  @ApiProperty({ required: false, example: 'https://k.kakaocdn.net/....jpg' })
  imageUrl?: string;
}

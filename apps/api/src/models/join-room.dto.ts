import { ApiProperty } from '@nestjs/swagger';

export class JoinRoomDto {
  @ApiProperty({ description: '방 초대 코드 (8자)' })
  code!: string;
}

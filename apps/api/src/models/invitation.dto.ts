import { ApiProperty } from '@nestjs/swagger';
import type {
  Background,
  CreateInvitationRequest,
  Invitation,
  Ratio,
  UpdateInvitationRequest,
} from '@nacho/shared';

export class CreateInvitationDto implements CreateInvitationRequest {
  @ApiProperty({ description: '초대장 이름' })
  name!: string;

  @ApiProperty({ description: "비율 ('9:16'|'4:5'|'1:1'|'16:9'), 생성 후 불변" })
  ratio!: Ratio;

  @ApiProperty({ description: '배경 (color | image)' })
  background!: Background;
}

export class UpdateInvitationDto implements UpdateInvitationRequest {
  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false, description: '배경 (color | image)' })
  background?: Background;

  @ApiProperty({ required: false })
  thumbnailUrl?: string;
}

// POST/GET/PATCH 초대장 라우트 응답
export class InvitationDto implements Invitation {
  @ApiProperty({ example: 'f3b1...' })
  id!: string;

  @ApiProperty({ example: 'f3b1...' })
  roomId!: string;

  @ApiProperty({ example: '초대장' })
  name!: string;

  @ApiProperty({ example: '9:16', enum: ['9:16', '4:5', '1:1', '16:9'] })
  ratio!: Ratio;

  @ApiProperty({
    description: '배경 (color | image)',
    example: { type: 'color', value: '#ffffff' },
  })
  background!: Background;

  @ApiProperty({ required: false, example: 'https://res.cloudinary.com/.../thumb.jpg' })
  thumbnailUrl?: string;

  @ApiProperty({ example: '2026-11-22T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-11-22T10:00:00.000Z' })
  updatedAt!: string;
}

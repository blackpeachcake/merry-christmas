import { ApiProperty } from '@nestjs/swagger';
import type {
  Background,
  CreateInvitationRequest,
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

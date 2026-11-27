import { ApiProperty } from '@nestjs/swagger';
import type { UploadSignatureResponse } from '@nacho/shared';

// POST /api/uploads/signature 응답
export class UploadSignatureDto implements UploadSignatureResponse {
  @ApiProperty({ example: 'a1b2c3d4e5f6...' })
  signature!: string;

  @ApiProperty({ example: 1732268400 })
  timestamp!: number;

  @ApiProperty({ example: '123456789012345' })
  apiKey!: string;

  @ApiProperty({ example: 'my-cloud-name' })
  cloudName!: string;
}

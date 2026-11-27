import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadSignatureDto } from '../models/upload.dto';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('signature')
  @ApiOperation({ summary: 'Cloudinary 직접 업로드용 서명 발급' })
  @ApiOkResponse({ type: UploadSignatureDto })
  sign() {
    return this.uploads.sign();
  }
}

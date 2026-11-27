import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadsController } from './uploads.controller';
import { UploadsService, CLOUDINARY_CONFIG } from './uploads.service';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryConfig } from '../models/upload.model';

@Module({
  imports: [AuthModule], // JwtAuthGuard 사용
  controllers: [UploadsController],
  providers: [
    UploadsService,
    {
      provide: CLOUDINARY_CONFIG,
      inject: [ConfigService],
      useFactory: (c: ConfigService): CloudinaryConfig => ({
        cloudName: c.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
        apiKey: c.getOrThrow<string>('CLOUDINARY_API_KEY'),
        apiSecret: c.getOrThrow<string>('CLOUDINARY_API_SECRET'),
      }),
    },
  ],
})
export class UploadsModule {}

import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { CloudinaryConfig } from '../models/upload.model';

export const CLOUDINARY_CONFIG = 'CLOUDINARY_CONFIG';

// FE가 Cloudinary로 직접 업로드하기 위한 서명 발급. 파일은 BE를 거치지 않음.
@Injectable()
export class UploadsService {
  constructor(@Inject(CLOUDINARY_CONFIG) private readonly cfg: CloudinaryConfig) {}

  sign(): { signature: string; timestamp: number; apiKey: string; cloudName: string } {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha1')
      .update(`timestamp=${timestamp}${this.cfg.apiSecret}`)
      .digest('hex');
    return { signature, timestamp, apiKey: this.cfg.apiKey, cloudName: this.cfg.cloudName };
  }
}
